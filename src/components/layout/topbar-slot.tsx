"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Slot = { lead: ReactNode; actions: ReactNode } | null;

const TopbarSlotContext = createContext<{
  slot: Slot;
  setSlot: (s: Slot) => void;
}>({ slot: null, setSlot: () => {} });

/** Fournit le slot topbar. Doit envelopper la Topbar ET les pages. */
export function TopbarSlotProvider({ children }: { children: ReactNode }) {
  const [slot, setSlot] = useState<Slot>(null);
  return (
    <TopbarSlotContext.Provider value={{ slot, setSlot }}>
      {children}
    </TopbarSlotContext.Provider>
  );
}

/** Lu par la Topbar pour afficher le contenu injecté par la page. */
export function useTopbarSlot(): Slot {
  return useContext(TopbarSlotContext).slot;
}

/**
 * Injecte un contenu (contexte + actions) dans la topbar pour la durée de vie
 * de la page. `key` (ex: l'id de la commande) déclenche la mise à jour.
 */
export function useProvideTopbarSlot(
  key: string,
  lead: ReactNode,
  actions: ReactNode,
) {
  const { setSlot } = useContext(TopbarSlotContext);
  useEffect(() => {
    setSlot({ lead, actions });
    return () => setSlot(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
