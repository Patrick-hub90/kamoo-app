import { SHOPIFY_API_VERSION } from "@/lib/shopify/config";
import { getToken } from "@/lib/shopify/token-store";

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
  if (m.includes("protected") || m.includes("not approved to access")) return "donnees_client";
  return "scopes";
}

/** Exécute une requête GraphQL sur l'Admin API d'une boutique. */
export async function shopifyGraphQL<T = unknown>(
  shop: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const token = await getToken(shop);
  if (!token) {
    throw new ShopifyApiError(`Aucun token pour ${shop} — boutique non connectée`, 401);
  }
  const res = await fetch(
    `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token.accessToken,
      },
      body: JSON.stringify({ query, variables }),
    },
  );
  if (!res.ok) {
    throw new ShopifyApiError(`Shopify ${res.status}`, res.status, await res.text());
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
    throw new ShopifyApiError(`Erreur GraphQL Shopify: ${messages}`, 200, json.errors);
  }
  return json.data as T;
}

/** Requête REST (pour les endpoints sans équivalent GraphQL pratique). */
export async function shopifyRest<T = unknown>(
  shop: string,
  endpoint: string,
  init?: RequestInit,
): Promise<T> {
  const token = await getToken(shop);
  if (!token) {
    throw new ShopifyApiError(`Aucun token pour ${shop} — boutique non connectée`, 401);
  }
  const res = await fetch(
    `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/${endpoint}`,
    {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token.accessToken,
        ...(init?.headers ?? {}),
      },
    },
  );
  if (!res.ok) {
    throw new ShopifyApiError(`Shopify ${res.status}`, res.status, await res.text());
  }
  return (await res.json()) as T;
}
