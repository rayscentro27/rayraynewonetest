import { createAdminClient } from "../_shared/supabase.ts";
import { ensureIdempotentEvent } from "../_shared/idempotency.ts";
import { jsonResponse } from "../_shared/responses.ts";
import { verifyTwilioSignature } from "../_shared/twilio.ts";

type TwilioParams = Record<string, string>;

async function parseTwilioParams(req: Request): Promise<TwilioParams> {
  const rawBody = await req.text();
  const params = new URLSearchParams(rawBody);
  return Object.fromEntries(params.entries());
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const params = await parseTwilioParams(req);
  const signature = req.headers.get("X-Twilio-Signature");

  if (!verifyTwilioSignature(params, req.url, signature)) {
    return jsonResponse({ error: "Invalid signature" }, 403);
  }

  const messageSid = params.MessageSid;
  const fromNumber = params.From;
  const toNumber = params.To;

  if (!messageSid || !fromNumber || !toNumber) {
    return jsonResponse({ error: "Missing SMS parameters" }, 400);
  }

  const admin = createAdminClient();
  const wasInserted = await ensureIdempotentEvent(
    admin,
    `twilio:sms_inbound:${messageSid}`,
    params,
    "sms_inbound",
  );

  if (!wasInserted) {
    return jsonResponse({ received: true });
  }

  const { data: settings } = await admin
    .from("telephony_settings")
    .select("client_id")
    .eq("twilio_phone_number", toNumber)
    .maybeSingle();

  if (!settings?.client_id) {
    return jsonResponse({ received: true });
  }

  const { data: contact } = await admin
    .from("contacts")
    .select("id")
    .eq("client_id", settings.client_id)
    .eq("phone", fromNumber)
    .maybeSingle();

  const { data: thread, error: threadError } = await admin
    .from("sms_threads")
    .upsert(
      {
        client_id: settings.client_id,
        contact_id: contact?.id ?? null,
        phone: fromNumber,
      },
      { onConflict: "client_id,phone" },
    )
    .select("id")
    .maybeSingle();

  if (threadError || !thread?.id) {
    console.error("sms-inbound-webhook thread error", threadError);
    return jsonResponse({ received: true });
  }

  await admin.from("sms_messages").insert({
    thread_id: thread.id,
    client_id: settings.client_id,
    direction: "inbound",
    from_number: fromNumber,
    to_number: toNumber,
    body: params.Body ?? null,
    status: params.MessageStatus ?? "received",
    provider: "twilio",
    provider_message_sid: messageSid,
  });

  await admin.from("audit_logs").insert({
    client_id: settings.client_id,
    action: "sms_received",
    metadata: {
      from: fromNumber,
      provider_message_sid: messageSid,
    },
  });

  return jsonResponse({ received: true });
});
