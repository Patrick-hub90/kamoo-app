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
};

type ProductOverridesMap = Record<string, ProductOverride>;

const STORAGE_KEY = "kamoo.productOverrides";

/* ─── Store module-level (singleton client) ─── */

let overridesState: ProductOverridesMap = {};
let hydrated = false;
const listeners = new Set<() => void>();

function hydrateOnce() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      overridesState = JSON.parse(stored) as ProductOverridesMap;
    }
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
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(overridesState));
  } catch {
    /* ignore */
  }
}

function updateState(updater: (prev: ProductOverridesMap) => ProductOverridesMap) {
  overridesState = updater(overridesState);
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

function getSnapshot(): ProductOverridesMap {
  return overridesState;
}

// Référence stable pour le SSR snapshot — sinon useSyncExternalStore détecte
// un changement à chaque render et entre en boucle infinie.
const EMPTY_OVERRIDES: ProductOverridesMap = Object.freeze(
  {},
) as ProductOverridesMap;

function getServerSnapshot(): ProductOverridesMap {
  // Côté serveur (SSR initial), pas d'overrides. Le client se ré-hydrate.
  return EMPTY_OVERRIDES;
}

export function useProductsState() {
  const overrides = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const products: Produit[] = useMemo(() => {
    if (Object.keys(overrides).length === 0) return MOCK_PRODUITS;
    return MOCK_PRODUITS.map((p) => {
      const o = overrides[p.id];
      if (!o) return p;
      return {
        ...p,
        ...(o.isActive !== undefined && { isActive: o.isActive }),
      };
    });
  }, [overrides]);

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

  return {
    products,
    getProduct,
    toggleActive,
    setActive,
  };
}
