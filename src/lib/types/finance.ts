/**
 * Types pour le Module Finances (livre de comptes consolidé).
 *
 * Le livre de comptes consolide TOUS les flux d'argent du vendeur :
 *  - Entrées : ventes COD encaissées
 *  - Sorties : commissions closeuses, frais livreurs, frais transit
 *
 * Chaque flux = un FinanceMovement avec un état clair (encaissé / à payer / payé).
 * V2 : ces mouvements seront générés automatiquement par triggers SQL ou
 * server actions à chaque événement métier (livraison effectuée, devis payé…).
 */

export type MovementType =
  /** Cash COD encaissé sur une livraison réussie */
  | "vente_encaissee"
  /** Prix d'achat des marchandises payé au fournisseur (Chine) */
  | "cout_marchandise"
  /** Commission due / payée à une closeuse pour une commande livrée */
  | "commission_closeuse"
  /** Forfait dû / payé à un livreur pour une livraison effectuée */
  | "frais_livreur"
  /** Devis dû / payé au transitaire pour une expédition */
  | "frais_transit"
  /** Dépense publicitaire (campagne FB / TikTok) */
  | "depense_pub"
  /** Remboursement client (rare — produit défectueux, etc.) */
  | "remboursement";

export type MovementDirection = "in" | "out";

export type MovementStatus =
  /** Cash chez le livreur, pas encore versé au vendeur (pour les ventes) */
  | "a_recevoir"
  /** Argent rentré dans la caisse vendeur (pour les "in") */
  | "encaisse"
  /** Argent à sortir, pas encore versé au partenaire (pour les "out") */
  | "a_payer"
  /** Argent déjà versé (pour les "out") */
  | "paye";

export type PartnerType =
  | "closeuse"
  | "livreur"
  | "transitaire"
  | "regie_pub"
  | "client";

export type Partner = {
  type: PartnerType;
  name: string;
  /** Slug ou ID pour cross-link vers la fiche du partenaire (optionnel) */
  ref?: string;
};

export type FinanceMovement = {
  /** ID unique du mouvement (ex: "mv_001") */
  id: string;
  /** ISO date — quand le flux a eu lieu (ou est attendu) */
  date: string;
  type: MovementType;
  direction: MovementDirection;
  /** Montant en F CFA, toujours positif (la direction porte le signe) */
  amountXof: number;
  status: MovementStatus;
  /** Libellé court humain (ex: "Livraison ORD-SN-00128 · Aminata Diallo") */
  description: string;
  /** Contrepartie (closeuse, livreur, transit…) — optionnel pour les ventes COD */
  partner?: Partner;
  /** Lien vers la commande source (cliquable) */
  orderId?: string;
  /** Lien vers l'expédition source (cliquable) */
  expeditionId?: string;
  /**
   * Produit lié (si applicable) — permet d'agréger les recettes/coûts par
   * produit sur une période donnée. Renseigné pour : ventes, coût marchandise
   * historique, dépenses pub (via la campagne).
   */
  productId?: string;

  /* ─── Preuve de paiement (uniquement quand status === "paye") ─── */

  /** Date à laquelle le vendeur a effectivement effectué le virement */
  paidAt?: string;
  /** URL de la capture du paiement (Wave/OM/banque) */
  proofUrl?: string;
  /** ID de transaction côté wallet/banque */
  transactionId?: string;
  /** Moyen de paiement utilisé : Wave / Orange Money / Free Money / Virement */
  paymentMethod?: string;
  /** Numéro destinataire (téléphone du partenaire) */
  recipientPhone?: string;
  /**
   * Date à laquelle le partenaire (closeuse / transitaire) a confirmé avoir
   * reçu le virement. Si undefined sur un type qui requiert confirmation,
   * le mouvement est en attente de confirmation côté partenaire.
   */
  partnerConfirmedAt?: string;
};

/**
 * Types de mouvements pour lesquels le partenaire doit confirmer la
 * réception du virement (closeuse, transitaire). Pour les autres types
 * (depense_pub vers Meta, frais_livreur auto-déduits), la confirmation
 * n'a pas de sens.
 */
export const MOVEMENT_TYPES_REQUIRING_PARTNER_CONFIRMATION = new Set<MovementType>([
  "commission_closeuse",
  "frais_transit",
]);

/* ─── Helpers ─── */

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  vente_encaissee: "Vente",
  cout_marchandise: "Achat produit",
  commission_closeuse: "Commission closeuse",
  frais_livreur: "Frais livreur",
  frais_transit: "Frais expédition",
  depense_pub: "Dépense pub",
  remboursement: "Dépense",
};

