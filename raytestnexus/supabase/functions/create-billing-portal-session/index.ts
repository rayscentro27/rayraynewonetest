import { createAdminClient } from "../_shared/supabase.ts";
import { HttpError, parseJsonBody, requireClientAccess } from "../_shared/auth.ts";
import { getStripe } from "../_shared/stripe.ts";

type RequestBody = {
  client_id: string;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      throw new HttpError(405, "Method not allowed");
    }

    const body = await parseJsonBody<RequestBody>(req);
    const clientId = body.client_id;

    if (!clientId) {
      throw new HttpError(400, "client_id is required");
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

    const portal = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${siteUrl}/billing`,
    });

    return jsonResponse({ url: portal.url });
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("create-billing-portal-session error", err);
    return jsonResponse({ error: message }, status);
  }
});
