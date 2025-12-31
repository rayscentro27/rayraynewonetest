import { createAdminClient } from "../_shared/supabase.ts";
import { getUserRole, HttpError, parseJsonBody, requireUser } from "../_shared/auth.ts";

type RequestBody = {
  client_name: string;
  client_user_email: string;
  client_user_name?: string;
  send_invite?: boolean;
};

type ResponseBody = {
  client_id: string;
  user_id: string;
  invite_sent: boolean;
  temp_password?: string;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function generateTempPassword(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      throw new HttpError(405, "Method not allowed");
    }

    const body = await parseJsonBody<RequestBody>(req);
    const clientName = body.client_name?.trim();
    const clientUserEmail = body.client_user_email?.trim();
    const clientUserName = body.client_user_name?.trim() || null;
    const sendInvite = body.send_invite ?? true;

    if (!clientName || !clientUserEmail) {
      throw new HttpError(400, "client_name and client_user_email are required");
    }

    const caller = await requireUser(req);
    const callerRole = await getUserRole(caller.id);

    if (!["admin", "user", "sales", "partner"].includes(callerRole)) {
      throw new HttpError(403, "Not authorized to invite client users");
    }

    const admin = createAdminClient();

    const { data: clientRow, error: clientError } = await admin
      .from("clients")
      .insert({ name: clientName, created_by: caller.id })
      .select("id")
      .single();

    if (clientError || !clientRow) {
      throw new HttpError(500, `Failed to create client: ${clientError?.message ?? "unknown error"}`);
    }

    let userId: string;
    let tempPassword: string | undefined;
    let inviteSent = false;

    if (sendInvite) {
      const { data, error } = await admin.auth.admin.inviteUserByEmail(clientUserEmail, {
        data: clientUserName ? { name: clientUserName } : {},
      });

      if (error || !data?.user) {
        throw new HttpError(500, `Failed to invite user: ${error?.message ?? "unknown error"}`);
      }

      userId = data.user.id;
      inviteSent = true;
    } else {
      tempPassword = generateTempPassword();
      const { data, error } = await admin.auth.admin.createUser({
        email: clientUserEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: clientUserName ? { name: clientUserName } : {},
      });

      if (error || !data?.user) {
        throw new HttpError(500, `Failed to create user: ${error?.message ?? "unknown error"}`);
      }

      userId = data.user.id;
    }

    const { error: profileError } = await admin
      .from("profiles")
      .upsert(
        {
          id: userId,
          role: "client",
          name: clientUserName,
          email: clientUserEmail,
        },
        { onConflict: "id" },
      );

    if (profileError) {
      throw new HttpError(500, `Failed to set client profile: ${profileError.message}`);
    }

    const { error: linkError } = await admin
      .from("client_users")
      .insert({ user_id: userId, client_id: clientRow.id });

    if (linkError) {
      throw new HttpError(500, `Failed to link client user: ${linkError.message}`);
    }

    const response: ResponseBody = {
      client_id: clientRow.id,
      user_id: userId,
      invite_sent: inviteSent,
    };

    if (!inviteSent && tempPassword) {
      response.temp_password = tempPassword;
    }

    return jsonResponse(response, 200);
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("invite-client-user error", err);
    return jsonResponse({ error: message }, status);
  }
});
