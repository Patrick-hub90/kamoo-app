"use client";

import { useCallback } from "react";
import { useSessionStorageState } from "@/lib/hooks/use-session-storage-state";

/**
 * Partenaires actifs du vendeur (par marché, V1 mono-marché).
 *
 * Règle Kamoo : PAS d'annonces ni de candidatures — le vendeur se rend dans
 * la Marketplace et CHOISIT directement son partenaire. Le partenaire reçoit
 * la demande sur son app et l'accepte (V1 démo : acceptation immédiate).
 *
 * V2 : table partnerships(vendor_id, partner_id, role, market_id, status).
 */

export type PartnerRole = "closeuse" | "transitaire" | "livreur";

type Partners = Partial<Record<PartnerRole, string>>; // slug par rôle

export const PARTNER_ROLE_LABELS: Record<PartnerRole, string> = {
  closeuse: "closeuse",
  transitaire: "transitaire",
  livreur: "livreur",
};

export function usePartners() {
  const [partners, setPartners] = useSessionStorageState<Partners>(
    "kamoo.partners",
    // La closeuse active des fixtures est déjà un partenariat en cours.
    { closeuse: "aminata-sene" },
  );

  const choose = useCallback(
    (role: PartnerRole, slug: string) =>
      setPartners((prev) => ({ ...prev, [role]: slug })),
    [setPartners],
  );

  const end = useCallback(
    (role: PartnerRole) =>
      setPartners((prev) => ({ ...prev, [role]: undefined })),
    [setPartners],
  );

  const isCurrent = useCallback(
    (role: PartnerRole, slug: string) => partners[role] === slug,
    [partners],
  );

  return { partners, choose, end, isCurrent };
}
