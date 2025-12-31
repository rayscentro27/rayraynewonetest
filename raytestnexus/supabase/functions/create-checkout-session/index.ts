import { createAdminClient } from "../_shared/supabase.ts";
import { HttpError, parseJsonBody, requireClientAccess } from "../_shared/auth.ts";
import { getStripe } from "../_shared/stripe.ts";

type RequestBody = {
  client_id: string;
  mode: "subscription" | "payment";
  price_id: string;
  quantity?: number;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function parseAllowedPriceIds(envName: string): Set<string> | null {
  const raw = Deno.env.get(envName);
  if (!raw) return null;
  const list = raw
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return new Set(list);
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      throw new HttpError(405, "Method not allowed");
    }

    const body = await parseJsonBody<RequestBody>(req);
    const clientId = body.client_id;
    const mode = body.mode;
    const priceId = body.price_id;
    const quantity = body.quantity ?? 1;

    if (!clientId || !mode || !priceId) {
      throw new HttpError(400, "client_id, mode, and price_id are required");
    }
    if (mode !== "subscription" && mode !== "payment") {
      throw new HttpError(400, "mode must be subscription or payment");
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new HttpError(400, "quantity must be a positive integer");
    }

    const allowedSubs = parseAllowedPriceIds("STRIPE_SUBSCRIPTION_PRICE_IDS");
    const allowedOneTime = parseAllowedPriceIds("STRIPE_ONE_TIME_PRICE_IDS");
    if (mode === "subscription" && allowedSubs && !allowedSubs.has(priceId)) {
      throw new HttpError(400, "price_id is not allowed for subscriptions");
    }
    if (mode === "payment" && allowedOneTime && !allowedOneTime.has(priceId)) {
      throw new HttpError(400, "price_id is not allowed for one-time payments");
    }

    const { user } = await requireClientAccess(req, clientId);

    const admin = createAdminClient();
    const stripe = getStripe();

    const { data: existingCustomer, error: customerError } = await admin
      .from("billing_customers")
      .select("stripe_customer_id")
      .eq("client_id", clientId)
      .maybeSingle();

    if (customerError) {
      throw new HttpError(500, `Failed to load billing customer: ${customerError.message}`);
    }

    let stripeCustomerId = existingCustomer?.stripe_customer_id ?? null;

    if (!stripeCustomerId) {
      const stripeCustomer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { client_id: clientId },
      });

      stripeCustomerId = stripeCustomer.id;

      const { error: insertError } = await admin
        .from("billing_customers")
        .upsert({ client_id: clientId, stripe_customer_id: stripeCustomerId }, { onConflict: "client_id" });

      if (insertError) {
        throw new HttpError(500, `Failed to save billing customer: ${insertError.message}`);
      }
    }

    const siteUrl = Deno.env.get("SITE_URL");
    if (!siteUrl) {
      throw new HttpError(500, "Missing required environment variable: SITE_URL");
    }

    const session = await stripe.checkout.sessions.create({
      mode,
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity }],
      success_url: `${siteUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/billing/cancel`,
      metadata: { client_id: clientId },
    });

    if (!session.url) {
      throw new HttpError(500, "Stripe did not return a checkout session URL");
    }

    return jsonResponse({ url: session.url });
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("create-checkout-session error", err);
    return jsonResponse({ error: message }, status);
  }
});
