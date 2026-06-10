import { MOCK_AD_CAMPAIGNS } from "./mock-ad-campaigns";
import {
  MOCK_ACTIVE_CLOSEUSE,
  MOCK_CLOSING_ASSIGNMENTS,
} from "./mock-closing";
import { MOCK_CLOSEUSES } from "./mock-closeuses";
import { MOCK_EXPEDITIONS } from "./mock-expeditions";
import { getApprovisionnements, MOCK_PRODUITS } from "./mock-produits";
import { PLATFORM_LABELS } from "@/lib/types/ad-campaign";
import type { FinanceMovement, MovementStatus } from "@/lib/types/finance";
import { averageAcquisitionCost } from "@/lib/types/produit";

/** Commission de la closeuse active (lookup dans le marketplace par nom) */
const ACTIVE_CLOSEUSE_COMMISSION =
  MOCK_CLOSEUSES.find((c) => c.name === MOCK_ACTIVE_CLOSEUSE.name)
    ?.commissionXof ?? 1500;

/**
 * Génération du livre de comptes (mocks).
 *
 * On dérive automatiquement les mouvements financiers depuis les autres
 * mocks pour rester 100% cohérent avec l'UI :
 *  - Ventes encaissées   ← MOCK_CLOSING_ASSIGNMENTS (status="livre" + amountCollected)
 *  - Commissions closeuse ← idem (1 par commande livrée)
 *  - Frais livreurs       ← idem (forfait par livraison)
 *  - Frais transit        ← MOCK_EXPEDITIONS (amountXof + paymentStatus)
 *
 * En V2, ces mouvements seront stockés en BDD et générés par triggers
 * SQL ou server actions à chaque événement métier.
 *
 * Date de référence : 2026-05-04 (cohérent avec mock-clients).
 */

/**
 * Date de référence "aujourd'hui" — désormais l'horloge réelle centralisée
 * dans lib/clock (re-exportée ici pour compat avec les imports legacy).
 */
import { MOCK_TODAY, shiftToNow } from "@/lib/clock";
export { MOCK_TODAY };
const TODAY = MOCK_TODAY;

/** PRNG déterministe (même sortie serveur/client — pas de mismatch d'hydratation). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash simple et stable d'une string (seed PRNG par produit). */
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
const PAID_THRESHOLD_DAYS = 7; // au-delà de 7j, on marque comme "payé"
/**
 * Seuil livreur : sous 3 jours après livraison, le cash est encore chez
 * le livreur (status "à recevoir" pour le vendeur). Au-delà → versé.
 */
const LIVREUR_VERSEMENT_THRESHOLD_DAYS = 3;

/** Forfait livreur (F CFA) — V1 mock simplifié, V2 = zone-based */
const LIVREUR_FEE_BY_NAME: Record<string, number> = {
  "Moussa Sow": 2000,
  "Ibrahima Sarr": 1500,
  "Yango Express": 2500,
};
const DEFAULT_LIVREUR_FEE = 2000;

