import { createAdminClient } from "../_shared/supabase.ts";
import { HttpError, parseJsonBody, requireClientAccess } from "../_shared/auth.ts";

/*
SQL to create the table:

create table if not exists public.document_extractions (
  id bigserial primary key,
  client_id uuid references public.clients(id),
  path text not null,
  extracted jsonb not null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);
*/

type RequestBody = {
  client_id: string;
  path: string;
  mime_type: string;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function extractFinancials(buffer: ArrayBuffer, mimeType: string): Promise<Record<string, unknown>> {
  // TODO: Replace this stub with a real AI provider call.
  // Example: send buffer to OpenAI/Gemini, then parse JSON response.
  return {
    status: "stub",
    mime_type: mimeType,
    bytes: buffer.byteLength,
    extracted_at: new Date().toISOString(),
  };
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      throw new HttpError(405, "Method not allowed");
    }

    const body = await parseJsonBody<RequestBody>(req);
    const clientId = body.client_id;
    const path = body.path;
    const mimeType = body.mime_type;

    if (!clientId || !path || !mimeType) {
      throw new HttpError(400, "client_id, path, and mime_type are required");
    }

    const { user } = await requireClientAccess(req, clientId);
    const admin = createAdminClient();

    const { data: file, error: downloadError } = await admin
      .storage
      .from("documents")
      .download(path);

    if (downloadError || !file) {
      throw new HttpError(404, "Document not found in storage");
    }

    const buffer = await file.arrayBuffer();
    const extracted = await extractFinancials(buffer, mimeType);

    const { data, error } = await admin
      .from("document_extractions")
      .insert({
        client_id: clientId,
        path,
        extracted,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new HttpError(500, `Failed to store extraction: ${error?.message ?? "unknown error"}`);
    }

    return jsonResponse({ extraction_id: data.id, extracted });
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("analyze-document error", err);
    return jsonResponse({ error: message }, status);
  }
});
