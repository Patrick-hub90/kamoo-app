"use client";

import { useCallback, useEffect } from "react";
import { createSyncedStore } from "@/lib/sync/synced-store";
import type { LivreurService } from "@/lib/types/livreur";

/**
 * Partenaires du vendeur (par marché, V1 mono-marché).
 *
 * Cardinalités (validées avec le fondateur) :
 *  - closeuse    : UNE seule (un seul pipeline d'appels) ;
 *  - transitaires : PLUSIEURS (on choisit le transitaire à chaque expédition) ;
 *  - livreurs     : PLUSIEURS (zones différentes).
 *
 * Workflow de demande : choisir → `pending` (en attente de validation par le
 * partenaire) → `active`. Démo : transitaires et livreurs acceptent
 * automatiquement après ~12 s (pas encore d'app pour eux) ; la CLOSEUSE
 * accepte RÉELLEMENT depuis l'app partenaires (port 3001) — pas d'auto-accept.
 *
 * Fin de partenariat : motif + évaluation (note/commentaire) conservée et
 * modifiable (elle s'ajoute aussi à la liste d'avis du profil).
 *
 * État synchronisé via le mini-backend de démo (/api/demo-state) : la
 * console vendeur ET l'app partenaires voient le même état.
 */

export type PartnerRole = "closeuse" | "transitaire" | "livreur";

export type PartnershipStatus = "pending" | "active";

export type Partnership = {
  slug: string;
  status: PartnershipStatus;
  requestedAt: string; // ISO
  /** Services souscrits (livreurs uniquement — livraison toujours incluse) */
  services?: LivreurService[];
};

export type PartnerReview = {
  rating: number; // 1..5
  comment: string;
  /** Motif de la fin du partenariat (si applicable) */
  endReason?: string;
  at: string; // ISO
};

type ReviewsMap = Record<string, PartnerReview>; // par slug

export type PartnersState = {
  closeuse?: Partnership;
  transitaires: Partnership[];
  livreurs: Partnership[];
  reviews: ReviewsMap;
};

export const END_REASONS = [
  "Je n'ai plus besoin de ce service",
  "Qualité de service insuffisante",
  "Tarifs trop élevés",
  "Délais non respectés",
  "Je change de partenaire",
  "Autre raison",
] as const;

/** Démo : transitaires/livreurs « acceptent » après ce délai (pas d'app encore). */
const ACCEPT_DELAY_MS = 12_000;

const DEFAULT_STATE: PartnersState = {
  // La closeuse active des fixtures + les 2 livreurs utilisés par les
  // commandes mock sont déjà des partenariats en cours.
  closeuse: { slug: "aminata-sene", status: "active", requestedAt: "2025-09-20T10:00:00Z" },
  transitaires: [],
  livreurs: [
    { slug: "moussa-sow", status: "active", requestedAt: "2024-10-01T10:00:00Z" },
    { slug: "ibrahima-sarr", status: "active", requestedAt: "2024-08-15T10:00:00Z" },
  ],
  reviews: {},
};

const store = createSyncedStore<PartnersState>("partners", DEFAULT_STATE);

/* Acceptation auto (démo) — transitaires et livreurs uniquement : la
 * closeuse accepte réellement depuis l'app partenaires. */
const acceptTimers = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleAcceptances(state: PartnersState) {
  if (typeof window === "undefined") return;
  const pendings: Array<{ list: "transitaires" | "livreurs"; p: Partnership }> = [
    ...state.transitaires.filter((p) => p.status === "pending").map((p) => ({ list: "transitaires" as const, p })),
    ...state.livreurs.filter((p) => p.status === "pending").map((p) => ({ list: "livreurs" as const, p })),
  ];
  for (const { list, p } of pendings) {
    const timerKey = `${list}:${p.slug}`;
    if (acceptTimers.has(timerKey)) continue;
    const elapsed = Date.now() - new Date(p.requestedAt).getTime();
    const remaining = Math.max(300, ACCEPT_DELAY_MS - elapsed);
    acceptTimers.set(
      timerKey,
      setTimeout(() => {
        acceptTimers.delete(timerKey);
        store.set((s) => ({
          ...s,
          [list]: s[list].map((x) =>
            x.slug === p.slug && x.status === "pending" ? { ...x, status: "active" as const } : x,
          ),
        }));
      }, remaining),
    );
  }
}

