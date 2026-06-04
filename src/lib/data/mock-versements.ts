import type {
  CashFlowModel,
  Dispute,
  Versement,
} from "@/lib/types/finance";

/**
 * Réglage vendeur — mode de versement choisi.
 *
 * V1 : valeur statique. V2 : sera persisté dans Supabase et configurable
 * dans /parametres/finances.
 *
 * Pour démo : on laisse "direct" par défaut (le cas le plus courant).
 * Changer en "centralized" pour voir le cas closeuse-relais.
 */
export const MOCK_VENDOR_CASH_FLOW_MODEL: CashFlowModel = "direct";

/**
 * Versements mock — déclarés par les livreurs quand ils envoient du cash au vendeur.
 *
 * Algorithme V1 :
 *  1. Livreur encaisse → cash chez lui
 *  2. Livreur déclare un versement (montant ≤ ce qu'il doit)
 *     → `en_attente_validation`
 *  3. Vendeur valide (j'ai bien reçu) ou invalide (pas reçu)
 *     → `valide` ou `en_litige`
 *
 * Mix de cas pour la démo :
 *  - 2 versements `en_attente_validation` → permet de voir les boutons Valider/Pas reçu
 *  - 2 versements déjà `valide` → décrémentent les soldes dûs
 *
 * Dates récentes (~mai 2026) cohérentes avec MOCK_TODAY.
 */
