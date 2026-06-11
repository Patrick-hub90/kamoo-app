import { isLiveMode } from "@/lib/shopify/config";
import { shopifyGraphQL, ShopifyApiError } from "@/lib/shopify/admin-client";

/**
 * Pull RÉEL des commandes récentes d'une boutique (mode live).
 * POST { shop } → { orders: NormalizedOrder[] }
 *
 * On privilégie le polling à l'abonnement webhook : sur localhost, Shopify ne
 * peut pas joindre la machine. En production (URL publique), on basculera sur
 * les webhooks orders/create + customers/create.
 *
 * Le mode DÉMO ne passe pas par cette route (généré côté client).
 */

type NormalizedOrder = {
  shopifyOrderId: string;
  name: string; // ex "#1042"
  createdAt: string;
  customer: { name: string; phone: string; city: string; zone: string };
  items: { productName: string; quantity: number; unitPriceXof: number }[];
};

const ORDERS_QUERY = `
  query RecentOrders {
    orders(first: 50, sortKey: CREATED_AT, reverse: true, query: "status:any") {
      edges {
        node {
          id
          name
          createdAt
          shippingAddress { city province address1 phone }
          customer { firstName lastName phone defaultAddress { city } }
          lineItems(first: 20) {
            edges { node { title quantity originalUnitPriceSet { shopMoney { amount } } } }
          }
        }
      }
    }
  }`;

type GqlOrders = {
  orders: {
    edges: {
      node: {
        id: string;
        name: string;
        createdAt: string;
        shippingAddress?: { city?: string; province?: string; address1?: string; phone?: string };
        customer?: { firstName?: string; lastName?: string; phone?: string; defaultAddress?: { city?: string } };
        lineItems: { edges: { node: { title: string; quantity: number; originalUnitPriceSet: { shopMoney: { amount: string } } } }[] };
      };
    }[];
  };
};

export async function POST(request: Request) {
  if (!isLiveMode()) {
    return Response.json({ error: "mode_demo", orders: [] }, { status: 400 });
  }
  let shop = "";
  try {
    shop = ((await request.json()) as { shop?: string }).shop ?? "";
  } catch {
    return Response.json({ error: "body_invalide" }, { status: 400 });
  }
  if (!shop) return Response.json({ error: "shop_requis" }, { status: 400 });

  try {
    const data = await shopifyGraphQL<GqlOrders>(shop, ORDERS_QUERY);
    const orders: NormalizedOrder[] = data.orders.edges.map(({ node }) => ({
      shopifyOrderId: node.id,
      name: node.name,
      createdAt: node.createdAt,
      customer: {
        name: [node.customer?.firstName, node.customer?.lastName].filter(Boolean).join(" ") || "Client Shopify",
        phone: node.shippingAddress?.phone ?? node.customer?.phone ?? "",
        city: node.shippingAddress?.city ?? node.customer?.defaultAddress?.city ?? "—",
        zone: node.shippingAddress?.address1 ?? node.shippingAddress?.city ?? "—",
      },
      items: node.lineItems.edges.map((e) => ({
        productName: e.node.title,
        quantity: e.node.quantity,
        unitPriceXof: Math.round(parseFloat(e.node.originalUnitPriceSet.shopMoney.amount) || 0),
      })),
    }));
    return Response.json({ orders, fetched: orders.length });
  } catch (e) {
    const status = e instanceof ShopifyApiError ? e.status : 500;
    return Response.json({ error: "echec_pull", detail: String(e) }, { status });
  }
}
