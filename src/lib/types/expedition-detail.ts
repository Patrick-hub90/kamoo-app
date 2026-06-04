import type { Expedition } from "./expedition";

/**
 * Vue détaillée d'une expédition (utilisée sur l'écran /expeditions/[id]).
 * Étend les infos de la liste avec produits, photos, devis, historique.
 */

export type Product = {
  name: string;
  cartons: number;
  weightDeclared: number; // kg, déclaré par le vendeur
  /** Photos uploadées par le vendeur à la création */
  photosDeclared: { emoji: string; bg: string }[];
};

export type Quote = {
  issuedAt: string;
  validUntil: string;
  /**
   * Description libre du transitaire — détaille l'état du colis reçu,
   * les opérations effectuées (consolidation, palettisation…) et la base
   * de calcul du devis. Donne au vendeur le contexte humain derrière le
   * chiffre final.
   */
  description: string;
  /** Nombre de cartons réellement comptés par le transitaire à réception */
  cartons: number;
  weightKg: number;
  /** Volume en m³ (CBM), optionnel — pertinent surtout pour le maritime */
  volumeCbm?: number;
  /** Tarif unitaire (au kg pour avion, au m³ pour maritime) */
  unitCost: {
    amountXof: number;
    unit: "kg" | "cbm";
  };
  totalXof: number;
  /**
   * Photo de confirmation envoyée par le transitaire lors de la réception
   * du colis en Chine. Stockée en V1 comme {emoji, bg} ; en prod sera une
   * URL d'image S3 uploadée via la PWA Transitaire.
   */
  photo: { emoji: string; bg: string };
};

export type HistoryEvent = {
  date: string;
  authorName: string;
  authorRole: "vendor" | "system" | "transitaire" | "carrier" | "admin";
  icon: "plus" | "box" | "camera" | "sparkle" | "ship" | "globe" | "wallet" | "check";
  label: string;
  detail: string;
};

export type ExpeditionDetail = Expedition & {
  warehouseAddress: string;
  destinationCity: string;
  destinationCityFlag: string;
  aiCategory: { label: string; emoji: string };
  products: Product[];
  quote: Quote | null;
  history: HistoryEvent[];

  currentStage: {
    emoji: string;
    label: string;
    sub: string;
  };
  /** 0=Soumis, 1=Reçu en Chine, 2=Arrivé à destination */
  progress: number;
  transitaireReviews: number;
  dateSubmitted: string;
};
