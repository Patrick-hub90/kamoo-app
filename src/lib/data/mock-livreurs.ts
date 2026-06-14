import { averageRating, generateReviews } from "@/lib/data/review-generator";
import type { Livreur, ServiceOffering } from "@/lib/types/livreur";

/**
 * Mocks Marketplace Livreurs — 8 profils variés pour la démo.
 * Mix volontaire : particuliers / agences, marchés (SN/CI/CM), véhicules,
 * niveaux de KPI, anciennetés.
 */
const RAW_LIVREURS: Livreur[] = [
  /* ─── PARTICULIERS ─────────────────────────────────────── */
  {
    slug: "moussa-sow",
    name: "Moussa Sow",
    type: "particulier",
    initials: "MS",
    avatarBg: "linear-gradient(135deg,#0EA5E9,#0284C7)",
    coverBg: "linear-gradient(135deg,#0EA5E9,#06B6D4)",
    bio: "5 ans à Dakar, je sillonne les Almadies, le Plateau et Yoff toute la semaine. Toujours présent à l'heure, jamais raté un colis.",
    city: "Dakar",
    countryCode: "SN",
    countryFlag: "🇸🇳",
    zones: [
      { name: "Plateau", priceXof: 1000, estimatedMin: 30 },
      { name: "Almadies", priceXof: 1500, estimatedMin: 40 },
      { name: "Yoff", priceXof: 1500, estimatedMin: 45 },
      { name: "Mermoz", priceXof: 1000, estimatedMin: 35 },
      { name: "Sacré-Coeur", priceXof: 1000, estimatedMin: 30 },
      { name: "Ouakam", priceXof: 1500, estimatedMin: 40 },
    ],
    rating: 4.6,
    reviewsCount: 87,
    reviews: [
      {
        vendorName: "Aïcha Diop",
        vendorAvatarBg: "linear-gradient(135deg,#F97316,#FB923C)",
        vendorCity: "Dakar",
        vendorCountryCode: "SN",
        rating: 5,
        comment: "Toujours réactif, remet le cash sans souci. Mon livreur préféré.",
        at: "2026-04-20T10:00:00Z",
      },
      {
        vendorName: "Ibrahima Ndiaye",
        vendorAvatarBg: "linear-gradient(135deg,#22C55E,#4ADE80)",
        vendorCity: "Pikine",
        vendorCountryCode: "SN",
        rating: 4,
        comment: "Bon livreur, parfois un peu en retard quand ça bouchonne aux Almadies.",
        at: "2026-03-15T14:00:00Z",
      },
    ],
    status: "certified",
    activePartners: 6,
    kpi: {
      deliverySuccessRate: 94,
      avgDeliveryMin: 65,
      deliveriesHandled: 1432,
      monthsOnPlatform: 18,
    },
    schedule: {
      days: ["mon", "tue", "wed", "thu", "fri", "sat"],
      startTime: "08:00",
      endTime: "19:00",
    },
    joinedAt: "2024-09-10",
  },
  {
    slug: "ibrahima-sarr",
    name: "Ibrahima Sarr",
    type: "particulier",
    initials: "IS",
    avatarBg: "linear-gradient(135deg,#10B981,#059669)",
    coverBg: "linear-gradient(135deg,#10B981,#34D399)",
    bio: "Livreur expérimenté basé à Guédiawaye. Je couvre toute la banlieue de Dakar et je connais les raccourcis pour éviter les embouteillages.",
    city: "Dakar",
    countryCode: "SN",
    countryFlag: "🇸🇳",
    zones: [
      { name: "Guédiawaye", priceXof: 1200, estimatedMin: 35 },
      { name: "Pikine", priceXof: 1200, estimatedMin: 35 },
      { name: "Parcelles Assainies", priceXof: 1000, estimatedMin: 30 },
      { name: "Rufisque", priceXof: 2000, estimatedMin: 60 },
      { name: "Plateau", priceXof: 1500, estimatedMin: 50 },
    ],
    rating: 4.9,
    reviewsCount: 124,
    reviews: [
      {
        vendorName: "Mariama Sall",
        vendorAvatarBg: "linear-gradient(135deg,#3B82F6,#60A5FA)",
        vendorCity: "Dakar",
        vendorCountryCode: "SN",
        rating: 5,
        comment: "Le meilleur livreur pour la banlieue. Jamais une plainte client.",
        at: "2026-04-25T11:00:00Z",
      },
    ],
    status: "certified",
    activePartners: 8,
    kpi: {
      deliverySuccessRate: 97,
      avgDeliveryMin: 50,
      deliveriesHandled: 2107,
      monthsOnPlatform: 22,
    },
    schedule: {
      days: ["mon", "tue", "wed", "thu", "fri", "sat"],
      startTime: "07:00",
      endTime: "20:00",
    },
    joinedAt: "2024-05-15",
  },
  {
    slug: "pape-faye",
    name: "Pape Faye",
    type: "particulier",
    initials: "PF",
    avatarBg: "linear-gradient(135deg,#A855F7,#C084FC)",
    coverBg: "linear-gradient(135deg,#A855F7,#D8B4FE)",
    bio: "Étudiant à Saint-Louis, je livre en vélo le centre-ville et Sor. Tarifs imbattables, parfait pour les petites commandes.",
    city: "Saint-Louis",
    countryCode: "SN",
    countryFlag: "🇸🇳",
    zones: [
      { name: "Sor", priceXof: 800, estimatedMin: 25 },
      { name: "Centre-ville", priceXof: 800, estimatedMin: 30 },
      { name: "Île Nord", priceXof: 1000, estimatedMin: 40 },
    ],
    rating: 4.3,
    reviewsCount: 12,
    reviews: [
      {
        vendorName: "Aïssatou Faye",
        vendorAvatarBg: "linear-gradient(135deg,#EC4899,#F472B6)",
        vendorCity: "Saint-Louis",
        vendorCountryCode: "SN",
        rating: 4,
        comment: "Sympa et rapide pour les petits colis. Limité par le vélo en heures de pointe.",
        at: "2026-04-12T09:00:00Z",
      },
    ],
    status: "new",
    activePartners: 2,
    kpi: {
      deliverySuccessRate: 88,
      avgDeliveryMin: 40,
      deliveriesHandled: 156,
      monthsOnPlatform: 4,
    },
    schedule: {
      days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
      startTime: "10:00",
      endTime: "18:00",
    },
    joinedAt: "2026-01-05",
  },
  {
    slug: "aminata-diakite",
    name: "Aminata Diakité",
    type: "particulier",
    initials: "AD",
    avatarBg: "linear-gradient(135deg,#F97316,#FB923C)",
    coverBg: "linear-gradient(135deg,#F97316,#FBBF24)",
    bio: "Une des rares femmes livreuses à Abidjan. Spécialisée dans les produits cosmétiques et mode féminine. Mes clientes adorent.",
    city: "Abidjan",
    countryCode: "CI",
    countryFlag: "🇨🇮",
    zones: [
      { name: "Cocody", priceXof: 1500, estimatedMin: 35 },
      { name: "Plateau", priceXof: 1200, estimatedMin: 30 },
      { name: "Marcory", priceXof: 1500, estimatedMin: 40 },
      { name: "Treichville", priceXof: 1200, estimatedMin: 35 },
    ],
    rating: 4.8,
    reviewsCount: 56,
    reviews: [
      {
        vendorName: "Adjoa Toure",
        vendorAvatarBg: "linear-gradient(135deg,#EC4899,#F472B6)",
        vendorCity: "Abidjan",
        vendorCountryCode: "CI",
        rating: 5,
        comment: "Aminata est sérieuse et mes clientes femmes se sentent à l'aise avec elle.",
        at: "2026-04-08T15:00:00Z",
      },
    ],
    status: "certified",
    activePartners: 5,
    kpi: {
      deliverySuccessRate: 92,
      avgDeliveryMin: 55,
      deliveriesHandled: 743,
      monthsOnPlatform: 11,
    },
    schedule: {
      days: ["mon", "tue", "wed", "thu", "fri", "sat"],
      startTime: "09:00",
      endTime: "18:00",
    },
    joinedAt: "2025-05-20",
  },
  {
    slug: "yves-mballa",
    name: "Yves Mballa",
    type: "particulier",
    initials: "YM",
    avatarBg: "linear-gradient(135deg,#EF4444,#DC2626)",
    coverBg: "linear-gradient(135deg,#EF4444,#F87171)",
    bio: "Livreur multi-quartiers à Douala. Couverture Akwa, Bonapriso et Bonabéri. Parle français, anglais et douala.",
    city: "Douala",
    countryCode: "CM",
    countryFlag: "🇨🇲",
    zones: [
      { name: "Akwa", priceXof: 1500, estimatedMin: 30 },
      { name: "Bonapriso", priceXof: 1500, estimatedMin: 35 },
      { name: "Bonabéri", priceXof: 2000, estimatedMin: 50 },
      { name: "Deido", priceXof: 1200, estimatedMin: 30 },
    ],
    rating: 4.7,
    reviewsCount: 78,
    reviews: [
      {
        vendorName: "Christine Tchouala",
        vendorAvatarBg: "linear-gradient(135deg,#10B981,#059669)",
        vendorCity: "Douala",
        vendorCountryCode: "CM",
        rating: 5,
        comment: "Yves est très professionnel, surtout pour les zones anglophones.",
        at: "2026-04-02T12:00:00Z",
      },
    ],
    status: "certified",
    activePartners: 7,
    kpi: {
      deliverySuccessRate: 91,
      avgDeliveryMin: 60,
      deliveriesHandled: 1289,
      monthsOnPlatform: 15,
    },
    schedule: {
      days: ["mon", "tue", "wed", "thu", "fri", "sat"],
      startTime: "08:00",
      endTime: "19:00",
    },
    joinedAt: "2025-01-15",
  },
  /* ─── AGENCES ──────────────────────────────────────────── */
  {
    slug: "wave-express-sn",
    name: "Wave Express",
    type: "agence",
    initials: "WE",
    avatarBg: "linear-gradient(135deg,#1E40AF,#3B82F6)",
    coverBg: "linear-gradient(135deg,#1E40AF,#60A5FA)",
    bio: "Agence professionnelle couvrant tout le Grand Dakar avec une flotte de 24 motos et 6 voitures. Suivi GPS en temps réel et service client 7j/7.",
    city: "Dakar",
    countryCode: "SN",
    countryFlag: "🇸🇳",
    zones: [
      { name: "Plateau", priceXof: 1500, estimatedMin: 30 },
      { name: "Almadies", priceXof: 2000, estimatedMin: 40 },
      { name: "Yoff", priceXof: 2000, estimatedMin: 45 },
      { name: "Mermoz", priceXof: 1500, estimatedMin: 35 },
      { name: "Sacré-Coeur", priceXof: 1500, estimatedMin: 30 },
      { name: "Ouakam", priceXof: 2000, estimatedMin: 40 },
      { name: "Mamelles", priceXof: 2000, estimatedMin: 45 },
      { name: "Pikine", priceXof: 1800, estimatedMin: 50 },
      { name: "Guédiawaye", priceXof: 1800, estimatedMin: 55 },
      { name: "Rufisque", priceXof: 2500, estimatedMin: 70 },
      { name: "Parcelles Assainies", priceXof: 1500, estimatedMin: 40 },
      { name: "Thiaroye", priceXof: 2000, estimatedMin: 50 },
    ],
    rating: 4.7,
    reviewsCount: 312,
    reviews: [
      {
        vendorName: "Babacar Diop",
        vendorAvatarBg: "linear-gradient(135deg,#F59E0B,#FBBF24)",
        vendorCity: "Dakar",
        vendorCountryCode: "SN",
        rating: 5,
        comment: "Service de qualité, très fiable. Coûte un peu plus cher mais ça vaut le coup pour le suivi en temps réel.",
        at: "2026-04-18T16:00:00Z",
      },
      {
        vendorName: "Khady Niang",
        vendorAvatarBg: "linear-gradient(135deg,#A855F7,#C084FC)",
        vendorCity: "Dakar",
        vendorCountryCode: "SN",
        rating: 4,
        comment: "Bonne couverture du Grand Dakar. Quelques retards en heures de pointe.",
        at: "2026-03-22T14:00:00Z",
      },
    ],
    status: "certified",
    activePartners: 47,
    kpi: {
      deliverySuccessRate: 96,
      avgDeliveryMin: 55,
      deliveriesHandled: 8421,
      monthsOnPlatform: 24,
    },
    schedule: {
      days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
      startTime: "07:00",
      endTime: "21:00",
    },
    joinedAt: "2024-03-01",
  },
  {
    slug: "yango-delivery-ci",
    name: "Yango Delivery",
    type: "agence",
    initials: "YD",
    avatarBg: "linear-gradient(135deg,#FACC15,#EAB308)",
    coverBg: "linear-gradient(135deg,#FACC15,#FDE047)",
    bio: "Plateforme de livraison panafricaine présente à Abidjan. 100+ partenaires moto/voiture, application de tracking dédiée, paiement Mobile Money intégré.",
    city: "Abidjan",
    countryCode: "CI",
    countryFlag: "🇨🇮",
    zones: [
      { name: "Plateau", priceXof: 1500, estimatedMin: 25 },
      { name: "Cocody", priceXof: 1800, estimatedMin: 35 },
      { name: "Yopougon", priceXof: 2000, estimatedMin: 45 },
      { name: "Adjamé", priceXof: 1500, estimatedMin: 30 },
      { name: "Marcory", priceXof: 1800, estimatedMin: 35 },
      { name: "Treichville", priceXof: 1500, estimatedMin: 30 },
      { name: "Abobo", priceXof: 2000, estimatedMin: 40 },
      { name: "Port-Bouët", priceXof: 2200, estimatedMin: 50 },
    ],
    rating: 4.5,
    reviewsCount: 245,
    reviews: [
      {
        vendorName: "Marie Kouassi",
        vendorAvatarBg: "linear-gradient(135deg,#A855F7,#C084FC)",
        vendorCity: "Abidjan",
        vendorCountryCode: "CI",
        rating: 5,
        comment: "Couverture imbattable d'Abidjan. Tracking GPS très utile.",
        at: "2026-04-10T10:00:00Z",
      },
    ],
    status: "certified",
    activePartners: 38,
    kpi: {
      deliverySuccessRate: 93,
      avgDeliveryMin: 45,
      deliveriesHandled: 6754,
      monthsOnPlatform: 19,
    },
    schedule: {
      days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
      startTime: "06:00",
      endTime: "23:00",
    },
    joinedAt: "2024-08-15",
  },
  {
    slug: "express-cameroun",
    name: "Express Cameroun",
    type: "agence",
    initials: "EC",
    avatarBg: "linear-gradient(135deg,#059669,#10B981)",
    coverBg: "linear-gradient(135deg,#059669,#34D399)",
    bio: "Agence locale de Douala spécialisée e-commerce. 18 livreurs, couverture totale Douala + extension Yaoundé en cours. Émission de bons de livraison automatique.",
    city: "Douala",
    countryCode: "CM",
    countryFlag: "🇨🇲",
    zones: [
      { name: "Akwa", priceXof: 1800, estimatedMin: 30 },
      { name: "Bonapriso", priceXof: 1800, estimatedMin: 35 },
      { name: "Bonabéri", priceXof: 2200, estimatedMin: 50 },
      { name: "Deido", priceXof: 1500, estimatedMin: 30 },
      { name: "Bali", priceXof: 1500, estimatedMin: 30 },
      { name: "Bépanda", priceXof: 1800, estimatedMin: 40 },
      { name: "New Bell", priceXof: 1800, estimatedMin: 40 },
    ],
    rating: 4.6,
    reviewsCount: 189,
    reviews: [
      {
        vendorName: "Christine Tchouala",
        vendorAvatarBg: "linear-gradient(135deg,#10B981,#059669)",
        vendorCity: "Douala",
        vendorCountryCode: "CM",
        rating: 5,
        comment: "Très professionnel pour les commandes urgentes. Bon suivi.",
        at: "2026-04-05T11:00:00Z",
      },
    ],
    status: "certified",
    activePartners: 22,
    kpi: {
      deliverySuccessRate: 95,
      avgDeliveryMin: 50,
      deliveriesHandled: 3567,
      monthsOnPlatform: 14,
    },
    schedule: {
      days: ["mon", "tue", "wed", "thu", "fri", "sat"],
      startTime: "07:00",
      endTime: "20:00",
    },
    joinedAt: "2025-02-10",
  },
];

