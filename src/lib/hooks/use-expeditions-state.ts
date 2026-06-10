"use client";

import { useCallback, useMemo } from "react";
import { MOCK_EXPEDITIONS } from "@/lib/data/mock-expeditions";
import { useSessionStorageState } from "@/lib/hooks/use-session-storage-state";
import type { Expedition } from "@/lib/types/expedition";

/**
 * État expéditions V1 (mock) : les expéditions créées via le wizard
 * « Nouvelle expédition » sont persistées en sessionStorage et fusionnées
 * en tête des fixtures — elles apparaissent immédiatement dans la liste.
 *
 * V2 : server action createExpedition() + Supabase.
 */
export function useExpeditionsState() {
  const [extra, setExtra] = useSessionStorageState<Expedition[]>(
    "expeditions.extra",
    [],
  );

  const all = useMemo(() => [...extra, ...MOCK_EXPEDITIONS], [extra]);

  const addExpedition = useCallback(
    (e: Expedition) => setExtra((prev) => [e, ...prev]),
    [setExtra],
  );

  return { all, addExpedition };
}
