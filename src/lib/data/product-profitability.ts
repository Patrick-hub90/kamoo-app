import {
  campaignsForProduct,
  totalAdSpendForProduct,
} from "./mock-ad-campaigns";
import { getApprovisionnements, MOCK_PRODUITS } from "./mock-produits";
import {
  averageAcquisitionCost,
  type Produit,
} from "@/lib/types/produit";

/**
 * Profitabilité d'un produit — calculée en croisant :
 *  - Boutique : prix de vente, ventes totales (soldTotal), coût d'achat manuel
 *  - Expéditions : coût d'acquisition moyen pondéré (priorité sur le manuel)
 *  - Campagnes pubs : total dépensé en marketing pour ce produit
 *
 * On utilise `p.soldTotal` (lifetime sales) plutôt que les commandes du
 * closing — qui ne représentent que l'opérationnel récent (3-4 commandes)
 * et ne reflètent pas l'historique réel des ventes.
 *
 * Bénéfice brut net = CA livré - coût acquisition - dépenses pubs
 *  - Ne déduit PAS les commissions closeuses / frais livreurs (= coûts opérationnels
 *    consolidés ailleurs). Ici on isole la contribution intrinsèque du produit.
 */

export type ProductProfitability = {
  product: Produit;
  /** Quantité réellement livrée (depuis MOCK_CLOSING_ASSIGNMENTS) */
  qtyDelivered: number;
  /** CA réel encaissé (qty × prix de vente) */
  revenueXof: number;
  /** Coût d'acquisition unitaire (moyen pondéré sinon manuel) */
  unitCostXof: number | null;
  /** Origine du coût utilisé : "expeditions" (auto) ou "manual" */
  costSource: "expeditions" | "manual" | "none";
  /** Coût total d'acquisition = unitCost × qtyDelivered */
  totalAcquisitionXof: number;
  /** Dépense totale en pubs sur ce produit */
  adSpendXof: number;
  /** Nombre de campagnes liées (actives + inactives) */
  campaignCount: number;
  /** Bénéfice brut net = revenue - acquisition - pubs */
  netGrossProfitXof: number;
  /** % de marge nette sur le CA */
  marginPct: number;
};

export function computeProductProfitability(p: Produit): ProductProfitability {
  // Quantité livrée totale = compteur lifetime du produit (Boutique).
  // C'est le vrai indicateur business — les MOCK_CLOSING_ASSIGNMENTS ne
  // contiennent qu'un échantillon opérationnel (commandes en cours).
  const qtyDelivered = p.soldTotal;
  const revenueXof = p.revenueTotalXof;

  // Coût d'acquisition : priorité au moyen pondéré dérivé des expéditions
  const appros = getApprovisionnements(p.id);
  const avgAcquisition = averageAcquisitionCost(appros);
  let unitCostXof: number | null = null;
  let costSource: ProductProfitability["costSource"] = "none";
  if (avgAcquisition !== null) {
    unitCostXof = avgAcquisition;
    costSource = "expeditions";
  } else if (p.costPriceXof !== undefined) {
    unitCostXof = p.costPriceXof;
    costSource = "manual";
  }

  const totalAcquisitionXof =
    unitCostXof !== null ? unitCostXof * qtyDelivered : 0;

  const adSpendXof = totalAdSpendForProduct(p.id);
  const campaignCount = campaignsForProduct(p.id).length;

  const netGrossProfitXof = revenueXof - totalAcquisitionXof - adSpendXof;
  const marginPct =
    revenueXof > 0
      ? Math.round((netGrossProfitXof / revenueXof) * 100)
      : 0;

  return {
    product: p,
    qtyDelivered,
    revenueXof,
    unitCostXof,
    costSource,
    totalAcquisitionXof,
    adSpendXof,
    campaignCount,
    netGrossProfitXof,
    marginPct,
  };
}

/**
 * Stats produit unifiées (vente + rentabilité) — utilisées partout dans
 * la Boutique. Calcul sur une période donnée OU en lifetime selon l'appelant.
 */
export type ProductStats = {
  soldQty: number;
  revenueXof: number;
  cogsXof: number;
  adSpendXof: number;
  netProfitXof: number;
  marginPct: number;
};

export const EMPTY_STATS: ProductStats = {
  soldQty: 0,
  revenueXof: 0,
  cogsXof: 0,
  adSpendXof: 0,
  netProfitXof: 0,
  marginPct: 0,
};

/**
 * Stats par produit sur une PÉRIODE = agrège les mouvements financiers
 * filtrés par productId.
 */
export function computeProductStatsForPeriod(
  movements: import("@/lib/types/finance").FinanceMovement[],
): Map<string, ProductStats> {
  const map = new Map<string, ProductStats>();

  for (const m of movements) {
    if (!m.productId) continue;
    const cur = map.get(m.productId) ?? { ...EMPTY_STATS };
    if (m.type === "vente_encaissee") cur.revenueXof += m.amountXof;
    if (m.type === "cout_marchandise") cur.cogsXof += m.amountXof;
    if (m.type === "depense_pub") cur.adSpendXof += m.amountXof;
    map.set(m.productId, cur);
  }

  // Calcul derived (qty, net, margin) à partir des produits
  for (const p of MOCK_PRODUITS) {
    const cur = map.get(p.id);
    if (!cur) continue;
    cur.soldQty =
      p.priceXof > 0 ? Math.round(cur.revenueXof / p.priceXof) : 0;
    cur.netProfitXof = cur.revenueXof - cur.cogsXof - cur.adSpendXof;
    cur.marginPct =
      cur.revenueXof > 0
        ? Math.round((cur.netProfitXof / cur.revenueXof) * 100)
        : 0;
  }

  return map;
}