/**
 * Services proposés par livreur — la flexibilité Kamoo : certains font aussi
 * le closing ou l'entreposage. Déclaré par le livreur à l'inscription.
 */
const SERVICES: Record<string, Livreur["services"]> = {
  "moussa-sow": ["livraison"],
  "ibrahima-sarr": ["livraison", "closing"],
  "pape-faye": ["livraison"],
  "aminata-diakite": ["livraison", "closing"],
  "yves-mballa": ["livraison"],
  "wave-express-sn": ["livraison", "entreposage"],
  "yango-delivery-ci": ["livraison"],
  "express-cameroun": ["livraison", "entreposage"],
};

/* Description standard de la livraison (tarifée par zone, cf. `zones`). */
const LIVRAISON_OFFERING: ServiceOffering = {
  service: "livraison",
  description:
    "Livraison de vos commandes confirmées avec encaissement à la livraison (COD). Tarif fixe selon la zone — voir la grille des zones desservies.",
};

/**
 * Grille tarifaire détaillée par livreur (façon ComeUp) : chaque service
 * additionnel a son tarif, son unité et sa description rédigée par le livreur.
 */
const SERVICE_OFFERINGS: Record<string, ServiceOffering[]> = {
  "ibrahima-sarr": [
    LIVRAISON_OFFERING,
    {
      service: "closing",
      priceXof: 1000,
      unit: "/ commande confirmée",
      description:
        "J'appelle vos clients pour confirmer la commande avant de livrer. Pratique si vous n'avez pas de closeuse : je confirme et je livre dans la foulée, payé uniquement sur les commandes confirmées.",
    },
  ],
  "aminata-diakite": [
    LIVRAISON_OFFERING,
    {
      service: "closing",
      priceXof: 1200,
      unit: "/ commande confirmée",
      description:
        "6 ans de télévente avant la livraison : je confirme vos commandes en français et en dioula, puis je les livre moi-même. Un seul interlocuteur du premier appel à l'encaissement.",
    },
  ],
  "wave-express-sn": [
    LIVRAISON_OFFERING,
    {
      service: "entreposage",
      priceXof: 100,
      unit: "/ colis / jour",
      description:
        "Entrepôt sécurisé de 200 m² aux Parcelles Assainies : vos colis y sont stockés et partent en livraison directement, sans passer par chez vous. Inventaire mis à jour dans Kamoo.",
    },
  ],
  "express-cameroun": [
    LIVRAISON_OFFERING,
    {
      service: "entreposage",
      priceXof: 150,
      unit: "/ colis / jour",
      description:
        "Dépôt central à Akwa avec gardiennage 24 h/24. Idéal pour pré-positionner votre stock à Douala et livrer en moins de 2 h.",
    },
  ],
};

/**
 * Photo de profil téléchargée (Unsplash, licence libre) pour les livreurs
 * INDÉPENDANTS uniquement, servie depuis /public/livreurs/{slug}.jpg.
 * Les AGENCES gardent leur avatar à initiales (placeholder logo).
 */
const __seed_LIVREURS: Livreur[] = RAW_LIVREURS.map((l) => {
  /* Avis : fixtures + generes (stables) — compteur = nombre reel liste. */
  const reviews = [
    ...l.reviews,
    ...generateReviews(l.slug, "livreur", l.rating).map((g) => ({
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
    ...l,
    photoUrl: l.type === "particulier" ? `/livreurs/${l.slug}.jpg` : undefined,
    services: SERVICES[l.slug] ?? ["livraison"],
    serviceOfferings: SERVICE_OFFERINGS[l.slug] ?? [LIVRAISON_OFFERING],
    reviews,
    reviewsCount: reviews.length,
    rating: averageRating(reviews.map((r) => r.rating)),
  };
});

export function getLivreur(slug: string): Livreur | undefined {
  return MOCK_LIVREURS.find((l) => l.slug === slug);
}

export const MOCK_LIVREURS: Livreur[] = __seed_LIVREURS;
