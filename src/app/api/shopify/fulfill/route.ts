import { isLiveMode } from "@/lib/shopify/config";
import { shopifyGraphQL, ShopifyApiError } from "@/lib/shopify/admin-client";

/**
 * Push de statut RÉEL : commande livrée & encaissée côté Kamoo → marquée
 * « honorée » (fulfilled) + paiement enregistré sur Shopify.
 * POST { shop, shopifyOrderId } — mode live uniquement.
 *
 * COD : on crée le fulfillment de la (des) fulfillment order(s) ouvertes.
 * Le marquage « payé » se fait via une transaction de capture/sale selon la
 * config de la boutique ; ici on déclenche le fulfillment, suffisant pour
 * refléter « commande honorée ».
 */

const FO_QUERY = `
  query OpenFulfillmentOrders($id: ID!) {
    order(id: $id) {
      fulfillmentOrders(first: 10, query: "status:open") {
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

type FoResult = { order: { fulfillmentOrders: { edges: { node: { id: string } }[] } } | null };

export async function POST(request: Request) {
  if (!isLiveMode()) return Response.json({ error: "mode_demo" }, { status: 400 });
  let body: { shop?: string; shopifyOrderId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "body_invalide" }, { status: 400 });
  }
  const { shop, shopifyOrderId } = body;
  if (!shop || !shopifyOrderId) return Response.json({ error: "params_requis" }, { status: 400 });

  try {
    const fo = await shopifyGraphQL<FoResult>(shop, FO_QUERY, { id: shopifyOrderId });
    const ids = fo.order?.fulfillmentOrders.edges.map((e) => e.node.id) ?? [];
    if (ids.length === 0) return Response.json({ ok: true, note: "deja_honoree" });
    await shopifyGraphQL(shop, FULFILL, {
      fulfillment: {
        lineItemsByFulfillmentOrder: ids.map((id) => ({ fulfillmentOrderId: id })),
        notifyCustomer: false,
      },
    });
    return Response.json({ ok: true });
  } catch (e) {
    if (e instanceof ShopifyApiError && e.status === 403) {
      return Response.json({ error: "scopes_manquants", detail: e.message }, { status: 403 });
    }
    const status = e instanceof ShopifyApiError ? e.status : 500;
    return Response.json({ error: "echec_fulfill", detail: String(e) }, { status });
  }
}
