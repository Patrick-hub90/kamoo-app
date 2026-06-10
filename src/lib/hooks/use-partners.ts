"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { LivreurService } from "@/lib/types/livreur";

/**
 * Partenaires du vendeur (par marché, V1 mono-marché).
 *
 * Règle Kamoo : PAS d'annonces ni de candidatures — le vendeur se rend dans
 * la Marketplace et CHOISIT directement son partenaire.
 *
 * Workflow de demande :
 *   choisir → `pending` (en attente de validation par le partenaire)
 *   → `active` (le partenaire accepte — démo : acceptation auto après ~12 s)
 *
 * Workflow de fin : motif obligatoire + évaluation (note/commentaire),
 * l'évaluation est conservée et modifiable (kamoo.partnerReviews).
 *
 * Architecture : STORE SINGLETON module-level (même pattern que
 * use-products-state) — les cartes marketplace, les profils et le CTA
 * lisent tous le même état, sans race condition entre instances.
 *
 * V2 : tables partnerships + partner_reviews (Supabase).
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

type PartnersMap = Partial<Record<PartnerRole, Partnership>>;
type ReviewsMap = Record<string, PartnerReview>; // par slug

type PartnersState = { partners: PartnersMap; reviews: ReviewsMap };

export const END_REASONS = [
  "Je n'ai plus besoin de ce service",
  "Qualité de service insuffisante",
  "Tarifs trop élevés",
  "Délais non respectés",
  "Je change de partenaire",
  "Autre raison",
] as const;

/** Démo : le partenaire « accepte » la demande après ce délai. */
const ACCEPT_DELAY_MS = 12_000;

const PARTNERS_KEY = "kamoo.partners";
const REVIEWS_KEY = "kamoo.partnerReviews";

const DEFAULT_PARTNERS: PartnersMap = {
  // La closeuse active des fixtures est déjà un partenariat en cours.
  closeuse: {
    slug: "aminata-sene",
    status: "active",
    requestedAt: "2025-09-20T10:00:00Z",
  },
};

/** Migration : l'ancien format stockait un simple slug (string) par rôle. */
function normalizePartners(raw: unknown): PartnersMap {
  if (!raw || typeof raw !== "object") return DEFAULT_PARTNERS;
  const out: PartnersMap = {};
  for (const [role, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "string") {
      out[role as PartnerRole] = {
        slug: v,
        status: "active",
        requestedAt: "2025-09-20T10:00:00Z",
      };
    } else if (v && typeof v === "object" && "slug" in v) {
      out[role as PartnerRole] = v as Partnership;
    }
  }
  return out;
}

/* ─── Store module-level (singleton client) ─── */

let state: PartnersState = { partners: DEFAULT_PARTNERS, reviews: {} };
let hydrated = false;
const listeners = new Set<() => void>();
const acceptTimers = new Map<string, ReturnType<typeof setTimeout>>();

function notify() {
  listeners.forEach((l) => l());
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(PARTNERS_KEY, JSON.stringify(state.partners));
    sessionStorage.setItem(REVIEWS_KEY, JSON.stringify(state.reviews));
  } catch {
    /* ignore */
  }
}

function setState(updater: (prev: PartnersState) => PartnersState) {
  state = updater(state);
  persist();
  notify();
  scheduleAcceptances();
}

/** Démo : programme l'acceptation auto de chaque demande pending. */
function scheduleAcceptances() {
  if (typeof window === "undefined") return;
  for (const [role, p] of Object.entries(state.partners) as [PartnerRole, Partnership | undefined][]) {
    if (!p || p.status !== "pending") continue;
    const key = `${role}:${p.slug}`;
    if (acceptTimers.has(key)) continue;
    const elapsed = Date.now() - new Date(p.requestedAt).getTime();
    const remaining = Math.max(300, ACCEPT_DELAY_MS - elapsed);
    acceptTimers.set(
      key,
      setTimeout(() => {
        acceptTimers.delete(key);
        const cur = state.partners[role];
        if (cur && cur.slug === p.slug && cur.status === "pending") {
          setState((s) => ({
            ...s,
            partners: { ...s.partners, [role]: { ...cur, status: "active" } },
          }));
        }
      }, remaining),
    );
  }
}

function hydrateOnce() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const rawPartners = sessionStorage.getItem(PARTNERS_KEY);
    const rawReviews = sessionStorage.getItem(REVIEWS_KEY);
    state = {
      partners: rawPartners ? normalizePartners(JSON.parse(rawPartners)) : DEFAULT_PARTNERS,
      reviews: rawReviews ? (JSON.parse(rawReviews) as ReviewsMap) : {},
    };
  } catch {
    /* ignore — storage corrompu */
  }
  scheduleAcceptances();
}

function subscribe(callback: () => void): () => void {
  hydrateOnce();
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): PartnersState {
  return state;
}

const SERVER_STATE: PartnersState = Object.freeze({
  partners: DEFAULT_PARTNERS,
  reviews: {},
}) as PartnersState;

function getServerSnapshot(): PartnersState {
  return SERVER_STATE;
}

/* ─── Hook React ─── */

export function usePartners() {
  const { partners, reviews } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  /** Envoie une demande de partenariat → statut « en attente de validation ». */
  const request = useCallback(
    (role: PartnerRole, slug: string, services?: LivreurService[]) =>
      setState((s) => ({
        ...s,
        partners: {
          ...s.partners,
          [role]: {
            slug,
            status: "pending" as const,
            requestedAt: new Date().toISOString(),
            ...(services ? { services } : {}),
          },
        },
      })),
    [],
  );

  /** Annule une demande encore en attente. */
  const cancelRequest = useCallback(
    (role: PartnerRole) =>
      setState((s) =>
        s.partners[role]?.status === "pending"
          ? { ...s, partners: { ...s.partners, [role]: undefined } }
          : s,
      ),
    [],
  );

  /** Met fin au partenariat : motif + évaluation (conservée, modifiable). */
  const end = useCallback(
    (
      role: PartnerRole,
      slug: string,
      data: { reason: string; rating: number; comment: string },
    ) =>
      setState((s) => ({
        partners: { ...s.partners, [role]: undefined },
        reviews: {
          ...s.reviews,
          [slug]: {
            rating: data.rating,
            comment: data.comment,
            endReason: data.reason,
            at: new Date().toISOString(),
          },
        },
      })),
    [],
  );

  /** Met à jour l'évaluation d'un partenaire (sans mettre fin). */
  const saveReview = useCallback(
    (slug: string, data: { rating: number; comment: string }) =>
      setState((s) => ({
        ...s,
        reviews: {
          ...s.reviews,
          [slug]: {
            ...s.reviews[slug],
            rating: data.rating,
            comment: data.comment,
            at: new Date().toISOString(),
          },
        },
      })),
    [],
  );

  /** Modifie les services souscrits chez un livreur partenaire. */
  const setServices = useCallback(
    (role: PartnerRole, services: LivreurService[]) =>
      setState((s) => {
        const cur = s.partners[role];
        if (!cur) return s;
        return { ...s, partners: { ...s.partners, [role]: { ...cur, services } } };
      }),
    [],
  );

  const getPartnership = useCallback(
    (role: PartnerRole, slug: string): Partnership | null => {
      const p = partners[role];
      return p && p.slug === slug ? p : null;
    },
    [partners],
  );

  const getReview = useCallback((slug: string) => reviews[slug] ?? null, [reviews]);

  return {
    partners,
    getPartnership,
    request,
    cancelRequest,
    end,
    saveReview,
    setServices,
    getReview,
  };
}
