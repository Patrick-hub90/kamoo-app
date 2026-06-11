"use client";

import { useEffect, useRef } from "react";
import { useShopify } from "@/lib/hooks/use-shopify";
import { useShopifySync } from "@/lib/hooks/use-shopify-sync";

/**
 * Synchronisation AUTOMATIQUE Shopify → Kamoo (temps réel local).
 *
 * Monté une fois dans le layout vendeur : toutes les 60 s, chaque boutique
 * connectée en mode RÉEL est synchronisée (nouvelles commandes → Closing,
 * clients → base). La déduplication par shopifyOrderId rend l'opération
 * idempotente. Le mode démo n'est PAS auto-synchronisé (sinon il générerait
 * des commandes fictives en continu) — bouton Sync manuel.
 *
 * En production (URL publique), les webhooks orders/create remplaceront ce
 * polling ; l'architecture consommatrice ne changera pas.
 */

const POLL_MS = 60_000;

export function ShopifyAutoSync() {
  const { connections } = useShopify();
  const { syncNow } = useShopifySync();

  /* refs : le setInterval lit toujours la dernière version sans se réarmer */
  const connectionsRef = useRef(connections);
  connectionsRef.current = connections;
  const syncRef = useRef(syncNow);
  syncRef.current = syncNow;
  const busyRef = useRef(false);

  useEffect(() => {
    const tick = async () => {
      if (busyRef.current) return;
      busyRef.current = true;
      try {
        const entries = Object.entries(connectionsRef.current);
        for (const [marketId, conn] of entries) {
          if (conn.isConnected && conn.mode === "live") {
            await syncRef.current(marketId);
          }
        }
      } finally {
        busyRef.current = false;
      }
    };
    // Première passe rapide (5 s après l'arrivée sur la console), puis 60 s.
    const first = setTimeout(tick, 5_000);
    const interval = setInterval(tick, POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, []);

  return null;
}