/** Tone Tailwind par type de mouvement (pour les badges) */
export const MOVEMENT_TYPE_TONE: Record<
  MovementType,
  { bg: string; fg: string }
> = {
  vente_encaissee: { bg: "bg-emerald-50", fg: "text-emerald-700" },
  cout_marchandise: { bg: "bg-rose-50", fg: "text-rose-700" },
  commission_closeuse: {
    bg: "bg-kamoo-blue-50",
    fg: "text-kamoo-blue-700",
  },
  frais_livreur: { bg: "bg-cyan-50", fg: "text-cyan-700" },
  frais_transit: { bg: "bg-amber-50", fg: "text-amber-700" },
  depense_pub: { bg: "bg-purple-50", fg: "text-purple-700" },
  remboursement: { bg: "bg-red-50", fg: "text-red-700" },
};

export const MOVEMENT_STATUS_LABELS: Record<MovementStatus, string> = {
  a_recevoir: "À recevoir",
  encaisse: "Encaissé",
  a_payer: "À payer",
  paye: "Payé",
};

export const MOVEMENT_STATUS_TONE: Record<
  MovementStatus,
  { bg: string; fg: string }
> = {
  a_recevoir: { bg: "bg-cyan-50", fg: "text-cyan-700" },
  encaisse: { bg: "bg-emerald-50", fg: "text-emerald-700" },
  a_payer: { bg: "bg-amber-50", fg: "text-amber-700" },
  paye: { bg: "bg-paper-2", fg: "text-ink-500" },
};

export const PARTNER_TYPE_LABELS: Record<PartnerType, string> = {
  closeuse: "Closeuse",
  livreur: "Livreur",
  transitaire: "Transitaire",
  regie_pub: "Régie pub",
  client: "Client",
};

/* ─── Stats globales ─── */

export type FinanceStats = {
  /** CA total vendu = encaissé + à recevoir (toutes ventes confirmées) */
  caTotal: number;
  /** Argent déjà dans la caisse vendeur */
  caEncaisse: number;
  /** Argent encaissé par le livreur, pas encore versé au vendeur */
  aRecevoir: number;
  /** Coûts engagés total (à_payer + paye, toutes catégories sortie) */
  coutsEngages: number;
  /** Coûts déjà payés */
  coutsPayes: number;
  /** Bénéfice brut = CA total - Coûts engagés (incluant les pubs) */
  beneficeBrut: number;
  /** Solde dû à tous les partenaires (a_payer total) */
  soldeDu: number;
  /** Pourcentage de marge brute sur le CA */
  margePct: number;
  /** Cash réel en caisse = encaissé - déjà payé */
  enCaisseReel: number;
};

export function computeFinanceStats(movements: FinanceMovement[]): FinanceStats {
  let caEncaisse = 0;
  let aRecevoir = 0;
  let coutsEngages = 0;
  let coutsPayes = 0;
  let soldeDu = 0;

  for (const m of movements) {
    if (m.direction === "in") {
      if (m.status === "encaisse") caEncaisse += m.amountXof;
      if (m.status === "a_recevoir") aRecevoir += m.amountXof;
    }
    if (m.direction === "out") {
      coutsEngages += m.amountXof;
      if (m.status === "paye") coutsPayes += m.amountXof;
      if (m.status === "a_payer") soldeDu += m.amountXof;
    }
  }

  const caTotal = caEncaisse + aRecevoir;
  const beneficeBrut = caTotal - coutsEngages;
  const margePct =
    caTotal > 0 ? Math.round((beneficeBrut / caTotal) * 100) : 0;
  const enCaisseReel = caEncaisse - coutsPayes;

  return {
    caTotal,
    caEncaisse,
    aRecevoir,
    coutsEngages,
    coutsPayes,
    beneficeBrut,
    soldeDu,
    margePct,
    enCaisseReel,
  };
}

/**
 * Ventilation des coûts par type — pour graphiques / cards "où va l'argent".
 */
export type CostBreakdown = {
  type: MovementType;
  label: string;
  amount: number;
  pct: number; // % du total des coûts
};

