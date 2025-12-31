import { createAdminClient } from "../_shared/supabase.ts";
import { getStripe } from "../_shared/stripe.ts";
import Stripe from "https://esm.sh/stripe@12.18.0?target=deno";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function resolveClientIdFromCustomer(
  admin: ReturnType<typeof createAdminClient>,
  stripeCustomerId: string | null,
): Promise<string | null> {
  if (!stripeCustomerId) return null;
  const { data, error } = await admin
    .from("billing_customers")
    .select("client_id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();

  if (error) {
    console.error("Failed to resolve client_id from customer", error);
    return null;
  }

  return data?.client_id ?? null;
}

async function ensureBillingCustomer(
  admin: ReturnType<typeof createAdminClient>,
  clientId: string,
  stripeCustomerId: string,
): Promise<void> {
  const { error } = await admin
    .from("billing_customers")
    .upsert({ client_id: clientId, stripe_customer_id: stripeCustomerId }, { onConflict: "client_id" });

  if (error) {
    console.error("Failed to upsert billing customer", error);
  }
}

async function upsertSubscription(
  admin: ReturnType<typeof createAdminClient>,
  clientId: string,
  subscription: Stripe.Subscription,
): Promise<void> {
  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const currentPeriodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;

  const { error } = await admin
    .from("billing_subscriptions")
    .upsert(
      {
        client_id: clientId,
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        price_id: priceId,
        current_period_end: currentPeriodEnd,
        cancel_at_period_end: subscription.cancel_at_period_end,
      },
      { onConflict: "stripe_subscription_id" },
    );

  if (error) {
    console.error("Failed to upsert subscription", error);
  }
}

async function upsertOneTimePayment(
  admin: ReturnType<typeof createAdminClient>,
  clientId: string,
  intent: Stripe.PaymentIntent,
): Promise<void> {
  const { error } = await admin
    .from("billing_one_time_payments")
    .upsert(
      {
        client_id: clientId,
        stripe_payment_intent_id: intent.id,
        status: intent.status,
        amount: intent.amount_received ?? intent.amount,
        currency: intent.currency,
      },
      { onConflict: "stripe_payment_intent_id" },
    );

  if (error) {
    console.error("Failed to upsert one-time payment", error);
  }
}

async function registerStripeEvent(
  admin: ReturnType<typeof createAdminClient>,
  event: Stripe.Event,
): Promise<boolean> {
  const { data, error } = await admin
    .from("stripe_events")
    .upsert({ id: event.id, type: event.type }, { onConflict: "id", ignoreDuplicates: true })
    .select("id");

  if (error) {
    console.error("Failed to record stripe event", error);
    throw error;
  }

  if (!data || data.length === 0) {
    return false;
  }

  return true;
}

Deno.serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    return jsonResponse({ error: "Missing Stripe signature or webhook secret" }, 400);
  }

  const stripe = getStripe();
  const admin = createAdminClient();

  let event: Stripe.Event;
  try {
    const body = await req.arrayBuffer();
    const bodyText = new TextDecoder().decode(body);
    event = stripe.webhooks.constructEvent(bodyText, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return jsonResponse({ error: "Invalid signature" }, 400);
  }

  try {
    const firstSeen = await registerStripeEvent(admin, event);
    if (!firstSeen) {
      return jsonResponse({ received: true, duplicate: true });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const stripeCustomerId = session.customer ? String(session.customer) : null;
        let clientId = await resolveClientIdFromCustomer(admin, stripeCustomerId);
        clientId = clientId ?? session.metadata?.client_id ?? null;

        if (!clientId) {
          console.warn("checkout.session.completed without client_id");
          break;
        }

        if (stripeCustomerId) {
          await ensureBillingCustomer(admin, clientId, stripeCustomerId);
        }

        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(String(session.subscription));
          await upsertSubscription(admin, clientId, subscription);
        }

        if (session.mode === "payment" && session.payment_intent) {
          const intent = await stripe.paymentIntents.retrieve(String(session.payment_intent));
          await upsertOneTimePayment(admin, clientId, intent);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeCustomerId = subscription.customer ? String(subscription.customer) : null;
        let clientId = await resolveClientIdFromCustomer(admin, stripeCustomerId);
        clientId = clientId ?? subscription.metadata?.client_id ?? null;

        if (!clientId) {
          console.warn("subscription event without client_id", subscription.id);
          break;
        }

        if (stripeCustomerId) {
          await ensureBillingCustomer(admin, clientId, stripeCustomerId);
        }

        await upsertSubscription(admin, clientId, subscription);
        break;
      }

      case "invoice.paid":
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription ? String(invoice.subscription) : null;
        if (!subscriptionId) break;

        const status = invoice.status ?? (invoice.paid ? "paid" : "unpaid");
        const { error } = await admin
          .from("billing_subscriptions")
          .update({ status })
          .eq("stripe_subscription_id", subscriptionId);

        if (error) {
          console.error("Failed to update subscription status from invoice", error);
        }
        break;
      }

      case "payment_intent.succeeded":
      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const stripeCustomerId = intent.customer ? String(intent.customer) : null;
        let clientId = await resolveClientIdFromCustomer(admin, stripeCustomerId);
        clientId = clientId ?? intent.metadata?.client_id ?? null;

        if (!clientId) {
          console.warn("payment_intent event without client_id", intent.id);
          break;
        }

        await upsertOneTimePayment(admin, clientId, intent);
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("Stripe webhook handler error", err);
    return jsonResponse({ error: "Webhook processing failed" }, 500);
  }

  return jsonResponse({ received: true });
});
