/**
 * Types pour la Marketplace Closeuses (côté vendeur).
 * Le vendeur browse les closeuses de SON marché et choisit avec qui travailler.
 */

export type CloseuseGender = "F" | "M";

export type LanguageLevel = "natif" | "courant" | "scolaire";

export type CloseuseLanguage = {
  /** Code ISO (fr, wo, en, ar, bm…) */
  code: string;
  /** Nom affiché (Français, Wolof…) */
  name: string;
  /** Drapeau emoji pour rendu rapide en card */
  flag: string;
  level: LanguageLevel;
};

/**
 * Statut de la closeuse sur la marketplace.
 * Pas de "quelques places" : si elle ne prend plus de vendeurs,
 * elle désactive son profil (et n'apparaît plus dans la liste).
 */
export type CloseuseStatus =
  | "new" // Récemment inscrite, profil pas encore éprouvé
  | "certified"; // Vérifiée Kamoo (KYC + entretien validés)

export type CloseuseKpi = {
  /** Taux de confirmation (% des appels qui aboutissent à une commande confirmée) */
  confirmationRate: number;
  /**
   * Temps moyen entre arrivée commande et 1er appel (en minutes).
   * IMPORTANT : calculé UNIQUEMENT sur les heures d'ouverture de la closeuse
   * (cf. WorkingSchedule). Une commande qui arrive un dimanche soir et qui est
   * appelée lundi matin à 9h ne pénalise pas la closeuse si elle ne travaille
   * pas le dimanche.
   */
  avgResponseMin: number;
  /** Nombre total de commandes traitées sur la plateforme */
  ordersHandled: number;
  /** Nombre de mois d'ancienneté sur Kamoo */
  monthsOnPlatform: number;
};

/** Jours de la semaine où la closeuse travaille */
export type WorkingDay =
  | "mon"
  | "tue"
  | "wed"
  | "thu"
  | "fri"
  | "sat"
  | "sun";

export const ALL_DAYS: { key: WorkingDay; short: string; long: string }[] = [
  { key: "mon", short: "L", long: "Lundi" },
  { key: "tue", short: "M", long: "Mardi" },
  { key: "wed", short: "M", long: "Mercredi" },
  { key: "thu", short: "J", long: "Jeudi" },
  { key: "fri", short: "V", long: "Vendredi" },
  { key: "sat", short: "S", long: "Samedi" },
  { key: "sun", short: "D", long: "Dimanche" },
];

export type WorkingSchedule = {
  /** Jours travaillés (les autres sont off) */
  days: WorkingDay[];
  /** Heure de début format "HH:mm" (ex: "08:00") */
  startTime: string;
  /** Heure de fin format "HH:mm" (ex: "18:00") */
  endTime: string;
};

export type CloseuseReview = {
  vendorName: string;
  vendorAvatarBg: string;
  /** Ville du vendeur (pour donner du contexte à l'avis) */
  vendorCity: string;
  /** Code pays du vendeur (SN, CI, CM…) */
  vendorCountryCode: string;
  rating: number;
  comment: string;
  /** Date ISO */
  at: string;
};

export type Closeuse = {
  slug: string;
  name: string;
  gender: CloseuseGender;
  /** Initiales pour avatar à défaut de photo */
  initials: string;
  /** Gradient CSS pour l'avatar */
  avatarBg: string;
  /** URL photo si dispo (sinon avatarBg + initials) */
  photoUrl?: string;
  /** Ville d'opération */
  city: string;
  /** Code pays (SN, CI, CM) */
  countryCode: string;
  /** Drapeau pays */
  countryFlag: string;
  /** Description libre par la closeuse elle-même */
  bio: string;
  languages: CloseuseLanguage[];
  /** Commission par commande LIVRÉE (en F CFA) */
  commissionXof: number;
  rating: number;
  reviewsCount: number;
  reviews: CloseuseReview[];
  /** Nombre de vendeurs avec qui elle travaille actuellement */
  activePartners: number;
  status: CloseuseStatus;
  kpi: CloseuseKpi;
  /** Jours et heures de travail */
  schedule: WorkingSchedule;
  /** Date d'inscription Kamoo (ISO) — sert au "Partenaire depuis…" */
  joinedAt: string;
};

export const STATUS_LABELS: Record<CloseuseStatus, string> = {
  new: "Nouveau",
  certified: "Certifié Kamoo",
};

export const GENDER_LABELS: Record<CloseuseGender, string> = {
  F: "Femme",
  M: "Homme",
};

export const LANGUAGE_LEVEL_LABELS: Record<LanguageLevel, string> = {
  natif: "Natif",
  courant: "Courant",
  scolaire: "Scolaire",
};
