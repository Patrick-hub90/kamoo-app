import { isLiveMode } from "@/lib/shopify/config";

/**
 * Indique au client si l'intégration Shopify tourne en mode RÉEL (clés API
 * présentes) ou DÉMO. Aucune donnée sensible exposée.
 */
export async function GET() {
  return Response.json({ live: isLiveMode() });
}
