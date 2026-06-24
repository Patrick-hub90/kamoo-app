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

/**
 * Membre du RÉSEAU du vendeur — partenaire enrôlé DIRECTEMENT par le vendeur
 * (invitation par nom + téléphone), par opposition aux partenariats recrutés
 * depuis la marketplace (`Partnership`, par slug de profil public).
 *
 * Cycle : « invité » (code à transmettre) → « actif » (reconnu : assignable
 * partout dans Kamoo) → éventuellement « suspendu ». L'état vit dans le store
 * partagé `partners` → reconnu aussi bien côté console que côté espace
 * partenaires (même source de vérité, cross-app).
 */
export type PartnerMemberStatus = "invite" | "actif" | "suspendu";

export type PartnerMember = {
  id: string;
  role: PartnerRole;
  name: string;
  phone: string;
  city?: string;
  /** Zones desservies (livreur) */
  zones?: string[];
  /** Services souscrits (livreur — livraison incluse par défaut) */
  services?: LivreurService[];
  /** Code court à transmettre au partenaire pour rejoindre l'espace partenaires. */
  inviteCode: string;
  status: PartnerMemberStatus;
  createdAt: string;
  activatedAt?: string;
  avatarBg: string;
};

export const PARTNER_MEMBER_STATUS_LABELS: Record<PartnerMemberStatus, string> = {
  invite: "Invité",
  actif: "Actif",
  suspendu: "Suspendu",
};

export const PARTNER_ROLE_LABELS: Record<PartnerRole, string> = {
  closeuse: "Closeuse",
  transitaire: "Transitaire",
  livreur: "Livreur",
};

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
  /** Partenaires enrôlés directement par le vendeur (invitation). */
  members: PartnerMember[];
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
  // Tout à zéro : aucun partenariat pré-câblé. Le vendeur recrute lui-même
  // depuis la marketplace (vide tant qu'il n'y a pas de vrais partenaires).
  closeuse: undefined,
  transitaires: [],
  livreurs: [],
  reviews: {},
  members: [],
};

/* Dégradés d'avatar pour les membres invités (à défaut de photo). */
const MEMBER_AVATARS = [
  "linear-gradient(135deg,#0EA5E9,#0284C7)",
  "linear-gradient(135deg,#22C55E,#16A34A)",
  "linear-gradient(135deg,#A855F7,#7E22CE)",
  "linear-gradient(135deg,#F59E0B,#B45309)",
  "linear-gradient(135deg,#EC4899,#DB2777)",
  "linear-gradient(135deg,#14B8A6,#0D9488)",
];

/** Code d'invitation court, lisible (sans caractères ambigus 0/O/1/I). */
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

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

  /* ─── Membres invités (réseau enrôlé par le vendeur) ─── */

  /** Crée une invitation → membre « invité » (code à transmettre). */
  const inviteMember = useCallback(
    (input: {
      role: PartnerRole;
      name: string;
      phone: string;
      city?: string;
      zones?: string[];
      services?: LivreurService[];
    }): PartnerMember => {
      const name = input.name.trim();
      const member: PartnerMember = {
        id: `pm_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        role: input.role,
        name,
        phone: input.phone.trim(),
        city: input.city?.trim() || undefined,
        zones:
          input.role === "livreur"
            ? input.zones?.map((z) => z.trim()).filter(Boolean)
            : undefined,
        services:
          input.role === "livreur"
            ? input.services && input.services.length
              ? input.services
              : ["livraison"]
            : undefined,
        inviteCode: generateInviteCode(),
        status: "invite",
        createdAt: new Date().toISOString(),
        avatarBg: MEMBER_AVATARS[name.length % MEMBER_AVATARS.length],
      };
      store.set((s) => ({ ...s, members: [member, ...(s.members ?? [])] }));
      return member;
    },
    [],
  );

  /** Change le statut d'un membre (activer = reconnu / assignable). */
  const setMemberStatus = useCallback((id: string, status: PartnerMemberStatus) => {
    store.set((s) => ({
      ...s,
      members: (s.members ?? []).map((m) =>
        m.id === id
          ? {
              ...m,
              status,
              ...(status === "actif" && !m.activatedAt
                ? { activatedAt: new Date().toISOString() }
                : {}),
            }
          : m,
      ),
    }));
  }, []);

  /** Retire définitivement un membre du réseau. */
  const removeMember = useCallback((id: string) => {
    store.set((s) => ({ ...s, members: (s.members ?? []).filter((m) => m.id !== id) }));
  }, []);

  /** Membres d'un rôle (tous statuts), triés actifs d'abord. */
  const getMembers = useCallback(
    (role?: PartnerRole): PartnerMember[] =>
      (state.members ?? []).filter((m) => !role || m.role === role),
    [state.members],
  );

  /** Membres ACTIFS (reconnus) d'un rôle — pour les listes d'assignation. */
  const getActiveMembers = useCallback(
    (role: PartnerRole): PartnerMember[] =>
      (state.members ?? []).filter((m) => m.role === role && m.status === "actif"),
    [state.members],
  );

  return {
    /** État brut : closeuse (mono), transitaires[], livreurs[], reviews, members. */
    partners: state,
    getPartnership,
    request,
    cancelRequest,
    end,
    saveReview,
    setServices,
    getReview,
    /* Réseau enrôlé */
    inviteMember,
    setMemberStatus,
    removeMember,
    getMembers,
    getActiveMembers,
  };
}
