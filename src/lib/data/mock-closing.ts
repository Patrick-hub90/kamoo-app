import {
  CANCELLATION_REASON_LABELS,
  orderTotalXof,
  type ActiveCloseuse,
  type ClosingAssignment,
  type ClosingHistoryEvent,
  type DeliveryProgress,
} from "@/lib/types/closing";
import { shiftToNow } from "@/lib/clock";

export const MOCK_ACTIVE_CLOSEUSE: ActiveCloseuse = {
  id: "cl_aicha",
  name: "Aminata Sène",
  phone: "+221 77 123 45 67",
  avatarBg: "linear-gradient(135deg,#F97316,#FB923C)",
  rating: 4.8,
  reviewsCount: 47,
  startedAt: "2024-09-15",
  // Quelques minutes avant midi le jour de l'ancre → « il y a X min » aujourd'hui.
  lastSeenAt: shiftToNow("2026-05-04T11:56:00Z"),
};

/* Fixtures écrites autour de l'ancre 2026-05-04 — toutes les dates sont
 * décalées vers AUJOURD'HUI via shiftToNow() à l'export (voir bas de fichier). */
const RAW_CLOSING_ASSIGNMENTS: ClosingAssignment[] = [
  /* ─── Nouvelles fraîches ─────────────────────────────────── */
  {
    id: "ORD-SN-00132",
    items: [
      {
        productId: "p_creme",
        productName: "Crème éclaircissante naturelle",
        productEmoji: "🧴",
        productBg: "linear-gradient(135deg,#FCE7F3,#F472B6)",
        quantity: 1,
        unitPriceXof: 18000,
      },
    ],
    client: {
      id: "cu_awa_diop",
      name: "Awa Diop",
      phone: "+221 77 999 12 34",
      whatsapp: "+221 77 999 12 34",
      city: "Dakar",
      zone: "Sacré-Coeur",
      deliveryNotes: "Immeuble Khadim, 3e étage",
      isReturning: false,
    },
    status: "nouvelle",
    lastActivityAt: "2026-05-02T11:30:00Z",
    createdAt: "2026-05-02T11:30:00Z",
    callAttempts: 0,
  },
  {
    id: "ORD-SN-00131",
    items: [
      {
        productId: "p_powerbank",
        productName: "Power Bank 10 000mAh",
        productEmoji: "🔋",
        productBg: "linear-gradient(135deg,#DCFCE7,#22C55E)",
        quantity: 1,
        unitPriceXof: 12000,
      },
    ],
    client: {
      id: "cu_cheikh_diagne",
      name: "Cheikh Diagne",
      phone: "+221 78 222 99 88",
      whatsapp: "+221 78 222 99 88",
      city: "Dakar",
      zone: "Cité Tonghor, Yoff",
      deliveryNotes: "Devant la pharmacie du Marché — portail vert",
      isReturning: true,
      orderCount: 2,
    },
    status: "livraison_en_cours",
    source: "Instagram",
    scheduledDeliveryAt: "2026-05-04T16:00:00Z",
    lastActivityAt: "2026-05-04T14:20:00Z",
    createdAt: "2026-05-04T11:42:00Z",
    callAttempts: 1,
    delivery: {
      id: "lv_moussa",
      name: "Moussa Sow",
      phone: "+221 77 645 12 03",
      avatarBg: "linear-gradient(135deg,#0EA5E9,#0284C7)",
      rating: 4.9,
      progress: "en_attente",
      scheduledAt: "2026-05-04T16:00:00Z",
      pickedUpAt: "2026-05-04T14:20:00Z",
      deliveriesCount: 312,
      vehicle: "Moto",
    },
  },
  /* ─── Imminent : rappel dans <30min ──────────────────────── */
  {
    id: "ORD-SN-00130",
    items: [
      {
        productId: "p_sac",
        productName: "Sac à main cuir",
        productEmoji: "👜",
        productBg: "linear-gradient(135deg,#DBEAFE,#3B82F6)",
        quantity: 1,
        unitPriceXof: 25000,
      },
    ],
    client: {
      id: "cu_bineta_cisse",
      name: "Bineta Cissé",
      phone: "+221 77 555 12 13",
      whatsapp: "+221 77 555 12 13",
      city: "Dakar",
      zone: "Almadies",
      isReturning: true,
    },
    status: "rappele",
    // Rappel À VENIR (après MOCK_TODAY) → décompte bleu en cours.
    callbackAt: "2026-05-04T13:30:00Z",
    comment: "Doit valider avec son mari, dispo à midi",
    lastActivityAt: "2026-05-02T09:00:00Z",
    createdAt: "2026-05-02T08:30:00Z",
    callAttempts: 1,
  },
  /* ─── Programmé plus tard ────────────────────────────────── */
  {
    id: "ORD-SN-00129",
    items: [
      {
        productId: "p_lunettes",
        productName: "Lunettes solaires aviateur",
        productEmoji: "🕶️",
        productBg: "linear-gradient(135deg,#FEF3C7,#F59E0B)",
        quantity: 2,
        unitPriceXof: 11000,
      },
    ],
    client: {
      id: "cu_modou_faye",
      name: "Modou Faye",
      phone: "+221 70 444 55 66",
      whatsapp: "+221 70 444 55 66",
      city: "Thiès",
      zone: "Centre-ville",
      isReturning: false,
    },
    status: "rappele",
    // Rappel À VENIR (après MOCK_TODAY) → décompte bleu en cours.
    callbackAt: "2026-05-04T16:00:00Z",
    comment: "Sortira du boulot à 17h",
    lastActivityAt: "2026-05-02T08:00:00Z",
    createdAt: "2026-05-02T07:30:00Z",
    callAttempts: 1,
  },
  /* ─── Multi-produits (démo) ──────────────────────────────── */
  {
    id: "ORD-SN-00126",
    items: [
      {
        productId: "p_creme",
        productName: "Crème éclaircissante naturelle",
        productEmoji: "🧴",
        productBg: "linear-gradient(135deg,#FCE7F3,#F472B6)",
        quantity: 2,
        unitPriceXof: 18000,
      },
      {
        productId: "p_lunettes",
        productName: "Lunettes solaires aviateur",
        productEmoji: "🕶️",
        productBg: "linear-gradient(135deg,#FEF3C7,#F59E0B)",
        quantity: 1,
        unitPriceXof: 11000,
      },
      {
        productId: "p_casquette",
        productName: "Casquette brodée",
        productEmoji: "🧢",
        productBg: "linear-gradient(135deg,#FED7AA,#F97316)",
        quantity: 1,
        unitPriceXof: 7000,
      },
    ],
    client: {
      id: "cu_fatou_thiam",
      name: "Fatou Thiam",
      phone: "+221 77 333 22 11",
      whatsapp: "+221 77 333 22 11",
      city: "Dakar",
      zone: "Plateau",
      deliveryNotes: "Bureau au 4e étage, demander à la réception",
      isReturning: true,
    },
    status: "livraison_en_cours",
    scheduledDeliveryAt: "2026-05-02T16:00:00Z",
    comment: "Commande pour son shop",
    lastActivityAt: "2026-05-02T10:00:00Z",
    createdAt: "2026-05-01T15:00:00Z",
    callAttempts: 1,
    delivery: {
      id: "lv_moussa",
      name: "Moussa Sow",
      phone: "+221 77 888 11 22",
      avatarBg: "linear-gradient(135deg,#0EA5E9,#0284C7)",
      rating: 4.6,
      progress: "en_attente",
      scheduledAt: "2026-05-02T16:00:00Z",
      pickedUpAt: "2026-05-02T11:30:00Z",
      livreurNote: "Bureau au 4e étage, je préviens à l'arrivée",
    },
  },
  /* ─── Anciennes urgentes ─────────────────────────────────── */
  {
    id: "ORD-SN-00128",
    items: [
      {
        productId: "p_creme",
        productName: "Crème éclaircissante naturelle",
        productEmoji: "🧴",
        productBg: "linear-gradient(135deg,#FCE7F3,#F472B6)",
        quantity: 1,
        unitPriceXof: 18000,
      },
    ],
    client: {
      id: "cu_marieme_sow",
      name: "Marième Sow",
      phone: "+221 77 444 22 11",
      whatsapp: "+221 77 444 22 11",
      city: "Dakar",
      zone: "Mermoz",
      isReturning: false,
    },
    status: "nouvelle",
    lastActivityAt: "2026-05-01T08:30:00Z",
    createdAt: "2026-05-01T08:00:00Z",
    callAttempts: 0,
  },
  {
    id: "ORD-SN-00127",
    items: [
      {
        productId: "p_powerbank",
        productName: "Power Bank 10 000mAh",
        productEmoji: "🔋",
        productBg: "linear-gradient(135deg,#DCFCE7,#22C55E)",
        quantity: 2,
        unitPriceXof: 11000,
      },
    ],
    client: {
      id: "cu_ousmane_ba",
      name: "Ousmane Ba",
      phone: "+221 78 555 33 44",
      whatsapp: "+221 78 555 33 44",
      city: "Pikine",
      zone: "Centre",
      isReturning: true,
    },
    status: "nouvelle",
    comment: "Client fidèle, généralement rapide à confirmer",
    lastActivityAt: "2026-05-01T07:45:00Z",
    createdAt: "2026-05-01T07:30:00Z",
    callAttempts: 1,
  },
  {
    id: "ORD-SN-00125",
    items: [
      {
        productId: "p_lunettes",
        productName: "Lunettes solaires aviateur",
        productEmoji: "🕶️",
        productBg: "linear-gradient(135deg,#FEF3C7,#F59E0B)",
        quantity: 1,
        unitPriceXof: 12500,
      },
    ],
    client: {
      id: "cu_fatou_ndiaye",
      name: "Fatou Ndiaye",
      phone: "+221 76 999 88 77",
      city: "Rufisque",
      zone: "Diokoul",
      isReturning: false,
    },
    status: "rappele",
    callbackAt: "2026-05-01T16:00:00Z",
    comment: "Demande de rappeler à 16h après le boulot",
    lastActivityAt: "2026-05-01T10:15:00Z",
    createdAt: "2026-04-30T18:00:00Z",
    callAttempts: 2,
  },
  {
    id: "ORD-SN-00122",
    items: [
      {
        productId: "p_sac",
        productName: "Sac à main cuir",
        productEmoji: "👜",
        productBg: "linear-gradient(135deg,#DBEAFE,#3B82F6)",
        quantity: 1,
        unitPriceXof: 25000,
      },
    ],
    client: {
      id: "cu_aminata_diallo",
      name: "Aminata Diallo",
      phone: "+221 70 111 22 33",
      whatsapp: "+221 70 111 22 33",
      city: "Dakar",
      zone: "Plateau",
      isReturning: true,
    },
    status: "livraison_en_cours",
    scheduledDeliveryAt: "2026-05-02T14:30:00Z",
    comment: "Préfère livraison après-midi",
    lastActivityAt: "2026-05-01T11:30:00Z",
    createdAt: "2026-04-30T16:20:00Z",
    callAttempts: 1,
    delivery: {
      id: "lv_moussa",
      name: "Moussa Sow",
      phone: "+221 77 888 11 22",
      avatarBg: "linear-gradient(135deg,#0EA5E9,#0284C7)",
      rating: 4.6,
      progress: "alerte",
      scheduledAt: "2026-05-02T14:30:00Z",
      pickedUpAt: "2026-05-02T13:00:00Z",
      alertRaisedAt: "2026-05-02T15:15:00Z",
      livreurNote: "Sur place mais le client ne décroche pas — 3 tentatives",
    },
  },
  /* ─── Livraison reportée (livreur a contacté, client demande plus tard) ─── */
  {
    id: "ORD-SN-00121",
    items: [
      {
        productId: "p_powerbank",
        productName: "Power Bank 10 000mAh",
        productEmoji: "🔋",
        productBg: "linear-gradient(135deg,#DCFCE7,#22C55E)",
        quantity: 1,
        unitPriceXof: 12000,
      },
    ],
    client: {
      id: "cu_assane_kane",
      name: "Assane Kane",
      phone: "+221 78 444 22 11",
      whatsapp: "+221 78 444 22 11",
      city: "Dakar",
      zone: "Liberté 6",
      isReturning: false,
    },
    status: "livraison_en_cours",
    scheduledDeliveryAt: "2026-05-02T11:00:00Z",
    lastActivityAt: "2026-05-02T08:00:00Z",
    createdAt: "2026-05-01T20:00:00Z",
    callAttempts: 1,
    delivery: {
      id: "lv_moussa",
      name: "Moussa Sow",
      phone: "+221 77 888 11 22",
      avatarBg: "linear-gradient(135deg,#0EA5E9,#0284C7)",
      rating: 4.6,
      progress: "alerte",
      scheduledAt: "2026-05-02T11:00:00Z",
      pickedUpAt: "2026-05-02T10:00:00Z",
      alertRaisedAt: "2026-05-02T11:30:00Z",
      livreurNote: "Client en réunion — demande de repasser demain à 16h",
    },
  },
  {
    id: "ORD-SN-00120",
    items: [
      {
        productId: "p_casquette",
        productName: "Casquette brodée",
        productEmoji: "🧢",
        productBg: "linear-gradient(135deg,#FED7AA,#F97316)",
        quantity: 3,
        unitPriceXof: 7000,
      },
    ],
    client: {
      id: "cu_mamadou_sy",
      name: "Mamadou Sy",
      phone: "+221 77 888 66 55",
      whatsapp: "+221 77 888 66 55",
      city: "Guédiawaye",
      zone: "Cité Sahm",
      isReturning: false,
    },
    status: "livraison_en_cours",
    scheduledDeliveryAt: "2026-05-01T17:00:00Z",
    lastActivityAt: "2026-05-01T09:50:00Z",
    createdAt: "2026-04-30T14:00:00Z",
    callAttempts: 1,
    delivery: {
      id: "lv_ibrahima",
      name: "Ibrahima Sarr",
      phone: "+221 78 222 33 44",
      avatarBg: "linear-gradient(135deg,#10B981,#059669)",
      rating: 4.9,
      progress: "alerte",
      scheduledAt: "2026-05-01T17:00:00Z",
      pickedUpAt: "2026-05-01T15:00:00Z",
      alertRaisedAt: "2026-05-01T17:45:00Z",
      livreurNote: "Client présent mais pas d'argent, refuse la commande",
    },
  },
  {
    id: "ORD-SN-00118",
    items: [
      {
        productId: "p_coque",
        productName: "Coque téléphone silicone",
        productEmoji: "📱",
        productBg: "linear-gradient(135deg,#E9D5FF,#A78BFA)",
        quantity: 1,
        unitPriceXof: 8500,
      },
    ],
    client: {
      id: "cu_khadija_mbaye",
      name: "Khadija Mbaye",
      phone: "+221 76 333 44 55",
      city: "Thiès",
      zone: "Médina Fall",
      isReturning: false,
    },
    status: "annule",
    cancellationReason: "no_money",
    comment: "Pas d'argent ce mois",
    lastActivityAt: "2026-05-01T11:00:00Z",
    createdAt: "2026-04-30T12:00:00Z",
    callAttempts: 2,
  },
  {
    id: "ORD-SN-00115",
    items: [
      {
        productId: "p_creme",
        productName: "Crème éclaircissante naturelle",
        productEmoji: "🧴",
        productBg: "linear-gradient(135deg,#FCE7F3,#F472B6)",
        quantity: 1,
        unitPriceXof: 18000,
      },
    ],
    client: {
      id: "cu_aissatou_faye",
      name: "Aïssatou Faye",
      phone: "+221 78 222 11 99",
      city: "Dakar",
      zone: "Almadies",
      isReturning: true,
    },
    status: "injoignable",
    callbackAt: "2026-05-01T15:30:00Z",
    comment: "5 tentatives, ne décroche pas — réessayer à 15h30",
    lastActivityAt: "2026-05-01T13:20:00Z",
    createdAt: "2026-04-29T10:00:00Z",
    callAttempts: 5,
  },
  {
    id: "ORD-SN-00112",
    items: [
      {
        productId: "p_lunettes",
        productName: "Lunettes solaires aviateur",
        productEmoji: "🕶️",
        productBg: "linear-gradient(135deg,#FEF3C7,#F59E0B)",
        quantity: 2,
        unitPriceXof: 11000,
      },
    ],
    client: {
      id: "cu_khady_niang",
      name: "Khady Niang",
      phone: "+221 77 666 11 22",
      whatsapp: "+221 77 666 11 22",
      city: "Dakar",
      zone: "Plateau",
      isReturning: false,
    },
    status: "livre",
    scheduledDeliveryAt: "2026-04-28T15:00:00Z",
    lastActivityAt: "2026-04-28T16:30:00Z",
    createdAt: "2026-04-28T09:00:00Z",
    callAttempts: 1,
    delivery: {
      id: "lv_moussa",
      name: "Moussa Sow",
      phone: "+221 77 888 11 22",
      avatarBg: "linear-gradient(135deg,#0EA5E9,#0284C7)",
      rating: 4.6,
      progress: "effectue",
      scheduledAt: "2026-04-28T15:00:00Z",
      pickedUpAt: "2026-04-28T13:00:00Z",
      deliveredAt: "2026-04-28T16:00:00Z",
      amountCollected: 22000,
    },
  },
  {
    id: "ORD-SN-00108",
    items: [
      {
        productId: "p_sac",
        productName: "Sac à main cuir",
        productEmoji: "👜",
        productBg: "linear-gradient(135deg,#DBEAFE,#3B82F6)",
        quantity: 1,
        unitPriceXof: 25000,
      },
    ],
    client: {
      id: "cu_coumba_sarr",
      name: "Coumba Sarr",
      phone: "+221 78 333 44 55",
      city: "Mbour",
      zone: "Tefess",
      isReturning: false,
    },
    status: "annule",
    cancellationReason: "wrong_number",
    comment: "Numéro incorrect dès le départ",
    lastActivityAt: "2026-04-27T14:00:00Z",
    createdAt: "2026-04-27T10:00:00Z",
    callAttempts: 3,
  },
  {
    id: "ORD-SN-00103",
    items: [
      {
        productId: "p_casquette",
        productName: "Casquette brodée",
        productEmoji: "🧢",
        productBg: "linear-gradient(135deg,#FED7AA,#F97316)",
        quantity: 4,
        unitPriceXof: 7000,
      },
    ],
    client: {
      id: "cu_babacar_faye",
      name: "Babacar Faye",
      phone: "+221 70 555 88 99",
      whatsapp: "+221 70 555 88 99",
      city: "Saint-Louis",
      zone: "Sor",
      isReturning: true,
    },
    status: "livre",
    scheduledDeliveryAt: "2026-04-26T16:00:00Z",
    lastActivityAt: "2026-04-26T17:45:00Z",
    createdAt: "2026-04-25T16:00:00Z",
    callAttempts: 2,
    delivery: {
      id: "lv_ibrahima",
      name: "Ibrahima Sarr",
      phone: "+221 78 222 33 44",
      avatarBg: "linear-gradient(135deg,#10B981,#059669)",
      rating: 4.9,
      progress: "effectue",
      scheduledAt: "2026-04-26T16:00:00Z",
      pickedUpAt: "2026-04-26T14:30:00Z",
      deliveredAt: "2026-04-26T17:30:00Z",
      amountCollected: 28000,
    },
  },
];

