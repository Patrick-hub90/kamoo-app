import { MOCK_CLOSING_ASSIGNMENTS } from "./mock-closing";
import { getClientSegment, type Client } from "@/lib/types/client";

/**
 * Mock CRM — 13 clients avec mix volontaire :
 *  - 10 Fidèles  (livrés ≥2 fois — habitude prouvée)
 *  -  1 Nouveau  (livré 1 fois — à fidéliser)
 *  -  2 Prospects (0 livraison — à convertir, pas encore vrai client)
 *
 * Les IDs matchent les ClosingClient.id de mock-closing.ts pour permettre
 * le cross-link "fiche client → ses commandes" (filtrage en V1, jointure en V2).
 *
 * Date de référence : aujourd'hui = 2026-05-04.
 */
export const MOCK_CLIENTS: Client[] = [
  /* ─── Top clients (anciens, gros volume) ───────────────── */
  {
    id: "cu_aminata_diallo",
    name: "Aminata Diallo",
    phone: "+221 77 555 88 22",
    whatsapp: "+221 77 555 88 22",
    city: "Dakar",
    zone: "Almadies",
    country: "SN",
    status: "actif",
    acquisitionChannel: "instagram",
    firstOrderDate: "2025-09-12",
    lastOrderDate: "2026-04-29",
    totalOrders: 12,
    totalDeliveredOrders: 11,
    totalCancelledOrders: 1,
    totalSpentXof: 287000,
    avgBasketXof: 26090,
    preferredProductIds: ["p_creme", "p_parfum", "p_sac"],
    notes:
      "Cliente top — toujours 2-3 articles par commande. Sensible aux nouveautés cosmétique. Préfère payer cash.",
    tags: ["VIP-cosmetique", "fidelisation-prioritaire"],
    avatarBg: "linear-gradient(135deg,#F59E0B,#EA580C)",
  },
  {
    id: "cu_fatou_thiam",
    name: "Fatou Thiam",
    phone: "+221 76 412 33 18",
    city: "Dakar",
    zone: "Mermoz",
    country: "SN",
    status: "actif",
    acquisitionChannel: "whatsapp",
    firstOrderDate: "2025-04-22",
    lastOrderDate: "2026-04-25",
    totalOrders: 9,
    totalDeliveredOrders: 9,
    totalCancelledOrders: 0,
    totalSpentXof: 198500,
    avgBasketXof: 22055,
    preferredProductIds: ["p_sac", "p_lunettes", "p_creme"],
    notes: "Aucune commande annulée depuis 1 an. Très fiable.",
    tags: ["100%-livre"],
    avatarBg: "linear-gradient(135deg,#FB923C,#F97316)",
  },
  {
    id: "cu_cheikh_diagne",
    name: "Cheikh Diagne",
    phone: "+221 78 222 99 88",
    city: "Dakar",
    zone: "Yoff",
    country: "SN",
    status: "actif",
    acquisitionChannel: "facebook",
    firstOrderDate: "2025-11-08",
    lastOrderDate: "2026-05-02",
    totalOrders: 5,
    totalDeliveredOrders: 5,
    totalCancelledOrders: 0,
    totalSpentXof: 78000,
    avgBasketXof: 15600,
    preferredProductIds: ["p_powerbank", "p_coque"],
    avatarBg: "linear-gradient(135deg,#3B82F6,#2563EB)",
  },
  {
    id: "cu_awa_diop",
    name: "Awa Diop",
    phone: "+221 77 999 12 34",
    whatsapp: "+221 77 999 12 34",
    city: "Dakar",
    zone: "Sacré-Coeur",
    country: "SN",
    status: "actif",
    acquisitionChannel: "instagram",
    firstOrderDate: "2025-12-15",
    lastOrderDate: "2026-05-02",
    totalOrders: 4,
    totalDeliveredOrders: 3,
    totalCancelledOrders: 1,
    totalSpentXof: 64000,
    avgBasketXof: 21333,
    preferredProductIds: ["p_creme", "p_parfum"],
    notes: "Adresse facile d'accès. Très ponctuelle.",
    avatarBg: "linear-gradient(135deg,#EC4899,#DB2777)",
  },
  {
    id: "cu_modou_faye",
    name: "Modou Faye",
    phone: "+221 77 333 44 55",
    city: "Thiès",
    zone: "Centre-ville",
    country: "SN",
    status: "actif",
    acquisitionChannel: "tiktok",
    firstOrderDate: "2026-01-20",
    lastOrderDate: "2026-04-18",
    totalOrders: 3,
    totalDeliveredOrders: 3,
    totalCancelledOrders: 0,
    totalSpentXof: 41000,
    avgBasketXof: 13666,
    preferredProductIds: ["p_casquette", "p_lunettes"],
    avatarBg: "linear-gradient(135deg,#10B981,#059669)",
  },
  {
    id: "cu_khadija_mbaye",
    name: "Khadija Mbaye",
    phone: "+221 78 711 22 33",
    whatsapp: "+221 78 711 22 33",
    city: "Mbour",
    zone: "Saly",
    country: "SN",
    status: "actif",
    acquisitionChannel: "whatsapp",
    firstOrderDate: "2025-10-30",
    lastOrderDate: "2026-04-12",
    totalOrders: 4,
    totalDeliveredOrders: 4,
    totalCancelledOrders: 0,
    totalSpentXof: 92000,
    avgBasketXof: 23000,
    preferredProductIds: ["p_sac", "p_parfum"],
    notes: "Préfère livraison en fin d'après-midi (rentre du travail).",
    tags: ["livraison-soir"],
    avatarBg: "linear-gradient(135deg,#A78BFA,#8B5CF6)",
  },
  {
    id: "cu_marieme_sow",
    name: "Mariéme Sow",
    phone: "+221 77 808 14 27",
    city: "Dakar",
    zone: "Plateau",
    country: "SN",
    status: "actif",
    acquisitionChannel: "instagram",
    firstOrderDate: "2026-02-14",
    lastOrderDate: "2026-04-05",
    totalOrders: 2,
    totalDeliveredOrders: 2,
    totalCancelledOrders: 0,
    totalSpentXof: 36000,
    avgBasketXof: 18000,
    preferredProductIds: ["p_creme"],
    avatarBg: "linear-gradient(135deg,#06B6D4,#0891B2)",
  },
  {
    id: "cu_ousmane_ba",
    name: "Ousmane Ba",
    phone: "+221 78 666 11 09",
    city: "Saint-Louis",
    zone: "Sor",
    country: "SN",
    status: "actif",
    acquisitionChannel: "appel",
    firstOrderDate: "2026-01-08",
    lastOrderDate: "2026-03-22",
    totalOrders: 2,
    totalDeliveredOrders: 1,
    totalCancelledOrders: 1,
    totalSpentXof: 12000,
    avgBasketXof: 12000,
    preferredProductIds: ["p_powerbank"],
    notes: "1 commande annulée — pas d'argent au moment de la livraison.",
    avatarBg: "linear-gradient(135deg,#64748B,#475569)",
  },
  {
    id: "cu_bineta_cisse",
    name: "Bineta Cissé",
    phone: "+225 07 88 12 33 44",
    city: "Abidjan",
    zone: "Cocody",
    country: "CI",
    status: "actif",
    acquisitionChannel: "instagram",
    firstOrderDate: "2026-02-28",
    lastOrderDate: "2026-04-15",
    totalOrders: 2,
    totalDeliveredOrders: 2,
    totalCancelledOrders: 0,
    totalSpentXof: 47000,
    avgBasketXof: 23500,
    preferredProductIds: ["p_sac", "p_parfum"],
    tags: ["multi-pays"],
    avatarBg: "linear-gradient(135deg,#14B8A6,#0D9488)",
  },
  {
    id: "cu_mamadou_sy",
    name: "Mamadou Sy",
    phone: "+221 77 211 09 88",
    city: "Touba",
    zone: "Centre",
    country: "SN",
    status: "actif",
    acquisitionChannel: "bouche_a_oreille",
    firstOrderDate: "2025-08-10",
    lastOrderDate: "2025-11-04",
    totalOrders: 3,
    totalDeliveredOrders: 3,
    totalCancelledOrders: 0,
    totalSpentXof: 54000,
    avgBasketXof: 18000,
    preferredProductIds: ["p_lunettes", "p_casquette"],
    notes:
      "N'a plus commandé depuis 6 mois — relancer avec une promo cosmétique ?",
    tags: ["a-relancer"],
    avatarBg: "linear-gradient(135deg,#94A3B8,#64748B)",
  },
  {
    id: "cu_aissatou_faye",
    name: "Aissatou Faye",
    phone: "+237 6 78 90 12 34",
    city: "Douala",
    zone: "Bonanjo",
    country: "CM",
    status: "actif",
    acquisitionChannel: "instagram",
    firstOrderDate: "2025-04-12",
    lastOrderDate: "2025-05-08",
    totalOrders: 2,
    totalDeliveredOrders: 2,
    totalCancelledOrders: 0,
    totalSpentXof: 38000,
    avgBasketXof: 19000,
    preferredProductIds: ["p_parfum"],
    notes: "Cliente Cameroun — stoppé après l'arrêt temporaire du marché CM.",
    tags: ["multi-pays", "a-relancer"],
    avatarBg: "linear-gradient(135deg,#A1A1AA,#71717A)",
  },

  /* ─── Nouveaux : 1re commande pas encore livrée ─────────── */
  {
    id: "cu_fatou_ndiaye",
    name: "Fatou Ndiaye",
    phone: "+221 77 414 88 22",
    whatsapp: "+221 77 414 88 22",
    city: "Dakar",
    zone: "Liberté 6",
    country: "SN",
    status: "actif",
    acquisitionChannel: "tiktok",
    firstOrderDate: "2026-04-26",
    lastOrderDate: "2026-04-26",
    totalOrders: 1,
    totalDeliveredOrders: 0,
    totalCancelledOrders: 0,
    totalSpentXof: 0,
    avgBasketXof: 0,
    preferredProductIds: [],
    notes: "Découverte via une vidéo TikTok influence. Première commande à confirmer.",
    tags: ["acquisition-tiktok"],
    avatarBg: "linear-gradient(135deg,#F472B6,#DB2777)",
  },
  {
    id: "cu_assane_kane",
    name: "Assane Kane",
    phone: "+221 76 119 33 04",
    city: "Dakar",
    zone: "Parcelles Assainies",
    country: "SN",
    status: "actif",
    acquisitionChannel: "facebook",
    firstOrderDate: "2026-04-30",
    lastOrderDate: "2026-04-30",
    totalOrders: 1,
    totalDeliveredOrders: 0,
    totalCancelledOrders: 0,
    totalSpentXof: 0,
    avgBasketXof: 0,
    preferredProductIds: [],
    avatarBg: "linear-gradient(135deg,#22C55E,#16A34A)",
  },

];

