import type { Expedition } from "./expedition";

/**
 * Vue détaillée d'une expédition (utilisée sur l'écran /expeditions/[id]).
 * Étend les infos de la liste avec produits, photos, devis, historique.
 */

export type Product = {
  name: string;
  cartons: number;
  weightDeclared: number; // kg
  weightActual: number | null; // null tant que pas pesé
  photosDeclared: { emoji: string; bg: string }[];
  photosReceived: { emoji: string; bg: string }[];
};

export type QuoteLine = {
  label: string;
  amountXof: number;
};

export type Quote = {
  issuedAt: string;
  validUntil: string;
  lines: QuoteLine[];
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
  trackingNumber: string | null;
  trackingCarrier: string | null;
  aiCategory: { label: string; emoji: string };
  products: Product[];
  quote: Quote | null;
  history: HistoryEvent[];
};
