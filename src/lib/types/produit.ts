/**
 * Types pour le Module Boutique (catalogue produits du vendeur).
 */

/**
 * Provenance d'un produit du catalogue — sert à la réconciliation Shopify :
 *  - "manual"         : créé à la main par le vendeur.
 *  - "shopify_import" : tiré depuis la boutique via la modale d'import.
 *  - "shopify_order"  : créé AUTOMATIQUEMENT depuis une commande dont le
 *                       produit n'était pas encore au catalogue (brouillon à
 *                       compléter : prix d'achat manquant → marge non calculée).
 */
export type ProductOrigin = "manual" | "shopify_import" | "shopify_order";

export type Produit = {
  /** Identifiant utilisé dans les commandes (ex: "p_creme"). */
  id: string;
  /** Référence SKU lisible (ex: "SKU-CRM-001"). */
  sku: string;
  name: string;
  /** Emoji représentatif — utilisé partout dans l'app */
  emoji: string;
  /** Gradient CSS de fallback derrière l'emoji */
  bg: string;
  /** Description longue (affichée sur la fiche produit) */
  description: string;
  /** URLs des photos produit (V1 : vide, on utilise emoji + bg) */
  photos?: string[];

  /** Pricing */
  priceXof: number; // prix de vente actuel (peut être modifié)
  /**
   * Prix d'achat indicatif (Chine + transport amorti).
   * OPTIONNEL : le vendeur peut le laisser vide. S'il est saisi, on calcule
   * la marge. Sinon on affiche "Marge non calculée".
   *
   * NB : en V2, le vrai coût d'achat sera dérivé des expéditions (FIFO/avg)
   * car il varie d'une commande Chine à l'autre. Ce champ reste un fallback
   * manuel pour le vendeur qui veut une estimation rapide.
   */
  costPriceXof?: number;

  /** Stock */
  stock: number;
  /** En dessous : alerte stock bas (orange). 0 = rupture (rouge) */
  lowStockThreshold: number;

  /** État */
  isActive: boolean;
  /** Produit archivé : masqué des vues actives, conservé pour l'historique */
  archived?: boolean;
  /** Provenance (réconciliation Shopify). Défaut implicite : "manual". */
  origin?: ProductOrigin;

  /** Performance — calculée depuis les commandes en V1, mock pour la démo */
  soldThisMonth: number;
  soldTotal: number;
  revenueThisMonthXof: number;
  revenueTotalXof: number;

  /** Dates */
  createdAt: string;
  lastSoldAt?: string;
};

/**
 * Approvisionnement = expédition Chine→Afrique qui contenait ce produit.
 * Affiché sur la fiche produit pour voir l'historique d'arrivage et le pipeline.
 *
 * Le coût d'acquisition unitaire = prix d'achat fournisseur + part allouée
 * du coût d'expédition (frais transitaire répartis au prorata de la qté).
 *
 * Les deux montants sont OPTIONNELS :
 *  - `purchasePriceXof` peut être inconnu si le vendeur ne l'a pas saisi.
 *  - `shippingCostXof` est inconnu tant que le devis Kamoo n'est pas émis
 *    (status = "en_attente_devis"), puis se calcule automatiquement.
 */
export type Approvisionnement = {
  /** ID de l'expédition (ex: "exp_01") */
  expeditionId: string;
  /** Code public (ex: "KMO-SN-78421") — sert de label */
  expeditionCode: string;
  /** Quantité de ce produit dans l'expédition */
  quantity: number;
  /** Date prévue/effective d'arrivée à destination */
  arrivalDate: string;
  /** Statut de l'expédition (simplifié pour la fiche produit) */
  status: "en_route" | "arrive" | "en_attente_devis";

  /** Prix d'achat unitaire payé au fournisseur Chine (FOB Guangzhou). */
  purchasePriceXof?: number;
  /** Part du coût d'expédition allouée à 1 unité de ce produit. */
  shippingCostXof?: number;
};

/**
 * Coût d'acquisition unitaire = prix d'achat + part expédition.
 * Renvoie `null` si l'un des deux est manquant.
 */
export function acquisitionCost(a: Approvisionnement): number | null {
  if (a.purchasePriceXof === undefined || a.shippingCostXof === undefined) {
    return null;
  }
  return a.purchasePriceXof + a.shippingCostXof;
}

/**
 * Coût d'acquisition moyen pondéré par les quantités, calculé uniquement
 * sur les approvisionnements arrivés et dont le coût est complet.
 * Renvoie `null` si aucune donnée disponible.
 */
export function averageAcquisitionCost(
  appros: Approvisionnement[],
): number | null {
  const usable = appros.filter(
    (a) =>
      a.status === "arrive" &&
      a.purchasePriceXof !== undefined &&
      a.shippingCostXof !== undefined &&
      a.quantity > 0,
  );
  if (usable.length === 0) return null;

  const totalQty = usable.reduce((sum, a) => sum + a.quantity, 0);
  if (totalQty === 0) return null;

  const totalCost = usable.reduce(
    (sum, a) =>
      sum + (a.purchasePriceXof! + a.shippingCostXof!) * a.quantity,
    0,
  );
  return Math.round(totalCost / totalQty);
}

/**
 * Produit « à compléter » : créé automatiquement depuis une commande Shopify
 * et dont le prix d'achat n'a pas encore été renseigné. Tant qu'il manque, la
 * marge de ce produit ne peut pas être calculée → on relance le vendeur dans
 * le catalogue (bandeau de réconciliation).
 */
export function needsCompletion(p: Produit): boolean {
  return p.origin === "shopify_order" && p.costPriceXof === undefined;
}

/** Statut visuel du stock — dérivé de stock + lowStockThreshold */
export type StockLevel = "rupture" | "bas" | "ok";

export function getStockLevel(p: Produit): StockLevel {
  if (p.stock === 0) return "rupture";
  if (p.stock <= p.lowStockThreshold) return "bas";
  return "ok";
}

/**
 * Marge unitaire (prix de vente - prix d'achat).
 * Renvoie `null` si le prix d'achat n'est pas renseigné.
 */
export function unitMargin(p: Produit): number | null {
  if (p.costPriceXof === undefined) return null;
  return p.priceXof - p.costPriceXof;
}

/**
 * Taux de marge (%).
 * Renvoie `null` si le prix d'achat n'est pas renseigné.
 */
export function marginRate(p: Produit): number | null {
  if (p.costPriceXof === undefined) return null;
  if (p.priceXof === 0) return 0;
  return Math.round((unitMargin(p)! / p.priceXof) * 100);
}
