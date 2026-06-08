import type { Review, Transitaire } from "@/lib/types/transitaire";

/**
 * Données mockées pour les transitaires de la Marketplace.
 * Sera remplacé par des requêtes Supabase + Storage pour les images.
 */

const REVIEWS_POOL: Review[] = [
  {
    id: "rev_1",
    vendorName: "Aïcha Diop",
    vendorCity: "Dakar",
    vendorCountryFlag: "🇸🇳",
    rating: 5,
    date: "12 oct. 2025",
    comment:
      "Très réactif, le devis est tombé en moins de 24h après réception. Je recommande à 100%.",
    avatarBg: "linear-gradient(135deg,#F97316,#FB923C)",
  },
  {
    id: "rev_2",
    vendorName: "Mamadou Koné",
    vendorCity: "Abidjan",
    vendorCountryFlag: "🇨🇮",
    rating: 5,
    date: "08 oct. 2025",
    comment:
      "Délais respectés, communication impeccable même en français. Mes 3 dernières expéditions sont arrivées sans problème.",
    avatarBg: "linear-gradient(135deg,#1E40AF,#0EA5E9)",
  },
  {
    id: "rev_3",
    vendorName: "Fatou Ndiaye",
    vendorCity: "Dakar",
    vendorCountryFlag: "🇸🇳",
    rating: 4,
    date: "02 oct. 2025",
    comment:
      "Bon transitaire mais les tarifs ont un peu augmenté ces derniers mois. La qualité reste là.",
    avatarBg: "linear-gradient(135deg,#7C3AED,#A78BFA)",
  },
  {
    id: "rev_4",
    vendorName: "N'Dri Kouassi",
    vendorCity: "Abidjan",
    vendorCountryFlag: "🇨🇮",
    rating: 5,
    date: "28 sept. 2025",
    comment:
      "Premier essai concluant. Photos détaillées à la réception, devis transparent. Je continue avec eux.",
    avatarBg: "linear-gradient(135deg,#16A34A,#34D399)",
  },
  {
    id: "rev_5",
    vendorName: "Ousmane Traoré",
    vendorCity: "Douala",
    vendorCountryFlag: "🇨🇲",
    rating: 4,
    date: "20 sept. 2025",
    comment:
      "Sérieux et fiable. Petit bémol sur le délai maritime qui était un peu plus long que prévu.",
    avatarBg: "linear-gradient(135deg,#DC2626,#F87171)",
  },
];

const ABOUT_PREMIUM =
  "Transitaire premium spécialisé dans les expéditions Chine → Afrique de l'Ouest et Centrale. Réseau d'agents francophones à Guangzhou et Shenzhen, suivi photo systématique à la réception et tarification transparente.";
const ABOUT_NEW =
  "Nouveau partenaire Kamoo, en pleine montée en puissance. Tarifs compétitifs et équipe dédiée pour les vendeurs e-commerce africains. Spécialisé dans les petits volumes et les premiers tests produits.";
const ABOUT_ESTABLISHED =
  "Transitaire établi avec une forte expertise sur les corridors maritimes longue durée. Service client en mandarin et en français.";

