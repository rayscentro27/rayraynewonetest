import { createAdminClient, createAnonClient } from "./supabase.ts";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type AuthResult = {
  user: { id: string; email?: string | null };
  role: string;
};

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

export async function requireUser(req: Request): Promise<{ id: string; email?: string | null }> {
  const token = getBearerToken(req);
  const anon = createAnonClient();
  const { data, error } = await anon.auth.getUser(token);
  if (error || !data?.user) {
    throw new HttpError(401, "Invalid or expired token");
  }
  return { id: data.user.id, email: data.user.email };
}

export async function getUserRole(userId: string): Promise<string> {
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

export async function authorizeClientAccess(userId: string, clientId: string): Promise<string> {
  const admin = createAdminClient();
  const role = await getUserRole(userId);

  if (role === "admin") {
    return role;
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

  return role;
}

export async function requireClientAccess(
  req: Request,
  clientId: string,
): Promise<AuthResult> {
  const user = await requireUser(req);
  const role = await authorizeClientAccess(user.id, clientId);
  return { user, role };
}

export async function parseJsonBody<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch (_err) {
    throw new HttpError(400, "Invalid JSON body");
  }
}