/**
 * Stats LIFETIME par produit — utilise soldTotal/revenueTotalXof + le coût
 * d'acquisition + total dépense pub via campaignsForProduct.
 */
export function computeProductStatsLifetime(): Map<string, ProductStats> {
  const map = new Map<string, ProductStats>();
  for (const p of MOCK_PRODUITS) {
    const appros = getApprovisionnements(p.id);
    const unitCost =
      averageAcquisitionCost(appros) ?? p.costPriceXof ?? null;
    const cogsXof =
      unitCost !== null && p.soldTotal > 0 ? unitCost * p.soldTotal : 0;
    const adSpendXof = totalAdSpendForProduct(p.id);
    const revenueXof = p.revenueTotalXof;
    const netProfitXof = revenueXof - cogsXof - adSpendXof;
    const marginPct =
      revenueXof > 0 ? Math.round((netProfitXof / revenueXof) * 100) : 0;
    map.set(p.id, {
      soldQty: p.soldTotal,
      revenueXof,
      cogsXof,
      adSpendXof,
      netProfitXof,
      marginPct,
    });
  }
  return map;
}

/**
 * @deprecated — utilise `computeProductStatsForPeriod` qui retourne un super-set.
 * Conservé pour la rétro-compat des appels existants.
 */
export type ProductPeriodSales = {
  soldQty: number;
  revenueXof: number;
};

export function computeSalesByProductForPeriod(
  movements: import("@/lib/types/finance").FinanceMovement[],
): Map<string, ProductPeriodSales> {
  const stats = computeProductStatsForPeriod(movements);
  const map = new Map<string, ProductPeriodSales>();
  for (const [id, s] of stats.entries()) {
    map.set(id, { soldQty: s.soldQty, revenueXof: s.revenueXof });
  }
  return map;
}

/** Profitabilité de tous les produits, triée par bénéfice net décroissant */
export function computeAllProductsProfitability(): ProductProfitability[] {
  return MOCK_PRODUITS.map(computeProductProfitability).sort(
    (a, b) => b.netGrossProfitXof - a.netGrossProfitXof,
  );
}

/**
 * Profitabilité de tous les produits sur une PÉRIODE donnée — calculée
 * directement à partir des mouvements financiers filtrés. Utilisée par la
 * page Aperçu pour synchroniser les Recettes avec le filtre de période.
 *
 * Logique : on agrège par productId :
 *   - revenue = sum(vente_encaissee)
 *   - cogs    = sum(cout_marchandise)
 *   - adSpend = sum(depense_pub)
 *   - net     = revenue - cogs - adSpend
 *
 * Les ventes opérationnelles (closing) n'ont pas de productId — elles sont
 * volontairement ignorées ici (le compteur "vendu lifetime" n'a de sens
 * que sur l'historique agrégé). Pour V1 c'est ok, V2 on liera tous les flux.
 */
export function computeProductsProfitabilityForPeriod(
  movements: import("@/lib/types/finance").FinanceMovement[],
): ProductProfitability[] {
  const byProduct = new Map<
    string,
    { revenue: number; cogs: number; adSpend: number; qty: number }
  >();

  for (const m of movements) {
    if (!m.productId) continue;
    const cur = byProduct.get(m.productId) ?? {
      revenue: 0,
      cogs: 0,
      adSpend: 0,
      qty: 0,
    };
    if (m.type === "vente_encaissee") cur.revenue += m.amountXof;
    if (m.type === "cout_marchandise") cur.cogs += m.amountXof;
    if (m.type === "depense_pub") cur.adSpend += m.amountXof;
    byProduct.set(m.productId, cur);
  }

  const rows: ProductProfitability[] = [];
  for (const p of MOCK_PRODUITS) {
    const agg = byProduct.get(p.id);
    if (!agg) continue;
    if (agg.revenue === 0 && agg.cogs === 0 && agg.adSpend === 0) continue;

    // Estimation qty livrée à partir du revenue / prix unitaire
    const qty = p.priceXof > 0 ? Math.round(agg.revenue / p.priceXof) : 0;
    const unitCost = qty > 0 && agg.cogs > 0 ? Math.round(agg.cogs / qty) : null;
    const net = agg.revenue - agg.cogs - agg.adSpend;
    const marginPct =
      agg.revenue > 0 ? Math.round((net / agg.revenue) * 100) : 0;
    const campaignCount = campaignsForProduct(p.id).length;

    rows.push({
      product: p,
      qtyDelivered: qty,
      revenueXof: agg.revenue,
      unitCostXof: unitCost,
      costSource: unitCost !== null ? "expeditions" : "none",
      totalAcquisitionXof: agg.cogs,
      adSpendXof: agg.adSpend,
      campaignCount,
      netGrossProfitXof: net,
      marginPct,
    });
  }

  return rows.sort((a, b) => b.netGrossProfitXof - a.netGrossProfitXof);
}

/** Stats globales pour le header de /finances/produits */
export function computeProductsStats(
  rows: ProductProfitability[],
) {
  const totalRevenue = rows.reduce((s, r) => s + r.revenueXof, 0);
  const totalAcquisition = rows.reduce(
    (s, r) => s + r.totalAcquisitionXof,
    0,
  );
  const totalAdSpend = rows.reduce((s, r) => s + r.adSpendXof, 0);
  const totalNetProfit = rows.reduce((s, r) => s + r.netGrossProfitXof, 0);
  const avgMargin =
    totalRevenue > 0
      ? Math.round((totalNetProfit / totalRevenue) * 100)
      : 0;

  return {
    totalRevenue,
    totalAcquisition,
    totalAdSpend,
    totalNetProfit,
    avgMargin,
  };
}