/**
 * Export public : fixtures recalées sur AUJOURD'HUI. Chaque date legacy est
 * décalée du même nombre de jours entiers (heures préservées), si bien que
 * « créée le jour de l'ancre à 12:30 » devient « créée aujourd'hui à 12:30 ».
 */
const __seed_CLOSING: ClosingAssignment[] =
  RAW_CLOSING_ASSIGNMENTS.map((a) => ({
    ...a,
    createdAt: shiftToNow(a.createdAt),
    lastActivityAt: shiftToNow(a.lastActivityAt),
    callbackAt: a.callbackAt ? shiftToNow(a.callbackAt) : undefined,
    scheduledDeliveryAt: a.scheduledDeliveryAt
      ? shiftToNow(a.scheduledDeliveryAt)
      : undefined,
    delivery: a.delivery
      ? {
          ...a.delivery,
          scheduledAt: a.delivery.scheduledAt
            ? shiftToNow(a.delivery.scheduledAt)
            : undefined,
          pickedUpAt: a.delivery.pickedUpAt
            ? shiftToNow(a.delivery.pickedUpAt)
            : undefined,
          deliveredAt: a.delivery.deliveredAt
            ? shiftToNow(a.delivery.deliveredAt)
            : undefined,
          alertRaisedAt: a.delivery.alertRaisedAt
            ? shiftToNow(a.delivery.alertRaisedAt)
            : undefined,
        }
      : undefined,
  }));

