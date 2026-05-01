import type { ActiveCloseuse, ClosingAssignment } from "@/lib/types/closing";

export const MOCK_ACTIVE_CLOSEUSE: ActiveCloseuse = {
  id: "cl_aicha",
  name: "Aïcha Diop",
  phone: "+221 77 123 45 67",
  avatarBg: "linear-gradient(135deg,#F97316,#FB923C)",
  rating: 4.8,
  reviewsCount: 47,
  startedAt: "2024-09-15",
};

export const MOCK_CLOSING_ASSIGNMENTS: ClosingAssignment[] = [
  {
    id: "co_01",
    publicCode: "ORD-SN-00128",
    productName: "Crème éclaircissante naturelle",
    productEmoji: "🧴",
    productBg: "linear-gradient(135deg,#FCE7F3,#F472B6)",
    quantity: 1,
    client: {
      name: "Marième Sow",
      phone: "+221 77 444 22 11",
      whatsapp: "+221 77 444 22 11",
      city: "Dakar · Mermoz",
      isReturning: false,
    },
    amountXof: 18000,
    status: "nouvelle",
    lastActivityAt: "2026-05-01T08:30:00Z",
    createdAt: "2026-05-01T08:00:00Z",
    callAttempts: 0,
  },
  {
    id: "co_02",
    publicCode: "ORD-SN-00127",
    productName: "Power Bank 10 000mAh",
    productEmoji: "🔋",
    productBg: "linear-gradient(135deg,#DCFCE7,#22C55E)",
    quantity: 2,
    client: {
      name: "Ousmane Ba",
      phone: "+221 78 555 33 44",
      whatsapp: "+221 78 555 33 44",
      city: "Pikine",
      isReturning: true,
    },
    amountXof: 22000,
    status: "nouvelle",
    comment: "Client fidèle, généralement rapide à confirmer",
    lastActivityAt: "2026-05-01T07:45:00Z",
    createdAt: "2026-05-01T07:30:00Z",
    callAttempts: 1,
  },
  {
    id: "co_03",
    publicCode: "ORD-SN-00125",
    productName: "Lunettes solaires aviateur",
    productEmoji: "🕶️",
    productBg: "linear-gradient(135deg,#FEF3C7,#F59E0B)",
    quantity: 1,
    client: {
      name: "Fatou Ndiaye",
      phone: "+221 76 999 88 77",
      city: "Rufisque",
      isReturning: false,
    },
    amountXof: 12500,
    status: "rappele",
    callbackAt: "2026-05-01T16:00:00Z",
    comment: "Demande de rappeler à 16h après le boulot",
    lastActivityAt: "2026-05-01T10:15:00Z",
    createdAt: "2026-04-30T18:00:00Z",
    callAttempts: 2,
  },
  {
    id: "co_04",
    publicCode: "ORD-SN-00122",
    productName: "Sac à main cuir",
    productEmoji: "👜",
    productBg: "linear-gradient(135deg,#DBEAFE,#3B82F6)",
    quantity: 1,
    client: {
      name: "Aminata Diallo",
      phone: "+221 70 111 22 33",
      whatsapp: "+221 70 111 22 33",
      city: "Dakar · Plateau",
      isReturning: true,
    },
    amountXof: 25000,
    status: "livraison_en_cours",
    scheduledDeliveryAt: "2026-05-02T14:30:00Z",
    comment: "Préfère livraison après-midi",
    lastActivityAt: "2026-05-01T11:30:00Z",
    createdAt: "2026-04-30T16:20:00Z",
    callAttempts: 1,
  },
  {
    id: "co_05",
    publicCode: "ORD-SN-00120",
    productName: "Casquette brodée",
    productEmoji: "🧢",
    productBg: "linear-gradient(135deg,#FED7AA,#F97316)",
    quantity: 3,
    client: {
      name: "Mamadou Sy",
      phone: "+221 77 888 66 55",
      whatsapp: "+221 77 888 66 55",
      city: "Guediawaye",
      isReturning: false,
    },
    amountXof: 21000,
    status: "livraison_en_cours",
    scheduledDeliveryAt: "2026-05-01T17:00:00Z",
    lastActivityAt: "2026-05-01T09:50:00Z",
    createdAt: "2026-04-30T14:00:00Z",
    callAttempts: 1,
  },
  {
    id: "co_06",
    publicCode: "ORD-SN-00118",
    productName: "Coque téléphone silicone",
    productEmoji: "📱",
    productBg: "linear-gradient(135deg,#E9D5FF,#A78BFA)",
    quantity: 1,
    client: {
      name: "Khadija Mbaye",
      phone: "+221 76 333 44 55",
      city: "Thiès",
      isReturning: false,
    },
    amountXof: 8500,
    status: "annule",
    cancellationReason: "no_money",
    comment: "Pas d'argent ce mois",
    lastActivityAt: "2026-05-01T11:00:00Z",
    createdAt: "2026-04-30T12:00:00Z",
    callAttempts: 2,
  },
  {
    id: "co_07",
    publicCode: "ORD-SN-00115",
    productName: "Crème éclaircissante naturelle",
    productEmoji: "🧴",
    productBg: "linear-gradient(135deg,#FCE7F3,#F472B6)",
    quantity: 1,
    client: {
      name: "Aïssatou Faye",
      phone: "+221 78 222 11 99",
      city: "Dakar · Almadies",
      isReturning: true,
    },
    amountXof: 18000,
    status: "injoignable",
    callbackAt: "2026-05-01T15:30:00Z",
    comment: "5 tentatives, ne décroche pas — réessayer à 15h30",
    lastActivityAt: "2026-05-01T13:20:00Z",
    createdAt: "2026-04-29T10:00:00Z",
    callAttempts: 5,
  },
  {
    id: "co_08",
    publicCode: "ORD-SN-00112",
    productName: "Lunettes solaires aviateur",
    productEmoji: "🕶️",
    productBg: "linear-gradient(135deg,#FEF3C7,#F59E0B)",
    quantity: 2,
    client: {
      name: "Khady Niang",
      phone: "+221 77 666 11 22",
      whatsapp: "+221 77 666 11 22",
      city: "Dakar · Plateau",
      isReturning: false,
    },
    amountXof: 22000,
    status: "livraison_en_cours",
    scheduledDeliveryAt: "2026-04-28T15:00:00Z",
    lastActivityAt: "2026-04-28T11:00:00Z",
    createdAt: "2026-04-28T09:00:00Z",
    callAttempts: 1,
  },
  {
    id: "co_09",
    publicCode: "ORD-SN-00108",
    productName: "Sac à main cuir",
    productEmoji: "👜",
    productBg: "linear-gradient(135deg,#DBEAFE,#3B82F6)",
    quantity: 1,
    client: {
      name: "Coumba Sarr",
      phone: "+221 78 333 44 55",
      city: "Mbour",
      isReturning: false,
    },
    amountXof: 25000,
    status: "annule",
    cancellationReason: "wrong_number",
    comment: "Numéro incorrect dès le départ",
    lastActivityAt: "2026-04-27T14:00:00Z",
    createdAt: "2026-04-27T10:00:00Z",
    callAttempts: 3,
  },
  {
    id: "co_10",
    publicCode: "ORD-SN-00103",
    productName: "Casquette brodée",
    productEmoji: "🧢",
    productBg: "linear-gradient(135deg,#FED7AA,#F97316)",
    quantity: 4,
    client: {
      name: "Babacar Faye",
      phone: "+221 70 555 88 99",
      whatsapp: "+221 70 555 88 99",
      city: "Saint-Louis",
      isReturning: true,
    },
    amountXof: 28000,
    status: "livraison_en_cours",
    scheduledDeliveryAt: "2026-04-26T16:00:00Z",
    lastActivityAt: "2026-04-26T08:00:00Z",
    createdAt: "2026-04-25T16:00:00Z",
    callAttempts: 2,
  },
];

export function computeClosingStats(assignments: ClosingAssignment[]) {
  const total = assignments.length;

  // Taux de confirmation : confirmées / (confirmées + annulées + injoignables)
  const confirmed = assignments.filter(
    (a) => a.status === "livraison_en_cours",
  ).length;
  const closed = assignments.filter((a) =>
    ["livraison_en_cours", "annule", "injoignable"].includes(a.status),
  ).length;
  const conversionRate = closed > 0 ? Math.round((confirmed / closed) * 100) : 0;

  // Temps moyen de traitement (en minutes) : durée entre création et dernière activité
  // pour les commandes "fermées"
  const closedItems = assignments.filter((a) =>
    ["livraison_en_cours", "annule"].includes(a.status),
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

  // CA confirmé (en livraison)
  const confirmedRevenue = assignments
    .filter((a) => a.status === "livraison_en_cours")
    .reduce((sum, a) => sum + a.amountXof, 0);

  return {
    total,
    conversionRate,
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
