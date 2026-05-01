/**
 * Types pour le Module Closing (côté vendeur).
 */

export type ClosingStatus =
  | "nouvelle" // À appeler (par défaut quand commande arrive)
  | "rappele" // Appelée + rappel planifié OU client demande à être rappelé
  | "livraison_en_cours" // Confirmée par closeuse, en cours / partie à la livraison
  | "annule" // Annulée
  | "injoignable"; // Plusieurs tentatives sans réponse

export type CancellationReason =
  | "wrong_number"
  | "no_money"
  | "client_traveling"
  | "refused_product"
  | "negotiation_failed"
  | "other";

export type ClosingAssignment = {
  id: string;
  publicCode: string;
  productName: string;
  productEmoji: string;
  productBg: string;
  quantity: number;
  client: {
    name: string;
    phone: string;
    whatsapp?: string;
    city: string;
    isReturning: boolean;
  };
  amountXof: number;
  status: ClosingStatus;
  /** Si rappele, quand ? */
  callbackAt?: string;
  /** Si livraison_en_cours, ETA livraison */
  scheduledDeliveryAt?: string;
  /** Si annule, motif */
  cancellationReason?: CancellationReason;
  /** Commentaire libre laissé par la closeuse */
  comment?: string;
  /** Date dernière activité */
  lastActivityAt: string;
  /** Date de création de la commande */
  createdAt: string;
  /** Nombre de tentatives d'appel déjà faites */
  callAttempts: number;
};

export const CLOSING_STATUS_LABELS: Record<ClosingStatus, string> = {
  nouvelle: "Nouvelle",
  rappele: "Rappelé",
  livraison_en_cours: "Livraison en cours",
  annule: "Annulé",
  injoignable: "Injoignable",
};

export const CANCELLATION_REASON_LABELS: Record<CancellationReason, string> = {
  wrong_number: "Faux numéro",
  no_money: "Pas d'argent",
  client_traveling: "Client en voyage",
  refused_product: "Refus du produit",
  negotiation_failed: "Négociation échouée",
  other: "Autre",
};

export type ActiveCloseuse = {
  id: string;
  name: string;
  phone: string;
  avatarBg: string;
  rating: number;
  reviewsCount: number;
  startedAt: string;
};