export function computeClosingStats(assignments: ClosingAssignment[]) {
  const total = assignments.length;

  const confirmedStatuses: ClosingAssignment["status"][] = [
    "livraison_en_cours",
    "livre",
  ];
  const closingStatuses: ClosingAssignment["status"][] = [
    "livraison_en_cours",
    "livre",
    "annule",
    "injoignable",
  ];

  const confirmedCount = assignments.filter((a) =>
    confirmedStatuses.includes(a.status),
  ).length;
  const closedCount = assignments.filter((a) =>
    closingStatuses.includes(a.status),
  ).length;
  const conversionRate =
    closedCount > 0 ? Math.round((confirmedCount / closedCount) * 100) : 0;

  const closedItems = assignments.filter((a) =>
    [...confirmedStatuses, "annule"].includes(a.status),
  );
  const avgProcessingMinutes =
    closedItems.length > 0
      ? Math.round(
          closedItems.reduce((sum, a) => {
            const start = new Date(a.createdAt).getTime();
            const end = new Date(a.lastActivityAt).getTime();
            return sum + (end - start) / 60_000;
          }, 0) / closedItems.length,
        )
      : 0;

  const confirmedRevenue = assignments
    .filter((a) => confirmedStatuses.includes(a.status))
    .reduce((sum, a) => sum + orderTotalXof(a), 0);

  return {
    total,
    conversionRate,
    confirmedCount,
    closedCount,
    avgProcessingMinutes,
    confirmedRevenue,
  };
}

