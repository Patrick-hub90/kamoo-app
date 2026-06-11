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
  const json = (await res.json()) as { data?: T; errors?: unknown };
  if (json.errors) {
    throw new ShopifyApiError("Erreur GraphQL Shopify", 200, json.errors);
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
