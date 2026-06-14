"use client";

import { useCallback } from "react";
import { useShopify } from "@/lib/hooks/use-shopify";
import { useShopifyPublish } from "@/lib/hooks/use-shopify-publish";
import { useProductsState } from "@/lib/hooks/use-products-state";
import type { ShopifyProductLite } from "@/lib/shopify/products";
import type { Produit } from "@/lib/types/produit";

/**
 * Import de produits Shopify → catalogue Kamoo (le pendant « pull » de la
 * publication façon DSers).
 *
 *  - Mode LIVE : liste réelle via /api/shopify/products (Admin API).
 *  - Mode DÉMO : liste plausible et STABLE (id figés) générée localement, pour
 *    que l'état « déjà importé » reste cohérent d'une ouverture à l'autre.
 *
 * À l'import, chaque produit Shopify devient un produit du catalogue + un lien
 * `productId Kamoo ↔ shopifyProductId` (via useShopifyPublish.link), ce qui
 * évite les doublons et rattache les futures commandes Shopify.
 */

/* Catalogue Shopify de démonstration — ids figés (pas de Date.now()). */
const DEMO_SHOPIFY_PRODUCTS: ShopifyProductLite[] = [
  {
    shopifyProductId: "gid://shopify/Product/demo-1001",
    title: "Crème éclaircissante naturelle",
    description: "Soin visage à base de karité et vitamine C.",
    priceXof: 12000,
    sku: "CRM-001",
    variantsCount: 1,
    totalInventory: 48,
  },
  {
    shopifyProductId: "gid://shopify/Product/demo-1002",
    title: "Sac à main cuir grainé",
    description: "Sac porté épaule, cuir synthétique premium.",
    priceXof: 25000,
    sku: "SAC-204",
    variantsCount: 2,
    totalInventory: 17,
  },
  {
    shopifyProductId: "gid://shopify/Product/demo-1003",
    title: "Montre homme acier",
    description: "Montre à quartz, bracelet maille milanaise.",
    priceXof: 18500,
    sku: "MTR-011",
    variantsCount: 1,
    totalInventory: 9,
  },
  {
    shopifyProductId: "gid://shopify/Product/demo-1004",
    title: "Huile de barbe naturelle 50ml",
    description: "Huile nourrissante, parfum bois de cèdre.",
    priceXof: 9500,
    sku: "HLB-050",
    variantsCount: 1,
    totalInventory: 63,
  },
  {
    shopifyProductId: "gid://shopify/Product/demo-1005",
    title: "Lunettes de soleil polarisées",
    description: "Protection UV400, monture légère.",
    priceXof: 14000,
    sku: "LUN-330",
    variantsCount: 3,
    totalInventory: 28,
  },
  {
    shopifyProductId: "gid://shopify/Product/demo-1006",
    title: "Casquette brodée logo",
    description: "Casquette ajustable, coton brossé.",
    priceXof: 7000,
    sku: "CSQ-077",
    variantsCount: 4,
    totalInventory: 0,
  },
  {
    shopifyProductId: "gid://shopify/Product/demo-1007",
    title: "Écouteurs sans fil Pro",
    description: "Bluetooth 5.3, réduction de bruit active.",
    priceXof: 22000,
    sku: "ECO-512",
    variantsCount: 2,
    totalInventory: 35,
  },
  {
    shopifyProductId: "gid://shopify/Product/demo-1008",
    title: "Foulard en soie imprimé",
    description: "Foulard carré 90×90, motif géométrique.",
    priceXof: 8500,
    sku: "FLD-019",
    variantsCount: 5,
    totalInventory: 41,
  },
];

/* Dégradés de fallback derrière l'emoji (couvre quand pas d'image Shopify). */
const IMPORT_BG = [
  "linear-gradient(135deg,#FCE7F3,#F472B6)",
  "linear-gradient(135deg,#DBEAFE,#3B82F6)",
  "linear-gradient(135deg,#DCFCE7,#22C55E)",
  "linear-gradient(135deg,#FEF3C7,#F59E0B)",
  "linear-gradient(135deg,#E9D5FF,#A78BFA)",
  "linear-gradient(135deg,#FED7AA,#F97316)",
];

export function useShopifyImport() {
  const { getConnection, liveMode } = useShopify();
  const { addProduct } = useProductsState();
  const { link, linkedShopifyIds } = useShopifyPublish();

  /**
   * Récupère la liste des produits de la boutique d'un marché.
   * Live (connexion réelle + clés serveur) : Admin API. Sinon : liste démo.
   */
  const fetchProducts = useCallback(
    async (marketId: string): Promise<{ products: ShopifyProductLite[]; error?: string }> => {
      const conn = getConnection(marketId);
      if (!conn?.isConnected) return { products: [], error: "non_connecte" };

      const useLive = liveMode === true && conn.mode === "live";
      if (!useLive) return { products: DEMO_SHOPIFY_PRODUCTS };

      try {
        const res = await fetch("/api/shopify/products", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ shop: conn.domain }),
        });
        const data = (await res.json()) as { products?: ShopifyProductLite[]; error?: string };
        if (!res.ok) return { products: [], error: data.error ?? "echec_pull" };
        return { products: data.products ?? [] };
      } catch {
        return { products: [], error: "reseau" };
      }
    },
    [getConnection, liveMode],
  );

  /**
   * Importe les produits Shopify sélectionnés dans le catalogue Kamoo. Crée le
   * produit, sa couverture (si image Shopify) et le lien Kamoo↔Shopify.
   * Retourne le nombre réellement importé (les déjà-liés sont ignorés).
   */
  const importProducts = useCallback(
    (selection: ShopifyProductLite[]): number => {
      let n = 0;
      selection.forEach((sp, i) => {
        if (linkedShopifyIds.has(sp.shopifyProductId)) return; // anti-doublon
        const id = `p_sh_${Date.now().toString(36)}_${i}`;
        const produit: Produit = {
          id,
          sku: sp.sku || `SH-${sp.shopifyProductId.replace(/\D/g, "").slice(-6)}`,
          name: sp.title,
          emoji: "🛍️",
          bg: IMPORT_BG[i % IMPORT_BG.length],
          description: sp.description ?? "",
          priceXof: Math.round(sp.priceXof),
          stock: sp.totalInventory ?? 0,
          lowStockThreshold: 5,
          isActive: true,
          soldThisMonth: 0,
          soldTotal: 0,
          revenueThisMonthXof: 0,
          revenueTotalXof: 0,
          createdAt: new Date().toISOString(),
        };
        addProduct(produit);
        // Couverture : on stocke l'URL Shopify telle quelle (affichée en <img>).
        if (sp.imageUrl) {
          try {
            localStorage.setItem(`boutique.photos.${id}`, JSON.stringify([sp.imageUrl]));
          } catch {
            /* stockage plein — non bloquant */
          }
        }
        link(id, sp.shopifyProductId, "imported");
        n++;
      });
      if (n > 0) {
        try {
          window.dispatchEvent(new Event("storage")); // rafraîchit les couvertures
        } catch {
          /* ignore */
        }
      }
      return n;
    },
    [addProduct, link, linkedShopifyIds],
  );

  return { fetchProducts, importProducts, linkedShopifyIds };
}
