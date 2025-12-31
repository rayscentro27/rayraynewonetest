import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function ensureIdempotentEvent(
  supabaseAdmin: SupabaseClient,
  key: string,
  payload: Record<string, unknown>,
  type: string,
  source = "twilio",
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("external_events")
    .upsert(
      { id: key, source, type, payload },
      { onConflict: "id", ignoreDuplicates: true },
    )
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to record idempotency key: ${error.message}`);
  }

  return Boolean(data?.id);
}
