import { MOCK_TODAY } from "@/lib/clock";

/**
 * Générateur DÉTERMINISTE d'avis pour les profils marketplace.
 *
 * Règle (validée avec le fondateur) : le compteur d'avis affiché doit être
 * EXACTEMENT le nombre d'avis listés. Plutôt que de réduire les compteurs,
 * on étoffe chaque partenaire de 8 à 14 avis crédibles, générés de façon
 * stable (même partenaire → mêmes avis à chaque rendu/rechargement).
 */

/* PRNG déterministe (même graine → même séquence) */
function hashStr(s: string): number {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Persona = {
  name: string;
  city: string;
  countryCode: string;
  flag: string;
};

const PERSONAS: Persona[] = [
  { name: "Mariama Sall", city: "Dakar", countryCode: "SN", flag: "🇸🇳" },
  { name: "Ibrahima Ndiaye", city: "Pikine", countryCode: "SN", flag: "🇸🇳" },
  { name: "Adjoa Touré", city: "Abidjan", countryCode: "CI", flag: "🇨🇮" },
  { name: "Moussa Traoré", city: "Bouaké", countryCode: "CI", flag: "🇨🇮" },
  { name: "Christine Tchouala", city: "Douala", countryCode: "CM", flag: "🇨🇲" },
  { name: "Fatou Bâ", city: "Thiès", countryCode: "SN", flag: "🇸🇳" },
  { name: "Kouamé Yao", city: "Yopougon", countryCode: "CI", flag: "🇨🇮" },
  { name: "Aminata Diallo", city: "Rufisque", countryCode: "SN", flag: "🇸🇳" },
  { name: "Serge Kamdem", city: "Yaoundé", countryCode: "CM", flag: "🇨🇲" },
  { name: "Awa Cissé", city: "Saint-Louis", countryCode: "SN", flag: "🇸🇳" },
  { name: "Didier Kouassi", city: "Cocody", countryCode: "CI", flag: "🇨🇮" },
  { name: "Ndeye Fall", city: "Guédiawaye", countryCode: "SN", flag: "🇸🇳" },
  { name: "Paul Eyenga", city: "Douala", countryCode: "CM", flag: "🇨🇲" },
  { name: "Salimata Koné", city: "Marcory", countryCode: "CI", flag: "🇨🇮" },
  { name: "Cheikh Mbaye", city: "Mbour", countryCode: "SN", flag: "🇸🇳" },
  { name: "Grace Ngo Bell", city: "Bonabéri", countryCode: "CM", flag: "🇨🇲" },
];

const GRADIENTS = [
  "linear-gradient(135deg,#0EA5E9,#0284C7)",
  "linear-gradient(135deg,#22C55E,#16A34A)",
  "linear-gradient(135deg,#A855F7,#7E22CE)",
  "linear-gradient(135deg,#F59E0B,#B45309)",
  "linear-gradient(135deg,#EC4899,#DB2777)",
  "linear-gradient(135deg,#14B8A6,#0F766E)",
  "linear-gradient(135deg,#6366F1,#4338CA)",
  "linear-gradient(135deg,#EF4444,#B91C1C)",
];

const COMMENTS: Record<"transitaire" | "closeuse" | "livreur", string[]> = {
  transitaire: [
    "Colis bien reçu, pesée conforme aux photos envoyées. Sérieux.",
    "Devis rapide et transparent, aucun frais surprise à l'arrivée.",
    "Deuxième conteneur avec eux, toujours dans les délais annoncés.",
    "Bonne communication sur le chat, répond même le week-end.",
    "Un carton légèrement abîmé mais remboursement proposé sans discuter.",
    "Le suivi photo à la réception en Chine, ça change tout.",
    "Tarif maritime imbattable pour mes gros volumes.",
    "Léger retard sur un envoi express, mais prévenu à l'avance.",
    "Retrait à l'entrepôt très fluide, tout était prêt à mon arrivée.",
    "Fiable depuis 8 mois, je n'ai jamais perdu un colis.",
    "Les catégories refusées sont claires dès le départ, zéro mauvaise surprise.",
    "Bon transitaire pour débuter, ils expliquent tout patiemment.",
  ],
  closeuse: [
    "Taux de confirmation impressionnant dès la première semaine.",
    "Très professionnelle, rappelle vite, ne lâche jamais un client.",
    "Mes clientes adorent son ton — naturelle et convaincante.",
    "Elle gère le wolof et le français, parfait pour ma clientèle.",
    "Compte-rendus clairs après chaque session d'appels.",
    "A sauvé plusieurs commandes que je pensais perdues.",
    "Disponible aux horaires convenus, jamais un appel manqué.",
    "Sait dire non aux mauvais payeurs, ça m'évite des livraisons inutiles.",
    "Un peu débordée en fin de mois mais prévient toujours.",
    "Excellente sur les produits cosmétiques, elle connaît son sujet.",
    "Commission honnête pour la qualité du travail fourni.",
    "Mes confirmations ont doublé depuis qu'on travaille ensemble.",
  ],
  livreur: [
    "Toujours à l'heure, remet le cash le soir même.",
    "Les clients le trouvent poli et arrangeant sur les créneaux.",
    "Connaît tous les raccourcis, livre même aux heures de pointe.",
    "Versements réguliers, jamais eu à courir après mon argent.",
    "A géré un client difficile avec beaucoup de calme.",
    "Photos de preuve de livraison à chaque course, très pro.",
    "Rapide sur ma zone, parfois moins dispo le dimanche.",
    "Zéro colis perdu en 6 mois de collaboration.",
    "Prévient immédiatement quand un client est injoignable.",
    "Tarifs corrects et fixes, pas de négociation à chaque course.",
    "Très fiable pour les commandes à forte valeur.",
    "Mes clients me félicitent de la livraison, c'est grâce à lui.",
  ],
};

export type GeneratedReview = {
  id: string;
  vendorName: string;
  vendorCity: string;
  vendorCountryCode: string;
  vendorCountryFlag: string;
  rating: number;
  comment: string;
  /** ISO */
  at: string;
  avatarBg: string;
};

/**
 * Génère `8 + hash%7` avis stables pour un partenaire.
 * Les notes gravitent autour de `targetRating` (la personnalité du profil
 * est conservée : un profil 4.9 reçoit surtout des 5).
 */
export function generateReviews(
  slug: string,
  role: "transitaire" | "closeuse" | "livreur",
  targetRating: number,
): GeneratedReview[] {
  const rng = mulberry32(hashStr(`${role}:${slug}`));
  const comments = COMMENTS[role];
  // Borné par les pools : les while anti-doublons doivent TOUJOURS terminer.
  const count = Math.min(8 + Math.floor(rng() * 7), comments.length, PERSONAS.length);
  const out: GeneratedReview[] = [];
  const usedPersona = new Set<number>();
  const usedComment = new Set<number>();
  for (let i = 0; i < count; i++) {
    let pi = Math.floor(rng() * PERSONAS.length);
    while (usedPersona.has(pi)) pi = (pi + 1) % PERSONAS.length;
    usedPersona.add(pi);
    let ci = Math.floor(rng() * comments.length);
    while (usedComment.has(ci)) ci = (ci + 1) % comments.length;
    usedComment.add(ci);
    const p = PERSONAS[pi];
    // Note autour de la cible : 70% = round(target), sinon ±1 (borné 3..5)
    const base = Math.round(targetRating);
    const r = rng();
    const rating = Math.max(3, Math.min(5, r < 0.7 ? base : r < 0.88 ? base - 1 : base + 1));
    // Date stable : entre 15 et 320 jours avant aujourd'hui
    const daysAgo = 15 + Math.floor(rng() * 305);
    const at = new Date(MOCK_TODAY.getTime() - daysAgo * 86400000).toISOString();
    out.push({
      id: `gen_${slug}_${i}`,
      vendorName: p.name,
      vendorCity: p.city,
      vendorCountryCode: p.countryCode,
      vendorCountryFlag: p.flag,
      rating,
      comment: comments[ci],
      at,
      avatarBg: GRADIENTS[(pi + i) % GRADIENTS.length],
    });
  }
  // Plus récents d'abord
  return out.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

/** Moyenne arrondie à 1 décimale — le rating affiché = la vraie moyenne. */
export function averageRating(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  return Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10;
}

export function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
