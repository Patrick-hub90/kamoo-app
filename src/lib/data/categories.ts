import type { TransportMode } from "@/lib/types/expedition";

/**
 * Catégories produit + règles de compatibilité avec les modes de transport.
 * V1 : matrice statique. V2 : règles personnalisables par transitaire.
 */

export type ProductCategory = {
  id: string;
  label: string;
  emoji: string;
  /** Modes interdits pour cette catégorie */
  incompatibleModes: TransportMode[];
  reason: string;
};

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    id: "cosmetique",
    label: "Cosmétique",
    emoji: "🧴",
    incompatibleModes: ["air_standard", "air_express"],
    reason: "Cosmétique liquide non transportable par avion",
  },
  {
    id: "mode",
    label: "Mode & textile",
    emoji: "👕",
    incompatibleModes: [],
    reason: "",
  },
  {
    id: "electronique",
    label: "Électronique",
    emoji: "📱",
    incompatibleModes: [],
    reason: "",
  },
  {
    id: "batterie",
    label: "Batteries / Lithium",
    emoji: "🔋",
    incompatibleModes: ["air_standard", "air_express"],
    reason: "Batteries lithium interdites par voie aérienne (IATA)",
  },
  {
    id: "parfum",
    label: "Parfumerie",
    emoji: "🌸",
    incompatibleModes: ["air_standard", "air_express"],
    reason: "Produits inflammables non transportables par avion",
  },
  {
    id: "alimentaire",
    label: "Alimentaire",
    emoji: "🍪",
    incompatibleModes: ["sea"],
    reason: "Trop périssable pour le maritime (45 jours)",
  },
  {
    id: "maison",
    label: "Maison & déco",
    emoji: "🏠",
    incompatibleModes: [],
    reason: "",
  },
  {
    id: "sport",
    label: "Sport & loisirs",
    emoji: "⚽",
    incompatibleModes: [],
    reason: "",
  },
  {
    id: "jouet",
    label: "Jouets & enfants",
    emoji: "🧸",
    incompatibleModes: [],
    reason: "",
  },
  {
    id: "autre",
    label: "Autre",
    emoji: "📦",
    incompatibleModes: [],
    reason: "",
  },
];

export function getCategoryById(id: string): ProductCategory {
  return PRODUCT_CATEGORIES.find((c) => c.id === id) ?? PRODUCT_CATEGORIES[0];
}
