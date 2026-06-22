import { isLiveMode } from "@/lib/shopify/config";
import { shopifyGraphQL, ShopifyApiError, classifyShopifyError } from "@/lib/shopify/admin-client";

/**
 * Synchro de statut Kamoo → Shopify, RÉVERSIBLE côté fulfillment.
 * POST { shop, shopifyOrderId, fulfilled }
 *
 *  - `fulfilled: true`  (Kamoo « Livré ») → crée le fulfillment → FULFILLED.
 *  - `fulfilled: false` (tout autre statut) → annule le(s) fulfillment(s)
 *    actif(s) → la commande Shopify revient à NON honorée (UNFULFILLED).
 *
 * ⚠️ Réversibilité : le FULFILLMENT est réversible (create ↔ cancel). Shopify
 * NE permet PAS d'annuler un encaissement (seulement rembourser) ni d'annuler
 * une annulation de commande — on ne pilote donc ici que le fulfillment, pour
 * garantir un aller-retour propre depuis Kamoo.
 *
 * Mode live uniquement.
 */

const QUERY = `
  query OrderFulfillState($id: ID!) {
    order(id: $id) {
      fulfillments(first: 25) { id status }
      fulfillmentOrders(first: 25, query: "status:open") {
        edges { node { id } }
      }
    }
  }`;

const FULFILL = `
  mutation Fulfill($fulfillment: FulfillmentV2Input!) {
    fulfillmentCreateV2(fulfillment: $fulfillment) {
      fulfillment { id status }
      userErrors { field message }
    }
  }`;

const CANCEL = `
  mutation FulfillmentCancel($id: ID!) {
    fulfillmentCancel(id: $id) {
      fulfillment { id status }
      userErrors { field message }
    }
  }`;

type QueryResult = {
  order: {
    fulfillments: { id: string; status: string }[];
    fulfillmentOrders: { edges: { node: { id: string } }[] };
  } | null;
};

/** Statuts de fulfillment annulables (= actifs). */
const CANCELLABLE = new Set(["SUCCESS", "OPEN", "PENDING"]);

export async function POST(request: Request) {
  if (!isLiveMode()) return Response.json({ error: "mode_demo" }, { status: 400 });
  let body: { shop?: string; shopifyOrderId?: string; fulfilled?: boolean };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "body_invalide" }, { status: 400 });
  }
  const { shop, shopifyOrderId } = body;
  const fulfilled = body.fulfilled !== false; // défaut true (rétrocompat)
  if (!shop || !shopifyOrderId) return Response.json({ error: "params_requis" }, { status: 400 });

  try {
    const data = await shopifyGraphQL<QueryResult>(shop, QUERY, { id: shopifyOrderId });
    if (!data.order) return Response.json({ error: "order_introuvable" }, { status: 404 });

    if (fulfilled) {
      // Honorer : créer le fulfillment des fulfillment orders encore ouvertes.
      const ids = data.order.fulfillmentOrders.edges.map((e) => e.node.id);
      if (ids.length === 0) return Response.json({ ok: true, note: "deja_honoree" });
      await shopifyGraphQL(shop, FULFILL, {
        fulfillment: {
          lineItemsByFulfillmentOrder: ids.map((id) => ({ fulfillmentOrderId: id })),
          notifyCustomer: false,
        },
      });
      return Response.json({ ok: true, action: "fulfilled" });
    }

    // Retour arrière : annuler les fulfillments actifs → UNFULFILLED.
    const toCancel = (data.order.fulfillments ?? []).filter((f) => CANCELLABLE.has(f.status));
    if (toCancel.length === 0) return Response.json({ ok: true, note: "rien_a_annuler" });
    for (const f of toCancel) {
      await shopifyGraphQL(shop, CANCEL, { id: f.id });
    }
    return Response.json({ ok: true, action: "unfulfilled", cancelled: toCancel.length });
  } catch (e) {
    const cls = classifyShopifyError(e);
    if (cls !== "autre") {
      return Response.json(
        {
          error: cls === "donnees_client" ? "donnees_client_a_approuver" : "scopes_manquants",
          detail: e instanceof Error ? e.message : String(e),
        },
        { status: 403 },
      );
    }
    const status = e instanceof ShopifyApiError ? e.status : 500;
    return Response.json({ error: "echec_sync_statut", detail: String(e) }, { status });
  }
}
