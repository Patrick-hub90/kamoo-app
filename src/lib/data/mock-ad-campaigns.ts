import type { AdCampaign } from "@/lib/types/ad-campaign";

/**
 * Mock campagnes pubs Facebook — V1 sans TikTok (réservé V2).
 *
 *  - Mix actives (produits dispo) / inactives (rupture, fin saison)
 *  - Mix paid / pending : pour démontrer le suivi des paiements Meta
 *  - Plusieurs campagnes peuvent cibler le même produit (on additionne)
 *
 * En V2 : ces données seront synchronisées via Meta Marketing API et le
 * `paymentStatus` sera dérivé automatiquement de `act_<id>/billing_transactions`.
 *
 * Date de référence : 2026-05-04.
 */
const __seed_ADS: AdCampaign[] = [
  /* ─── Crème éclaircissante — top vente, 2 campagnes ─── */
  {
    id: "cmp_creme_fb_avr",
    name: "Crème naturelle — Femmes 25-45 Dakar",
    platform: "facebook",
    productId: "p_creme",
    status: "active",
    paymentStatus: "paid",
    startDate: "2026-04-01",
    spentXof: 145000,
    ordersReceived: 287,
    ordersDelivered: 92,
  },
  {
    id: "cmp_creme_fb_mai",
    name: "Crème éclaircissante — Reciblage acheteurs",
    platform: "facebook",
    productId: "p_creme",
    status: "active",
    paymentStatus: "pending",
    startDate: "2026-04-15",
    spentXof: 75000,
    ordersReceived: 156,
    ordersDelivered: 32,
  },

  /* ─── Power bank — campagne FB tech ─── */
  {
    id: "cmp_powerbank_fb",
    name: "Power Bank — Étudiants Dakar/Thiès",
    platform: "facebook",
    productId: "p_powerbank",
    status: "active",
    paymentStatus: "paid",
    startDate: "2026-03-20",
    spentXof: 88000,
    ordersReceived: 198,
    ordersDelivered: 67,
  },

  /* ─── Sac à main — campagne FB premium ─── */
  {
    id: "cmp_sac_fb",
    name: "Sac cuir — Premium Dakar Almadies",
    platform: "facebook",
    productId: "p_sac",
    status: "active",
    paymentStatus: "pending",
    startDate: "2026-03-10",
    spentXof: 110000,
    ordersReceived: 92,
    ordersDelivered: 18,
  },

  /* ─── Lunettes — campagne FB jeunes ─── */
  {
    id: "cmp_lunettes_fb",
    name: "Lunettes aviateur — Jeunes 18-30",
    platform: "facebook",
    productId: "p_lunettes",
    status: "active",
    paymentStatus: "paid",
    startDate: "2026-03-25",
    spentXof: 42000,
    ordersReceived: 167,
    ordersDelivered: 42,
  },

  /* ─── Casquette — campagne FB sport ─── */
  {
    id: "cmp_casquette_fb",
    name: "Casquette — Hommes sport",
    platform: "facebook",
    productId: "p_casquette",
    status: "active",
    paymentStatus: "paid",
    startDate: "2026-04-05",
    spentXof: 35000,
    ordersReceived: 124,
    ordersDelivered: 89,
  },

  /* ─── Coque téléphone — INACTIVE (rupture) — ancienne, payée ─── */
  {
    id: "cmp_coque_fb",
    name: "Coque iPhone/Samsung — Mass-market",
    platform: "facebook",
    productId: "p_coque",
    status: "inactive",
    paymentStatus: "paid",
    startDate: "2026-02-15",
    endDate: "2026-04-29",
    spentXof: 67000,
    ordersReceived: 312,
    ordersDelivered: 287,
  },

  /* ─── Parfum — campagne FB lifestyle ─── */
  {
    id: "cmp_parfum_fb",
    name: "Parfum oud arabe — Lifestyle luxe",
    platform: "facebook",
    productId: "p_parfum",
    status: "active",
    paymentStatus: "pending",
    startDate: "2026-04-10",
    spentXof: 58000,
    ordersReceived: 76,
    ordersDelivered: 9,
  },

  /* ─── Campagne importée de Meta, PAS ENCORE reliée à un produit ───
   *  Cas réel : on importe une campagne depuis Meta avant de l'avoir
   *  associée à un produit du catalogue. productId vide = non reliée. */
  {
    id: "cmp_unlinked_fb",
    name: "Promo flash — trafic boutique",
    platform: "facebook",
    productId: "",
    status: "active",
    paymentStatus: "pending",
    startDate: "2026-04-25",
    spentXof: 32000,
    ordersReceived: 41,
    ordersDelivered: 7,
  },
];

/* ─── Lookups & agrégats ─── */

export function getAdCampaign(id: string): AdCampaign | undefined {
  return MOCK_AD_CAMPAIGNS.find((c) => c.id === id);
}

/**
 * Total dépensé en pubs pour un produit donné = somme de toutes
 * les campagnes (actives + inactives) qui ciblent ce produit.
 */
export function totalAdSpendForProduct(productId: string): number {
  return MOCK_AD_CAMPAIGNS.filter((c) => c.productId === productId).reduce(
    (sum, c) => sum + c.spentXof,
    0,
  );
}

/** Toutes les campagnes liées à un produit donné */
export function campaignsForProduct(productId: string): AdCampaign[] {
  return MOCK_AD_CAMPAIGNS.filter((c) => c.productId === productId);
}

/** Stats globales des campagnes pour le header de la page Pubs */
export function computeCampaignsStats(campaigns: AdCampaign[]) {
  const total = campaigns.length;
  const actives = campaigns.filter((c) => c.status === "active").length;
  const pendingPayment = campaigns.filter(
    (c) => c.paymentStatus === "pending",
  ).length;
  const totalPendingAmount = campaigns
    .filter((c) => c.paymentStatus === "pending")
    .reduce((sum, c) => sum + c.spentXof, 0);

  const totalSpent = campaigns.reduce((sum, c) => sum + c.spentXof, 0);
  const totalReceived = campaigns.reduce(
    (sum, c) => sum + c.ordersReceived,
    0,
  );
  const totalDelivered = campaigns.reduce(
    (sum, c) => sum + c.ordersDelivered,
    0,
  );
  const avgCostPerDelivered =
    totalDelivered > 0 ? Math.round(totalSpent / totalDelivered) : 0;

  return {
    total,
    actives,
    pendingPayment,
    totalPendingAmount,
    totalSpent,
    totalReceived,
    totalDelivered,
    avgCostPerDelivered,
  };
}

/* Tout à zéro : la console vit sur du réel (Shopify) + créations manuelles. */
export const MOCK_AD_CAMPAIGNS: AdCampaign[] = [];
void __seed_ADS;
