"use client";

import { useCallback } from "react";
import { createSyncedStore } from "@/lib/sync/synced-store";

/**
 * État de publication des produits vers Shopify — workflow « façon DSers » :
 * un produit du catalogue Kamoo n'est JAMAIS poussé automatiquement. Le
 * vendeur le publie explicitement vers sa boutique (avec confirmation).
 *
 *  - non_publie (défaut) : présent dans Kamoo, absent de la boutique Shopify
 *  - publie              : poussé vers Shopify (productId Shopify connu)
 *
 * Live : la publication appelle /api/shopify/publish (mutation Admin API).
 * Démo : publication simulée (statut + horodatage), aucune vraie écriture.
 */

export type PublishStatus = "non_publie" | "publie";

type ProductPublish = {
  status: PublishStatus;
  publishedAt?: string;
  shopifyProductId?: string;
};

type PublishState = { products: Record<string, ProductPublish> };

const store = createSyncedStore<PublishState>("shopifyProducts", { products: {} });

export function useShopifyPublish() {
  const state = store.use();

  const getStatus = useCallback(
    (productId: string): PublishStatus => state.products[productId]?.status ?? "non_publie",
    [state.products],
  );

  /**
   * Publie un produit vers la boutique. `shop` requis en mode live (domaine
   * de la boutique du marché courant). Retourne true si OK.
   */
  const publish = useCallback(
    async (
      productId: string,
      product: { name: string; description: string; priceXof: number; photos?: string[] },
      opts: { live: boolean; shop?: string },
    ): Promise<{ ok: boolean; error?: string }> => {
      let shopifyProductId: string | undefined;
      if (opts.live && opts.shop) {
        try {
          const res = await fetch("/api/shopify/publish", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ shop: opts.shop, product }),
          });
          const data = (await res.json()) as { shopifyProductId?: string; error?: string };
          if (!res.ok) return { ok: false, error: data.error ?? "echec" };
          shopifyProductId = data.shopifyProductId;
        } catch {
          return { ok: false, error: "reseau" };
        }
      } else {
        // Démo : id Shopify simulé
        shopifyProductId = `gid://shopify/Product/demo-${Date.now()}`;
      }
      store.set((s) => ({
        products: {
          ...s.products,
          [productId]: { status: "publie", publishedAt: new Date().toISOString(), shopifyProductId },
        },
      }));
      return { ok: true };
    },
    [],
  );

  /** Retire un produit de la boutique (dépublication). */
  const unpublish = useCallback((productId: string) => {
    store.set((s) => {
      const next = { ...s.products };
      delete next[productId];
      return { products: next };
    });
  }, []);

  return { getStatus, publish, unpublish, all: state.products };
}
