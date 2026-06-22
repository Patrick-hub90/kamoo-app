import "server-only";
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
 * Schéma SQL : cf. `supabase/schema.sql` (table verrouillée par RLS +
 * colonnes refresh_token / expires_at / refresh_token_expires_at pour les
 * tokens offline expirables).
 */

const TABLE = "shopify_tokens";
const FILE = path.join(process.cwd(), ".shopify-tokens.json");

export type TokenEntry = {
  accessToken: string;
  scope: string;
  installedAt: string;
  /** Refresh token (tokens offline expirables). */
  refreshToken?: string;
  /** Expiration ISO de l'access token. */
  expiresAt?: string;
  /** Expiration ISO du refresh token. */
  refreshTokenExpiresAt?: string;
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
      refresh_token: entry.refreshToken ?? null,
      expires_at: entry.expiresAt ?? null,
      refresh_token_expires_at: entry.refreshTokenExpiresAt ?? null,
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
    .select("access_token, scope, installed_at, refresh_token, expires_at, refresh_token_expires_at")
    .eq("shop", shop)
    .maybeSingle();
  if (error) throw new Error(`Supabase getToken: ${error.message}`);
  if (!data) return null;
  return {
    accessToken: data.access_token as string,
    scope: (data.scope as string | null) ?? "",
    installedAt: data.installed_at as string,
    refreshToken: (data.refresh_token as string | null) ?? undefined,
    expiresAt: (data.expires_at as string | null) ?? undefined,
    refreshTokenExpiresAt: (data.refresh_token_expires_at as string | null) ?? undefined,
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