const RAW_TRANSITAIRES: Transitaire[] = [
  {
    id: "tr_trust",
    slug: "trust-transit-services",
    name: "Trust Transit & Services",
    about: ABOUT_PREMIUM,
    avatar: "TT",
    avatarBg: "linear-gradient(135deg,#F97316,#FB923C)",
    coverBg: "linear-gradient(135deg, #F97316 0%, #FB923C 50%, #FDBA74 100%)",
    coverImageUrl: "/transitaires/trust-transit-cover.png",
    logoImageUrl: "/transitaires/trust-transit-logo.png",
    city: "Guangzhou",
    countryCode: "🇨🇳",
    rating: 4.7,
    reviewsCount: 184,
    status: "certified",
    paymentPolicy: "upfront",
    refusedCategories: ["Cosmétiques liquides", "Batteries lithium"],
    specialties: ["Express Cameroun", "Mode", "Électronique"],
    modes: [
      {
        mode: "air_express",
        fromXof: 8_500,
        toXof: 11_000,
        unit: "kg",
        delay: "2 jours (48h chrono)",
        description:
          "Service express Chine → Cameroun en 48h chrono. Idéal pour les commandes urgentes et les produits à forte valeur.",
        accepted: ["Mode & textile", "Électronique", "Accessoires", "Bijoux", "Petits équipements"],
        forbidden: ["Cosmétiques liquides", "Batteries lithium", "Parfumerie", "Produits inflammables"],
      },
      {
        mode: "air_standard",
        fromXof: 5_800,
        toXof: 7_500,
        unit: "kg",
        delay: "8–10 jours",
        description:
          "Aérien standard : meilleur rapport qualité/prix pour la plupart des envois. Vol commercial avec consolidation.",
        accepted: ["Mode & textile", "Électronique", "Accessoires", "Maison & déco", "Jouets"],
        forbidden: ["Cosmétiques liquides", "Batteries lithium", "Parfumerie"],
      },
      {
        mode: "sea",
        fromXof: 70_000,
        toXof: 100_000,
        unit: "cbm",
        delay: "32–40 jours",
        description:
          "Maritime en conteneur partagé. Le plus économique pour gros volumes (>1 CBM). Acceptation très large des catégories.",
        accepted: ["Toutes catégories non périssables"],
        forbidden: ["Alimentaire frais", "Médicaments à conservation froide"],
      },
    ],
    activeVendors: 73,
    partnerSince: 2024,
    reviews: REVIEWS_POOL.slice(0, 3),
  },
  {
    id: "tr_liang",
    slug: "liang-wei-trading",
    name: "Liang Wei Trading",
    about: ABOUT_PREMIUM,
    avatar: "LW",
    avatarBg: "linear-gradient(135deg,#1E40AF,#0EA5E9)",
    coverBg: "linear-gradient(135deg, #1E40AF 0%, #0EA5E9 50%, #38BDF8 100%)",
    city: "Guangzhou",
    countryCode: "🇨🇳",
    rating: 4.9,
    reviewsCount: 312,
    status: "certified",
    paymentPolicy: "upfront",
    refusedCategories: ["Cosmétiques liquides", "Batteries lithium", "Parfumerie"],
    specialties: ["Mode & textile", "Électronique", "Maison & déco"],
    modes: [
      { mode: "sea", fromXof: 65_000, toXof: 95_000, unit: "cbm", delay: "35–45 jours" },
      { mode: "air_standard", fromXof: 5_500, toXof: 7_200, unit: "kg", delay: "8–12 jours" },
      { mode: "air_express", fromXof: 8_200, toXof: 10_500, unit: "kg", delay: "3–5 jours" },
    ],
    activeVendors: 87,
    partnerSince: 2023,
    reviews: REVIEWS_POOL.slice(1, 5),
  },
  {
    id: "tr_pearl",
    slug: "pearl-river-logistics",
    name: "Pearl River Logistics",
    about: ABOUT_PREMIUM,
    avatar: "PR",
    avatarBg: "linear-gradient(135deg,#F97316,#FB923C)",
    coverBg: "linear-gradient(135deg, #F97316 0%, #FB923C 50%, #FDBA74 100%)",
    city: "Shenzhen",
    countryCode: "🇨🇳",
    rating: 4.8,
    reviewsCount: 198,
    status: "certified",
    paymentPolicy: "upfront",
    refusedCategories: ["Parfumerie"],
    specialties: ["Électronique haut de gamme", "Accessoires tech"],
    modes: [
      { mode: "sea", fromXof: 70_000, toXof: 110_000, unit: "cbm", delay: "30–42 jours" },
      { mode: "air_standard", fromXof: 6_000, toXof: 8_000, unit: "kg", delay: "7–10 jours" },
      { mode: "air_express", fromXof: 9_000, toXof: 12_000, unit: "kg", delay: "3–4 jours" },
    ],
    activeVendors: 64,
    partnerSince: 2023,
    reviews: REVIEWS_POOL.slice(0, 4),
  },
  {
    id: "tr_shanghai",
    slug: "shanghai-express-cargo",
    name: "Shanghai Express Cargo",
    about: ABOUT_ESTABLISHED,
    avatar: "SE",
    avatarBg: "linear-gradient(135deg,#7C3AED,#A78BFA)",
    coverBg: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 50%, #C4B5FD 100%)",
    city: "Shanghai",
    countryCode: "🇨🇳",
    rating: 4.6,
    reviewsCount: 148,
    status: "certified",
    paymentPolicy: "on_arrival",
    refusedCategories: ["Batteries lithium", "Alimentaire frais"],
    specialties: ["Mode & textile", "Maison & déco", "Bijoux"],
    modes: [
      { mode: "sea", fromXof: 55_000, toXof: 85_000, unit: "cbm", delay: "38–48 jours" },
      { mode: "air_standard", fromXof: 5_000, toXof: 6_800, unit: "kg", delay: "9–13 jours" },
      { mode: "air_express", fromXof: 7_500, toXof: 9_800, unit: "kg", delay: "4–6 jours" },
    ],
    activeVendors: 42,
    partnerSince: 2024,
    reviews: REVIEWS_POOL.slice(2, 5),
  },
  {
    id: "tr_yiwu",
    slug: "yiwu-global-freight",
    name: "Yiwu Global Freight",
    about: ABOUT_NEW,
    avatar: "YG",
    avatarBg: "linear-gradient(135deg,#DC2626,#F87171)",
    coverBg: "linear-gradient(135deg, #DC2626 0%, #F87171 50%, #FCA5A5 100%)",
    city: "Yiwu",
    countryCode: "🇨🇳",
    rating: 4.5,
    reviewsCount: 203,
    status: "new",
    paymentPolicy: "on_arrival",
    refusedCategories: [],
    specialties: ["Mode & textile", "Bijoux", "Accessoires", "Jouets"],
    modes: [
      { mode: "sea", fromXof: 50_000, toXof: 80_000, unit: "cbm", delay: "40–50 jours" },
      { mode: "air_standard", fromXof: 4_800, toXof: 6_500, unit: "kg", delay: "10–14 jours" },
      { mode: "air_express", fromXof: 7_000, toXof: 9_000, unit: "kg", delay: "4–6 jours" },
    ],
    activeVendors: 51,
    partnerSince: 2024,
    reviews: REVIEWS_POOL.slice(0, 3),
  },
  {
    id: "tr_hk",
    slug: "hong-kong-cargo-pro",
    name: "Hong Kong Cargo Pro",
    about: ABOUT_PREMIUM,
    avatar: "HK",
    avatarBg: "linear-gradient(135deg,#059669,#34D399)",
    coverBg: "linear-gradient(135deg, #059669 0%, #34D399 50%, #6EE7B7 100%)",
    city: "Hong Kong",
    countryCode: "🇭🇰",
    rating: 4.7,
    reviewsCount: 167,
    status: "certified",
    paymentPolicy: "upfront",
    refusedCategories: ["Alimentaire frais"],
    specialties: ["Électronique haut de gamme", "Cosmétique", "Parfumerie"],
    modes: [
      { mode: "sea", fromXof: 75_000, toXof: 120_000, unit: "cbm", delay: "32–42 jours" },
      { mode: "air_standard", fromXof: 6_500, toXof: 8_500, unit: "kg", delay: "6–9 jours" },
      { mode: "air_express", fromXof: 9_500, toXof: 13_000, unit: "kg", delay: "2–4 jours" },
    ],
    activeVendors: 38,
    partnerSince: 2023,
    reviews: REVIEWS_POOL.slice(0, 5),
  },
  {
    id: "tr_shenzhen",
    slug: "shenzhen-tech-logistics",
    name: "Shenzhen Tech Logistics",
    about: ABOUT_NEW,
    avatar: "ST",
    avatarBg: "linear-gradient(135deg,#0891B2,#22D3EE)",
    coverBg: "linear-gradient(135deg, #0891B2 0%, #22D3EE 50%, #67E8F9 100%)",
    city: "Shenzhen",
    countryCode: "🇨🇳",
    rating: 4.4,
    reviewsCount: 94,
    status: "new",
    paymentPolicy: "upfront",
    refusedCategories: ["Cosmétiques liquides", "Parfumerie"],
    specialties: ["Électronique", "Accessoires tech"],
    modes: [
      { mode: "sea", fromXof: 60_000, toXof: 90_000, unit: "cbm", delay: "35–45 jours" },
      { mode: "air_standard", fromXof: 5_200, toXof: 7_000, unit: "kg", delay: "8–11 jours" },
      { mode: "air_express", fromXof: 7_800, toXof: 10_000, unit: "kg", delay: "3–5 jours" },
    ],
    activeVendors: 29,
    partnerSince: 2024,
    reviews: REVIEWS_POOL.slice(1, 4),
  },
];

