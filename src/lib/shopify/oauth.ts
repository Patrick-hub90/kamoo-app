import crypto from "crypto";
import {
  SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET,
  SHOPIFY_APP_URL,
  SHOPIFY_SCOPES,
} from "@/lib/shopify/config";

/**
 * Helpers OAuth Shopify (côté serveur).
 *  - URL d'installation (authorize)
 *  - vérification HMAC du callback (signature des query params)
 *  - vérification HMAC des webhooks (signature du body brut)
 *  - échange code → access token
 */

/** Construit l'URL d'autorisation Shopify pour une boutique donnée. */
export function buildInstallUrl(shop: string, state: string): string {
  const params = new URLSearchParams({
    client_id: SHOPIFY_API_KEY,
    scope: SHOPIFY_SCOPES,
    redirect_uri: `${SHOPIFY_APP_URL}/api/shopify/callback`,
    state,
  });
  return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
}

/**
 * Vérifie le HMAC d'un callback OAuth : tous les params sauf `hmac` et
 * `signature`, triés, joints en query string, signés en SHA-256.
 */
export function verifyCallbackHmac(searchParams: URLSearchParams): boolean {
  const hmac = searchParams.get("hmac");
  if (!hmac) return false;
  const pairs: string[] = [];
  const sorted = [...searchParams.entries()]
    .filter(([k]) => k !== "hmac" && k !== "signature")
    .sort(([a], [b]) => a.localeCompare(b));
  for (const [k, v] of sorted) pairs.push(`${k}=${v}`);
  const message = pairs.join("&");
  const digest = crypto
    .createHmac("sha256", SHOPIFY_API_SECRET)
    .update(message)
    .digest("hex");
  return safeEqual(digest, hmac);
}

/** Vérifie le HMAC d'un webhook (base64 du SHA-256 du body brut). */
export function verifyWebhookHmac(rawBody: string, hmacHeader: string | null): boolean {
  if (!hmacHeader) return false;
  const digest = crypto
    .createHmac("sha256", SHOPIFY_API_SECRET)
    .update(rawBody, "utf8")
    .digest("base64");
  return safeEqual(digest, hmacHeader);
}

/**
 * Réponse token Shopify (offline EXPIRABLE).
 * Shopify n'accepte plus les tokens offline non-expirants sur l'Admin API :
 * on demande `expiring=1`, ce qui renvoie un access token court (≈1h) + un
 * refresh token (≈90j) pour le renouveler.
 */
export type ShopifyTokenResponse = {
  accessToken: string;
  scope: string;
  /** Durée de vie de l'access token en secondes (≈3600). */
  expiresIn?: number;
  /** Refresh token pour renouveler l'access token. */
  refreshToken?: string;
  /** Durée de vie du refresh token en secondes (≈7776000 = 90 j). */
  refreshTokenExpiresIn?: number;
};

type RawTokenJson = {
  access_token: string;
  scope: string;
  expires_in?: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
};

function mapTokenJson(json: RawTokenJson): ShopifyTokenResponse {
  return {
    accessToken: json.access_token,
    scope: json.scope ?? "",
    expiresIn: json.expires_in,
    refreshToken: json.refresh_token,
    refreshTokenExpiresIn: json.refresh_token_expires_in,
  };
}

/** Échange le code d'autorisation contre un access token offline EXPIRABLE. */
export async function exchangeCodeForToken(
  shop: string,
  code: string,
): Promise<ShopifyTokenResponse> {
  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      code,
      // Tokens offline expirables (les non-expirants sont refusés par l'API).
      expiring: 1,
    }),
  });
  if (!res.ok) {
    throw new Error(`Échec de l'échange du token (${res.status})`);
  }
  return mapTokenJson((await res.json()) as RawTokenJson);
}

/** Renouvelle un access token offline expiré via son refresh token. */
export async function refreshAccessToken(
  shop: string,
  refreshToken: string,
): Promise<ShopifyTokenResponse> {
  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) {
    throw new Error(`Échec du rafraîchissement du token (${res.status})`);
  }
  return mapTokenJson((await res.json()) as RawTokenJson);
}

/** Comparaison à temps constant (évite les attaques par timing). */
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/** Domaine boutique valide (anti-injection sur le paramètre shop). */
export function isValidShopDomain(shop: string): boolean {
  return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(shop);
}
