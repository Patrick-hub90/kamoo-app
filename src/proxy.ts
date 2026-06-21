import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Proxy (ex-Middleware — renommé en Next.js 16).
 *
 * Routage par sous-domaine : `partners.kamoo.me` est l'espace public
 * Partenaires (la marketplace). Il ne sert QUE les routes `/marketplace/*` ;
 * tout le reste y est redirigé vers la liste des transitaires.
 *
 * Le domaine principal (`kamoo.me`, `localhost`, previews Vercel) n'est pas
 * affecté : la marketplace y reste accessible à `/marketplace/*` (coque
 * publique sans la sidebar vendeur, cf. layout (vendor)).
 */
export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").toLowerCase();
  const { pathname } = request.nextUrl;

  if (host.startsWith("partners.")) {
    if (!pathname.startsWith("/marketplace")) {
      const url = request.nextUrl.clone();
      url.pathname = "/marketplace/transitaires";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  // On exclut l'API, les assets _next et tout chemin contenant un point
  // (fichiers statiques du dossier /public : images, favicon, etc.).
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
