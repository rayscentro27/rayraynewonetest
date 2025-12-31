import { createAdminClient } from "../_shared/supabase.ts";
import { xmlResponse } from "../_shared/responses.ts";
import { verifyTwilioSignature } from "../_shared/twilio.ts";

type TwilioParams = Record<string, string>;

async function parseTwilioParams(req: Request): Promise<TwilioParams> {
  const rawBody = await req.text();
  const params = new URLSearchParams(rawBody);
  return Object.fromEntries(params.entries());
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getIdentity(fromValue: string | undefined): string | null {
  if (!fromValue) return null;
  if (fromValue.startsWith("client:")) {
    return fromValue.slice("client:".length);
  }
  return fromValue;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return xmlResponse("Method not allowed", 405);
  }

  const params = await parseTwilioParams(req);
  const signature = req.headers.get("X-Twilio-Signature");

  if (!verifyTwilioSignature(params, req.url, signature)) {
    return xmlResponse("Invalid signature", 403);
  }

  const toNumber = params.To;
  const callSid = params.CallSid;
  const from = params.From;

  const url = new URL(req.url);
  const clientId = params.client_id || url.searchParams.get("client_id") || "";

  if (!clientId || !toNumber || !callSid) {
    return xmlResponse("<Response><Say>Missing call parameters.</Say></Response>", 400);
  }

  const admin = createAdminClient();

  const { data: settings, error: settingsError } = await admin
    .from("telephony_settings")
    .select("twilio_phone_number")
    .eq("client_id", clientId)
    .maybeSingle();

  if (settingsError || !settings?.twilio_phone_number) {
    console.error("telephony-client-voice-webhook missing settings", settingsError);
    return xmlResponse("<Response><Say>Telephony is not configured.</Say></Response>", 500);
  }

  const identity = getIdentity(from);
  let createdBy: string | null = null;

  if (identity) {
    const { data: identityRow } = await admin
      .from("user_telephony_identities")
      .select("user_id")
      .eq("identity", identity)
      .maybeSingle();
    createdBy = identityRow?.user_id ?? null;
  }

  const { data: callRow } = await admin
    .from("calls")
    .upsert(
      {
        client_id: clientId,
        provider: "twilio",
        provider_call_sid: callSid,
        direction: "outbound",
        from_number: settings.twilio_phone_number,
        to_number: toNumber,
        status: params.CallStatus || "initiated",
        created_by: createdBy,
      },
      { onConflict: "provider_call_sid" },
    )
    .select("id")
    .maybeSingle();

  if (callRow?.id) {
    await admin.from("call_events").insert({
      call_id: callRow.id,
      event_type: "client_dial",
      payload: params,
    });
  }

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${escapeXml(settings.twilio_phone_number)}">
    <Number>${escapeXml(toNumber)}</Number>
  </Dial>
</Response>`;

  return xmlResponse(twiml);
});
