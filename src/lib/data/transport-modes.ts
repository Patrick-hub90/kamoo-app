import type { TransportMode } from "@/lib/types/expedition";

export type TransportModeData = {
  id: TransportMode;
  label: string;
  sub: string;
  delay: string;
  bestFor: string;
  icon: "Ship" | "Plane" | "Zap";
  recommended?: boolean;
  /** Tarif indicatif "à partir de" — sert à comparer les modes au choix */
  unitCostFromXof: number;
  unit: "kg" | "cbm";
};

export const TRANSPORT_MODES_DATA: TransportModeData[] = [
  {
    id: "sea",
    label: "Maritime",
    sub: "Économique",
    delay: "35–45 jours",
    bestFor: "Gros volumes, non urgent",
    icon: "Ship",
    unitCostFromXof: 75_000,
    unit: "cbm",
  },
  {
    id: "air_standard",
    label: "Aérien Standard",
    sub: "Équilibré",
    delay: "8–12 jours",
    bestFor: "Recommandé pour la plupart",
    icon: "Plane",
    recommended: true,
    unitCostFromXof: 5_500,
    unit: "kg",
  },
  {
    id: "air_express",
    label: "Aérien Express",
    sub: "Le plus rapide",
    delay: "3–5 jours",
    bestFor: "Produits à forte valeur, urgent",
    icon: "Zap",
    unitCostFromXof: 8_200,
    unit: "kg",
  },
];