/** Formate des minutes en "Xh Ymin" ou "Ymin" */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

/* ─── Module Livraisons : helpers ─────────────────────────── */

/**
 * Renvoie toutes les commandes actuellement dans le module Livraisons.
 * Une commande y figure SI ET SEULEMENT SI :
 *   1. Elle a un livreur assigné (delivery défini)
 *   2. Son statut closing est `livraison_en_cours` ou `livre`
 *
 * → Si la closeuse repasse une commande en `rappele`, `annule`, etc.
 *   après une alerte du livreur, la commande quitte automatiquement
 *   la liste des livraisons.
 */
export function getDeliveryItems(): ClosingAssignment[] {
  return MOCK_CLOSING_ASSIGNMENTS.filter(
    (a) =>
      a.delivery !== undefined &&
      (a.status === "livraison_en_cours" || a.status === "livre"),
  );
}

/** Stats pour le header de /livraisons */
export function computeDeliveryStats(items: ClosingAssignment[]) {
  const total = items.length;
  const counts: Record<DeliveryProgress, number> = {
    en_attente: 0,
    effectue: 0,
    alerte: 0,
  };
  let revenueCollected = 0;
  let revenueExpected = 0;

  for (const a of items) {
    if (!a.delivery) continue;
    counts[a.delivery.progress]++;
    if (a.delivery.progress === "effectue" && a.delivery.amountCollected) {
      revenueCollected += a.delivery.amountCollected;
    }
    // CA en attente = livraisons pas encore conclues (en_attente + alerte)
    if (a.delivery.progress !== "effectue") {
      revenueExpected += orderTotalXof(a);
    }
  }

  return {
    total,
    counts,
    revenueCollected,
    revenueExpected,
  };
}