/**
 * Données complémentaires par transitaire (réponse, fiabilité, corridors),
 * + image de couverture téléchargée (Unsplash, licence libre) servie depuis
 * /public/transitaires/{slug}.jpg. Le logo reste en initiales (fallback).
 */
const EXTRA: Record<
  string,
  { responseTime: string; onTimePct: number; exampleRoutes: { label: string; delay: string }[] }
> = {
  "trust-transit-services": {
    responseTime: "1h",
    onTimePct: 98,
    exampleRoutes: [
      { label: "CN → CM", delay: "2–3 j" },
      { label: "CN → SN", delay: "3–4 j" },
      { label: "CN → CI", delay: "4–5 j" },
    ],
  },
  "liang-wei-trading": {
    responseTime: "1h",
    onTimePct: 95,
    exampleRoutes: [
      { label: "CN → CM", delay: "18–22 j" },
      { label: "CN → CI", delay: "20–25 j" },
      { label: "CN → SN", delay: "22–28 j" },
    ],
  },
  "pearl-river-logistics": {
    responseTime: "2h",
    onTimePct: 97,
    exampleRoutes: [
      { label: "CN → SN", delay: "8–11 j" },
      { label: "CN → CI", delay: "9–12 j" },
      { label: "CN → CM", delay: "10–14 j" },
    ],
  },
  "shanghai-express-cargo": {
    responseTime: "3h",
    onTimePct: 93,
    exampleRoutes: [
      { label: "CN → SN", delay: "9–13 j" },
      { label: "CN → CI", delay: "12–16 j" },
      { label: "CN → CM", delay: "38–48 j" },
    ],
  },
  "yiwu-global-freight": {
    responseTime: "2h",
    onTimePct: 91,
    exampleRoutes: [
      { label: "CN → SN", delay: "10–14 j" },
      { label: "CN → CI", delay: "12–16 j" },
      { label: "CN → CM", delay: "40–50 j" },
    ],
  },
  "hong-kong-cargo-pro": {
    responseTime: "1h",
    onTimePct: 96,
    exampleRoutes: [
      { label: "HK → SN", delay: "6–9 j" },
      { label: "HK → CI", delay: "7–10 j" },
      { label: "HK → CM", delay: "32–42 j" },
    ],
  },
  "shenzhen-tech-logistics": {
    responseTime: "2h",
    onTimePct: 90,
    exampleRoutes: [
      { label: "CN → SN", delay: "8–11 j" },
      { label: "CN → CI", delay: "10–13 j" },
      { label: "CN → CM", delay: "35–45 j" },
    ],
  },
};

/** Nombre de pays de destination desservis (Afrique de l'Ouest & Centrale). */
const COUNTRIES_SERVED: Record<string, number> = {
  "trust-transit-services": 9,
  "liang-wei-trading": 12,
  "pearl-river-logistics": 12,
  "shanghai-express-cargo": 8,
  "yiwu-global-freight": 10,
  "hong-kong-cargo-pro": 14,
  "shenzhen-tech-logistics": 7,
};

export const MOCK_TRANSITAIRES: Transitaire[] = RAW_TRANSITAIRES.map((t) => ({
  ...t,
  coverImageUrl: `/transitaires/${t.slug}.jpg`,
  logoImageUrl: undefined,
  countriesServed: COUNTRIES_SERVED[t.slug] ?? 10,
  ...EXTRA[t.slug],
}));

export function getTransitaireBySlug(slug: string) {
  return MOCK_TRANSITAIRES.find((t) => t.slug === slug);
}
