import type { TransportMode } from "./expedition";

export type ModeOffer = {
  mode: TransportMode;
  /** Tarif minimum (contenu standard) */
  fromXof: number;
  /** Tarif maximum (contenu sensible / volumineux) */
  toXof: number;
  unit: "kg" | "cbm";
  delay: string; // "35–45 jours"
};

export type Transitaire = {
  id: string;
  slug: string;
  name: string;
  /** Initiales (fallback si pas de logo image) */
  avatar: string;
  /** Couleur de fond du logo (fallback) */
  avatarBg: string;
  /** Bannière de couverture (fallback gradient si pas d'image) */
  coverBg: string;
  /** URL de la bannière (chemin /public/... ou URL distante) */
  coverImageUrl?: string;
  /** URL du logo (chemin /public/... ou URL distante) */
  logoImageUrl?: string;
  city: string;
  countryCode: string;
  rating: number;
  reviewsCount: number;
  isVerified: boolean;
  isTopChoice: boolean;
  paymentPolicy: "upfront" | "on_arrival";
  refusedCategories: string[];
  specialties: string[];
  modes: ModeOffer[];
  activeVendors: number;
  partnerSince: number;
};
