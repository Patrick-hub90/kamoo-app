import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Proxy (ex-Middleware — renommé en Next.js 16).
 *
 * Routage de l'espace **Partenaires** par sous-domaine.
 *
 * Routes propres (groupe `(partners)`) : `/partenaires` (landing),
 * `/transitaires`, `/closeurs`, `/livreurs` (+ `/[slug]`).
 *
 * - `partners.kamoo.me` : sert ces pages en URLs propres. La racine `/` affiche
 *   la landing (réécriture interne vers `/partenaires`, l'URL reste `/`). Les
 *   anciens liens `/marketplace/*` y sont normalisés vers la version propre.
 * - `kamoo.me` / `www.kamoo.me` (prod) : la marketplace a déménagé → toute route
 *   du pôle (propre ou legacy) est redirigée vers `partners.kamoo.me`.
 * - `localhost` / previews Vercel : tout reste interne (le legacy est juste
 *   normalisé), pour que le dev fonctionne sans sous-domaine.
 */

const PARTNER_PREFIXES = ["/partenaires", "/transitaires", "/closeurs", "/livreurs"];

/** Mappe un ancien chemin `/marketplace/*` vers son équivalent propre. */
function toClean(path: string): string {
  if (path === "/marketplace") return "/partenaires";
  const rest = path.slice("/marketplace".length); // ex. "/transitaires/acme"
  if (
    rest.startsWith("/transitaires") ||
    rest.startsWith("/closeurs") ||
    rest.startsWith("/livreurs")
  ) {
    return rest;
  }
  return "/partenaires";
}

export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").toLowerCase();
  const { pathname, search } = request.nextUrl;

  const isPartnersHost = host.startsWith("partners.");
  const isMainProd = host === "kamoo.me" || host === "www.kamoo.me";
  const isLegacy = pathname === "/marketplace" || pathname.startsWith("/marketplace/");
  const cleanPath = isLegacy ? toClean(pathname) : pathname;
  const isPartnerPath = PARTNER_PREFIXES.some(
    (p) => cleanPath === p || cleanPath.startsWith(p + "/"),
  );

  // 1) Sous-domaine partenaires
  if (isPartnersHost) {
    if (isLegacy) {
      const url = request.nextUrl.clone();
      url.pathname = cleanPath;
      return NextResponse.redirect(url);
    }
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/partenaires";
      return NextResponse.rewrite(url); // landing à la racine, URL inchangée
    }
    if (isPartnerPath) return NextResponse.next();
    // Tout le reste du sous-domaine → landing
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // 2) Domaine principal de prod → la marketplace vit sur partners.kamoo.me
  if (isMainProd && (isLegacy || isPartnerPath)) {
    const target = new URL(cleanPath, "https://partners.kamoo.me");
    target.search = search;
    return NextResponse.redirect(target);
  }

  // 3) Localhost / previews : on garde tout en interne (legacy normalisé)
  if (isLegacy) {
    const url = request.nextUrl.clone();
    url.pathname = cleanPath;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // On exclut l'API, les assets _next et tout chemin contenant un point
  // (fichiers statiques du dossier /public : images, favicon, etc.).
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
