import type { TransportMode } from "@/lib/types/expedition";

export type TransportModeData = {
  id: TransportMode;
  label: string;
  sub: string;
  delay: string;
  bestFor: string;
  icon: "Ship" | "Plane" | "Zap";
  recommended?: boolean;
};

export const TRANSPORT_MODES_DATA: TransportModeData[] = [
  {
    id: "sea",
    label: "Maritime",
    sub: "Économique",
    delay: "35–45 jours",
    bestFor: "Gros volumes, non urgent",
    icon: "Ship",
  },
  {
    id: "air_standard",
    label: "Aérien Standard",
    sub: "Équilibré",
    delay: "8–12 jours",
    bestFor: "Recommandé pour la plupart",
    icon: "Plane",
    recommended: true,
  },
  {
    id: "air_express",
    label: "Aérien Express",
    sub: "Le plus rapide",
    delay: "3–5 jours",
    bestFor: "Produits à forte valeur, urgent",
    icon: "Zap",
  },
];
