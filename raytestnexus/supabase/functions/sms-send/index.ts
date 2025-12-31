import { createAdminClient } from "../_shared/supabase.ts";
import { getUserFromRequest, HttpError, requireClientAccess, requireInternal } from "../_shared/authz.ts";
import { jsonResponse } from "../_shared/responses.ts";
import { createTwilioRestClient } from "../_shared/twilio.ts";

type RequestBody = {
  client_id: string;
  contact_id?: string;
  to_number: string;
  body: string;
};

async function parseJsonBody<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch (_err) {
    throw new HttpError(400, "Invalid JSON body");
  }
}

async function ensureNotOptedOut(
  admin: ReturnType<typeof createAdminClient>,
  clientId: string,
  contactId: string | undefined,
): Promise<void> {
  if (!contactId) {
    return;
  }

  const { data: dnc, error: dncError } = await admin
    .from("do_not_contact")
    .select("id")
    .eq("client_id", clientId)
    .eq("contact_id", contactId)
    .maybeSingle();

  if (dncError) {
    throw new HttpError(500, "Failed to check do_not_contact");
  }

  if (dnc) {
    throw new HttpError(403, "Contact is on the do-not-contact list");
  }

  const { data: consent, error: consentError } = await admin
    .from("contact_consent")
    .select("status")
    .eq("client_id", clientId)
    .eq("contact_id", contactId)
    .eq("channel", "sms")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (consentError) {
    throw new HttpError(500, "Failed to check consent");
  }

  if (consent?.status === "opted_out") {
    throw new HttpError(403, "Contact has opted out of SMS");
  }
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      throw new HttpError(405, "Method not allowed");
    }

    const body = await parseJsonBody<RequestBody>(req);
    const clientId = body.client_id;
    const contactId = body.contact_id;
    const toNumber = body.to_number;
    const messageBody = body.body;

    if (!clientId || !toNumber || !messageBody) {
      throw new HttpError(400, "client_id, to_number, and body are required");
    }

    const { userId } = await getUserFromRequest(req);
    await requireInternal(userId);
    await requireClientAccess(userId, clientId);

    const admin = createAdminClient();
    await ensureNotOptedOut(admin, clientId, contactId);

    const messagingServiceSid = Deno.env.get("TWILIO_MESSAGING_SERVICE_SID");
    let fromNumber: string | undefined;

    if (!messagingServiceSid) {
      const { data: settings, error: settingsError } = await admin
        .from("telephony_settings")
        .select("twilio_phone_number")
        .eq("client_id", clientId)
        .maybeSingle();

      if (settingsError || !settings?.twilio_phone_number) {
        throw new HttpError(500, "No Twilio phone number configured for this client");
      }

      fromNumber = settings.twilio_phone_number;
    }

    const twilio = createTwilioRestClient();
    const statusCallback = `${new URL(req.url).origin}/sms-status-webhook`;

    const message = await twilio.messages.create({
      to: toNumber,
      body: messageBody,
      from: fromNumber,
      messagingServiceSid: messagingServiceSid || undefined,
      statusCallback,
    });

    const { data: thread, error: threadError } = await admin
      .from("sms_threads")
      .upsert(
        {
          client_id: clientId,
          contact_id: contactId ?? null,
          phone: toNumber,
        },
        { onConflict: "client_id,phone" },
      )
      .select("id")
      .maybeSingle();

    if (threadError || !thread?.id) {
      throw new HttpError(500, `Failed to upsert sms_thread: ${threadError?.message ?? "unknown error"}`);
    }

    const { data: smsMessage, error: insertError } = await admin
      .from("sms_messages")
      .insert({
        thread_id: thread.id,
        client_id: clientId,
        direction: "outbound",
        from_number: fromNumber,
        to_number: toNumber,
        body: messageBody,
        status: message.status ?? "queued",
        provider: "twilio",
        provider_message_sid: message.sid,
        created_by: userId,
      })
      .select("id")
      .maybeSingle();

    if (insertError || !smsMessage?.id) {
      throw new HttpError(500, `Failed to insert sms message: ${insertError?.message ?? "unknown error"}`);
    }

    await admin.from("audit_logs").insert({
      actor_user_id: userId,
      client_id: clientId,
      action: "sms_sent",
      metadata: {
        to: toNumber,
        provider_message_sid: message.sid,
      },
    });

    return jsonResponse({
      thread_id: thread.id,
      message_id: smsMessage.id,
      provider_message_sid: message.sid,
      status: message.status ?? "queued",
    });
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("sms-send error", err);
    return jsonResponse({ error: message }, status);
  }
});
