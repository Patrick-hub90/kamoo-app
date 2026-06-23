import { SHOPIFY_API_VERSION } from "@/lib/shopify/config";
import { getToken, saveToken } from "@/lib/shopify/token-store";
import { refreshAccessToken } from "@/lib/shopify/oauth";

/**
 * Renvoie un access token VALIDE pour la boutique : rafraîchit automatiquement
 * le token offline expirable s'il est expiré (ou expire dans < 60 s) via le
 * refresh token. Renvoie null si la boutique n'est pas connectée.
 */
async function getValidAccessToken(shop: string): Promise<string | null> {
  const entry = await getToken(shop);
  if (!entry) return null;
  const expMs = entry.expiresAt ? Date.parse(entry.expiresAt) : 0;
  const expiringSoon = expMs > 0 && expMs < Date.now() + 60_000;
  if (expiringSoon && entry.refreshToken) {
    try {
      const r = await refreshAccessToken(shop, entry.refreshToken);
      await saveToken(shop, {
        accessToken: r.accessToken,
        scope: r.scope || entry.scope,
        installedAt: entry.installedAt,
        refreshToken: r.refreshToken ?? entry.refreshToken,
        expiresAt: r.expiresIn
          ? new Date(Date.now() + r.expiresIn * 1000).toISOString()
          : undefined,
        refreshTokenExpiresAt: r.refreshTokenExpiresIn
          ? new Date(Date.now() + r.refreshTokenExpiresIn * 1000).toISOString()
          : entry.refreshTokenExpiresAt,
      });
      return r.accessToken;
    } catch {
      // Échec du refresh → on tente le token courant (échouera proprement).
      return entry.accessToken;
    }
  }
  return entry.accessToken;
}

/**
 * Client Admin API Shopify (GraphQL) — côté serveur uniquement.
 * Utilise l'access token stocké pour la boutique.
 */

export class ShopifyApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ShopifyApiError";
  }
}

/**
 * Classe une erreur Shopify pour un message utilisateur précis :
 *  - "donnees_client" : l'app n'a pas l'accès aux DONNÉES CLIENT PROTÉGÉES
 *    (objet Order/Customer) → à demander dans « Protected customer data access ».
 *    Distinct des scopes : on peut avoir read_orders ET être bloqué ici.
 *  - "scopes" : un scope manque purement et simplement.
 *  - "autre" : autre erreur.
 */
export function classifyShopifyError(e: unknown): "donnees_client" | "scopes" | "autre" {
  if (!(e instanceof ShopifyApiError) || e.status !== 403) return "autre";
  const m = e.message.toLowerCase();
  // Données client protégées : Shopify renvoie un 403 quand l'app n'a pas
  // l'« approbation accès données client protégées » (lecture commandes /
  // clients). Plusieurs formulations possibles selon l'endpoint.
  if (
    m.includes("protected") ||
    m.includes("not approved to access") ||
    m.includes("merchant approval") ||
    m.includes("requires approval") ||
    m.includes("customer data") ||
    m.includes("read_orders")
  ) {
    return "donnees_client";
  }
  return "scopes";
}

/** Exécute une requête GraphQL sur l'Admin API d'une boutique. */
export async function shopifyGraphQL<T = unknown>(
  shop: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const accessToken = await getValidAccessToken(shop);
  if (!accessToken) {
    throw new ShopifyApiError(`Aucun token pour ${shop} — boutique non connectée`, 401);
  }
  const res = await fetch(
    `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({ query, variables }),
    },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new ShopifyApiError(`Shopify ${res.status}: ${body.slice(0, 400)}`, res.status, body);
  }
  const json = (await res.json()) as {
    data?: T;
    errors?: { message?: string; extensions?: { code?: string } }[];
  };
  if (json.errors && json.errors.length > 0) {
    const codes = json.errors.map((e) => e.extensions?.code).filter(Boolean);
    const messages = json.errors.map((e) => e.message).filter(Boolean).join(" | ");
    // Scopes manquants : erreur la plus fréquente sur une app fraîchement
    // créée (les scopes se déclarent dans la CONFIG de l'app, pas dans l'URL).
    if (codes.includes("ACCESS_DENIED")) {
      throw new ShopifyApiError(`ACCESS_DENIED: ${messages}`, 403, json.errors);
    }
    // Erreur GraphQL non bloquante (throttling, champ indisponible…) : on
    // remonte un vrai code d'échec (502) — surtout pas 200, qui masquait
    // l'erreur côté appelant (res.ok restait true).
    throw new ShopifyApiError(`Erreur GraphQL Shopify: ${messages}`, 502, json.errors);
  }
  return json.data as T;
}

/** Requête REST (pour les endpoints sans équivalent GraphQL pratique). */
export async function shopifyRest<T = unknown>(
  shop: string,
  endpoint: string,
  init?: RequestInit,
): Promise<T> {
  const accessToken = await getValidAccessToken(shop);
  if (!accessToken) {
    throw new ShopifyApiError(`Aucun token pour ${shop} — boutique non connectée`, 401);
  }
  const res = await fetch(
    `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/${endpoint}`,
    {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
        ...(init?.headers ?? {}),
      },
    },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new ShopifyApiError(`Shopify ${res.status}: ${body.slice(0, 400)}`, res.status, body);
  }
  return (await res.json()) as T;
}
