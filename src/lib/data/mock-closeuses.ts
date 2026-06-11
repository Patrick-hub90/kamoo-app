import { averageRating, generateReviews } from "@/lib/data/review-generator";
import { MOCK_ACTIVE_CLOSEUSE } from "./mock-closing";
import type { Closeuse } from "@/lib/types/closeuse";

/**
 * Mocks Marketplace Closeuses — 8 profils variés pour la démo.
 * Mix : sexe, dispo, niveau de KPI, langues, commissions, ancienneté.
 */
const RAW_CLOSEUSES: Closeuse[] = [
  {
    slug: "aminata-sene",
    name: "Aminata Sène",
    gender: "F",
    initials: "AS",
    avatarBg: "linear-gradient(135deg,#F97316,#FB923C)",
    city: "Dakar",
    countryCode: "SN",
    countryFlag: "🇸🇳",
    bio: "8 ans d'expérience en télévente cosmétique et mode. Je suis patiente avec les clients hésitants et je conclus 9 fois sur 10. Disponible du lundi au samedi de 9h à 19h.",
    languages: [
      { code: "fr", name: "Français", flag: "🇫🇷", level: "courant" },
      { code: "wo", name: "Wolof", flag: "🇸🇳", level: "natif" },
    ],
    commissionXof: 1500,
    rating: 4.9,
    reviewsCount: 47,
    reviews: [
      {
        vendorName: "Mariama Sall",
        vendorAvatarBg: "linear-gradient(135deg,#3B82F6,#60A5FA)",
        vendorCity: "Dakar",
        vendorCountryCode: "SN",
        rating: 5,
        comment:
          "Aminata a sauvé mon shop. Taux de confirmation passé de 50 à 85% en 2 mois.",
        at: "2026-04-15T10:00:00Z",
      },
      {
        vendorName: "Ibrahima Ndiaye",
        vendorAvatarBg: "linear-gradient(135deg,#22C55E,#4ADE80)",
        vendorCity: "Pikine",
        vendorCountryCode: "SN",
        rating: 5,
        comment:
          "Très professionnelle, rappelle vite, ne lâche jamais un client.",
        at: "2026-03-22T14:30:00Z",
      },
      {
        vendorName: "Fatou Bâ",
        vendorAvatarBg: "linear-gradient(135deg,#F97316,#FB923C)",
        vendorCity: "Dakar",
        vendorCountryCode: "SN",
        rating: 4,
        comment: "Excellente sur les produits féminins, parfois booked.",
        at: "2026-02-10T09:15:00Z",
      },
    ],
    activePartners: 8,
    status: "certified",
    kpi: {
      confirmationRate: 85,
      avgResponseMin: 12,
      ordersHandled: 1842,
      monthsOnPlatform: 18,
    },
    schedule: {
      days: ["mon", "tue", "wed", "thu", "fri", "sat"],
      startTime: "09:00",
      endTime: "19:00",
    },
    joinedAt: "2024-09-15",
  },
  {
    slug: "moussa-fall",
    name: "Moussa Fall",
    gender: "M",
    initials: "MF",
    avatarBg: "linear-gradient(135deg,#0EA5E9,#0284C7)",
    city: "Dakar",
    countryCode: "SN",
    countryFlag: "🇸🇳",
    bio: "Spécialiste des appels matinaux. Voix grave et rassurante, idéal pour produits techniques (électronique, outils). Je travaille avec rigueur militaire — chaque commande mérite 3 tentatives.",
    languages: [
      { code: "fr", name: "Français", flag: "🇫🇷", level: "courant" },
      { code: "wo", name: "Wolof", flag: "🇸🇳", level: "natif" },
      { code: "en", name: "Anglais", flag: "🇬🇧", level: "scolaire" },
    ],
    commissionXof: 1800,
    rating: 4.7,
    reviewsCount: 32,
    reviews: [
      {
        vendorName: "Cheikh Mbaye",
        vendorAvatarBg: "linear-gradient(135deg,#A855F7,#C084FC)",
        vendorCity: "Dakar",
        vendorCountryCode: "SN",
        rating: 5,
        comment: "Top pour mes ventes de gadgets tech. Ne perd jamais un appel.",
        at: "2026-04-02T16:00:00Z",
      },
      {
        vendorName: "Awa Faye",
        vendorAvatarBg: "linear-gradient(135deg,#EC4899,#F472B6)",
        vendorCity: "Rufisque",
        vendorCountryCode: "SN",
        rating: 4,
        comment: "Sérieux et ponctuel. Un peu cher mais ça vaut le coup.",
        at: "2026-03-18T11:00:00Z",
      },
    ],
    activePartners: 6,
    status: "certified",
    kpi: {
      confirmationRate: 78,
      avgResponseMin: 8,
      ordersHandled: 1124,
      monthsOnPlatform: 12,
    },
    schedule: {
      days: ["mon", "tue", "wed", "thu", "fri"],
      startTime: "08:00",
      endTime: "18:00",
    },
    joinedAt: "2025-04-20",
  },
  {
    slug: "fatou-niang",
    name: "Fatou Niang",
    gender: "F",
    initials: "FN",
    avatarBg: "linear-gradient(135deg,#EC4899,#F472B6)",
    city: "Thiès",
    countryCode: "SN",
    countryFlag: "🇸🇳",
    bio: "Closeuse de proximité spécialisée dans les commandes de la région de Thiès. Je connais tous les quartiers et je sais identifier les vrais clients des curieux.",
    languages: [
      { code: "fr", name: "Français", flag: "🇫🇷", level: "courant" },
      { code: "wo", name: "Wolof", flag: "🇸🇳", level: "natif" },
      { code: "se", name: "Sérère", flag: "🇸🇳", level: "natif" },
    ],
    commissionXof: 1200,
    rating: 4.8,
    reviewsCount: 28,
    reviews: [
      {
        vendorName: "Khady Mbaye",
        vendorAvatarBg: "linear-gradient(135deg,#10B981,#059669)",
        vendorCity: "Thiès",
        vendorCountryCode: "SN",
        rating: 5,
        comment: "Connaît la région par cœur. Mes livraisons sont parfaites.",
        at: "2026-04-25T09:00:00Z",
      },
    ],
    activePartners: 4,
    status: "certified",
    kpi: {
      confirmationRate: 82,
      avgResponseMin: 18,
      ordersHandled: 687,
      monthsOnPlatform: 8,
    },
    schedule: {
      days: ["mon", "tue", "wed", "thu", "fri", "sat"],
      startTime: "09:00",
      endTime: "18:00",
    },
    joinedAt: "2025-08-10",
  },
  {
    slug: "babacar-sow",
    name: "Babacar Sow",
    gender: "M",
    initials: "BS",
    avatarBg: "linear-gradient(135deg,#22C55E,#16A34A)",
    city: "Dakar",
    countryCode: "SN",
    countryFlag: "🇸🇳",
    bio: "Jeune closeur dynamique, je connais bien les attentes de la jeunesse urbaine. Spécialiste des produits lifestyle, sneakers, mode streetwear.",
    languages: [
      { code: "fr", name: "Français", flag: "🇫🇷", level: "courant" },
      { code: "wo", name: "Wolof", flag: "🇸🇳", level: "natif" },
      { code: "en", name: "Anglais", flag: "🇬🇧", level: "courant" },
    ],
    commissionXof: 1300,
    rating: 4.6,
    reviewsCount: 19,
    reviews: [
      {
        vendorName: "Pape Diop",
        vendorAvatarBg: "linear-gradient(135deg,#F59E0B,#FBBF24)",
        vendorCity: "Dakar",
        vendorCountryCode: "SN",
        rating: 5,
        comment: "Parfait pour mes baskets. Parle aux jeunes comme un pote.",
        at: "2026-04-10T15:00:00Z",
      },
    ],
    activePartners: 5,
    status: "new",
    kpi: {
      confirmationRate: 74,
      avgResponseMin: 22,
      ordersHandled: 412,
      monthsOnPlatform: 5,
    },
    schedule: {
      days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
      startTime: "10:00",
      endTime: "20:00",
    },
    joinedAt: "2025-11-15",
  },
  {
    slug: "marie-kouassi",
    name: "Marie Kouassi",
    gender: "F",
    initials: "MK",
    avatarBg: "linear-gradient(135deg,#A855F7,#C084FC)",
    city: "Abidjan",
    countryCode: "CI",
    countryFlag: "🇨🇮",
    bio: "9 ans dans la télévente à Abidjan. J'opère sur tout le marché ivoirien, du Plateau à Yopougon. Très bonne mémoire, je reconnais mes clients réguliers.",
    languages: [
      { code: "fr", name: "Français", flag: "🇫🇷", level: "natif" },
      { code: "bm", name: "Baoulé", flag: "🇨🇮", level: "natif" },
      { code: "dy", name: "Dioula", flag: "🇨🇮", level: "courant" },
    ],
    commissionXof: 1600,
    rating: 4.9,
    reviewsCount: 56,
    reviews: [
      {
        vendorName: "Adjoa Toure",
        vendorAvatarBg: "linear-gradient(135deg,#EC4899,#F472B6)",
        vendorCity: "Abidjan",
        vendorCountryCode: "CI",
        rating: 5,
        comment: "La meilleure closeuse d'Abidjan. Mes commandes filent.",
        at: "2026-04-28T10:00:00Z",
      },
      {
        vendorName: "Yao Konan",
        vendorAvatarBg: "linear-gradient(135deg,#3B82F6,#60A5FA)",
        vendorCity: "Yamoussoukro",
        vendorCountryCode: "CI",
        rating: 5,
        comment: "Pro, rapide, jamais une plainte client en 8 mois.",
        at: "2026-03-15T14:00:00Z",
      },
    ],
    activePartners: 11,
    status: "certified",
    kpi: {
      confirmationRate: 88,
      avgResponseMin: 10,
      ordersHandled: 2384,
      monthsOnPlatform: 22,
    },
    schedule: {
      days: ["mon", "tue", "wed", "thu", "fri", "sat"],
      startTime: "08:00",
      endTime: "19:00",
    },
    joinedAt: "2024-05-01",
  },
  {
    slug: "yves-mballa",
    name: "Yves Mballa",
    gender: "M",
    initials: "YM",
    avatarBg: "linear-gradient(135deg,#EF4444,#DC2626)",
    city: "Douala",
    countryCode: "CM",
    countryFlag: "🇨🇲",
    bio: "Closeur sénior basé à Douala. Polyglotte, je gère aussi bien les clients francophones d'Akwa que les anglophones de Bonabéri.",
    languages: [
      { code: "fr", name: "Français", flag: "🇫🇷", level: "natif" },
      { code: "en", name: "Anglais", flag: "🇬🇧", level: "natif" },
      { code: "du", name: "Douala", flag: "🇨🇲", level: "natif" },
    ],
    commissionXof: 1700,
    rating: 4.8,
    reviewsCount: 41,
    reviews: [
      {
        vendorName: "Christine Tchouala",
        vendorAvatarBg: "linear-gradient(135deg,#10B981,#059669)",
        vendorCity: "Douala",
        vendorCountryCode: "CM",
        rating: 5,
        comment: "Bilingue parfait, indispensable pour ma clientèle mixte.",
        at: "2026-04-05T12:00:00Z",
      },
    ],
    activePartners: 7,
    status: "certified",
    kpi: {
      confirmationRate: 81,
      avgResponseMin: 15,
      ordersHandled: 1567,
      monthsOnPlatform: 16,
    },
    schedule: {
      days: ["mon", "tue", "wed", "thu", "fri"],
      startTime: "08:00",
      endTime: "17:00",
    },
    joinedAt: "2024-12-20",
  },
  {
    slug: "ngoné-thiam",
    name: "Ngoné Thiam",
    gender: "F",
    initials: "NT",
    avatarBg: "linear-gradient(135deg,#14B8A6,#0D9488)",
    city: "Saint-Louis",
    countryCode: "SN",
    countryFlag: "🇸🇳",
    bio: "Étudiante en marketing à Saint-Louis. Ton frais et naturel, idéal pour produits beauté et accessoires destinés aux jeunes femmes. Disponible en soirée et week-ends.",
    languages: [
      { code: "fr", name: "Français", flag: "🇫🇷", level: "courant" },
      { code: "wo", name: "Wolof", flag: "🇸🇳", level: "natif" },
    ],
    commissionXof: 1000,
    rating: 4.5,
    reviewsCount: 8,
    reviews: [
      {
        vendorName: "Aïda Sarr",
        vendorAvatarBg: "linear-gradient(135deg,#A855F7,#C084FC)",
        vendorCity: "Saint-Louis",
        vendorCountryCode: "SN",
        rating: 5,
        comment: "Très naturelle, mes clientes l'adorent. Tarif imbattable.",
        at: "2026-04-20T11:00:00Z",
      },
    ],
    activePartners: 2,
    status: "new",
    kpi: {
      confirmationRate: 71,
      avgResponseMin: 35,
      ordersHandled: 156,
      monthsOnPlatform: 3,
    },
    schedule: {
      // Étudiante : soirée + week-end uniquement
      days: ["fri", "sat", "sun"],
      startTime: "17:00",
      endTime: "22:00",
    },
    joinedAt: "2026-01-25",
  },
  {
    slug: "amina-kone",
    name: "Amina Koné",
    gender: "F",
    initials: "AK",
    avatarBg: "linear-gradient(135deg,#F59E0B,#D97706)",
    city: "Bouaké",
    countryCode: "CI",
    countryFlag: "🇨🇮",
    bio: "Spécialiste des marchés du centre ivoirien. Je couvre Bouaké, Yamoussoukro et toute la zone N'Zi-Iffou. Bonne gestion des objections sur le prix.",
    languages: [
      { code: "fr", name: "Français", flag: "🇫🇷", level: "courant" },
      { code: "bm", name: "Baoulé", flag: "🇨🇮", level: "natif" },
      { code: "ar", name: "Arabe", flag: "🇲🇦", level: "scolaire" },
    ],
    commissionXof: 1400,
    rating: 4.7,
    reviewsCount: 24,
    reviews: [
      {
        vendorName: "Kouadio Bamba",
        vendorAvatarBg: "linear-gradient(135deg,#0EA5E9,#0284C7)",
        vendorCity: "Bouaké",
        vendorCountryCode: "CI",
        rating: 5,
        comment: "Idéale pour le centre du pays. Connaît toutes les zones.",
        at: "2026-04-12T16:00:00Z",
      },
    ],
    activePartners: 3,
    status: "certified",
    kpi: {
      confirmationRate: 76,
      avgResponseMin: 25,
      ordersHandled: 543,
      monthsOnPlatform: 7,
    },
    schedule: {
      days: ["mon", "tue", "wed", "thu", "fri", "sat"],
      startTime: "09:00",
      endTime: "18:00",
    },
    joinedAt: "2025-09-30",
  },
];

