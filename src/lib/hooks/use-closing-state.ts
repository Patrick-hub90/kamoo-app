"use client";

import { useCallback, useMemo } from "react";
import { MOCK_CLOSING_ASSIGNMENTS } from "@/lib/data/mock-closing";
import { createSyncedStore } from "@/lib/sync/synced-store";
import { getShopifyConnectionsSnapshot } from "@/lib/hooks/use-shopify";
import type {
  AssignedDelivery,
  CancellationReason,
  ClosingAssignment,
  ClosingStatus,
  DeliveryProgress,
} from "@/lib/types/closing";

/**
 * État closing V1 (mock) — la « machine d'états » du flux COD côté client :
 *
 *   nouvelle / rappelé / injoignable ──confirmer──▶ livraison_en_cours
 *   livraison_en_cours ──assigner livreur──▶ (delivery.en_attente)
 *   delivery.en_attente ──livrer──▶ livré + encaissé (delivery.effectue)
 *   delivery.alerte ──relancer──▶ en_attente │ ──annuler──▶ annulé
 *
 * Deux couches persistées en sessionStorage :
 *  - `closing.extraOrders` : commandes créées à la main (modale Nouvelle commande)
 *  - `closing.overrides`   : modifications d'état appliquées PAR-DESSUS les
 *    fixtures et les extraOrders (statut, rappel, livreur assigné, progrès…)
 *
 * En V2 (Supabase), ces transitions deviendront des server actions et ce hook
 * un simple fetch — les pages consommatrices ne changeront pas.
 */

export type ClosingOverride = {
  status?: ClosingStatus;
  callbackAt?: string;
  comment?: string;
  cancellationReason?: CancellationReason;
  /** Livreur assigné (remplace/complète la fixture) */
  delivery?: AssignedDelivery;
  /** Patch du progrès livreur sans toucher au reste de `delivery` */
  deliveryProgress?: DeliveryProgress;
  /** Date de livraison effective (posée quand on marque livré) */
  deliveredAt?: string;
  lastActivityAt?: string;
};

function applyOverride(
  a: ClosingAssignment,
  o: ClosingOverride | undefined,
): ClosingAssignment {
  if (!o) return a;
  const baseDelivery = o.delivery ?? a.delivery;
  const delivery = baseDelivery
    ? {
        ...baseDelivery,
        progress: o.deliveryProgress ?? baseDelivery.progress,
        deliveredAt: o.deliveredAt ?? baseDelivery.deliveredAt,
        amountCollected:
          (o.deliveryProgress ?? baseDelivery.progress) === "effectue"
            ? (baseDelivery.amountCollected ??
              a.items.reduce((s, i) => s + i.quantity * i.unitPriceXof, 0))
            : baseDelivery.amountCollected,
        livreurNote:
          o.deliveryProgress === "en_attente" ? undefined : baseDelivery.livreurNote,
      }
    : undefined;
  return {
    ...a,
    status: o.status ?? a.status,
    callbackAt: o.callbackAt ?? a.callbackAt,
    comment: "comment" in o ? o.comment : a.comment,
    cancellationReason: o.cancellationReason ?? a.cancellationReason,
    lastActivityAt: o.lastActivityAt ?? a.lastActivityAt,
    delivery,
  };
}

type ClosingSyncedState = {
  extraOrders: ClosingAssignment[];
  overrides: Record<string, ClosingOverride>;
};

/* État SYNCHRONISÉ via le mini-backend (/api/demo-state) : la console
 * vendeur ET l'app closeuse (port 3001) pilotent les MÊMES commandes —
 * une confirmation côté closeuse apparaît côté vendeur en ~2 s. */
const closingStore = createSyncedStore<ClosingSyncedState>("closing", {
  extraOrders: [],
  overrides: {},
});

export function useClosingState() {
  const { extraOrders, overrides } = closingStore.use();

  const all = useMemo(
    () =>
      [...extraOrders, ...MOCK_CLOSING_ASSIGNMENTS].map((a) =>
        applyOverride(a, overrides[a.id]),
      ),
    [extraOrders, overrides],
  );

  const update = useCallback((id: string, patch: ClosingOverride) => {
    closingStore.set((s) => ({
      ...s,
      overrides: {
        ...s.overrides,
        [id]: {
          ...s.overrides[id],
          ...patch,
          lastActivityAt: patch.lastActivityAt ?? new Date().toISOString(),
        },
      },
    }));
  }, []);

  const addOrder = useCallback((order: ClosingAssignment) => {
    closingStore.set((s) => ({ ...s, extraOrders: [order, ...s.extraOrders] }));
  }, []);

  const getById = useCallback(
    (id: string) => all.find((a) => a.id === id),
    [all],
  );

  /* ─── Transitions métier (la sémantique vit ici, pas dans les pages) ─── */

  const confirm = useCallback(
    (id: string) =>
      update(id, {
        status: "livraison_en_cours",
        comment: undefined,
      }),
    [update],
  );

  const postpone = useCallback(
    (id: string) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      update(id, { status: "rappele", callbackAt: tomorrow.toISOString() });
    },
    [update],
  );

  const markUnreachable = useCallback(
    (id: string) => update(id, { status: "injoignable" }),
    [update],
  );

  const cancel = useCallback(
    (id: string, reason: CancellationReason = "other") =>
      update(id, { status: "annule", cancellationReason: reason }),
    [update],
  );

  const assignLivreur = useCallback(
    (id: string, delivery: AssignedDelivery) => update(id, { delivery }),
    [update],
  );

  const markDelivered = useCallback(
    (id: string) => {
      update(id, {
        status: "livre",
        deliveryProgress: "effectue",
        deliveredAt: new Date().toISOString(),
      });
      /* Push de statut Shopify (automatique) : si la commande vient de la
       * boutique et qu'une connexion RÉELLE existe, on la marque honorée
       * côté Shopify. Best-effort : un échec ne bloque jamais le flux COD. */
      const a = [...closingStore.get().extraOrders, ...MOCK_CLOSING_ASSIGNMENTS].find(
        (x) => x.id === id,
      );
      if (a?.shopifyOrderId && !a.shopifyOrderId.includes("/demo-")) {
        const conns = Object.values(getShopifyConnectionsSnapshot());
        const live = conns.find((c) => c.isConnected && c.mode === "live");
        if (live) {
          fetch("/api/shopify/fulfill", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ shop: live.domain, shopifyOrderId: a.shopifyOrderId }),
          }).catch(() => {});
        }
      }
    },
    [update],
  );

  const retryDelivery = useCallback(
    (id: string) => update(id, { deliveryProgress: "en_attente" }),
    [update],
  );

  return {
    all,
    getById,
    addOrder,
    update,
    confirm,
    postpone,
    markUnreachable,
    cancel,
    assignLivreur,
    markDelivered,
    retryDelivery,
  };
}