/* ─── Lookups & stats ─── */

export function getClient(id: string): Client | undefined {
  return MOCK_CLIENTS.find((c) => c.id === id);
}

/**
 * Stats globales pour le header de la page Clients.
 *
 *  - total          : nombre total de clients
 *  - fideles        : clients livrés ≥2 fois
 *  - fidelesPct     : % de clients qui reviennent (objectif vendeur : monter)
 *  - ltv            : valeur moyenne d'un client payeur
 *                     = somme dépenses / nb clients ayant été livrés au moins 1 fois
 *  - cmdMoyenne     : nb commandes moyen par client payeur
 *                     = somme livraisons / nb clients ayant été livrés au moins 1 fois
 *
 * Les KPIs économiques (LTV, cmd moyenne) sont calculés sur les clients
 * "payeurs" (livrés ≥1 fois) — sinon les nouveaux qui n'ont rien encore
 * acheté tirent l'indicateur vers le bas et faussent la lecture.
 */
export function computeClientsStats(clients: Client[]) {
  const total = clients.length;

  const fideles = clients.filter(
    (c) => getClientSegment(c) === "fidele",
  ).length;
  const fidelesPct =
    total > 0 ? Math.round((fideles / total) * 100) : 0;

  const payeurs = clients.filter((c) => c.totalDeliveredOrders > 0);
  const totalDelivered = payeurs.reduce(
    (sum, c) => sum + c.totalDeliveredOrders,
    0,
  );
  const totalSpent = payeurs.reduce((sum, c) => sum + c.totalSpentXof, 0);

  // LTV = total dépensé / nb clients payeurs (= ce que rapporte un client en moyenne)
  const ltv = payeurs.length > 0 ? Math.round(totalSpent / payeurs.length) : 0;

  // Cmd moyenne = total livraisons / nb clients payeurs (arrondi entier)
  const cmdMoyenne =
    payeurs.length > 0 ? Math.round(totalDelivered / payeurs.length) : 0;

  return {
    total,
    fideles,
    fidelesPct,
    ltv,
    cmdMoyenne,
  };
}

/**
 * Compte par segment + grouping "client" (= nouveau + fidele, vrais payeurs).
 * Utilisé pour les badges des onglets (Tous · Client · Prospect).
 */
export function countBySegment(clients: Client[]) {
  const prospect = clients.filter(
    (c) => getClientSegment(c) === "prospect",
  ).length;
  const nouveau = clients.filter(
    (c) => getClientSegment(c) === "nouveau",
  ).length;
  const fidele = clients.filter(
    (c) => getClientSegment(c) === "fidele",
  ).length;
  return {
    all: clients.length,
    client: nouveau + fidele,
    prospect,
    nouveau,
    fidele,
  };
}

/**
 * Retourne les IDs des clients ayant commandé un produit donné — dérivé
 * en live de MOCK_CLOSING_ASSIGNMENTS pour rester cohérent avec
 * l'historique affiché sur la fiche client.
 */
export function clientIdsHavingOrdered(productId: string): Set<string> {
  const set = new Set<string>();
  for (const o of MOCK_CLOSING_ASSIGNMENTS) {
    if (o.items.some((it) => it.productId === productId)) {
      set.add(o.client.id);
    }
  }
  return set;
}
