"use client";

import { useCallback } from "react";
import { useSessionStorageState } from "@/lib/hooks/use-session-storage-state";
import {
  DEFAULT_ACTIVE_MARKET_ID,
  MOCK_MARKETS,
  getMarketById,
} from "@/lib/data/mock-markets";
import type { Market } from "@/lib/types/market";

/**
 * Hook central du contexte marché de l'application.
 *
 * Persiste l'ID du marché actif en sessionStorage → la sélection survit
 * aux navigations entre pages mais s'efface à la fermeture de l'onglet.
 *
 * V2 : `markets` viendra de Supabase, et le switch déclenchera invalidation
 * du cache RSC pour recharger toutes les données sous le bon contexte pays.
 */
export function useCurrentMarket() {
  const [currentMarketId, setCurrentMarketId] = useSessionStorageState<string>(
    "kamoo.currentMarketId",
    DEFAULT_ACTIVE_MARKET_ID,
  );

  const currentMarket: Market =
    getMarketById(currentMarketId) ??
    getMarketById(DEFAULT_ACTIVE_MARKET_ID) ??
    MOCK_MARKETS[0];

  const switchToMarket = useCallback(
    (id: string) => {
      setCurrentMarketId(id);
    },
    [setCurrentMarketId],
  );

  return {
    markets: MOCK_MARKETS,
    currentMarket,
    switchToMarket,
  };
}
