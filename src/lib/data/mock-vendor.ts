/**
 * Profil vendeur (compte courant) — mock V1.
 *
 * V2 : sera lu depuis Supabase via la session auth de l'utilisateur connecté.
 */

import type { CountryCode } from "@/lib/data/countries";

export type WalletKind =
  | "wave"
  | "orange_money"
  | "free_money"
  | "wari"
  /** Compte bancaire classique (IBAN/RIB) — pas un wallet mobile money */
  | "bank";

export const WALLET_LABELS: Record<WalletKind, string> = {
  wave: "Wave",
  orange_money: "Orange Money",
  free_money: "Free Money",
  wari: "Wari",
  bank: "Compte bancaire",
};

/** Logos/couleurs des wallets pour les badges */
export const WALLET_COLORS: Record<
  WalletKind,
  { bg: string; fg: string; ring: string }
> = {
  wave: { bg: "bg-cyan-50", fg: "text-cyan-700", ring: "ring-cyan-200" },
  orange_money: {
    bg: "bg-orange-50",
    fg: "text-orange-700",
    ring: "ring-orange-200",
  },
  free_money: {
    bg: "bg-amber-50",
    fg: "text-amber-700",
    ring: "ring-amber-200",
  },
  wari: { bg: "bg-blue-50", fg: "text-blue-700", ring: "ring-blue-200" },
  bank: {
    bg: "bg-kamoo-blue-50",
    fg: "text-kamoo-blue-700",
    ring: "ring-kamoo-blue-100",
  },
};

export type VendorWallet = {
  id: string;
  kind: WalletKind;
  /**
   * Identifiant principal du compte :
   *  - mobile money (wave/om/free/wari) : numéro de téléphone international
   *  - bank : IBAN/RIB formaté (ex: "SN012 0010 0024 5876 33")
   */
  phone: string;
  /**
   * Nom de l'établissement bancaire (uniquement pour `kind === "bank"`).
   * Ex: "Banque de l'Habitat du Sénégal", "Ecobank Côte d'Ivoire".
   * Affiché sous le numéro de compte pour identifier la banque.
   */
  bankName?: string;
  /** Nom du titulaire affiché sur l'app wallet (utile pour cross-check) */
  holderName: string;
  /** Marqué comme défaut pour ce wallet (1 par kind max) */
  isDefault: boolean;
  /** Date d'ajout (ISO) */
  createdAt: string;
};

/**
 * Préférences utilisateur — toggles affichés sur Paramètres → Compte.
 *
 * Persistées en sessionStorage en V1 (via useSessionStorageState côté UI)
 * pour que les toggles « stick » entre navigations. V2 : table preferences
 * keyed on vendor_id avec RLS.
 */
export type VendorPreferences = {
  /** Recevoir les alertes critiques (versements, litiges) par WhatsApp Business */
  whatsappNotifications: boolean;
  /** Thème sombre — Bientôt disponible (toggle désactivé en V1) */
  darkMode: boolean;
  /**
   * Auto-confirme les versements de petit montant (≤ 10 000 F CFA) pour
   * éviter de devoir valider manuellement chaque petit mouvement.
   * Sécurité : seuil dur côté serveur en V2.
   */
  autoConfirmSmallVersements: boolean;
};

export const VENDOR_PREFERENCES_DEFAULTS: VendorPreferences = {
  whatsappNotifications: true,
  darkMode: false,
  autoConfirmSmallVersements: true,
};

/**
 * Seuil d'auto-confirmation des versements quand
 * `autoConfirmSmallVersements` est activé. En F CFA.
 */
export const AUTO_CONFIRM_VERSEMENT_THRESHOLD_XOF = 10_000;

export type VendorSession = {
  id: string;
  /** Device humain (Chrome sur Windows 11, iPhone 14, etc.) */
  device: string;
  /** Ville approximative basée sur l'IP */
  location: string;
  /** ISO date de la dernière activité */
  lastActiveAt: string;
  /** True si c'est la session courante */
  isCurrent: boolean;
};

export type VendorProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  /** Téléphone principal (utilisé pour OTP login) */
  phone: string;
  /**
   * Pays de résidence du vendeur (où il vit / où sont basés ses comptes).
   * Distinct des `markets` (pays d'opération commerciale). Un vendeur basé
   * au Sénégal peut très bien avoir un marché Côte d'Ivoire — la résidence
   * sert au KYC (carte d'identité du pays) et à la fiscalité.
   */
  countryOfResidence: CountryCode;
  /** URL avatar (optionnel) */
  avatarUrl?: string;
  /** Initiales pour le badge avatar */
  initials: string;
  /** Tagline business */
  businessName: string;
  /** Date de création du compte */
  createdAt: string;
  /** Date dernière connexion */
  lastLoginAt: string;
  /** Plan d'abonnement */
  plan: "free" | "pro" | "enterprise";
};

/**
 * Vendeuse principale du mock — Aïcha Diop (Dakar).
 * Cohérente avec MOCK_ACTIVE_CLOSEUSE et tous les autres mocks.
 */
export const MOCK_VENDOR: VendorProfile = {
  id: "v_aicha",
  firstName: "Aïcha",
  lastName: "Diop",
  email: "aicha.diop@kamoo.app",
  phone: "+221 77 412 88 03",
  countryOfResidence: "SN",
  initials: "AD",
  businessName: "Aïcha Boutique",
  createdAt: "2026-01-15T10:00:00Z",
  lastLoginAt: "2026-05-13T08:30:00Z",
  plan: "pro",
};

/**
 * Wallets de la vendeuse — destinataires des versements livreurs.
 * Les numéros doivent correspondre à ceux dans mock-versements.ts
 * (recipientPhone) pour la cohérence du parcours.
 */
export const MOCK_VENDOR_WALLETS: VendorWallet[] = [
  {
    id: "wlt_001",
    kind: "wave",
    phone: "+221 77 412 88 03",
    holderName: "Aïcha Diop",
    isDefault: true,
    createdAt: "2026-01-15T10:30:00Z",
  },
  {
    id: "wlt_002",
    kind: "orange_money",
    phone: "+221 78 209 14 56",
    holderName: "Aïcha Diop",
    isDefault: true,
    createdAt: "2026-01-15T10:35:00Z",
  },
  {
    id: "wlt_003",
    kind: "free_money",
    phone: "+221 76 555 22 18",
    holderName: "Aïcha Diop",
    isDefault: true,
    createdAt: "2026-02-02T14:20:00Z",
  },
  {
    id: "wlt_004",
    kind: "bank",
    phone: "SN012 0010 0024 5876 33",
    bankName: "Banque de l'Habitat du Sénégal",
    holderName: "Aïcha Diop",
    isDefault: true,
    createdAt: "2026-02-12T11:05:00Z",
  },
];

/**
 * Sessions actives sur le compte vendeur.
 */
export const MOCK_VENDOR_SESSIONS: VendorSession[] = [
  {
    id: "ses_current",
    device: "Chrome sur Windows 11",
    location: "Dakar, Sénégal",
    lastActiveAt: "2026-05-13T08:30:00Z",
    isCurrent: true,
  },
  {
    id: "ses_phone",
    device: "Safari sur iPhone 14",
    location: "Dakar, Sénégal",
    lastActiveAt: "2026-05-12T19:14:00Z",
    isCurrent: false,
  },
  {
    id: "ses_old",
    device: "Chrome sur Android",
    location: "Thiès, Sénégal",
    lastActiveAt: "2026-04-28T16:42:00Z",
    isCurrent: false,
  },
];