export const MOCK_VERSEMENTS: Versement[] = [
  // ── Versements en attente de validation (action requise) ──
  // Variété de cas pour tester l'UI : différents wallets, avec/sans capture,
  // avec/sans ID transaction, montants variés, heures variées, multi-versements
  // d'un même livreur dans la journée.

  // Numéro wallet du vendeur (Aïcha Diop) — destinataire de tous les
  // versements mobile money. En V2 : récupéré depuis ses paramètres compte.
  // ── Versements ──

  // Cas standard : Wave avec capture + ID — le cas heureux
  {
    id: "vrs_pending_001",
    date: "2026-05-04T09:30:00Z",
    amountXof: 18000,
    versedBy: {
      type: "livreur",
      ref: "lv_moussa",
      name: "Moussa Sow",
    },
    status: "en_attente_validation",
    transactionId: "WV2026050409TX87432",
    proofUrl: "/mock-proofs/wave-moussa-18000.png",
    paymentMethod: "Wave",
    recipientPhone: "+221 77 412 88 03",
  },
  // Cas standard : Orange Money — gros montant
  {
    id: "vrs_pending_002",
    date: "2026-05-04T11:15:00Z",
    amountXof: 25000,
    versedBy: {
      type: "livreur",
      ref: "lv_ibrahima",
      name: "Ibrahima Sarr",
    },
    status: "en_attente_validation",
    transactionId: "OM26050410993",
    proofUrl: "/mock-proofs/om-ibrahima-25000.png",
    paymentMethod: "Orange Money",
    recipientPhone: "+221 78 209 14 56",
  },
  // Multi-versement même livreur : Moussa renvoie 12 500 F l'après-midi
  {
    id: "vrs_pending_003",
    date: "2026-05-04T14:20:00Z",
    amountXof: 12500,
    versedBy: {
      type: "livreur",
      ref: "lv_moussa",
      name: "Moussa Sow",
    },
    status: "en_attente_validation",
    transactionId: "WV2026050414TX91205",
    proofUrl: "/mock-proofs/wave-moussa-12500.png",
    paymentMethod: "Wave",
    recipientPhone: "+221 77 412 88 03",
  },
  // Cas edge : montant non rond, Free Money, capture sans ID lisible
  {
    id: "vrs_pending_004",
    date: "2026-05-04T15:45:00Z",
    amountXof: 7350,
    versedBy: {
      type: "livreur",
      ref: "lv_moussa",
      name: "Moussa Sow",
    },
    status: "en_attente_validation",
    proofUrl: "/mock-proofs/freemoney-moussa-7350.jpg",
    paymentMethod: "Free Money",
    recipientPhone: "+221 76 555 22 18",
  },
  // Cas edge : ID sans capture (livreur a tapé l'ID à la main)
  {
    id: "vrs_pending_005",
    date: "2026-05-04T08:10:00Z",
    amountXof: 30000,
    versedBy: {
      type: "livreur",
      ref: "lv_ibrahima",
      name: "Ibrahima Sarr",
    },
    status: "en_attente_validation",
    transactionId: "OM26050408455",
    paymentMethod: "Orange Money",
    recipientPhone: "+221 78 209 14 56",
  },
  // Cas suspect : aucune preuve — devrait inciter à demander capture.
  // Cash en main propre : pas de wallet ni numéro destinataire.
  {
    id: "vrs_pending_006",
    date: "2026-05-04T16:30:00Z",
    amountXof: 5500,
    versedBy: {
      type: "livreur",
      ref: "lv_ibrahima",
      name: "Ibrahima Sarr",
    },
    status: "en_attente_validation",
    paymentMethod: "Espèces",
  },
  // Très récent : il y a quelques minutes (timestamp < MOCK_TODAY)
  {
    id: "vrs_pending_007",
    date: "2026-05-04T11:50:00Z",
    amountXof: 32000,
    versedBy: {
      type: "livreur",
      ref: "lv_moussa",
      name: "Moussa Sow",
    },
    status: "en_attente_validation",
    transactionId: "WV2026050411TX95001",
    proofUrl: "/mock-proofs/wave-moussa-32000.png",
    paymentMethod: "Wave",
    recipientPhone: "+221 77 412 88 03",
  },

  // ── Versements déjà validés (historique) ──
  {
    id: "vrs_001",
    date: "2026-05-03T17:00:00Z",
    amountXof: 15000,
    versedBy: {
      type: "livreur",
      ref: "lv_moussa",
      name: "Moussa Sow",
    },
    status: "valide",
    validatedAt: "2026-05-03T17:05:00Z",
    paymentMethod: "Wave",
    recipientPhone: "+221 77 412 88 03",
    transactionId: "WV2026050317TX44128",
  },
  {
    id: "vrs_002",
    date: "2026-04-30T19:00:00Z",
    amountXof: 10000,
    versedBy: {
      type: "livreur",
      ref: "lv_ibrahima",
      name: "Ibrahima Sarr",
    },
    status: "valide",
    validatedAt: "2026-04-30T20:15:00Z",
    paymentMethod: "Orange Money",
    recipientPhone: "+221 78 209 14 56",
    transactionId: "OM26043019082",
  },
];

/**
 * Disputes mock — minimal : juste l'objet, le montant si pertinent, les parties.
 * Pas de longue description — en prod c'est généré automatiquement par l'app.
 */
export const MOCK_DISPUTES: Dispute[] = [
  {
    id: "dsp_001",
    type: "versement_partiel",
    raisedBy: {
      type: "vendeur",
      id: "v_aicha",
      name: "Aïcha Diop",
    },
    against: {
      type: "livreur",
      id: "lv_moussa",
      name: "Moussa Sow",
    },
    description: "Différence de versement",
    expectedXof: 25000,
    actualXof: 20000,
    status: "ouvert",
    createdAt: "2026-05-02T19:00:00Z",
  },
];

export function getVersementById(id: string): Versement | undefined {
  return MOCK_VERSEMENTS.find((v) => v.id === id);
}

export function getDisputeById(id: string): Dispute | undefined {
  return MOCK_DISPUTES.find((d) => d.id === id);
}

/** Tous les disputes ouverts ou en cours de résolution */
export function getActiveDisputes(): Dispute[] {
  return MOCK_DISPUTES.filter(
    (d) => d.status === "ouvert" || d.status === "en_resolution",
  );
}
