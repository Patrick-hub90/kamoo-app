import type { Expedition } from "@/lib/types/expedition";

/**
 * Données mockées pour les expéditions — usage UI uniquement.
 * Sera remplacé par des requêtes Supabase une fois la DB en place.
 */

const TRANSITAIRES = {
  liang: {
    name: "Liang Wei Trading",
    avatar: "LW",
    avatarBg: "linear-gradient(135deg,#1E40AF,#0EA5E9)",
    rating: 4.9,
    paymentPolicy: "upfront" as const,
    refusedCategories: [
      "Cosmétiques liquides",
      "Batteries lithium",
      "Parfumerie",
    ],
  },
  shanghai: {
    name: "Shanghai Express Cargo",
    avatar: "SE",
    avatarBg: "linear-gradient(135deg,#7C3AED,#A78BFA)",
    rating: 4.6,
    paymentPolicy: "on_arrival" as const,
    refusedCategories: ["Batteries lithium", "Alimentaire frais"],
  },
  pearl: {
    name: "Pearl River Logistics",
    avatar: "PR",
    avatarBg: "linear-gradient(135deg,#F97316,#FB923C)",
    rating: 4.8,
    paymentPolicy: "upfront" as const,
    refusedCategories: ["Parfumerie"],
  },
};

export const MOCK_EXPEDITIONS: Expedition[] = [
  {
    id: "exp_01",
    publicCode: "KMO-SN-78421",
    vendorId: "v_aicha",
    destinationCountry: "SN",
    status: "received_china",
    paymentStatus: "unpaid",
    productName: "Crème hydratante L'Oréal",
    otherProductsCount: 1,
    thumb: { emoji: "🧴", bg: "linear-gradient(135deg,#FCE7F3,#F472B6)" },
    transitaire: TRANSITAIRES.liang,
    transportMode: "sea",
    eta: "18 nov. 2025",
    createdAt: "2025-10-12T14:32:00Z",
    amountXof: 245000,
    action: {
      label: "Payez 245 000 F CFA pour libérer",
      href: "/expeditions/exp_01",
      urgent: true,
    },
  },
  {
    id: "exp_02",
    publicCode: "KMO-SN-78395",
    vendorId: "v_aicha",
    destinationCountry: "SN",
    status: "received_china",
    paymentStatus: "unpaid",
    productName: "Power banks 10 000mAh",
    otherProductsCount: 0,
    thumb: { emoji: "🔋", bg: "linear-gradient(135deg,#DCFCE7,#22C55E)" },
    transitaire: TRANSITAIRES.shanghai,
    transportMode: "air_standard",
    eta: "22 oct. 2025",
    createdAt: "2025-10-08T09:18:00Z",
    amountXof: 178000,
    action: {
      label: "Devis émis · paiement à l'arrivée",
      href: "/expeditions/exp_02",
      urgent: false,
    },
  },
  {
    id: "exp_03",
    publicCode: "KMO-SN-78366",
    vendorId: "v_aicha",
    destinationCountry: "SN",
    status: "awaiting_quote",
    paymentStatus: "unpaid",
    productName: "Lunettes solaires aviateur",
    otherProductsCount: 2,
    thumb: { emoji: "🕶️", bg: "linear-gradient(135deg,#FEF3C7,#F59E0B)" },
    transitaire: TRANSITAIRES.pearl,
    transportMode: "sea",
    eta: "03 déc. 2025",
    createdAt: "2025-10-15T16:47:00Z",
    amountXof: null,
    action: null,
  },
  {
    id: "exp_04",
    publicCode: "KMO-SN-78290",
    vendorId: "v_aicha",
    destinationCountry: "SN",
    status: "arrived_destination",
    paymentStatus: "paid",
    productName: "Sacs à main cuir véritable",
    otherProductsCount: 0,
    thumb: { emoji: "👜", bg: "linear-gradient(135deg,#DBEAFE,#3B82F6)" },
    transitaire: TRANSITAIRES.liang,
    transportMode: "air_express",
    eta: "Arrivé · 28 oct.",
    createdAt: "2025-10-02T10:12:00Z",
    amountXof: 178000,
    action: {
      label: "Récupérez votre colis · Mermoz, Dakar",
      href: "/expeditions/exp_04",
      urgent: false,
    },
  },
  {
    id: "exp_05",
    publicCode: "KMO-SN-78201",
    vendorId: "v_aicha",
    destinationCountry: "SN",
    status: "received_china",
    paymentStatus: "paid",
    productName: "Casquettes brodées",
    otherProductsCount: 0,
    thumb: { emoji: "🧢", bg: "linear-gradient(135deg,#FED7AA,#F97316)" },
    transitaire: TRANSITAIRES.pearl,
    transportMode: "sea",
    eta: "11 nov. 2025",
    createdAt: "2025-09-28T08:00:00Z",
    amountXof: 156000,
    action: null,
  },
  {
    id: "exp_06",
    publicCode: "KMO-SN-78104",
    vendorId: "v_aicha",
    destinationCountry: "SN",
    status: "arrived_destination",
    paymentStatus: "paid",
    productName: "Coques téléphone silicone",
    otherProductsCount: 4,
    thumb: { emoji: "📱", bg: "linear-gradient(135deg,#E9D5FF,#A78BFA)" },
    transitaire: TRANSITAIRES.shanghai,
    transportMode: "air_standard",
    eta: "Arrivé · 14 oct.",
    createdAt: "2025-09-20T12:00:00Z",
    amountXof: 92000,
    action: null,
  },
];

export function computeListStats(expeditions: Expedition[]) {
  const enCours = expeditions.filter(
    (e) => e.status !== "arrived_destination",
  ).length;
  const enAttenteAction = expeditions.filter((e) => e.action?.urgent).length;
  const arriveesCeMois = expeditions.filter(
    (e) => e.status === "arrived_destination",
  ).length;
  const totalAPayer = expeditions
    .filter((e) => e.paymentStatus === "unpaid" && e.amountXof)
    .reduce((sum, e) => sum + (e.amountXof ?? 0), 0);

  return { enCours, enAttenteAction, arriveesCeMois, totalAPayer };
}
