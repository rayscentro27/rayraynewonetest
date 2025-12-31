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

function buildDialClient(identity: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial>
    <Client>${escapeXml(identity)}</Client>
  </Dial>
</Response>`;
}

function buildDialNumber(number: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial>
    <Number>${escapeXml(number)}</Number>
  </Dial>
</Response>`;
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
  const fromNumber = params.From;
  const callSid = params.CallSid;

  if (!toNumber || !callSid) {
    return xmlResponse("<Response><Say>Missing call parameters.</Say></Response>", 400);
  }

  const admin = createAdminClient();
  const { data: settings, error: settingsError } = await admin
    .from("telephony_settings")
    .select("client_id, twilio_phone_number, fallback_number")
    .eq("twilio_phone_number", toNumber)
    .maybeSingle();

  if (settingsError || !settings?.client_id) {
    console.error("telephony-incoming-voice-webhook missing settings", settingsError);
    return xmlResponse("<Response><Say>We are unavailable right now.</Say></Response>", 200);
  }

  const { data: staffRows, error: staffError } = await admin
    .from("client_staff")
    .select("user_id")
    .eq("client_id", settings.client_id);

  if (staffError) {
    console.error("telephony-incoming-voice-webhook staff error", staffError);
  }

  const staffIds = (staffRows ?? []).map((row) => row.user_id);
  const { data: adminRows } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "admin");

  const adminIds = (adminRows ?? []).map((row) => row.id);
  const candidateIds = [...new Set([...staffIds, ...adminIds])];

  let identity: string | null = null;

  if (candidateIds.length > 0) {
    const { data: identities } = await admin
      .from("user_telephony_identities")
      .select("identity, last_seen_at")
      .in("user_id", candidateIds)
      .order("last_seen_at", { ascending: false })
      .limit(1);

    if (identities && identities.length > 0) {
      identity = identities[0]?.identity ?? null;
    }
  }

  const { data: callRow } = await admin
    .from("calls")
    .upsert(
      {
        client_id: settings.client_id,
        provider: "twilio",
        provider_call_sid: callSid,
        direction: "inbound",
        from_number: fromNumber,
        to_number: toNumber,
        status: params.CallStatus || "ringing",
      },
      { onConflict: "provider_call_sid" },
    )
    .select("id")
    .maybeSingle();

  if (callRow?.id) {
    await admin.from("call_events").insert({
      call_id: callRow.id,
      event_type: "inbound_routing",
      payload: params,
    });
  }

  if (identity) {
    return xmlResponse(buildDialClient(identity));
  }

  if (settings.fallback_number) {
    return xmlResponse(buildDialNumber(settings.fallback_number));
  }

  return xmlResponse("<Response><Say>No agents are available.</Say><Hangup/></Response>");
});
