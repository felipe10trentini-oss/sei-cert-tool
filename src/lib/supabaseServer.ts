import { createClient } from "@supabase/supabase-js";

// Cliente Supabase para uso exclusivo no servidor (API routes / scripts).
// Usa a service role key — NUNCA importe este arquivo em código que roda no navegador.
let cachedClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseServerClient() {
  if (cachedClient) return cachedClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não configurados. Veja .env.local.example."
    );
  }

  cachedClient = createClient(url, key, {
    auth: { persistSession: false },
  });
  return cachedClient;
}
