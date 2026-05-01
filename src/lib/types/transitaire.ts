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

export type Review = {
  id: string;
  vendorName: string;
  vendorCity: string;
  vendorCountryFlag: string;
  rating: number;
  date: string;
  comment: string;
  /** Initiale + couleur de fond (avatar fallback) */
  avatarBg: string;
};

export type Transitaire = {
  id: string;
  slug: string;
  name: string;
  /** Description courte affichée sur le profil */
  about: string;
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
  /**
   * Statut Kamoo, exclusif :
   *  - "new" : vient de rejoindre Kamoo
   *  - "certified" : vérifié + a au moins 50 expéditions complétées sans incident
   */
  status: "new" | "certified";
  paymentPolicy: "upfront" | "on_arrival";
  refusedCategories: string[];
  specialties: string[];
  modes: ModeOffer[];
  activeVendors: number;
  partnerSince: number;
  /** Avis vendeurs (max 5 affichés sur le profil, lien vers tous) */
  reviews: Review[];
};
