"use client";

import { useCallback, useEffect, useState } from "react";
import { createSyncedStore } from "@/lib/sync/synced-store";

/**
 * État de connexion Shopify côté client (par marché), synchronisé via le
 * mini-backend de démo. Reflète aussi bien le mode RÉEL (après OAuth) que le
 * mode DÉMO (connexion simulée).
 *
 * La règle métier est posée : 1 boutique Shopify par marché (pays).
 */

export type ShopifyConnection = {
  domain: string;
  isConnected: boolean;
  /** "live" = vrai OAuth ; "demo" = connexion simulée */
  mode: "live" | "demo";
  connectedAt: string;
  lastSyncAt?: string;
  /** Compteur cumulé de commandes importées (pour l'affichage) */
  ordersImported: number;
  /** Devise réelle de la boutique (auto-détectée depuis Shopify, ex "USD") */
  currencyCode?: string;
};

type ShopifyState = {
  /** Connexions par marketId */
  connections: Record<string, ShopifyConnection>;
};

const store = createSyncedStore<ShopifyState>("shopify", { connections: {} });

/**
 * Préférences de devise par marché — choix MANUEL du vendeur (Paramètres),
 * qui prime sur la devise auto-détectée depuis Shopify.
 *   { [marketId]: "USD" | "XOF" | … }
 */
type CurrencyPrefs = { overrides: Record<string, string> };
const currencyStore = createSyncedStore<CurrencyPrefs>("currencyPrefs", { overrides: {} });

/** Lecture hors-React (ex. push fulfillment depuis la machine d'états closing). */
export function getShopifyConnectionsSnapshot(): Record<string, ShopifyConnection> {
  return store.get().connections;
}

export function useShopify() {
  const state = store.use();
  const currencyPrefs = currencyStore.use();

  /* Mode réel ? (clés API présentes côté serveur) — lu une fois. */
  const [liveMode, setLiveMode] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/shopify/status")
      .then((r) => r.json())
      .then((d: { live: boolean }) => {
        if (alive) setLiveMode(d.live);
      })
      .catch(() => alive && setLiveMode(false));
    return () => {
      alive = false;
    };
  }, []);

  const getConnection = useCallback(
    (marketId: string): ShopifyConnection | null => state.connections[marketId] ?? null,
    [state.connections],
  );

  /** Connexion DÉMO : marque la boutique connectée immédiatement. */
  const connectDemo = useCallback((marketId: string, domain: string) => {
    store.set((s) => ({
      connections: {
        ...s.connections,
        [marketId]: {
          domain,
          isConnected: true,
          mode: "demo",
          connectedAt: new Date().toISOString(),
          ordersImported: 0,
        },
      },
    }));
  }, []);

  /** Connexion RÉELLE : redirige vers l'écran d'autorisation Shopify. */
  const connectLive = useCallback((marketId: string, domain: string) => {
    window.location.href = `/api/shopify/install?shop=${encodeURIComponent(domain)}&market=${encodeURIComponent(marketId)}`;
  }, []);

  /** Enregistre une connexion réelle revenue du callback OAuth. */
  const registerLiveConnection = useCallback((marketId: string, domain: string) => {
    store.set((s) => {
      const existing = s.connections[marketId];
      if (existing?.isConnected && existing.domain === domain && existing.mode === "live") {
        return s; // déjà enregistrée
      }
      return {
        connections: {
          ...s.connections,
          [marketId]: {
            domain,
            isConnected: true,
            mode: "live",
            connectedAt: new Date().toISOString(),
            ordersImported: existing?.ordersImported ?? 0,
          },
        },
      };
    });
  }, []);

  const disconnect = useCallback((marketId: string) => {
    store.set((s) => {
      const next = { ...s.connections };
      delete next[marketId];
      return { connections: next };
    });
    // En réel, on supprime aussi le token serveur (best-effort).
    const conn = store.get().connections[marketId];
    if (conn?.mode === "live") {
      fetch("/api/shopify/disconnect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ shop: conn.domain }),
      }).catch(() => {});
    }
  }, []);

  /** Met à jour l'horodatage + compteur (+ devise détectée) après une sync. */
  const recordSync = useCallback(
    (marketId: string, importedCount: number, currencyCode?: string) => {
      store.set((s) => {
        const c = s.connections[marketId];
        if (!c) return s;
        return {
          connections: {
            ...s.connections,
            [marketId]: {
              ...c,
              lastSyncAt: new Date().toISOString(),
              ordersImported: c.ordersImported + importedCount,
              currencyCode: currencyCode ?? c.currencyCode,
            },
          },
        };
      });
    },
    [],
  );

  /**
   * Devise active du marché. Priorité : choix MANUEL du vendeur (Paramètres)
   * > devise auto-détectée depuis Shopify > XOF par défaut.
   */
  const currencyFor = useCallback(
    (marketId: string): string =>
      currencyPrefs.overrides[marketId] ??
      state.connections[marketId]?.currencyCode ??
      "XOF",
    [currencyPrefs.overrides, state.connections],
  );

  /** Devise auto-détectée depuis Shopify (pour afficher « auto : USD »). */
  const detectedCurrencyFor = useCallback(
    (marketId: string): string | null => state.connections[marketId]?.currencyCode ?? null,
    [state.connections],
  );

  /** Y a-t-il un choix manuel pour ce marché ? */
  const isManualCurrency = useCallback(
    (marketId: string): boolean => marketId in currencyPrefs.overrides,
    [currencyPrefs.overrides],
  );

  /** Définit (ou efface si null) la devise manuelle d'un marché. */
  const setCurrencyOverride = useCallback((marketId: string, code: string | null) => {
    currencyStore.set((s) => {
      const overrides = { ...s.overrides };
      if (code === null) delete overrides[marketId];
      else overrides[marketId] = code;
      return { overrides };
    });
  }, []);

  return {
    connections: state.connections,
    liveMode,
    getConnection,
    connectDemo,
    connectLive,
    registerLiveConnection,
    disconnect,
    recordSync,
    currencyFor,
    detectedCurrencyFor,
    isManualCurrency,
    setCurrencyOverride,
  };
}
