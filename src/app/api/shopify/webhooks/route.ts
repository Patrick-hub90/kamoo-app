import { verifyWebhookHmac } from "@/lib/shopify/oauth";

/**
 * Réception des webhooks Shopify (PRODUCTION).
 *
 * En local, Shopify ne peut pas joindre localhost → c'est le polling
 * (ShopifyAutoSync, 60 s) qui assure le temps réel. Dès que Kamoo a une URL
 * publique, enregistrer les webhooks `orders/create` et `customers/create`
 * vers /api/shopify/webhooks rendra la synchro instantanée — cette route est
 * déjà prête (vérification HMAC incluse).
 *
 * V1 : on journalise dans l'état partagé (demo-state) sous la clé
 * `shopifyWebhookInbox` ; le client les intègre comme un sync classique.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const hmac = request.headers.get("x-shopify-hmac-sha256");
  if (!verifyWebhookHmac(raw, hmac)) {
    return new Response("HMAC invalide", { status: 401 });
  }
  const topic = request.headers.get("x-shopify-topic") ?? "inconnu";
  const shop = request.headers.get("x-shopify-shop-domain") ?? "inconnu";

  // Empile dans l'inbox partagée (consommée côté client au prochain poll)
  try {
    const base = process.env.SHOPIFY_APP_URL ?? "http://localhost:3000";
    const inboxRes = await fetch(`${base}/api/demo-state?key=shopifyWebhookInbox`);
    const inbox = ((await inboxRes.json()).value ?? []) as unknown[];
    inbox.push({ topic, shop, payload: JSON.parse(raw), receivedAt: new Date().toISOString() });
    await fetch(`${base}/api/demo-state`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key: "shopifyWebhookInbox", value: inbox.slice(-100) }),
    });
  } catch {
    /* l'échec d'archivage ne doit pas faire re-livrer le webhook en boucle */
  }

  return new Response(null, { status: 200 });
}
