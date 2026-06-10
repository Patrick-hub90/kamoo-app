/**
 * Types pour la Marketplace Livreurs.
 * Le card est conçu pour fonctionner aussi bien pour un livreur PARTICULIER
 * (Moussa Sow + sa moto) que pour une AGENCE de livraison (Wave Express,
 * Yango Delivery, Bolt, etc.).
 */

import type { WorkingSchedule } from "@/lib/types/closeuse";

export type LivreurType = "particulier" | "agence";

/** Zone desservie par le livreur, avec son tarif fixe */
export type DeliveryZone = {
  /** Nom du quartier / zone (ex: "Almadies", "Yopougon") */
  name: string;
  /** Tarif en F CFA pour cette zone */
  priceXof: number;
  /** Délai estimé moyen de livraison (en minutes) */
  estimatedMin?: number;
};

export type LivreurReview = {
  vendorName: string;
  vendorAvatarBg: string;
  vendorCity: string;
  vendorCountryCode: string;
  rating: number;
  comment: string;
  at: string;
};

export type LivreurStatus = "new" | "certified";

export type LivreurKpi = {
  /** Taux de livraison réussie (livré / (livré + échec/annulé)) */
  deliverySuccessRate: number;
  /** Temps moyen entre pickup et livraison (minutes) */
  avgDeliveryMin: number;
  /** Nombre total de livraisons traitées */
  deliveriesHandled: number;
  /** Ancienneté en mois sur Kamoo */
  monthsOnPlatform: number;
};

export type Livreur = {
  slug: string;
  name: string;
  type: LivreurType;
  /** Initiales pour fallback avatar */
  initials: string;
  /** Gradient CSS pour avatar à défaut de photo */
  avatarBg: string;
  /** Photo de profil (logo si agence, portrait si particulier) */
  photoUrl?: string;
  /** Bannière (image en haut du card) — optionnelle */
  coverImageUrl?: string;
  /** Gradient CSS de fallback pour la bannière */
  coverBg: string;
  /** Description par le livreur lui-même */
  bio: string;
  /** Ville d'opération principale */
  city: string;
  countryCode: string;
  countryFlag: string;
  /** Zones desservies avec leurs tarifs */
  zones: DeliveryZone[];
  rating: number;
  reviewsCount: number;
  reviews: LivreurReview[];
  status: LivreurStatus;
  /** Nombre de vendeurs actifs avec ce livreur */
  activePartners: number;
  kpi: LivreurKpi;
  schedule: WorkingSchedule;
  /** Date d'inscription Kamoo (ISO) — pour "Partenaire depuis…" */
  joinedAt: string;
  /** Services proposés (livraison incluse par défaut) */
  services?: LivreurService[];
  /** Grille tarifaire détaillée des services (façon ComeUp) */
  serviceOfferings?: ServiceOffering[];
};

export const LIVREUR_TYPE_LABELS: Record<LivreurType, string> = {
  particulier: "Livreur indépendant",
  agence: "Agence de livraison",
};

/**
 * Services proposés par un livreur — la flexibilité Kamoo : certains livreurs
 * font aussi le closing (le vendeur se passe alors de closeuse) ou stockent
 * les colis chez eux (entreposage). Chacun compose son offre.
 */
export type LivreurService = "livraison" | "closing" | "entreposage";

export const LIVREUR_SERVICE_LABELS: Record<LivreurService, string> = {
  livraison: "Livraison COD",
  closing: "Closing (confirmation d'appels)",
  entreposage: "Entreposage de colis",
};

export const LIVREUR_SERVICE_SHORT: Record<LivreurService, string> = {
  livraison: "Livraison",
  closing: "Closing",
  entreposage: "Entreposage",
};

/**
 * Offre de service détaillée (façon ComeUp) : chaque service additionnel a
 * son tarif, son unité et sa description. La livraison reste tarifée par
 * zone (cf. `zones`), les autres services par leur grille propre.
 */
export type ServiceOffering = {
  service: LivreurService;
  /** Tarif F CFA (absent pour la livraison : tarifée par zone) */
  priceXof?: number;
  /** Unité de facturation, ex. « / commande confirmée », « / colis / jour » */
  unit?: string;
  /** Description détaillée rédigée par le livreur */
  description: string;
};

export const LIVREUR_STATUS_LABELS: Record<LivreurStatus, string> = {
  new: "Nouveau",
  certified: "Certifié Kamoo",
};
