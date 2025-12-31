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
  const messageStatus = params.MessageStatus;

  if (!messageSid || !messageStatus) {
    return jsonResponse({ error: "Missing SMS status parameters" }, 400);
  }

  const admin = createAdminClient();
  const wasInserted = await ensureIdempotentEvent(
    admin,
    `twilio:sms_status:${messageSid}:${messageStatus}`,
    params,
    "sms_status",
  );

  if (!wasInserted) {
    return jsonResponse({ received: true });
  }

  const { error } = await admin
    .from("sms_messages")
    .update({
      status: messageStatus,
      error_code: params.ErrorCode ?? null,
      error_message: params.ErrorMessage ?? null,
    })
    .eq("provider_message_sid", messageSid);

  if (error) {
    console.error("sms-status-webhook update error", error);
  }

  return jsonResponse({ received: true });
});