export function usePartners() {
  const state = store.use();
  // (Re)programme l acceptation auto — en effet, PAS pendant le render.
  useEffect(() => {
    scheduleAcceptances(state);
  }, [state]);

  /** Envoie une demande de partenariat → statut « en attente de validation ». */
  const request = useCallback(
    (role: PartnerRole, slug: string, services?: LivreurService[]) => {
      const p: Partnership = {
        slug,
        status: "pending",
        requestedAt: new Date().toISOString(),
        ...(services ? { services } : {}),
      };
      store.set((s) => {
        if (role === "closeuse") return { ...s, closeuse: p }; // mono : remplace
        const list = role === "transitaire" ? "transitaires" : "livreurs";
        return { ...s, [list]: [...s[list].filter((x) => x.slug !== slug), p] };
      });
    },
    [],
  );

  /** Annule une demande encore en attente. */
  const cancelRequest = useCallback((role: PartnerRole, slug: string) => {
    store.set((s) => {
      if (role === "closeuse")
        return s.closeuse?.slug === slug && s.closeuse.status === "pending"
          ? { ...s, closeuse: undefined }
          : s;
      const list = role === "transitaire" ? "transitaires" : "livreurs";
      return {
        ...s,
        [list]: s[list].filter((x) => !(x.slug === slug && x.status === "pending")),
      };
    });
  }, []);

  /** Met fin au partenariat : motif + évaluation (conservée, modifiable). */
  const end = useCallback(
    (role: PartnerRole, slug: string, data: { reason: string; rating: number; comment: string }) => {
      store.set((s) => {
        const next: PartnersState = {
          ...s,
          reviews: {
            ...s.reviews,
            [slug]: {
              rating: data.rating,
              comment: data.comment,
              endReason: data.reason,
              at: new Date().toISOString(),
            },
          },
        };
        if (role === "closeuse") {
          if (s.closeuse?.slug === slug) next.closeuse = undefined;
        } else {
          const list = role === "transitaire" ? "transitaires" : "livreurs";
          next[list] = s[list].filter((x) => x.slug !== slug);
        }
        return next;
      });
    },
    [],
  );

  /** Laisse / met à jour une évaluation SANS mettre fin au partenariat. */
  const saveReview = useCallback((slug: string, data: { rating: number; comment: string }) => {
    store.set((s) => ({
      ...s,
      reviews: {
        ...s.reviews,
        [slug]: { ...s.reviews[slug], rating: data.rating, comment: data.comment, at: new Date().toISOString() },
      },
    }));
  }, []);

  /** Modifie les services souscrits chez un livreur partenaire. */
  const setServices = useCallback((role: PartnerRole, slug: string, services: LivreurService[]) => {
    store.set((s) => {
      if (role !== "livreur") return s;
      return {
        ...s,
        livreurs: s.livreurs.map((x) => (x.slug === slug ? { ...x, services } : x)),
      };
    });
  }, []);

  const getPartnership = useCallback(
    (role: PartnerRole, slug: string): Partnership | null => {
      if (role === "closeuse") return state.closeuse?.slug === slug ? state.closeuse : null;
      const list = role === "transitaire" ? state.transitaires : state.livreurs;
      return list.find((x) => x.slug === slug) ?? null;
    },
    [state],
  );

  const getReview = useCallback((slug: string) => state.reviews[slug] ?? null, [state]);

  return {
    /** État brut : closeuse (mono), transitaires[], livreurs[], reviews. */
    partners: state,
    getPartnership,
    request,
    cancelRequest,
    end,
    saveReview,
    setServices,
    getReview,
  };
}
