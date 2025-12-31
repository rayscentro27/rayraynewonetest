import { createAdminClient } from "../_shared/supabase.ts";
import { getUserFromRequest, HttpError, requireClientAccess, requireInternal } from "../_shared/authz.ts";
import { jsonResponse } from "../_shared/responses.ts";
import { generateTwilioVoiceAccessToken } from "../_shared/twilio.ts";

type RequestBody = {
  client_id: string;
};

async function parseJsonBody<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch (_err) {
    throw new HttpError(400, "Invalid JSON body");
  }
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

    const { userId } = await getUserFromRequest(req);
    await requireInternal(userId);
    await requireClientAccess(userId, clientId);

    const admin = createAdminClient();
    const identity = `user_${userId}`;

    const { error } = await admin
      .from("user_telephony_identities")
      .upsert(
        {
          user_id: userId,
          identity,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

    if (error) {
      throw new HttpError(500, `Failed to save telephony identity: ${error.message}`);
    }

    const token = generateTwilioVoiceAccessToken(identity, 3600);

    return jsonResponse({ identity, token });
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("telephony-token error", err);
    return jsonResponse({ error: message }, status);
  }
});
