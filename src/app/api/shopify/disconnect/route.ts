import { deleteToken } from "@/lib/shopify/token-store";

/** Supprime l'access token d'une boutique (déconnexion réelle). */
export async function POST(request: Request) {
  try {
    const { shop } = (await request.json()) as { shop?: string };
    if (shop) await deleteToken(shop);
  } catch {
    /* best-effort */
  }
  return Response.json({ ok: true });
}
