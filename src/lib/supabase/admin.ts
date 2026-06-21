import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase **admin (service role)** — serveur uniquement.
 *
 * Contrairement à `server.ts` (client SSR par cookie, clé anon, soumis à la
 * RLS), celui-ci utilise la clé `service_role` qui **contourne la RLS** : il
 * sert aux écritures système sans session utilisateur (ex. stockage des
 * access tokens Shopify obtenus par OAuth).
 *
 * ⚠️ `SUPABASE_SERVICE_ROLE_KEY` est un SECRET serveur : ne JAMAIS l'importer
 * dans un composant client ni l'exposer au navigateur.
 *
 * Renvoie `null` si non configuré → permet un repli (fichier) en dev local.
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

let cached: SupabaseClient | null | undefined;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  if (!URL || !SERVICE_KEY) {
    cached = null;
    return null;
  }
  cached = createClient(URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

/** Vrai si le client admin est configuré (choix du backend de stockage). */
export function isSupabaseAdminConfigured(): boolean {
  return Boolean(URL && SERVICE_KEY);
}
