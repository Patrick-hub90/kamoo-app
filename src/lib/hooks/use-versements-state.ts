"use client";

import { useCallback } from "react";
import { useSessionStorageState } from "@/lib/hooks/use-session-storage-state";
import {
  MOCK_DISPUTES,
  MOCK_VERSEMENTS,
} from "@/lib/data/mock-versements";
import type { Dispute, Versement } from "@/lib/types/finance";

/**
 * État partagé des versements et disputes entre toutes les pages Finances
 * (Aperçu, Journal…). Utilise sessionStorage → quand tu valides un versement
 * dans Aperçu puis tu vas dans Journal, l'action est répercutée.
 *
 * V2 : sera remplacé par des server actions avec invalidation cache.
 */

const KEY_VERSEMENTS = "fin.versements";
const KEY_DISPUTES = "fin.disputes";

export function useVersementsState() {
  const [versements, setVersements] = useSessionStorageState<Versement[]>(
    KEY_VERSEMENTS,
    MOCK_VERSEMENTS,
  );
  const [disputes, setDisputes] = useSessionStorageState<Dispute[]>(
    KEY_DISPUTES,
    MOCK_DISPUTES,
  );

  /** Marque un versement en `valide` (vendeur a confirmé la réception) */
  const validateVersement = useCallback(
    (id: string) => {
      setVersements((prev) =>
        prev.map((v) =>
          v.id === id
            ? { ...v, status: "valide", validatedAt: new Date().toISOString() }
            : v,
        ),
      );
    },
    [setVersements],
  );

  /**
   * Le vendeur conteste un versement → crée une dispute auto + passe le
   * versement en `en_litige`. Identité du vendeur en dur pour V1 mock.
   */
  const refuseVersement = useCallback(
    (versement: Versement) => {
      const newDispute: Dispute = {
        id: `dsp_${Date.now()}`,
        type: "versement_partiel",
        raisedBy: { type: "vendeur", id: "v_aicha", name: "Aïcha Diop" },
        against: {
          type: "livreur",
          id: versement.versedBy.ref,
          name: versement.versedBy.name,
        },
        description: `Versement déclaré (${versement.amountXof} F) non reçu`,
        expectedXof: versement.amountXof,
        actualXof: 0,
        status: "ouvert",
        createdAt: new Date().toISOString(),
        versementId: versement.id,
      };
      setDisputes((prev) => [newDispute, ...prev]);
      setVersements((prev) =>
        prev.map((v) =>
          v.id === versement.id
            ? { ...v, status: "en_litige", disputeId: newDispute.id }
            : v,
        ),
      );
    },
    [setDisputes, setVersements],
  );

  return {
    versements,
    disputes,
    validateVersement,
    refuseVersement,
  };
}
