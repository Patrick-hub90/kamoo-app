"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { MOCK_PRODUITS } from "@/lib/data/mock-produits";
import type { Produit } from "@/lib/types/produit";

/**
 * Overrides locaux pour les produits — pattern V1 mock :
 *   { [productId]: { isActive?: boolean, ... } }
 *
 * Architecture : **store partagé** via module-level state + listeners.
 * Tous les `useProductsState()` lisent le MÊME state — un toggle dans la
 * fiche produit propage immédiatement aux badges du catalogue, au dashboard,
 * etc., même sans navigation entre pages.
 *
 * Persistance : sessionStorage → la valeur survit aux navigations + reloads
 * dans la même session (jusqu'à fermeture de l'onglet).
 *
 * V2 : remplacé par server action + revalidatePath (Supabase).
 */

type ProductOverride = {
  isActive?: boolean;
  /** Champs éditables via le formulaire produit (V1 mock) */
  name?: string;
  description?: string;
  emoji?: string;
  priceXof?: number;
  costPriceXof?: number;
  stock?: number;
  lowStockThreshold?: number;
};

type ProductOverridesMap = Record<string, ProductOverride>;

type ProductsStore = {
  overrides: ProductOverridesMap;
  /** Produits créés via « Ajouter un produit » (en tête de catalogue) */
  extra: Produit[];
};

const STORAGE_KEY = "kamoo.productOverrides";
const EXTRA_KEY = "kamoo.extraProducts";

/* ─── Store module-level (singleton client) ─── */

let store: ProductsStore = { overrides: {}, extra: [] };
let hydrated = false;
const listeners = new Set<() => void>();

function hydrateOnce() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    const extra = sessionStorage.getItem(EXTRA_KEY);
    store = {
      overrides: stored ? (JSON.parse(stored) as ProductOverridesMap) : {},
      extra: extra ? (JSON.parse(extra) as Produit[]) : [],
    };
  } catch {
    /* ignore — sessionStorage corrompu */
  }
}

function notify() {
  listeners.forEach((l) => l());
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store.overrides));
    sessionStorage.setItem(EXTRA_KEY, JSON.stringify(store.extra));
  } catch {
    /* ignore */
  }
}

function updateState(updater: (prev: ProductOverridesMap) => ProductOverridesMap) {
  store = { ...store, overrides: updater(store.overrides) };
  persist();
  notify();
}

function updateExtra(updater: (prev: Produit[]) => Produit[]) {
  store = { ...store, extra: updater(store.extra) };
  persist();
  notify();
}

/* ─── Hook React ─── */

function subscribe(callback: () => void): () => void {
  hydrateOnce();
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): ProductsStore {
  return store;
}

// Référence stable pour le SSR snapshot — sinon useSyncExternalStore détecte
// un changement à chaque render et entre en boucle infinie.
const EMPTY_STORE: ProductsStore = Object.freeze({
  overrides: {},
  extra: [],
}) as ProductsStore;

function getServerSnapshot(): ProductsStore {
  // Côté serveur (SSR initial), pas d'overrides. Le client se ré-hydrate.
  return EMPTY_STORE;
}

function applyOverride(p: Produit, o: ProductOverride | undefined): Produit {
  if (!o) return p;
  return {
    ...p,
    ...(o.isActive !== undefined && { isActive: o.isActive }),
    ...(o.name !== undefined && { name: o.name }),
    ...(o.description !== undefined && { description: o.description }),
    ...(o.emoji !== undefined && { emoji: o.emoji }),
    ...(o.priceXof !== undefined && { priceXof: o.priceXof }),
    ...(o.costPriceXof !== undefined && { costPriceXof: o.costPriceXof }),
    ...(o.stock !== undefined && { stock: o.stock }),
    ...(o.lowStockThreshold !== undefined && {
      lowStockThreshold: o.lowStockThreshold,
    }),
  };
}

export function useProductsState() {
  const { overrides, extra } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const products: Produit[] = useMemo(
    () => [...extra, ...MOCK_PRODUITS].map((p) => applyOverride(p, overrides[p.id])),
    [overrides, extra],
  );

  const getProduct = useCallback(
    (id: string): Produit | undefined => products.find((p) => p.id === id),
    [products],
  );

  const toggleActive = useCallback((id: string) => {
    updateState((prev) => {
      const base = MOCK_PRODUITS.find((p) => p.id === id)?.isActive ?? true;
      const currentOverride = prev[id]?.isActive;
      const currentValue =
        currentOverride !== undefined ? currentOverride : base;
      const nextValue = !currentValue;
      // Si on revient à la valeur initiale, on nettoie l'override
      if (nextValue === base) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: { ...prev[id], isActive: nextValue } };
    });
  }, []);

  const setActive = useCallback((id: string, active: boolean) => {
    updateState((prev) => {
      const base = MOCK_PRODUITS.find((p) => p.id === id)?.isActive ?? true;
      if (active === base) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: { ...prev[id], isActive: active } };
    });
  }, []);

  /** Création (modale / page Nouveau produit) — persiste en tête de catalogue. */
  const addProduct = useCallback((p: Produit) => {
    updateExtra((prev) => [p, ...prev]);
  }, []);

  /** Édition des champs du formulaire — stockée en override par-dessus la fixture. */
  const updateProduct = useCallback((id: string, patch: ProductOverride) => {
    const isExtra = store.extra.some((p) => p.id === id);
    if (isExtra) {
      updateExtra((prev) =>
        prev.map((p) => (p.id === id ? ({ ...p, ...patch } as Produit) : p)),
      );
    } else {
      updateState((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
    }
  }, []);

  return {
    products,
    getProduct,
    toggleActive,
    setActive,
    addProduct,
    updateProduct,
  };
}
