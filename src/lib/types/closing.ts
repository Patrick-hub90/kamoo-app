/**
 * Types pour le Module Closing (côté vendeur).
 */

export type ClosingStatus =
  | "to_call" // À appeler
  | "called" // Appelée mais pas encore de décision
  | "callback_scheduled" // Rappel planifié à une date
  | "confirmed" // Confirmée, prête pour livraison
  | "cancelled" // Annulée par la closeuse
  | "delivered"; // Livrée (statut final)

export type CancellationReason =
  | "wrong_number"
  | "no_money"
  | "no_answer_3_attempts"
  | "client_traveling"
  | "refused_product"
  | "negotiation_failed"
  | "other";

export type ClosingAssignment = {
  id: string;
  publicCode: string; // ex: ORD-SN-2026-00128
  /** Produit principal */
  productName: string;
  productEmoji: string;
  productBg: string;
  /** Client */
  client: {
    name: string;
    phone: string;
    city: string;
    isReturning: boolean; // déjà commandé avant
  };
  /** Montant total commande */
  amountXof: number;
  /** Statut closing */
  status: ClosingStatus;
  /** Si callback_scheduled, quand ? */
  callbackAt?: string;
  /** Si confirmed, date livraison souhaitée */
  scheduledDeliveryAt?: string;
  /** Si cancelled, motif */
  cancellationReason?: CancellationReason;
  /** Date dernière activité (appel, etc.) */
  lastActivityAt: string;
  /** Date de création de la commande */
  createdAt: string;
  /** Nombre de tentatives d'appel déjà faites */
  callAttempts: number;
};

export const CLOSING_STATUS_LABELS: Record<ClosingStatus, string> = {
  to_call: "À appeler",
  called: "Appelée",
  callback_scheduled: "Rappel planifié",
  confirmed: "Confirmée",
  cancelled: "Annulée",
  delivered: "Livrée",
};

export const CANCELLATION_REASON_LABELS: Record<CancellationReason, string> = {
  wrong_number: "Faux numéro",
  no_money: "Pas d'argent",
  no_answer_3_attempts: "Injoignable (3 tentatives)",
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
  startedAt: string; // ex: "2024-09-15"
};
