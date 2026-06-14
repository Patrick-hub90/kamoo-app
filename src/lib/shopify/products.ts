/**
 * Type partagé (serveur + client) pour un produit Shopify « léger » —
 * la projection minimale dont Kamoo a besoin pour l'import / le lien :
 * id Shopify, titre, image de couverture, prix de la 1ʳᵉ variante, stock.
 *
 * Volontairement plat (pas de variantes détaillées) : en V1 on importe un
 * produit Kamoo simple. Le détail des variantes reste sur Shopify.
 */
export type ShopifyProductLite = {
  /** gid Shopify (ex "gid://shopify/Product/123") — clé du lien Kamoo↔Shopify */
  shopifyProductId: string;
  title: string;
  description: string;
  /** URL de l'image de couverture Shopify (peut être absente) */
  imageUrl?: string;
  /** Prix de la 1ʳᵉ variante (devise de la boutique, non converti) */
  priceXof: number;
  /** SKU de la 1ʳᵉ variante */
  sku?: string;
  /** Nombre de variantes du produit Shopify */
  variantsCount: number;
  /** Stock total Shopify (toutes variantes) */
  totalInventory?: number;
};