/**
 * Catégories de coûts à afficher dans la ventilation des charges.
 * Affichées même quand leur montant est 0 sur la période, pour que le vendeur
 * connaisse en permanence ses postes de dépense.
 *
 * Exclus volontairement :
 *  - `commission_closeuse` : auto-déduite par la closeuse du cash livreur
 *    (mode centralisé) ou par le vendeur via versement, mais ce n'est pas
 *    une sortie cash directe du vendeur.
 *  - `frais_livreur` : auto-déduit par le livreur sur le cash encaissé
 *    avant versement au vendeur. Le vendeur ne sort jamais d'argent pour ça.
 */
const COST_CATEGORIES: MovementType[] = [
  "cout_marchandise",
  "depense_pub",
  "frais_transit",
  "remboursement",
];

const COST_CATEGORIES_SET = new Set<MovementType>(COST_CATEGORIES);

export function computeCostBreakdown(
  movements: FinanceMovement[],
): CostBreakdown[] {
  const totals = new Map<MovementType, number>();
  let total = 0;

  for (const m of movements) {
    if (m.direction !== "out") continue;
    // On exclut commission/frais livreur qui ne sortent pas du cash vendeur
    if (!COST_CATEGORIES_SET.has(m.type)) continue;
    const cur = totals.get(m.type) ?? 0;
    totals.set(m.type, cur + m.amountXof);
    total += m.amountXof;
  }

  const result: CostBreakdown[] = COST_CATEGORIES.map((type) => {
    const amount = totals.get(type) ?? 0;
    return {
      type,
      label: MOVEMENT_TYPE_LABELS[type],
      amount,
      pct: total > 0 ? Math.round((amount / total) * 100) : 0,
    };
  });

  return result.sort((a, b) => b.amount - a.amount);
}

/**
 * Solde dû à un partenaire spécifique = somme des mouvements "a_payer" pour ce partenaire.
 */
export type PartnerBalance = {
  partner: Partner;
  amountDue: number;
  amountPaid: number;
  movements: FinanceMovement[];
};

/**
 * Dette d'un livreur envers le vendeur = somme des ventes encaissées en
 * statut "a_recevoir" (cash chez le livreur, pas encore versé au vendeur).
 *
 * Utilisé dans la card "Argent à recevoir" pour montrer qui doit quoi.
 */
export type LivreurReceivable = {
  partner: Partner;
  amountToReceive: number;
  /** Nb de livraisons concernées */
  deliveryCount: number;
};

