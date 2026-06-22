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
    const token = await exchangeCodeForToken(shop, code);
    const scope = token.scope;
    await saveToken(shop, {
      accessToken: token.accessToken,
      scope: token.scope,
      installedAt: new Date().toISOString(),
      refreshToken: token.refreshToken,
      expiresAt: token.expiresIn
        ? new Date(Date.now() + token.expiresIn * 1000).toISOString()
        : undefined,
      refreshTokenExpiresAt: token.refreshTokenExpiresIn
        ? new Date(Date.now() + token.refreshTokenExpiresIn * 1000).toISOString()
        : undefined,
    });
    /* Auto-diagnostic : un token SANS scopes signifie que l'app n'a aucun
     * scope déclaré dans sa CONFIGURATION (Partner Dashboard) — l'URL OAuth
     * ne suffit pas avec la « Shopify managed installation ». On connecte
     * quand même, mais on remonte l'alerte à l'UI. */
    if (!scope || scope.trim() === "") {
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/parametres/connexions?shopify_connected=${encodeURIComponent(shop)}&market=${encodeURIComponent(market)}&shopify_error=scopes_manquants`,
          "Set-Cookie": "shopify_oauth_state=; Path=/; HttpOnly; Max-Age=0",
        },
      });
    }
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
