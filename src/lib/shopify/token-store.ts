import { promises as fs } from "fs";
import path from "path";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Stockage serveur des access tokens Shopify (par domaine boutique).
 *
 * Backend choisi automatiquement :
 *  - **Supabase** (table `shopify_tokens`) dès que `NEXT_PUBLIC_SUPABASE_URL`
 *    + `SUPABASE_SERVICE_ROLE_KEY` sont configurés → persistant en serverless
 *    (Vercel). Table verrouillée par RLS : seule la clé service y accède.
 *  - **Fichier JSON** (`.shopify-tokens.json`, gitignoré) en repli pour le dev
 *    local quand Supabase n'est pas configuré. ⚠️ NON persistant en serverless.
 *
 * Schéma SQL attendu (à exécuter une fois dans Supabase) :
 *   create table if not exists public.shopify_tokens (
 *     shop         text primary key,
 *     access_token text not null,
 *     scope        text,
 *     installed_at timestamptz not null default now(),
 *     updated_at   timestamptz not null default now()
 *   );
 *   alter table public.shopify_tokens enable row level security;
 *   -- aucune policy → accès réservé à la clé service_role (serveur)
 */

const TABLE = "shopify_tokens";
const FILE = path.join(process.cwd(), ".shopify-tokens.json");

export type TokenEntry = {
  accessToken: string;
  scope: string;
  installedAt: string;
};

type TokenFile = Record<string, TokenEntry>;

/* ─── Repli fichier (dev local) ──────────────────────────────────── */
async function fileReadAll(): Promise<TokenFile> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as TokenFile;
  } catch {
    return {};
  }
}

/* ─── API publique (backend transparent) ─────────────────────────── */
export async function saveToken(shop: string, entry: TokenEntry): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) {
    const all = await fileReadAll();
    all[shop] = entry;
    await fs.writeFile(FILE, JSON.stringify(all, null, 2), "utf8");
    return;
  }
  const { error } = await sb.from(TABLE).upsert(
    {
      shop,
      access_token: entry.accessToken,
      scope: entry.scope,
      installed_at: entry.installedAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "shop" },
  );
  if (error) throw new Error(`Supabase saveToken: ${error.message}`);
}

export async function getToken(shop: string): Promise<TokenEntry | null> {
  const sb = getSupabaseAdmin();
  if (!sb) {
    return (await fileReadAll())[shop] ?? null;
  }
  const { data, error } = await sb
    .from(TABLE)
    .select("access_token, scope, installed_at")
    .eq("shop", shop)
    .maybeSingle();
  if (error) throw new Error(`Supabase getToken: ${error.message}`);
  if (!data) return null;
  return {
    accessToken: data.access_token as string,
    scope: (data.scope as string | null) ?? "",
    installedAt: data.installed_at as string,
  };
}

export async function deleteToken(shop: string): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) {
    const all = await fileReadAll();
    delete all[shop];
    await fs.writeFile(FILE, JSON.stringify(all, null, 2), "utf8");
    return;
  }
  const { error } = await sb.from(TABLE).delete().eq("shop", shop);
  if (error) throw new Error(`Supabase deleteToken: ${error.message}`);
}