export function computeLivreurReceivables(
  movements: FinanceMovement[],
): LivreurReceivable[] {
  const map = new Map<string, LivreurReceivable>();
  for (const m of movements) {
    if (m.direction !== "in") continue;
    if (m.status !== "a_recevoir") continue;
    if (!m.partner || m.partner.type !== "livreur") continue;
    const key = `${m.partner.type}:${m.partner.name}`;
    const cur = map.get(key);
    if (cur) {
      cur.amountToReceive += m.amountXof;
      cur.deliveryCount += 1;
    } else {
      map.set(key, {
        partner: m.partner,
        amountToReceive: m.amountXof,
        deliveryCount: 1,
      });
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => b.amountToReceive - a.amountToReceive,
  );
}

export function computePartnerBalances(
  movements: FinanceMovement[],
): PartnerBalance[] {
  const map = new Map<string, PartnerBalance>();

  for (const m of movements) {
    if (m.direction !== "out" || !m.partner) continue;
    const key = `${m.partner.type}:${m.partner.name}`;
    const existing = map.get(key);
    if (existing) {
      if (m.status === "a_payer") existing.amountDue += m.amountXof;
      if (m.status === "paye") existing.amountPaid += m.amountXof;
      existing.movements.push(m);
    } else {
      map.set(key, {
        partner: m.partner,
        amountDue: m.status === "a_payer" ? m.amountXof : 0,
        amountPaid: m.status === "paye" ? m.amountXof : 0,
        movements: [m],
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.amountDue - a.amountDue);
}

/* ─── Versements (cash transferts livreur/closeuse → vendeur) ─── */

/**
 * Mode de versement défini par le vendeur dans ses paramètres.
 *  - "direct"      : chaque livreur lui verse directement
 *  - "centralized" : sa closeuse centralise tous les versements
 */
export type CashFlowModel = "direct" | "centralized";

export type VersementStatus =
  /** Déclaré par le porteur de cash, pas encore validé par le vendeur */
  | "en_attente_validation"
  /** Vendeur a confirmé avoir reçu le bon montant */
  | "valide"
  /** Vendeur a contesté le montant — un Dispute est ouvert */
  | "en_litige";

export type VersementSource = {
  /** Qui a versé : livreur (mode direct) OU closeuse (mode centralisé) */
  type: "livreur" | "closeuse";
  /** Identifiant interne (slug ou id) */
  ref: string;
  /** Nom affichable */
  name: string;
};

export type Versement = {
  id: string;
  /** ISO date du versement */
  date: string;
  amountXof: number;
  versedBy: VersementSource;
  status: VersementStatus;
  /** Note libre du porteur (ex: "Versement partiel, reste demain") */
  note?: string;
  /**
   * URL de la capture d'écran du paiement (Wave / OM / cash) contenant l'ID
   * de la transaction. OBLIGATOIRE en V2 pour qu'un versement soit déclaré —
   * c'est la preuve de bonne foi du livreur.
   */
  proofUrl?: string;
  /** ID de transaction lu sur la capture (Wave/OM) — affiché en clair */
  transactionId?: string;
  /**
   * Moyen de paiement déclaré par le livreur lors de l'envoi.
   * V1 mock : valeur en dur. V2 : champ libre dans le formulaire livreur
   * (PWA), avec suggestions Wave / Orange Money / Free Money / Wari / Cash.
   */
  paymentMethod?: string;
  /**
   * Numéro de téléphone destinataire (wallet du vendeur) sur lequel le
   * livreur a effectué l'envoi. Permet au vendeur de croiser avec son
   * relevé wallet. Saisi par le livreur lors de la déclaration.
   */
  recipientPhone?: string;
  /** Si en litige, ID du Dispute associé */
  disputeId?: string;
  /** Date de validation par le vendeur (si valide) */
  validatedAt?: string;
};

/* ─── Disputes (système générique) ─── */

export type DisputeType =
  | "versement_partiel"
  | "commande_non_recue"
  | "commission_due"
  | "frais_livreur_du"
  | "produit_defectueux"
  | "client_problematique"
  | "autre";

export const DISPUTE_TYPE_LABELS: Record<DisputeType, string> = {
  versement_partiel: "Versement incorrect",
  commande_non_recue: "Commande non reçue",
  commission_due: "Commission impayée",
  frais_livreur_du: "Frais livreur impayés",
  produit_defectueux: "Produit défectueux",
  client_problematique: "Client problématique",
  autre: "Autre",
};

export type DisputeParty = {
  type: "vendeur" | "closeuse" | "livreur" | "client";
  id: string;
  name: string;
};

export type DisputeStatus =
  | "ouvert"
  | "en_resolution"
  | "resolu_favorable"
  | "resolu_defavorable"
  | "annule";

export const DISPUTE_STATUS_LABELS: Record<DisputeStatus, string> = {
  ouvert: "Ouvert",
  en_resolution: "En résolution",
  resolu_favorable: "Résolu (favorable)",
  resolu_defavorable: "Résolu (défavorable)",
  annule: "Annulé",
};

export const DISPUTE_STATUS_TONE: Record<
  DisputeStatus,
  { bg: string; fg: string }
> = {
  ouvert: { bg: "bg-red-50", fg: "text-red-700" },
  en_resolution: { bg: "bg-amber-50", fg: "text-amber-700" },
  resolu_favorable: { bg: "bg-emerald-50", fg: "text-emerald-700" },
  resolu_defavorable: { bg: "bg-paper-2", fg: "text-ink-500" },
  annule: { bg: "bg-paper-2", fg: "text-ink-500" },
};

export type Dispute = {
  id: string;
  type: DisputeType;
  raisedBy: DisputeParty;
  against: DisputeParty;
  description: string;
  /** Montant attendu (selon le plaignant) — si litige financier */
  expectedXof?: number;
  /** Montant réel (selon l'autre partie) — si litige financier */
  actualXof?: number;
  /** URL d'une preuve : photo, screenshot WhatsApp (V2) */
  evidence?: string;
  status: DisputeStatus;
  resolutionNote?: string;
  createdAt: string;
  resolvedAt?: string;
  /** Liens contextuels */
  orderId?: string;
  versementId?: string;
};

/* ─── Helpers cash flow & disputes ─── */

/**
 * Total brut encaissé par un livreur (ou closeuse en mode centralisé).
 * = somme des ventes_encaissées dont le partner est ce livreur.
 */
export function grossCashByPorter(
  movements: FinanceMovement[],
  porterRef: string,
): number {
  let total = 0;
  for (const m of movements) {
    if (m.direction !== "in") continue;
    if (m.type !== "vente_encaissee") continue;
    if (m.partner?.ref !== porterRef) continue;
    total += m.amountXof;
  }
  return total;
}

/**
 * Frais opérationnels que le livreur DÉDUIT directement du cash avant de
 * verser au vendeur (= sa propre commission de livraison).
 */
export function operationalFeesByLivreur(
  movements: FinanceMovement[],
  livreurRef: string,
): number {
  let total = 0;
  for (const m of movements) {
    if (m.type !== "frais_livreur") continue;
    if (m.partner?.ref !== livreurRef) continue;
    total += m.amountXof;
  }
  return total;
}

/**
 * Frais opérationnels que la closeuse DÉDUIT du cash avant de verser au
 * vendeur en mode centralisé (= sa commission + tous les frais livreurs).
 */
export function operationalFeesByCloseuse(
  movements: FinanceMovement[],
  closeuseName: string,
): number {
  let total = 0;
  for (const m of movements) {
    if (m.type === "commission_closeuse" && m.partner?.name === closeuseName) {
      total += m.amountXof;
    }
    if (m.type === "frais_livreur") {
      total += m.amountXof;
    }
  }
  return total;
}

/**
 * Récap de dette par livreur (V1 simplifié).
 *
 * Règle : tant que le vendeur n'a pas validé un versement, le cash est
 * considéré comme TOUJOURS chez le livreur. Un versement déclaré (en attente)
 * est juste une « promesse » qu'il a envoyé — on n'en tient compte qu'à la
 * validation. Donc :
 *
 *  - dueGross     : total brut encaissé sur ses livraisons
 *  - autoDeducted : ses propres frais de livraison (auto-retenus)
 *  - alreadyPaid  : ce qu'il a déjà versé ET que le vendeur a validé
 *  - pendingPaid  : déclaré mais pas validé — pour info uniquement
 *  - dueNet       : reste chez lui = gross − déduit − validé
 *
 * Quand dueNet ≤ 0, le livreur n'apparaît pas (il n'y a plus rien chez lui).
 */
export type PorterDebt = {
  porter: VersementSource;
  dueGross: number;
  autoDeducted: number;
  alreadyPaid: number;
  pendingPaid: number;
  dueNet: number;
};

export function computePorterDebts(
  movements: FinanceMovement[],
  versements: Versement[],
): PorterDebt[] {
  const livreurNames = new Map<string, { ref: string; name: string }>();
  for (const m of movements) {
    if (
      m.partner?.type === "livreur" &&
      m.type === "vente_encaissee" &&
      m.direction === "in"
    ) {
      const key = m.partner.ref ?? m.partner.name;
      if (!livreurNames.has(key)) {
        livreurNames.set(key, {
          ref: m.partner.ref ?? m.partner.name,
          name: m.partner.name,
        });
      }
    }
  }

  const out: PorterDebt[] = [];
  for (const { ref, name } of livreurNames.values()) {
    const dueGross = grossCashByPorter(movements, ref);
    const autoDeducted = operationalFeesByLivreur(movements, ref);
    const livreurVersements = versements.filter(
      (v) => v.versedBy.type === "livreur" && v.versedBy.ref === ref,
    );
    const alreadyPaid = livreurVersements
      .filter((v) => v.status === "valide")
      .reduce((s, v) => s + v.amountXof, 0);
    const pendingPaid = livreurVersements
      .filter((v) => v.status === "en_attente_validation")
      .reduce((s, v) => s + v.amountXof, 0);
    const dueNet = dueGross - autoDeducted - alreadyPaid;
    if (dueNet > 0) {
      out.push({
        porter: { type: "livreur", ref, name },
        dueGross,
        autoDeducted,
        alreadyPaid,
        pendingPaid,
        dueNet,
      });
    }
  }

  return out.sort((a, b) => b.dueNet - a.dueNet);
}

/* ─── Filtre période globale ─── */

export type FinancePeriod = "7d" | "30d" | "90d" | "365d" | "all";

export const PERIOD_LABELS: Record<FinancePeriod, string> = {
  "7d": "7 derniers jours",
  "30d": "30 derniers jours",
  "90d": "90 derniers jours",
  "365d": "12 derniers mois",
  all: "Tout l'historique",
};

/** Filtre une liste de mouvements selon la période choisie */
export function filterByPeriod(
  movements: FinanceMovement[],
  period: FinancePeriod,
  today: Date = new Date(),
): FinanceMovement[] {
  if (period === "all") return movements;
  const daysMap: Record<Exclude<FinancePeriod, "all">, number> = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "365d": 365,
  };
  const days = daysMap[period];
  const cutoff = today.getTime() - days * 24 * 60 * 60 * 1000;
  return movements.filter((m) => new Date(m.date).getTime() >= cutoff);
}

/**
 * Bucketing automatique du graphe selon la période choisie :
 *  - 7d  → 7 buckets jour
 *  - 30d → 30 buckets jour
 *  - 90d → 13 buckets semaine
 *  - 365d → 12 buckets mois
 *  - all → 24 buckets mois (~2 ans rolling)
 */
export function bucketingForPeriod(
  period: FinancePeriod,
): { granularity: TimelinePeriod; count: number } {
  switch (period) {
    case "7d":
      return { granularity: "day", count: 7 };
    case "30d":
      return { granularity: "day", count: 30 };
    case "90d":
      return { granularity: "week", count: 13 };
    case "365d":
      return { granularity: "month", count: 12 };
    case "all":
      return { granularity: "month", count: 24 };
  }
}

/* ─── Timeline trésorerie ─── */

export type TimelinePeriod = "hour" | "day" | "week" | "month" | "year";

export type TimelinePoint = {
  /** ISO ou label court selon période */
  label: string;
  /** Date de début du bucket */
  date: string;
  /** Argent rentré sur la période (encaissements + à recevoir) */
  in: number;
  /** Argent sorti sur la période (toutes catégories de coûts) */
  out: number;
  /** Solde net sur la période = in - out */
  net: number;
};

/**
 * Bucketise les mouvements par période et calcule les flux par bucket.
 * Sur une fenêtre glissante des N derniers buckets selon la période choisie.
 */
export function computeCashflowTimeline(
  movements: FinanceMovement[],
  period: TimelinePeriod,
  bucketCount: number = period === "day"
    ? 14
    : period === "week"
      ? 12
      : period === "month"
        ? 12
        : 5,
  today: Date = new Date("2026-05-04T12:00:00Z"),
): TimelinePoint[] {
  const buckets: TimelinePoint[] = [];

  for (let i = bucketCount - 1; i >= 0; i--) {
    const start = bucketStart(today, period, i);
    const end = bucketStart(today, period, i - 1);
    buckets.push({
      label: bucketLabel(start, period),
      date: start.toISOString(),
      in: 0,
      out: 0,
      net: 0,
    });

    for (const m of movements) {
      const t = new Date(m.date).getTime();
      if (t < start.getTime() || t >= end.getTime()) continue;
      const last = buckets[buckets.length - 1];
      if (m.direction === "in") last.in += m.amountXof;
      if (m.direction === "out") last.out += m.amountXof;
    }
    const last = buckets[buckets.length - 1];
    last.net = last.in - last.out;
  }

  return buckets;
}

function bucketStart(today: Date, period: TimelinePeriod, offset: number): Date {
  const d = new Date(today);
  switch (period) {
    case "hour":
      // On garde la date courante mais on aligne à l'heure exacte ; offset = nb
      // d'heures dans le passé (offset 0 = heure courante).
      d.setUTCMinutes(0, 0, 0);
      d.setUTCHours(d.getUTCHours() - offset);
      return d;
    case "day":
      d.setUTCHours(0, 0, 0, 0);
      d.setUTCDate(d.getUTCDate() - offset);
      return d;
    case "week": {
      d.setUTCHours(0, 0, 0, 0);
      // Lundi de la semaine
      const day = d.getUTCDay();
      const diff = (day + 6) % 7; // lundi = 0
      d.setUTCDate(d.getUTCDate() - diff - offset * 7);
      return d;
    }
    case "month":
      d.setUTCHours(0, 0, 0, 0);
      d.setUTCDate(1);
      d.setUTCMonth(d.getUTCMonth() - offset);
      return d;
    case "year":
      d.setUTCHours(0, 0, 0, 0);
      d.setUTCMonth(0, 1);
      d.setUTCFullYear(d.getUTCFullYear() - offset);
      return d;
  }
}

function bucketLabel(d: Date, period: TimelinePeriod): string {
  switch (period) {
    case "hour":
      // Ex: « 14 h », « 00 h » — espace entre nombre et unité (style éditorial
      // type Shopify), plus aéré qu'un « 14h » collé.
      return `${String(d.getUTCHours()).padStart(2, "0")} h`;
    case "day":
      return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
    case "week":
      // Date du lundi de la semaine, ex: "01 avr"
      return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
    case "month":
      return d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
    case "year":
      return String(d.getUTCFullYear());
  }
}
