"use client";

import { useCallback } from "react";
import { createSyncedStore } from "@/lib/sync/synced-store";
import type { PartnerRole } from "@/lib/hooks/use-partners";

/**
 * Système de DISPUTES — Kamoo ne gère pas l'argent entre les mains des
 * partenaires : en cas de problème (vendeur ↔ transitaire / livreur /
 * closeuse), on ouvre une dispute.
 *
 * Workflow (validé avec le fondateur) :
 *  1. Ouverture : motif + description. Le profil du partenaire est MARQUÉ
 *     « En dispute » publiquement (pression + prudence pour les autres).
 *  2. Les deux parties tentent de régler entre elles (fil de discussion chat).
 *  3. Après 72 h non réglée, « Faire intervenir Kamoo » s'active pour LES
 *     DEUX parties → statut « kamoo » (médiation).
 *  4. « Marquer comme réglée » : par l'initiateur, à tout moment. Le badge
 *     public disparaît ; l'historique reste dans la page Disputes.
 *
 * État synchronisé (/api/demo-state) : visible aussi par l'app partenaires.
 */

export const DISPUTE_REASONS = [
  "Argent non reversé",
  "Colis perdu ou endommagé",
  "Devis ou tarif contesté",
  "Délai non respecté",
  "Marchandise non conforme",
  "Comportement / communication",
  "Autre",
] as const;

export type DisputeReason = (typeof DISPUTE_REASONS)[number];

export type DisputeStatus = "ouverte" | "kamoo" | "reglee";

export type Dispute = {
  id: string;
  againstRole: PartnerRole;
  againstSlug: string;
  againstName: string;
  openedBy: "vendor" | "partner";
  reason: DisputeReason;
  description: string;
  /** Contexte métier, ex. « Expédition KMO-SN-78421 » ou « Commande ORD-SN-00132 » */
  context?: string;
  status: DisputeStatus;
  openedAt: string; // ISO
  kamooAt?: string; // ISO — date d'escalade à Kamoo
  resolvedAt?: string; // ISO
};

/** Kamoo n'intervient qu'après ce délai de résolution entre les parties. */
export const KAMOO_DELAY_MS = 72 * 3600 * 1000; // 72 h

type DisputesState = { disputes: Dispute[] };

/* Fixture : une dispute ouverte il y a 4 jours (l'option « Faire intervenir
 * Kamoo » est donc déjà active — visible pour la démo). */
const FOUR_DAYS_AGO = new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString();

const DEFAULT_STATE: DisputesState = {
  disputes: [
    {
      id: "disp_demo_1",
      againstRole: "transitaire",
      againstSlug: "shanghai-express-cargo",
      againstName: "Shanghai Express Cargo",
      openedBy: "vendor",
      reason: "Devis ou tarif contesté",
      description:
        "Le devis reçu est 40 % au-dessus de la grille affichée sur le profil (8 400 F/kg au lieu de 5 000–6 800 F/kg) sans justification de catégorie. J'ai demandé le détail du calcul, sans réponse depuis 3 jours.",
      context: "Expédition KMO-SN-78410",
      status: "ouverte",
      openedAt: FOUR_DAYS_AGO,
    },
  ],
};

const store = createSyncedStore<DisputesState>("disputes", DEFAULT_STATE);

export function useDisputes() {
  const { disputes } = store.use();

  const active = disputes.filter((d) => d.status !== "reglee");

  /** Dispute active visant ce partenaire (pour le badge public). */
  const activeFor = useCallback(
    (slug: string): Dispute | null =>
      disputes.find((d) => d.againstSlug === slug && d.status !== "reglee") ?? null,
    [disputes],
  );

  const open = useCallback(
    (d: Omit<Dispute, "id" | "status" | "openedAt" | "openedBy">) => {
      store.set((s) => ({
        disputes: [
          {
            ...d,
            id: `disp_${Date.now().toString(36)}`,
            openedBy: "vendor" as const,
            status: "ouverte" as const,
            openedAt: new Date().toISOString(),
          },
          ...s.disputes,
        ],
      }));
    },
    [],
  );

  /** Marquer réglée (initiateur) — le badge public disparaît. */
  const resolve = useCallback((id: string) => {
    store.set((s) => ({
      disputes: s.disputes.map((d) =>
        d.id === id ? { ...d, status: "reglee" as const, resolvedAt: new Date().toISOString() } : d,
      ),
    }));
  }, []);

  /** Faire intervenir Kamoo — possible UNIQUEMENT après 72 h. */
  const escalate = useCallback((id: string) => {
    store.set((s) => ({
      disputes: s.disputes.map((d) =>
        d.id === id && canEscalate(d)
          ? { ...d, status: "kamoo" as const, kamooAt: new Date().toISOString() }
          : d,
      ),
    }));
  }, []);

  return { disputes, active, activeFor, open, resolve, escalate };
}

export function canEscalate(d: Dispute): boolean {
  if (d.status !== "ouverte") return false;
  return Date.now() - new Date(d.openedAt).getTime() >= KAMOO_DELAY_MS;
}

/** Temps restant avant activation de l'intervention Kamoo (ms, 0 si écoulé). */
export function msUntilEscalation(d: Dispute): number {
  return Math.max(0, KAMOO_DELAY_MS - (Date.now() - new Date(d.openedAt).getTime()));
}
