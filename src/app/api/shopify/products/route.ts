import { isLiveMode } from "@/lib/shopify/config";
import { shopifyGraphQL, ShopifyApiError, classifyShopifyError } from "@/lib/shopify/admin-client";
import type { ShopifyProductLite } from "@/lib/shopify/products";

/**
 * Liste RÉELLE des produits d'une boutique (mode live) pour l'import vers le
 * catalogue Kamoo.
 * POST { shop } → { products: ShopifyProductLite[] }
 *
 * Le mode DÉMO ne passe pas par cette route (liste générée côté client, comme
 * la sync des commandes).
 */

const PRODUCTS_QUERY = `
  query ShopProducts {
    products(first: 50, sortKey: UPDATED_AT, reverse: true) {
      edges {
        node {
          id
          title
          description
          status
          totalInventory
          featuredImage { url }
          variants(first: 50) {
            edges { node { sku price } }
          }
        }
      }
    }
  }`;

type GqlProducts = {
  products: {
    edges: {
      node: {
        id: string;
        title: string;
        description?: string;
        status?: string;
        totalInventory?: number | null;
        featuredImage?: { url?: string } | null;
        variants: { edges: { node: { sku?: string | null; price?: string | null } }[] };
      };
    }[];
  };
};

export async function POST(request: Request) {
  if (!isLiveMode()) {
    return Response.json({ error: "mode_demo", products: [] }, { status: 400 });
  }
  let shop = "";
  try {
    shop = ((await request.json()) as { shop?: string }).shop ?? "";
  } catch {
    return Response.json({ error: "body_invalide" }, { status: 400 });
  }
  if (!shop) return Response.json({ error: "shop_requis" }, { status: 400 });

  try {
    const data = await shopifyGraphQL<GqlProducts>(shop, PRODUCTS_QUERY);
    const products: ShopifyProductLite[] = data.products.edges.map(({ node }) => {
      const variants = node.variants.edges;
      const first = variants[0]?.node;
      return {
        shopifyProductId: node.id,
        title: node.title,
        description: node.description ?? "",
        imageUrl: node.featuredImage?.url ?? undefined,
        // Prix fidèle (USD/EUR ont des décimales) — pas d'arrondi ici.
        priceXof: first?.price ? parseFloat(first.price) || 0 : 0,
        sku: first?.sku ?? undefined,
        variantsCount: variants.length,
        totalInventory: node.totalInventory ?? undefined,
      };
    });
    return Response.json({ products, fetched: products.length });
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
