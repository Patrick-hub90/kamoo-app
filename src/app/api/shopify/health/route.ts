import { isLiveMode } from "@/lib/shopify/config";
import { shopifyGraphQL, ShopifyApiError } from "@/lib/shopify/admin-client";
import { getToken } from "@/lib/shopify/token-store";

/**
 * Bilan de santé d'une connexion boutique : token présent ? scopes
 * suffisants ? Utilisé par la page Connexions pour afficher l'état réel
 * (et guider le vendeur si la config de l'app est incomplète).
 *
 * GET /api/shopify/health?shop=xxx.myshopify.com
 * → { status: "ok" | "scopes_manquants" | "token_absent" | "erreur", scopes }
 */
export async function GET(request: Request) {
  if (!isLiveMode()) return Response.json({ status: "demo" });
  const shop = new URL(request.url).searchParams.get("shop") ?? "";
  if (!shop) return Response.json({ status: "erreur", detail: "shop requis" }, { status: 400 });

  const token = await getToken(shop);
  if (!token) return Response.json({ status: "token_absent" });

  try {
    // Le test le plus représentatif : lire 1 commande (scope read_orders).
    await shopifyGraphQL(shop, `query { orders(first: 1) { edges { node { id } } } }`);
    return Response.json({ status: "ok", scopes: token.scope });
  } catch (e) {
    if (e instanceof ShopifyApiError && e.status === 403) {
      return Response.json({ status: "scopes_manquants", scopes: token.scope });
    }
    if (e instanceof ShopifyApiError && e.status === 401) {
      return Response.json({ status: "token_absent" });
    }
    return Response.json({ status: "erreur", detail: String(e) });
  }
}
