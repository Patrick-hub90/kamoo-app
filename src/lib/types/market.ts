import type { Country, CountryCode } from "@/lib/data/countries";

/**
 * Marché = 1 pays d'opération du vendeur.
 *
 * Un compte Kamoo (1 vendeur) peut avoir N marchés. Chaque marché a ses
 * propres partenaires, boutique Shopify, stock, finances, devise et fuseau.
 *
 * Le toggle marché en topbar permet de basculer entre marchés —
 * recharge totale du contexte. Pas de mélange entre pays.
 */

export type MarketStatus =
  /** Configuration en cours, pas encore opérationnel */
  | "config"
  /** Actif et utilisable */
  | "active"
  /** Désactivé temporairement (les données restent) */
  | "inactive";

export type Market = {
  /** ID unique du marché (préfixe + country code) */
  id: string;
  /** Pays référence (toutes les infos pays viennent de là) */
  country: Country;
  /** Statut opérationnel */
  status: MarketStatus;
  /** Date de création du marché (ISO) */
  createdAt: string;
  /** Boutique Shopify connectée (optionnel — peut être pas encore branchée) */
  shopify?: {
    domain: string; // ex: "aicha-boutique.myshopify.com"
    /** Date de la dernière sync */
    lastSyncAt?: string;
    /** Connection healthy ? */
    isConnected: boolean;
  };
  /** Fuseau horaire utilisé pour les notifications & cutoffs */
  timezone: string;
  /** Stats rapides (count partenaires/produits) — V2 calculées en live */
  stats: {
    partnersCount: number;
    productsCount: number;
    ordersThisMonth: number;
    /**
     * Commandes encore en cours (non-livrées et non-annulées) au moment T.
     * Affiché sur l'écran Paramètres → Marchés pour donner un aperçu de
     * l'activité opérationnelle de chaque marché.
     */
    activeOrdersCount: number;
    /**
     * Chiffre d'affaires du dernier mois civil pour ce marché, en F CFA.
     * (« MRR » par abus de langage e-com — c'est un revenu mensuel, pas
     * récurrent SaaS.) Sert de repère rapide sur la santé du marché.
     */
    mrrXof: number;
  };
};

export const MARKET_STATUS_LABELS: Record<MarketStatus, string> = {
  config: "Configuration",
  active: "Actif",
  inactive: "Désactivé",
};

export const MARKET_STATUS_TONE: Record<
  MarketStatus,
  { bg: string; fg: string; dot: string }
> = {
  config: {
    bg: "bg-amber-50",
    fg: "text-amber-800",
    dot: "bg-amber-500",
  },
  active: {
    bg: "bg-emerald-50",
    fg: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  inactive: {
    bg: "bg-paper-2",
    fg: "text-ink-500",
    dot: "bg-ink-400",
  },
};

export function isMarketUsable(m: Market): boolean {
  return m.status === "active";
}

export function findMarketByCountry(
  markets: Market[],
  code: CountryCode,
): Market | undefined {
  return markets.find((m) => m.country.code === code);
}
