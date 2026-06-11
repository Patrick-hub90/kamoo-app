import { isLiveMode, normalizeShopDomain } from "@/lib/shopify/config";
import {
  exchangeCodeForToken,
  isValidShopDomain,
  verifyCallbackHmac,
} from "@/lib/shopify/oauth";
import { saveToken } from "@/lib/shopify/token-store";

/**
 * Callback OAuth Shopify : GET /api/shopify/callback?code=...&shop=...&hmac=...&state=...
 *  1. vérifie le HMAC (intégrité des params)
 *  2. vérifie le state (cookie posé à l'install — anti-CSRF)
 *  3. échange le code contre un access token et le stocke
 *  4. redirige vers la page Connexions avec le résultat
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams;
  const shop = normalizeShopDomain(params.get("shop") ?? "");
  const code = params.get("code");
  const state = params.get("state");

  const fail = (reason: string) =>
    Response.redirect(
      new URL(`/parametres/connexions?shopify_error=${encodeURIComponent(reason)}`, request.url),
    );

  if (!isLiveMode()) return fail("mode_demo");
  if (!shop || !isValidShopDomain(shop) || !code) return fail("params_invalides");
  if (!verifyCallbackHmac(params)) return fail("hmac_invalide");

  // Vérif anti-CSRF : le state doit correspondre au cookie posé à l'install
  const cookie = request.headers.get("cookie") ?? "";
  const expected = cookie.match(/shopify_oauth_state=([^;]+)/)?.[1];
  if (!expected || decodeURIComponent(expected) !== state) return fail("state_invalide");

  const market = (state ?? "").split(".")[1] ?? "";

  try {
    const { accessToken, scope } = await exchangeCodeForToken(shop, code);
    await saveToken(shop, {
      accessToken,
      scope,
      installedAt: new Date().toISOString(),
    });
  } catch {
    return fail("echec_token");
  }

  // Succès → la page Connexions lit ces params pour mettre l'état à jour
  return new Response(null, {
    status: 302,
    headers: {
      Location: `/parametres/connexions?shopify_connected=${encodeURIComponent(shop)}&market=${encodeURIComponent(market)}`,
      // Nettoie le cookie de state
      "Set-Cookie": "shopify_oauth_state=; Path=/; HttpOnly; Max-Age=0",
    },
  });
}
