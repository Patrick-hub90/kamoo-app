import crypto from "crypto";
import { isLiveMode, normalizeShopDomain } from "@/lib/shopify/config";
import { buildInstallUrl, isValidShopDomain } from "@/lib/shopify/oauth";

/**
 * Démarre l'installation OAuth : GET /api/shopify/install?shop=xxx&market=SN
 * → redirige vers l'écran d'autorisation Shopify (mode réel uniquement).
 *
 * Un nonce `state` est posé en cookie httpOnly et vérifié au callback (CSRF).
 */
export async function GET(request: Request) {
  if (!isLiveMode()) {
    // En mode démo, l'UI gère un écran d'autorisation simulé — on ne devrait
    // pas arriver ici. Sécurité : on renvoie vers la page connexions.
    return Response.redirect(new URL("/parametres/connexions?demo=1", request.url));
  }

  const url = new URL(request.url);
  const shop = normalizeShopDomain(url.searchParams.get("shop") ?? "");
  const market = url.searchParams.get("market") ?? "";

  if (!shop || !isValidShopDomain(shop)) {
    return Response.json({ error: "Domaine boutique invalide" }, { status: 400 });
  }

  // state = nonce + marché, signé implicitement par le cookie httpOnly
  const nonce = crypto.randomBytes(16).toString("hex");
  const state = `${nonce}.${market}`;
  const installUrl = buildInstallUrl(shop, state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: installUrl,
      "Set-Cookie": `shopify_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`,
    },
  });
}