function isOlderThan(iso: string, days: number): boolean {
  const d = new Date(iso);
  const diffDays = (TODAY.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > days;
}

function statusForOutgoing(refDate: string): MovementStatus {
  return isOlderThan(refDate, PAID_THRESHOLD_DAYS) ? "paye" : "a_payer";
}

/**
 * Statut pour une vente encaissée :
 *  - récente (≤3j) → "a_recevoir" (cash chez livreur, pas encore versé)
 *  - plus ancienne → "encaisse" (versé au vendeur)
 */
function statusForSale(refDate: string): MovementStatus {
  return isOlderThan(refDate, LIVREUR_VERSEMENT_THRESHOLD_DAYS)
    ? "encaisse"
    : "a_recevoir";
}

let movementCounter = 0;
function nextId(): string {
  movementCounter += 1;
  return `mv_${String(movementCounter).padStart(3, "0")}`;
}

/* ─── Numéros wallets/téléphones des partenaires (mock) ─── */
const PARTNER_PHONES: Record<string, string> = {
  // Closeuse
  "Aminata Sène": "+221 77 123 45 67",
  // Transitaires (numéros locaux pour leurs représentants Dakar)
  "Shanghai Express Cargo": "+221 33 821 45 09",
  "Pearl River Logistics": "+221 33 825 11 88",
};

/**
 * Décale une date ISO de N jours et retourne l'ISO résultant.
 * Sert à simuler "le vendeur a payé X jours après l'engagement".
 */
function shiftDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

/**
 * Génère les preuves de paiement (paidAt, proofUrl, transactionId, etc.) pour
 * un mouvement sortant déjà en statut "paye". Les types qui n'ont pas de
 * partenaire à confirmer (frais_livreur auto-déduit, depense_pub vers Meta)
 * reçoivent quand même paidAt + transactionId pour traçabilité.
 *
 * `confirmIdx` permet de varier les statuts : pair → confirmé par partenaire,
 * impair → en attente de confirmation. Donne du grain pour la démo.
 */
function buildPaymentProof(args: {
  type: FinanceMovement["type"];
  partnerName?: string;
  engagementDate: string;
  amountXof: number;
  confirmIdx: number;
}): Partial<FinanceMovement> {
  const { type, partnerName, engagementDate, amountXof, confirmIdx } = args;
  const paidAt = shiftDays(engagementDate, 2 + (confirmIdx % 3));
  const recipientPhone = partnerName ? PARTNER_PHONES[partnerName] : undefined;

  // Méthode adaptée au type
  let paymentMethod = "Wave";
  let txPrefix = "WV";
  if (type === "frais_transit") {
    paymentMethod = "Virement bancaire";
    txPrefix = "VB";
  } else if (type === "depense_pub") {
    paymentMethod = "Carte bancaire";
    txPrefix = "CB";
  } else if (type === "frais_livreur") {
    paymentMethod = "Auto-déduit du cash";
    txPrefix = "AD";
  } else if (type === "remboursement") {
    paymentMethod = "Wave";
    txPrefix = "WV";
  }

  const txDate = new Date(paidAt);
  const transactionId = `${txPrefix}${txDate.getUTCFullYear()}${String(
    txDate.getUTCMonth() + 1,
  ).padStart(2, "0")}${String(txDate.getUTCDate()).padStart(
    2,
    "0",
  )}TX${String(amountXof).padStart(5, "0")}`;

  // Confirmation partenaire : seulement pour closeuse / transit, et 1 sur 2
  const needsConfirmation =
    type === "commission_closeuse" || type === "frais_transit";
  const partnerConfirmedAt =
    needsConfirmation && confirmIdx % 2 === 0
      ? shiftDays(paidAt, 1)
      : undefined;

  return {
    paidAt,
    proofUrl: `/mock-proofs/${type}-${confirmIdx}.png`,
    transactionId,
    paymentMethod,
    recipientPhone,
    partnerConfirmedAt,
  };
}

/* ─── Génération ─────────────────────────────────────────── */

function generateMovements(): FinanceMovement[] {
  movementCounter = 0;
  const out: FinanceMovement[] = [];

  /* ─── Mouvements liés aux commandes livrées ─── */
  let closingIdx = 0;
  for (const a of MOCK_CLOSING_ASSIGNMENTS) {
    if (a.status !== "livre") continue;
    if (!a.delivery || a.delivery.progress !== "effectue") continue;
    if (!a.delivery.amountCollected) continue;
    const deliveredAt = a.delivery.deliveredAt ?? a.lastActivityAt;
    const partnerStatus = statusForOutgoing(deliveredAt);
    closingIdx += 1;

    // 1. Vente encaissée (entrée) — status dépend de la date de livraison
    out.push({
      id: nextId(),
      date: deliveredAt,
      type: "vente_encaissee",
      direction: "in",
      status: statusForSale(deliveredAt),
      amountXof: a.delivery.amountCollected,
      description: `Livraison ${a.id} — ${a.client.name}`,
      partner: {
        type: "livreur",
        name: a.delivery.name,
        ref: a.delivery.id,
      },
      orderId: a.id,
    });

    // 2. Commission closeuse (sortie)
    out.push({
      id: nextId(),
      date: deliveredAt,
      type: "commission_closeuse",
      direction: "out",
      status: partnerStatus,
      amountXof: ACTIVE_CLOSEUSE_COMMISSION,
      description: `Commission · ${a.id}`,
      partner: {
        type: "closeuse",
        name: MOCK_ACTIVE_CLOSEUSE.name,
        ref: MOCK_ACTIVE_CLOSEUSE.id,
      },
      orderId: a.id,
      ...(partnerStatus === "paye"
        ? buildPaymentProof({
            type: "commission_closeuse",
            partnerName: MOCK_ACTIVE_CLOSEUSE.name,
            engagementDate: deliveredAt,
            amountXof: ACTIVE_CLOSEUSE_COMMISSION,
            confirmIdx: closingIdx,
          })
        : {}),
    });

    // 3. Frais livreur (sortie) — auto-déduit, donc toujours "paye" en théorie
    const livreurName = a.delivery.name;
    const livreurFee = LIVREUR_FEE_BY_NAME[livreurName] ?? DEFAULT_LIVREUR_FEE;
    out.push({
      id: nextId(),
      date: deliveredAt,
      type: "frais_livreur",
      direction: "out",
      status: partnerStatus,
      amountXof: livreurFee,
      description: `Livraison ${a.id} → ${a.client.zone}`,
      partner: {
        type: "livreur",
        name: livreurName,
        ref: a.delivery.id,
      },
      orderId: a.id,
      ...(partnerStatus === "paye"
        ? buildPaymentProof({
            type: "frais_livreur",
            partnerName: livreurName,
            engagementDate: deliveredAt,
            amountXof: livreurFee,
            confirmIdx: closingIdx,
          })
        : {}),
    });
  }

  /* ─── Mouvements liés aux expéditions ─── */
  let expeditionIdx = 0;
  for (const e of MOCK_EXPEDITIONS) {
    if (e.amountXof === null) continue;
    expeditionIdx += 1;
    const status: MovementStatus =
      e.paymentStatus === "paid" ? "paye" : "a_payer";

    out.push({
      id: nextId(),
      date: e.createdAt,
      type: "frais_transit",
      direction: "out",
      status,
      amountXof: e.amountXof,
      description: `Expédition ${e.publicCode} · ${e.productName}`,
      partner: {
        type: "transitaire",
        name: e.transitaire.name,
      },
      expeditionId: e.id,
      ...(status === "paye"
        ? buildPaymentProof({
            type: "frais_transit",
            partnerName: e.transitaire.name,
            engagementDate: e.createdAt,
            amountXof: e.amountXof,
            confirmIdx: expeditionIdx,
          })
        : {}),
    });
  }

  /* ─── Mouvements liés aux campagnes pubs ─── */
  // V1 simplifié : on étale le spend sur chaque jour entre startDate et today
  // (ou endDate si la campagne est terminée), pour que la dépense soit
  // visible dans toutes les périodes filtrées entre les 2 dates.
  // V2 : 1 mouvement par jour de spend alimenté par l'API Meta Ads.
  for (const cmp of MOCK_AD_CAMPAIGNS) {
    if (cmp.spentXof <= 0) continue;
    const start = new Date(cmp.startDate);
    const end = cmp.endDate ? new Date(cmp.endDate) : TODAY;
    const days = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / 86400000),
    );
    const dailySpend = Math.round(cmp.spentXof / days);
    if (dailySpend === 0) continue;

    // Note : pas de buildPaymentProof pour depense_pub. Facebook agrège ses
    // dépenses et facture en un seul paiement → on ne tient pas le détail
    // par jour côté Kamoo. Ces mouvements existent pour la ventilation des
    // coûts (Aperçu Charges) et l'attribution par produit. Dans le journal,
    // ils sont remplacés par une ligne agrégée unique.
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setUTCDate(d.getUTCDate() + i);
      if (d.getTime() > TODAY.getTime()) break;
      const status: MovementStatus =
        cmp.paymentStatus === "paid" ? "paye" : "a_payer";
      out.push({
        id: nextId(),
        date: d.toISOString(),
        type: "depense_pub",
        direction: "out",
        status,
        amountXof: dailySpend,
        description: `${cmp.name}`,
        partner: {
          type: "regie_pub",
          name: PLATFORM_LABELS[cmp.platform],
        },
        productId: cmp.productId,
      });
    }
  }

  /* ─── Historique des ventes par produit (agrégé mensuel) ─── */
  // Les MOCK_CLOSING_ASSIGNMENTS ne couvrent que l'opérationnel récent
  // (~3 commandes livrées). Pour avoir un livre de comptes réaliste, on
  // génère des mouvements agrégés mensuels pour les ventes historiques de
  // chaque produit (basé sur revenueTotalXof - revenueThisMonthXof).
  for (const p of MOCK_PRODUITS) {
    if (p.revenueTotalXof <= 0) continue;
    // Le mois courant est représenté par les commandes opérationnelles ci-dessus
    const historicalRevenue = Math.max(
      0,
      p.revenueTotalXof - p.revenueThisMonthXof,
    );
    if (historicalRevenue === 0) continue;

    const created = new Date(p.createdAt);
    const monthsSinceCreated = Math.max(
      1,
      Math.floor(
        (TODAY.getTime() - created.getTime()) /
          (1000 * 60 * 60 * 24 * 30),
      ),
    );
    // On répartit le CA historique sur jusqu'à 12 mois précédents
    const monthsToFill = Math.min(12, monthsSinceCreated);
    const monthlyRevenue = Math.round(historicalRevenue / monthsToFill);
    if (monthlyRevenue === 0) continue;

    // Coût marchandise unitaire (auto via expéditions, sinon manuel)
    const appros = getApprovisionnements(p.id);
    const unitCost =
      averageAcquisitionCost(appros) ?? p.costPriceXof ?? null;
    const historicalQty = Math.max(0, p.soldTotal - p.soldThisMonth);
    const monthlyCogs =
      unitCost !== null && historicalQty > 0
        ? Math.round((unitCost * historicalQty) / monthsToFill)
        : 0;

    // Étalement intra-mois : 4 dates par mois (≈ une par semaine)
    // Étalement intra-mois LISSÉ : chaque produit vend sur ~10 jours du mois,
    // tirés pseudo-aléatoirement PAR PRODUIT (déterministe). Les produits ne
    // tombent donc pas tous les mêmes jours → le cumul quotidien forme une
    // courbe naturelle, sans pics artificiels. Le total mensuel est inchangé.
    const rndP = mulberry32(hashStr(p.id));
    const spreadDays = Array.from(
      new Set(Array.from({ length: 10 }, () => 1 + Math.floor(rndP() * 27))),
    ).sort((a, b) => a - b);
    const splitRevenue = Math.round(monthlyRevenue / spreadDays.length);
    const splitCogs = Math.round(monthlyCogs / spreadDays.length);

    for (let i = 1; i <= monthsToFill; i++) {
      for (const dayOfMonth of spreadDays) {
        const d = new Date(TODAY);
        d.setUTCMonth(d.getUTCMonth() - i);
        d.setUTCDate(dayOfMonth);
        d.setUTCHours(9 + Math.floor(rndP() * 9), 0, 0, 0);
        const monthLabel = d.toLocaleDateString("fr-FR", {
          month: "long",
          year: "numeric",
        });

        out.push({
          id: nextId(),
          date: d.toISOString(),
          type: "vente_encaissee",
          direction: "in",
          status: "encaisse",
          amountXof: splitRevenue,
          description: `Ventes ${p.name} · ${monthLabel}`,
          productId: p.id,
        });

        if (splitCogs > 0) {
          out.push({
            id: nextId(),
            date: d.toISOString(),
            type: "cout_marchandise",
            direction: "out",
            status: "paye",
            amountXof: splitCogs,
            description: `Coût marchandise ${p.name} · ${monthLabel}`,
            productId: p.id,
          });
        }
      }
    }
  }

  /* ─── Ventes opérationnelles récentes (7 derniers jours) ─── */
  // Schedule réaliste : chaque jour a 0-3 produits vendus différents.
  // Sert à tester les filtres courte période ("Aujourd'hui", "7 jours")
  // et voir des journées avec très peu de produits vendus.
  // Chaque vente est attribuée à un livreur (alternance Moussa/Ibrahima)
  // pour générer du cash chez les livreurs et permettre de tester le flow
  // de versements/validation.
  // Date de réf : MOCK_TODAY = 2026-05-04 (lundi)
  const LIVREURS_POOL = [
    { id: "lv_moussa", name: "Moussa Sow" },
    { id: "lv_ibrahima", name: "Ibrahima Sarr" },
  ];
  const RECENT_DAILY_SALES: Array<{
    date: string;
    sales: Array<{ productId: string; qty: number; livreurIdx: 0 | 1 }>;
  }> = [
    {
      date: "2026-04-28",
      sales: [
        { productId: "p_creme", qty: 2, livreurIdx: 0 }, // Moussa 36k
        { productId: "p_casquette", qty: 1, livreurIdx: 1 }, // Ibrahima 7k
      ],
    },
    {
      date: "2026-04-29",
      sales: [{ productId: "p_creme", qty: 1, livreurIdx: 0 }], // Moussa 18k
    },
    { date: "2026-04-30", sales: [] }, // journée creuse
    {
      date: "2026-05-01",
      sales: [
        { productId: "p_creme", qty: 1, livreurIdx: 1 }, // Ibrahima 18k
        { productId: "p_lunettes", qty: 1, livreurIdx: 1 }, // Ibrahima 11k
        { productId: "p_powerbank", qty: 1, livreurIdx: 0 }, // Moussa 12k
      ],
    },
    {
      date: "2026-05-02",
      sales: [{ productId: "p_sac", qty: 1, livreurIdx: 1 }], // Ibrahima 25k
    },
    {
      date: "2026-05-03",
      sales: [
        { productId: "p_creme", qty: 1, livreurIdx: 0 }, // Moussa 18k
        { productId: "p_powerbank", qty: 1, livreurIdx: 1 }, // Ibrahima 12k
      ],
    },
    {
      date: "2026-05-04",
      sales: [{ productId: "p_casquette", qty: 1, livreurIdx: 0 }], // Moussa 7k
    },
  ];

  let recentSaleIdx = 0;
  for (const day of RECENT_DAILY_SALES) {
    for (const s of day.sales) {
      const product = MOCK_PRODUITS.find((p) => p.id === s.productId);
      if (!product) continue;
      // Dates legacy (ancrées 2026-05-04) recalées sur aujourd'hui.
      const dateIso = shiftToNow(`${day.date}T14:00:00Z`);
      const revenue = product.priceXof * s.qty;
      const livreur = LIVREURS_POOL[s.livreurIdx];
      const livreurFee =
        LIVREUR_FEE_BY_NAME[livreur.name] ?? DEFAULT_LIVREUR_FEE;
      recentSaleIdx += 1;

      // Vente encaissée — attribuée à un livreur
      out.push({
        id: nextId(),
        date: dateIso,
        type: "vente_encaissee",
        direction: "in",
        status: statusForSale(dateIso),
        amountXof: revenue,
        description: `Vente ${product.name} × ${s.qty}`,
        productId: product.id,
        partner: { type: "livreur", name: livreur.name, ref: livreur.id },
      });

      // Frais livreur associé (auto-déduit du cash)
      const fraisLivreurStatus = statusForOutgoing(dateIso);
      out.push({
        id: nextId(),
        date: dateIso,
        type: "frais_livreur",
        direction: "out",
        status: fraisLivreurStatus,
        amountXof: livreurFee,
        description: `Livraison ${product.name} → livreur`,
        partner: { type: "livreur", name: livreur.name, ref: livreur.id },
        ...(fraisLivreurStatus === "paye"
          ? buildPaymentProof({
              type: "frais_livreur",
              partnerName: livreur.name,
              engagementDate: dateIso,
              amountXof: livreurFee,
              confirmIdx: recentSaleIdx,
            })
          : {}),
      });

      // Coût marchandise associé
      const appros = getApprovisionnements(product.id);
      const unitCost =
        averageAcquisitionCost(appros) ?? product.costPriceXof ?? null;
      if (unitCost !== null) {
        out.push({
          id: nextId(),
          date: dateIso,
          type: "cout_marchandise",
          direction: "out",
          status: "paye",
          amountXof: unitCost * s.qty,
          description: `Coût ${product.name} × ${s.qty}`,
          productId: product.id,
        });
      }
    }
  }

  // Tri descendant par date (le plus récent en haut)
  out.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return out;
}

export const MOCK_FINANCE_MOVEMENTS: FinanceMovement[] = generateMovements();

export function getMovementById(id: string): FinanceMovement | undefined {
  return MOCK_FINANCE_MOVEMENTS.find((m) => m.id === id);
}
