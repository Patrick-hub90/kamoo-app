import { isLiveMode } from "@/lib/shopify/config";
import { isSupabaseAdminConfigured } from "@/lib/supabase/admin";

/**
 * État de l'intégration Shopify pour le client. Aucune donnée sensible.
 *  - `live`       : clés API présentes → OAuth réel (sinon démo simulée).
 *  - `persistent` : backend de tokens persistant (Supabase) configuré.
 *  - `serverless` : exécution sur Vercel (FS éphémère). En live + serverless
 *    SANS persistance, une connexion ne « tient » pas → l'UI alerte. En local
 *    (repli fichier), pas d'alerte car le fichier persiste sur la machine.
 */
export async function GET() {
  return Response.json({
    live: isLiveMode(),
    persistent: isSupabaseAdminConfigured(),
    serverless: Boolean(process.env.VERCEL),
  });
}
