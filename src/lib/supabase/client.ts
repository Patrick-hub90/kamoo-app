import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase côté navigateur (Client Components).
 * Utilise la clé anon publique.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
