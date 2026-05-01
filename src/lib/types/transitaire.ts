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
  /** Initiales / logo court */
  avatar: string;
  /** Couleur (gradient CSS) du logo */
  avatarBg: string;
  /** Bannière de couverture (gradient ou image) */
  coverBg: string;
  city: string;
  countryCode: string; // 🇨🇳
  rating: number;
  reviewsCount: number;
  /** Vérifié par Kamoo (KYC + entretien) */
  isVerified: boolean;
  /** Top 5% des transitaires */
  isTopChoice: boolean;
  paymentPolicy: "upfront" | "on_arrival";
  refusedCategories: string[];
  specialties: string[];
  modes: ModeOffer[];
  /** Nombre de vendeurs Kamoo qui travaillent actuellement avec ce transitaire */
  activeVendors: number;
  /** Année où il a rejoint Kamoo */
  partnerSince: number;
};
