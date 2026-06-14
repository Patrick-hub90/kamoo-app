"use client";

import { useCallback, useMemo } from "react";
import { MOCK_CLIENTS } from "@/lib/data/mock-clients";
import { useSessionStorageState } from "@/lib/hooks/use-session-storage-state";
import type { Client } from "@/lib/types/client";

/**
 * État clients V1 (mock) : les clients ajoutés via « Ajouter un client »
 * sont persistés en sessionStorage et fusionnés en tête des fixtures.
 *
 * V2 : server action createClient() + Supabase.
 */
export function useClientsState() {
  const [extra, setExtra] = useSessionStorageState<Client[]>("clients.extra", []);
  /* Modifs appliquées PAR-DESSUS les fixtures et les extras (ex : notes
   * vendeur éditées depuis la fiche). Persistées en sessionStorage. */
  const [overrides, setOverrides] = useSessionStorageState<
    Record<string, Partial<Client>>
  >("clients.overrides", {});

  const all = useMemo(
    () =>
      [...extra, ...MOCK_CLIENTS].map((c) =>
        overrides[c.id] ? { ...c, ...overrides[c.id] } : c,
      ),
    [extra, overrides],
  );

  const addClient = useCallback(
    (c: Client) => setExtra((prev) => [c, ...prev]),
    [setExtra],
  );

  const getById = useCallback(
    (id: string) => all.find((c) => c.id === id),
    [all],
  );

  const update = useCallback(
    (id: string, patch: Partial<Client>) =>
      setOverrides((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } })),
    [setOverrides],
  );

  return { all, addClient, getById, update };
}
