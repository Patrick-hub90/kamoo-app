/**
 * Configuration Shopify (serveur).
 *
 * Mode LIVE vs DÉMO : déterminé par la présence des clés API dans
 * l'environnement. Tant que `SHOPIFY_API_KEY` / `SHOPIFY_API_SECRET` ne sont
 * pas renseignés (dans `.env.local`), Kamoo tourne en mode DÉMO : la
 * connexion, l'import et la publication sont simulés mais injectent de vraies
 * données dans l'app. Dès que les clés sont là, on bascule en réel (OAuth +
 * Admin API).
 *
 * ⚠️ Le SECRET ne doit JAMAIS être exposé au client : il reste côté serveur.
 * Seul `SHOPIFY_API_KEY` peut éventuellement être public.
 */

export const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY ?? "";
export const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET ?? "";

/** Scopes demandés à l'installation (lecture/écriture produits + commandes + clients). */
export const SHOPIFY_SCOPES =
  process.env.SHOPIFY_SCOPES ??
  "read_products,write_products,read_orders,read_customers,write_orders,write_merchant_managed_fulfillment_orders";

/** URL publique de l'app (callback OAuth). En local : http://localhost:3000 */
export const SHOPIFY_APP_URL =
  process.env.SHOPIFY_APP_URL ?? "http://localhost:3000";

/** Version de l'Admin API ciblée. */
export const SHOPIFY_API_VERSION = "2025-01";

/** En mode réel uniquement si les deux clés sont présentes côté serveur. */
export function isLiveMode(): boolean {
  return SHOPIFY_API_KEY.length > 0 && SHOPIFY_API_SECRET.length > 0;
}

/** Normalise un domaine boutique saisi → `xxx.myshopify.com` (ou null si invalide). */
export function normalizeShopDomain(input: string): string | null {
  const raw = input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!raw) return null;
  // Déjà un domaine .myshopify.com complet
  if (/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(raw)) return raw;
  // Juste le « handle » de la boutique
  if (/^[a-z0-9][a-z0-9-]*$/.test(raw)) return `${raw}.myshopify.com`;
  return null;
}
