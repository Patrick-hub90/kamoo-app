import type { Expedition } from "./expedition";

/**
 * Vue détaillée d'une expédition (utilisée sur l'écran /expeditions/[id]).
 * Étend les infos de la liste avec produits, photos, devis, historique.
 */

export type Product = {
  name: string;
  cartons: number;
  weightDeclared: number; // kg, déclaré par le vendeur
};

export type Quote = {
  issuedAt: string;
  validUntil: string;
  weightKg: number;
  /** Volume en m³ (CBM), optionnel — pertinent surtout pour le maritime */
  volumeCbm?: number;
  /** Tarif unitaire (au kg pour avion, au m³ pour maritime) */
  unitCost: {
    amountXof: number;
    unit: "kg" | "cbm";
  };
  totalXof: number;
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
