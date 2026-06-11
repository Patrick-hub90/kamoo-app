import { isLiveMode } from "@/lib/shopify/config";
import { shopifyGraphQL, ShopifyApiError } from "@/lib/shopify/admin-client";

/**
 * Publication RÉELLE d'un produit vers une boutique (mode live).
 * POST { shop, product } → { shopifyProductId }
 *
 * Utilise `productSet` (Admin API 2025-01) : crée le produit + une variante
 * par défaut avec le prix. Le mode DÉMO ne passe pas par cette route.
 */

const PRODUCT_SET = `
  mutation PublishProduct($input: ProductSetInput!) {
    productSet(input: $input) {
      product { id }
      userErrors { field message }
    }
  }`;

type ProductSetResult = {
  productSet: {
    product: { id: string } | null;
    userErrors: { field: string[]; message: string }[];
  };
};

export async function POST(request: Request) {
  if (!isLiveMode()) {
    return Response.json({ error: "mode_demo" }, { status: 400 });
  }
  let body: { shop?: string; product?: { name: string; description: string; priceXof: number } };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "body_invalide" }, { status: 400 });
  }
  const { shop, product } = body;
  if (!shop || !product) {
    return Response.json({ error: "params_requis" }, { status: 400 });
  }

  try {
    const data = await shopifyGraphQL<ProductSetResult>(shop, PRODUCT_SET, {
      input: {
        title: product.name,
        descriptionHtml: product.description,
        status: "ACTIVE",
        productOptions: [{ name: "Titre", values: [{ name: "Default" }] }],
        variants: [{ price: String(product.priceXof), optionValues: [{ optionName: "Titre", name: "Default" }] }],
      },
    });
    const errs = data.productSet.userErrors;
    if (errs.length > 0) {
      return Response.json({ error: errs.map((e) => e.message).join("; ") }, { status: 422 });
    }
    return Response.json({ shopifyProductId: data.productSet.product?.id });
  } catch (e) {
    const status = e instanceof ShopifyApiError ? e.status : 500;
    return Response.json({ error: "echec_publication", detail: String(e) }, { status });
  }
}
