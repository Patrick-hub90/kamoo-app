/**
 * Types pour les Campagnes Publicitaires.
 *
 * V1 : Facebook uniquement (sync auto via Meta Marketing API en V2).
 * Pour le mock, les campagnes sont déclarées en dur. Quand l'intégration
 * sera branchée, le sync écrasera automatiquement les enregistrements.
 *
 * Modèle simple : 1 campagne = 1 produit. Le coût total dépensé pour un
 * produit donné = somme des `spentXof` des campagnes liées à ce produit.
 */

export type AdPlatform = "facebook";

export type AdCampaignStatus =
  /** Campagne en cours — produit en stock + dispo à la vente */
  | "active"
  /** En pause / arrêtée — produit en rupture, fin de saison, etc. */
  | "inactive";

/**
 * Statut de paiement vis-à-vis de Meta.
 *  - "paid"    : la dépense a été couverte (top-up consommé OU carte débitée)
 *  - "pending" : Meta n'a pas encore été payé pour cette campagne
 *
 * V2 : déduit automatiquement de `act_<id>/billing_transactions`.
 */
export type AdCampaignPaymentStatus = "paid" | "pending";

export type AdCampaign = {
  id: string;
  name: string;
  platform: AdPlatform;
  /** Produit lié (ID dans MOCK_PRODUITS) — 1 campagne = 1 produit */
  productId: string;
  status: AdCampaignStatus;
  paymentStatus: AdCampaignPaymentStatus;
  /** Date de lancement de la campagne */
  startDate: string;
  /** Date de fin (si terminée) */
  endDate?: string;
  /** Total dépensé en F CFA depuis le lancement */
  spentXof: number;
  /** Nb de commandes reçues dans la boutique grâce à cette campagne */
  ordersReceived: number;
  /** Nb de commandes effectivement livrées (= revenus encaissés) */
  ordersDelivered: number;
};

/* ─── Helpers ─── */

export const PLATFORM_LABELS: Record<AdPlatform, string> = {
  facebook: "Facebook Ads",
};

export const PLATFORM_TONE: Record<
  AdPlatform,
  { bg: string; fg: string; ring: string }
> = {
  facebook: {
    bg: "bg-kamoo-blue-50",
    fg: "text-kamoo-blue-700",
    ring: "ring-kamoo-blue-100",
  },
};

export const STATUS_LABELS: Record<AdCampaignStatus, string> = {
  active: "Active",
  inactive: "Inactive",
};

export const PAYMENT_STATUS_LABELS: Record<AdCampaignPaymentStatus, string> = {
  paid: "Payée",
  pending: "À payer",
};

export const PAYMENT_STATUS_TONE: Record<
  AdCampaignPaymentStatus,
  { bg: string; fg: string }
> = {
  paid: { bg: "bg-emerald-50", fg: "text-emerald-700" },
  pending: { bg: "bg-amber-50", fg: "text-amber-700" },
};

/**
 * Coût réel par client livré = total dépensé / nb livrés.
 * Renvoie null si aucune livraison (impossible de calculer).
 */
export function costPerDelivered(c: AdCampaign): number | null {
  if (c.ordersDelivered === 0) return null;
  return Math.round(c.spentXof / c.ordersDelivered);
}

/**
 * Coût par commande reçue (avant livraison).
 */
export function costPerOrder(c: AdCampaign): number | null {
  if (c.ordersReceived === 0) return null;
  return Math.round(c.spentXof / c.ordersReceived);
}

/**
 * Taux de conversion = livrés / reçus (en %).
 */
export function conversionRate(c: AdCampaign): number {
  if (c.ordersReceived === 0) return 0;
  return Math.round((c.ordersDelivered / c.ordersReceived) * 100);
}
