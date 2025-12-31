import { createAdminClient, createAnonClient } from "./supabase.ts";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function getBearerToken(req: Request): string {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader) {
    throw new HttpError(401, "Missing Authorization header");
  }
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new HttpError(401, "Invalid Authorization header format");
  }
  return token.trim();
}

export async function getUserFromRequest(req: Request): Promise<{ userId: string; token: string }> {
  const token = getBearerToken(req);
  const anon = createAnonClient();
  const { data, error } = await anon.auth.getUser(token);
  if (error || !data?.user) {
    throw new HttpError(401, "Invalid or expired token");
  }
  return { userId: data.user.id, token };
}

export async function getProfileRole(userId: string): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, `Failed to load profile role: ${error.message}`);
  }

  return data?.role || "user";
}

export async function requireInternal(userId: string): Promise<string> {
  const role = await getProfileRole(userId);
  if (!["admin", "user", "sales", "partner"].includes(role)) {
    throw new HttpError(403, "Internal role required");
  }
  return role;
}

export async function requireClientAccess(userId: string, clientId: string): Promise<void> {
  const admin = createAdminClient();
  const role = await getProfileRole(userId);

  if (role === "admin") {
    return;
  }

  const [{ data: clientUser, error: clientUserError }, { data: staffUser, error: staffError }] =
    await Promise.all([
      admin
        .from("client_users")
        .select("client_id")
        .eq("user_id", userId)
        .eq("client_id", clientId)
        .maybeSingle(),
      admin
        .from("client_staff")
        .select("client_id")
        .eq("user_id", userId)
        .eq("client_id", clientId)
        .maybeSingle(),
    ]);

  if (clientUserError || staffError) {
    throw new HttpError(500, "Failed to verify client access");
  }

  if (!clientUser && !staffUser) {
    throw new HttpError(403, "Not authorized for this client");
  }
}