/** Compte les commandes avec une alerte livreur active (pour onglet Closing) */
export function countLivreurAlerts(items: ClosingAssignment[]): number {
  return items.filter((a) => a.delivery?.progress === "alerte").length;
}

/** Récupère une livraison par ID — pour la page détail /livraisons/[id] */
export function getDeliveryItem(id: string): ClosingAssignment | undefined {
  return getDeliveryItems().find((a) => a.id === id);
}

/**
 * Liste les produits uniques apparus dans les commandes — sert au filtre
 * "Produit" sur les pages /closing et /livraisons.
 * Trié par nom alphabétique.
 */
export function getProductsFromAssignments(
  items: ClosingAssignment[],
): { name: string; emoji: string }[] {
  const map = new Map<string, string>(); // name → emoji
  for (const a of items) {
    for (const line of a.items) {
      if (!map.has(line.productName)) {
        map.set(line.productName, line.productEmoji);
      }
    }
  }
  return Array.from(map, ([name, emoji]) => ({ name, emoji })).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

/* ─── Système de priorité (queue de travail) ─────────────────── */

export type Priority =
  | "urgent"
  | "due_now"
  | "new"
  | "soon"
  | "delivering"
  | "closed";

export type QueueView = "todo" | "scheduled" | "delivering" | "closed" | "all";

const URGENT_NEW_HOURS = 4;
const DUE_NOW_MINUTES = 30;

export function getPriority(
  a: ClosingAssignment,
  now: Date = new Date(),
): Priority {
  const nowMs = now.getTime();

  if (a.status === "annule") return "closed";
  if (a.status === "livre") return "closed";
  if (a.status === "livraison_en_cours") return "delivering";

  if (a.callbackAt && (a.status === "rappele" || a.status === "injoignable")) {
    const minToCallback =
      (new Date(a.callbackAt).getTime() - nowMs) / 60_000;
    if (minToCallback < 0) return "urgent";
    if (minToCallback <= DUE_NOW_MINUTES) return "due_now";
    return "soon";
  }

  if (a.status === "injoignable") return "soon";

  if (a.status === "nouvelle") {
    const ageHours =
      (nowMs - new Date(a.createdAt).getTime()) / 3_600_000;
    if (ageHours > URGENT_NEW_HOURS) return "urgent";
    return "new";
  }

  return "soon";
}

const VIEW_PRIORITIES: Record<QueueView, Priority[]> = {
  todo: ["urgent", "new", "due_now"],
  scheduled: ["soon"],
  delivering: ["delivering"],
  closed: ["closed"],
  all: ["urgent", "new", "due_now", "soon", "delivering", "closed"],
};

const PRIORITY_RANK: Record<Priority, number> = {
  urgent: 0,
  new: 1,
  due_now: 2,
  soon: 3,
  delivering: 4,
  closed: 5,
};

export function filterByView(
  assignments: ClosingAssignment[],
  view: QueueView,
  now: Date = new Date(),
): ClosingAssignment[] {
  const allowed = new Set(VIEW_PRIORITIES[view]);
  return assignments.filter((a) => allowed.has(getPriority(a, now)));
}

export function countByView(
  assignments: ClosingAssignment[],
  now: Date = new Date(),
): Record<QueueView, number> {
  const result: Record<QueueView, number> = {
    todo: 0,
    scheduled: 0,
    delivering: 0,
    closed: 0,
    all: assignments.length,
  };
  for (const a of assignments) {
    const p = getPriority(a, now);
    if (VIEW_PRIORITIES.todo.includes(p)) result.todo++;
    if (VIEW_PRIORITIES.scheduled.includes(p)) result.scheduled++;
    if (VIEW_PRIORITIES.delivering.includes(p)) result.delivering++;
    if (VIEW_PRIORITIES.closed.includes(p)) result.closed++;
  }
  return result;
}

export function countUrgent(
  assignments: ClosingAssignment[],
  now: Date = new Date(),
): number {
  return assignments.filter((a) => getPriority(a, now) === "urgent").length;
}

export function sortByQueue(
  assignments: ClosingAssignment[],
  now: Date = new Date(),
): ClosingAssignment[] {
  return [...assignments].sort((a, b) => {
    const pa = getPriority(a, now);
    const pb = getPriority(b, now);
    if (pa !== pb) return PRIORITY_RANK[pa] - PRIORITY_RANK[pb];

    if (pa === "urgent") {
      const ra = a.callbackAt ?? a.createdAt;
      const rb = b.callbackAt ?? b.createdAt;
      return new Date(ra).getTime() - new Date(rb).getTime();
    }
    if (pa === "new") {
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    if (pa === "due_now" || pa === "soon") {
      const ra = a.callbackAt ?? a.createdAt;
      const rb = b.callbackAt ?? b.createdAt;
      return new Date(ra).getTime() - new Date(rb).getTime();
    }
    return (
      new Date(b.lastActivityAt).getTime() -
      new Date(a.lastActivityAt).getTime()
    );
  });
}

export type PriorityGroup = {
  priority: Priority;
  label: string;
  emoji: string;
  items: ClosingAssignment[];
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  urgent: "Urgent — à rattraper",
  new: "Nouvelles commandes",
  due_now: "Imminent — rappel dans <30min",
  soon: "Programmées plus tard",
  delivering: "En cours de livraison",
  closed: "Clôturées",
};

export const PRIORITY_EMOJI: Record<Priority, string> = {
  urgent: "🔴",
  new: "🆕",
  due_now: "⏰",
  soon: "📅",
  delivering: "🚚",
  closed: "❌",
};

export function groupByPriority(
  assignments: ClosingAssignment[],
  now: Date = new Date(),
): PriorityGroup[] {
  const sorted = sortByQueue(assignments, now);
  const buckets = new Map<Priority, ClosingAssignment[]>();
  for (const a of sorted) {
    const p = getPriority(a, now);
    if (!buckets.has(p)) buckets.set(p, []);
    buckets.get(p)!.push(a);
  }
  return Array.from(buckets, ([priority, items]) => ({
    priority,
    label: PRIORITY_LABELS[priority],
    emoji: PRIORITY_EMOJI[priority],
    items,
  }));
}

/** Formate une date+heure en fr "1er mai · 14h32" */
function formatDateTimeShort(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
  const time = d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}

/**
 * Construit l'historique d'une commande à partir de ses champs.
 * Génère une timeline réaliste : création → tentatives d'appel → confirmation
 * → (si livraison) prise en charge livreur → livraison.
 */
export function buildClosingHistory(
  a: ClosingAssignment,
  closeuseName: string,
): ClosingHistoryEvent[] {
  const events: ClosingHistoryEvent[] = [];
  const start = new Date(a.createdAt).getTime();
  const end = new Date(a.lastActivityAt).getTime();
  const span = Math.max(end - start, 1);

  // 1. Création
  events.push({
    type: "created",
    at: a.createdAt,
    authorName: "Système",
    authorRole: "system",
    label: "Commande reçue",
    detail: `Assignée à ${closeuseName}`,
  });

  // 2. Tentatives d'appel
  for (let i = 0; i < a.callAttempts; i++) {
    const ratio =
      a.callAttempts === 1 ? 0.5 : (i + 1) / (a.callAttempts + 1);
    const at = new Date(start + span * ratio * 0.85).toISOString();
    events.push({
      type: "call_attempt",
      at,
      authorName: closeuseName,
      authorRole: "closeuse",
      label: i === 0 ? "1er appel" : `Tentative ${i + 1}`,
    });
  }

  // 3. Statut spécifique
  if (a.status === "rappele" && a.callbackAt) {
    events.push({
      type: "callback_scheduled",
      at: a.lastActivityAt,
      authorName: closeuseName,
      authorRole: "closeuse",
      label: "Rappel planifié",
      detail: `Le client demande à être recontacté · ${formatDateTimeShort(a.callbackAt)}`,
    });
  } else if (
    (a.status === "livraison_en_cours" || a.status === "livre") &&
    a.scheduledDeliveryAt
  ) {
    events.push({
      type: "confirmed",
      at: a.lastActivityAt,
      authorName: closeuseName,
      authorRole: "closeuse",
      label: "Commande confirmée",
      detail: `Livraison prévue ${formatDateTimeShort(a.scheduledDeliveryAt)}`,
    });
    events.push({
      type: "delivery_scheduled",
      at: new Date(end + 60_000).toISOString(),
      authorName: "Système",
      authorRole: "system",
      label: "Transmis à la livraison",
    });

    // Événements livreur
    if (a.delivery) {
      if (a.delivery.pickedUpAt) {
        events.push({
          type: "delivery_scheduled",
          at: a.delivery.pickedUpAt,
          authorName: a.delivery.name,
          authorRole: "livreur",
          label: "Colis pris en charge",
          detail: "Le livreur a récupéré le colis et est en route",
        });
      }
      if (a.status === "livre") {
        // Événement final livré (~1-2h après pickup ou scheduled)
        const deliveredAt = new Date(
          new Date(a.scheduledDeliveryAt).getTime() + 90 * 60_000,
        ).toISOString();
        events.push({
          type: "confirmed",
          at: deliveredAt,
          authorName: a.delivery.name,
          authorRole: "livreur",
          label: "Colis livré · paiement reçu",
          detail: `${orderTotalXof(a).toLocaleString("fr-FR")} F CFA encaissés en cash`,
        });
      }
    }
  } else if (a.status === "annule") {
    events.push({
      type: "cancelled",
      at: a.lastActivityAt,
      authorName: closeuseName,
      authorRole: "closeuse",
      label: "Commande annulée",
      detail: a.cancellationReason
        ? `Motif · ${CANCELLATION_REASON_LABELS[a.cancellationReason]}`
        : undefined,
    });
  } else if (a.status === "injoignable") {
    events.push({
      type: "marked_unreachable",
      at: a.lastActivityAt,
      authorName: closeuseName,
      authorRole: "closeuse",
      label: "Marquée injoignable",
      detail: a.callbackAt
        ? `Nouvelle tentative prévue ${formatDateTimeShort(a.callbackAt)}`
        : "Pas de réponse après plusieurs essais",
    });
  }

  // 4. Commentaire (closeuse)
  if (a.comment) {
    events.push({
      type: "comment",
      at: new Date(end - 30_000).toISOString(),
      authorName: closeuseName,
      authorRole: "closeuse",
      label: "Commentaire",
      detail: `« ${a.comment} »`,
    });
  }

  return events.sort(
    (x, y) => new Date(x.at).getTime() - new Date(y.at).getTime(),
  );
}

export const MOCK_CLOSING_ASSIGNMENTS: ClosingAssignment[] = [];
void __seed_CLOSING;
