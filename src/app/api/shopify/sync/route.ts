import { isLiveMode } from "@/lib/shopify/config";
import { shopifyGraphQL, ShopifyApiError, classifyShopifyError } from "@/lib/shopify/admin-client";

/**
 * Pull RÉEL des commandes récentes d'une boutique (mode live).
 * POST { shop } → { orders: NormalizedOrder[] }
 *
 * On rapatrie TOUTES les infos utiles de la commande, y compris les champs
 * personnalisés des apps de formulaire COD (note_attributes = customAttributes),
 * la note, l'email, l'adresse complète et les propriétés de ligne.
 *
 * Le mode DÉMO ne passe pas par cette route (généré côté client).
 */

type Attribute = { key: string; value: string };

type NormalizedOrder = {
  shopifyOrderId: string;
  name: string; // ex "#1042"
  createdAt: string;
  currencyCode: string; // devise réelle de la boutique (ex "USD")
  /** Statut d'exécution Shopify : FULFILLED / UNFULFILLED / PARTIALLY_FULFILLED… */
  fulfillmentStatus?: string;
  /** Statut financier Shopify : PAID / PENDING / REFUNDED / VOIDED… */
  financialStatus?: string;
  /** Date d'annulation Shopify (si la commande est annulée). */
  cancelledAt?: string | null;
  /** Note de commande Shopify. */
  note?: string;
  /** Tags Shopify. */
  tags?: string[];
  /** Champs personnalisés (formulaire COD = note_attributes / customAttributes). */
  customAttributes?: Attribute[];
  customer: {
    name: string;
    phone: string;
    email?: string;
    city: string;
    zone: string;
    /** Adresse complète formatée (rue, ville, pays). */
    address?: string;
  };
  items: {
    productName: string;
    quantity: number;
    unitPriceXof: number;
    /** Propriétés de ligne (line item properties du formulaire). */
    customAttributes?: Attribute[];
  }[];
};

const ORDERS_QUERY = `
  query RecentOrders {
    orders(first: 50, sortKey: CREATED_AT, reverse: true, query: "status:any") {
      edges {
        node {
          id
          name
          createdAt
          currencyCode
          displayFulfillmentStatus
          displayFinancialStatus
          cancelledAt
          email
          note
          tags
          customAttributes { key value }
          shippingAddress { name address1 address2 city province zip country phone }
          customer { firstName lastName phone email defaultAddress { city } }
          lineItems(first: 50) {
            edges {
              node {
                title
                quantity
                customAttributes { key value }
                originalUnitPriceSet { shopMoney { amount currencyCode } }
              }
            }
          }
        }
      }
    }
  }`;

type GqlAttr = { key?: string; value?: string };

type GqlOrders = {
  orders: {
    edges: {
      node: {
        id: string;
        name: string;
        createdAt: string;
        currencyCode?: string;
        displayFulfillmentStatus?: string;
        displayFinancialStatus?: string;
        cancelledAt?: string | null;
        email?: string | null;
        note?: string | null;
        tags?: string[];
        customAttributes?: GqlAttr[];
        shippingAddress?: {
          name?: string;
          address1?: string;
          address2?: string;
          city?: string;
          province?: string;
          zip?: string;
          country?: string;
          phone?: string;
        };
        customer?: { firstName?: string; lastName?: string; phone?: string; email?: string; defaultAddress?: { city?: string } };
        lineItems: {
          edges: {
            node: {
              title: string;
              quantity: number;
              customAttributes?: GqlAttr[];
              originalUnitPriceSet: { shopMoney: { amount: string; currencyCode?: string } };
            };
          }[];
        };
      };
    }[];
  };
};

/** Nettoie une liste d'attributs : valeurs non vides, on retire les clés
 *  techniques masquées (convention Shopify : préfixe "_"). */
function cleanAttrs(attrs?: GqlAttr[]): Attribute[] | undefined {
  if (!attrs?.length) return undefined;
  const out = attrs
    .filter((a) => a.key && !a.key.startsWith("_") && a.value && a.value.trim() !== "")
    .map((a) => ({ key: a.key as string, value: a.value as string }));
  return out.length ? out : undefined;
}

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
    const orders: NormalizedOrder[] = data.orders.edges.map(({ node }) => {
      const addr = node.shippingAddress;
      const fullAddress = [addr?.address1, addr?.address2, addr?.city, addr?.zip, addr?.country]
        .filter(Boolean)
        .join(", ");
      return {
        shopifyOrderId: node.id,
        name: node.name,
        createdAt: node.createdAt,
        currencyCode: node.currencyCode ?? "XOF",
        fulfillmentStatus: node.displayFulfillmentStatus,
        financialStatus: node.displayFinancialStatus,
        cancelledAt: node.cancelledAt ?? null,
        note: node.note?.trim() || undefined,
        tags: node.tags && node.tags.length ? node.tags : undefined,
        customAttributes: cleanAttrs(node.customAttributes),
        customer: {
          name:
            addr?.name ||
            [node.customer?.firstName, node.customer?.lastName].filter(Boolean).join(" ") ||
            "Client Shopify",
          phone: addr?.phone ?? node.customer?.phone ?? "",
          email: node.email ?? node.customer?.email ?? undefined,
          city: addr?.city ?? node.customer?.defaultAddress?.city ?? "—",
          zone: addr?.address1 ?? addr?.city ?? "—",
          address: fullAddress || undefined,
        },
        // Montant fidèle (on NE round PAS : USD/EUR ont des décimales).
        items: node.lineItems.edges.map((e) => ({
          productName: e.node.title,
          quantity: e.node.quantity,
          unitPriceXof: parseFloat(e.node.originalUnitPriceSet.shopMoney.amount) || 0,
          customAttributes: cleanAttrs(e.node.customAttributes),
        })),
      };
    });
    return Response.json({ orders, fetched: orders.length });
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
    return Response.json({ error: "echec_pull", detail: String(e) }, { status });
  }
}