/**
 * Données complémentaires par closeuse : spécialités, disponibilité, et photo
 * de profil téléchargée (Unsplash, licence libre) servie depuis
 * /public/closeuses/{slug}.jpg.
 */
const EXTRA: Record<string, { skills: string[]; availableNow: boolean }> = {
  "aminata-sene": { skills: ["Télévente B2C", "Prise de RDV"], availableNow: true },
  "moussa-fall": { skills: ["Télévente B2C", "Relance & Fidélisation"], availableNow: false },
  "fatou-niang": { skills: ["Relance & Fidélisation", "SAV & Support"], availableNow: true },
  "babacar-sow": { skills: ["Télévente B2C"], availableNow: true },
  "marie-kouassi": { skills: ["Télévente B2C", "Prise de RDV", "Relance & Fidélisation"], availableNow: true },
  "yves-mballa": { skills: ["Télévente B2C", "SAV & Support"], availableNow: false },
  "ngoné-thiam": { skills: ["Prise de RDV", "SAV & Support"], availableNow: true },
  "amina-kone": { skills: ["Télévente B2C", "Relance & Fidélisation"], availableNow: true },
};

export const MOCK_CLOSEUSES: Closeuse[] = RAW_CLOSEUSES.map((c) => {
  /* Avis : fixtures + generes (stables) — compteur = nombre reel liste,
   * note = vraie moyenne. */
  const reviews = [
    ...c.reviews,
    ...generateReviews(c.slug, "closeuse", c.rating).map((g) => ({
      vendorName: g.vendorName,
      vendorAvatarBg: g.avatarBg,
      vendorCity: g.vendorCity,
      vendorCountryCode: g.vendorCountryCode,
      rating: g.rating,
      comment: g.comment,
      at: g.at,
    })),
  ];
  return {
    ...c,
    photoUrl: `/closeuses/${c.slug}.jpg`,
    skills: EXTRA[c.slug]?.skills ?? [],
    availableNow: EXTRA[c.slug]?.availableNow ?? false,
    reviews,
    reviewsCount: reviews.length,
    rating: averageRating(reviews.map((r) => r.rating)),
  };
});

/** Une closeuse est "top performer" si son taux de confirmation est élevé. */
export function isTopPerformer(c: Closeuse): boolean {
  return c.kpi.confirmationRate >= 85;
}

export function getCloseuse(slug: string): Closeuse | undefined {
  return MOCK_CLOSEUSES.find((c) => c.slug === slug);
}

/**
 * Indique si la closeuse est la partenaire active du vendeur.
 * V1 : pont entre le marketplace (slug) et l'engagement actif (id) via le nom.
 * V2 : sera dérivé d'une table partnerships(vendor_id, closeuse_id, status).
 */
export function isActiveCloseusePartner(c: Closeuse): boolean {
  return c.name === MOCK_ACTIVE_CLOSEUSE.name;
}
