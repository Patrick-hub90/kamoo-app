import type { CountryCode } from "@/lib/data/countries";

/**
 * Statuts logistiques (3 valeurs validées avec le fondateur).
 * On reste minimaliste pour le MVP.
 */
export type ExpeditionStatus =
  | "received_china" // Reçu en Chine
  | "awaiting_quote" // En attente devis
  | "arrived_destination"; // Arrivé à destination

/**
 * Statuts financiers (2 valeurs validées avec le fondateur).
 */
export type PaymentStatus = "paid" | "unpaid";

export type TransportMode = "air_express" | "air_standard" | "sea";

export type Expedition = {
  id: string;
  publicCode: string; // KMO-SN-78421
  vendorId: string;
  destinationCountry: CountryCode;
  status: ExpeditionStatus;
  paymentStatus: PaymentStatus;

  // Produit principal
  productName: string;
  otherProductsCount: number;
  thumb: { emoji: string; bg: string };

  // Transitaire
  transitaire: {
    name: string;
    avatar: string; // 2 lettres
    avatarBg: string; // gradient CSS
    rating: number; // 4.9
    /**
     * Politique de paiement du transitaire :
     *  - "upfront" : paie avant l'expédition de Chine
     *  - "on_arrival" : paie à l'arrivée du colis dans le pays de destination
     */
    paymentPolicy: "upfront" | "on_arrival";
    /**
     * Catégories de produits que ce transitaire REFUSE d'expédier.
     * Le vendeur les voit avant de s'engager + à la création.
     */
    refusedCategories: string[];
  };

  // Transport
  transportMode: TransportMode;

  // Dates
  eta: string; // libre format pour l'instant : "18 nov. 2025" ou "Arrivé · 28 oct."
  createdAt: string;

  // Argent
  amountXof: number | null; // null = pas encore de devis

  // Action requise (optionnelle)
  action: {
    label: string;
    href: string;
    urgent: boolean;
  } | null;
};

/* ─── Helpers d'affichage ────────────────────────────────────────────── */

export const STATUS_LABELS: Record<ExpeditionStatus, string> = {
  received_china: "Reçu en Chine",
  awaiting_quote: "En attente devis",
  arrived_destination: "Arrivé à destination",
};

/**
 * Labels compacts pour les contextes serrés (carte de liste, badges).
 * Le mot manquant est compris du contexte (statut d'une expédition →
 * « Reçu » = reçu chez le transitaire en Chine, etc.).
 */
export const STATUS_LABELS_SHORT: Record<ExpeditionStatus, string> = {
  received_china: "Reçu",
  awaiting_quote: "En attente",
  arrived_destination: "Arrivé",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: "Payé",
  unpaid: "Non payé",
};

export const TRANSPORT_MODE_LABELS: Record<TransportMode, string> = {
  air_express: "Aérien express",
  air_standard: "Aérien standard",
  sea: "Maritime",
};

export const TRANSPORT_MODE_ICONS: Record<TransportMode, string> = {
  air_express: "✈️",
  air_standard: "✈️",
  sea: "🚢",
};
