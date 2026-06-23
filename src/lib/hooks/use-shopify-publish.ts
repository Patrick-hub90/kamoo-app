"use client";

import { useCallback, useMemo } from "react";
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

/**
 * Comment le produit Kamoo s'est retrouvé lié à Shopify :
 *  - "published" : poussé depuis Kamoo vers Shopify (workflow façon DSers) ;
 *  - "imported"  : tiré depuis Shopify dans le catalogue Kamoo ;
 *  - "linked"    : produit Kamoo créé à la main puis rattaché à un produit
 *                  Shopify existant.
 * Dans les trois cas le produit EST sur la boutique → status "publie".
 */
export type PublishSource = "published" | "imported" | "linked";

type ProductPublish = {
  status: PublishStatus;
  publishedAt?: string;
  shopifyProductId?: string;
  source?: PublishSource;
};

type PublishState = { products: Record<string, ProductPublish> };

const store = createSyncedStore<PublishState>("shopifyProducts", { products: {} });

/**
 * Lit les liens de publication HORS React (gid Shopify ↔ produit Kamoo). Sert
 * à la réconciliation impérative côté synchro.
 */
export function getPublishSnapshot(): Record<string, ProductPublish> {
  return store.get().products;
}

export function useShopifyPublish() {
  const state = store.use();

  const getStatus = useCallback(
    (productId: string): PublishStatus => state.products[productId]?.status ?? "non_publie",
    [state.products],
  );

  /** Comment le lien a été établi (publié / importé / rattaché). */
  const getSource = useCallback(
    (productId: string): PublishSource | undefined => state.products[productId]?.source,
    [state.products],
  );

  /** gid du produit Shopify lié à ce produit Kamoo (si lien établi). */
  const getShopifyId = useCallback(
    (productId: string): string | undefined => state.products[productId]?.shopifyProductId,
    [state.products],
  );

  /** Ce produit Kamoo est-il rattaché à un produit Shopify ? */
  const isLinked = useCallback(
    (productId: string): boolean => !!state.products[productId]?.shopifyProductId,
    [state.products],
  );

  /** Ensemble des gid Shopify déjà liés (pour éviter les doublons à l'import). */
  const linkedShopifyIds = useMemo(
    () =>
      new Set(
        Object.values(state.products)
          .map((p) => p.shopifyProductId)
          .filter(Boolean) as string[],
      ),
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
          [productId]: {
            status: "publie",
            publishedAt: new Date().toISOString(),
            shopifyProductId,
            source: "published",
          },
        },
      }));
      return { ok: true };
    },
    [],
  );

  /**
   * Rattache un produit Kamoo à un produit Shopify existant (import ou lien
   * manuel). Aucune écriture vers Shopify : on enregistre seulement la
   * correspondance des id (le produit existe déjà sur la boutique).
   */
  const link = useCallback(
    (productId: string, shopifyProductId: string, source: PublishSource = "linked") => {
      store.set((s) => ({
        products: {
          ...s.products,
          [productId]: {
            status: "publie",
            publishedAt: new Date().toISOString(),
            shopifyProductId,
            source,
          },
        },
      }));
    },
    [],
  );

  /** Retire le lien Shopify d'un produit (dépublication / détachement). */
  const unpublish = useCallback((productId: string) => {
    store.set((s) => {
      const next = { ...s.products };
      delete next[productId];
      return { products: next };
    });
  }, []);

  return {
    getStatus,
    getSource,
    getShopifyId,
    isLinked,
    linkedShopifyIds,
    publish,
    link,
    unpublish,
    /** Alias sémantique de unpublish pour le détachement d'un lien. */
    unlink: unpublish,
    all: state.products,
  };
}
