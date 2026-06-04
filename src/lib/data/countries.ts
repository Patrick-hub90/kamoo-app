/**
 * Pays supportés par Kamoo + liste complète des 54 pays d'Afrique.
 *
 * `COUNTRIES` = pays opérationnels (marchés ouvrables) — utilisés partout
 *               dans l'app (sélecteur marché, mocks, etc.)
 * `ALL_AFRICAN_COUNTRIES` = liste exhaustive 54 pays — utilisée dans le
 *               wizard de création de marché, avec flag `isSupported` pour
 *               distinguer ceux dispo de ceux "bientôt".
 */

export type CountryCode = string;

export type Country = {
  code: CountryCode;
  name: string;
  flag: string;
  /** Ville d'entrepôt principale — uniquement pour les pays supportés */
  warehouseCity: string;
  /** XOF (CFA Ouest), XAF (CFA Centre), ou autre code ISO devise */
  currency: string;
  /** Drapeau « pays opérationnel chez Kamoo » — false = bientôt dispo */
  isSupported: boolean;
  isGlobal?: boolean;
};

/** Helper de construction pour réduire le bruit visuel */
function c(
  code: string,
  name: string,
  flag: string,
  currency: string,
  warehouseCity = "",
  isSupported = false,
): Country {
  return { code, name, flag, currency, warehouseCity, isSupported };
}

/**
 * Tous les pays d'Afrique (54), triés alphabétiquement par nom français.
 * Les pays supportés ont `isSupported: true` et une `warehouseCity`.
 */
export const ALL_AFRICAN_COUNTRIES: Country[] = [
  c("DZ", "Algérie", "🇩🇿", "DZD"),
  c("AO", "Angola", "🇦🇴", "AOA"),
  c("BJ", "Bénin", "🇧🇯", "XOF", "Entrepôt Cotonou", true),
  c("BW", "Botswana", "🇧🇼", "BWP"),
  c("BF", "Burkina Faso", "🇧🇫", "XOF", "Entrepôt Ouagadougou", true),
  c("BI", "Burundi", "🇧🇮", "BIF"),
  c("CV", "Cap-Vert", "🇨🇻", "CVE"),
  c("CM", "Cameroun", "🇨🇲", "XAF", "Entrepôt Douala", true),
  c("CF", "Centrafrique", "🇨🇫", "XAF"),
  c("KM", "Comores", "🇰🇲", "KMF"),
  c("CG", "Congo", "🇨🇬", "XAF"),
  c("CI", "Côte d'Ivoire", "🇨🇮", "XOF", "Entrepôt Abidjan", true),
  c("DJ", "Djibouti", "🇩🇯", "DJF"),
  c("EG", "Égypte", "🇪🇬", "EGP"),
  c("ER", "Érythrée", "🇪🇷", "ERN"),
  c("SZ", "Eswatini", "🇸🇿", "SZL"),
  c("ET", "Éthiopie", "🇪🇹", "ETB"),
  c("GA", "Gabon", "🇬🇦", "XAF"),
  c("GM", "Gambie", "🇬🇲", "GMD"),
  c("GH", "Ghana", "🇬🇭", "GHS"),
  c("GN", "Guinée", "🇬🇳", "GNF"),
  c("GQ", "Guinée équatoriale", "🇬🇶", "XAF"),
  c("GW", "Guinée-Bissau", "🇬🇼", "XOF"),
  c("KE", "Kenya", "🇰🇪", "KES"),
  c("LS", "Lesotho", "🇱🇸", "LSL"),
  c("LR", "Libéria", "🇱🇷", "LRD"),
  c("LY", "Libye", "🇱🇾", "LYD"),
  c("MG", "Madagascar", "🇲🇬", "MGA"),
  c("MW", "Malawi", "🇲🇼", "MWK"),
  c("ML", "Mali", "🇲🇱", "XOF", "Entrepôt Bamako", true),
  c("MA", "Maroc", "🇲🇦", "MAD"),
  c("MU", "Maurice", "🇲🇺", "MUR"),
  c("MR", "Mauritanie", "🇲🇷", "MRU"),
  c("MZ", "Mozambique", "🇲🇿", "MZN"),
  c("NA", "Namibie", "🇳🇦", "NAD"),
  c("NE", "Niger", "🇳🇪", "XOF"),
  c("NG", "Nigéria", "🇳🇬", "NGN"),
  c("UG", "Ouganda", "🇺🇬", "UGX"),
  c("RW", "Rwanda", "🇷🇼", "RWF"),
  c("CD", "RDC", "🇨🇩", "CDF"),
  c("ST", "Sao Tomé-et-Principe", "🇸🇹", "STN"),
  c("SN", "Sénégal", "🇸🇳", "XOF", "Entrepôt Dakar", true),
  c("SC", "Seychelles", "🇸🇨", "SCR"),
  c("SL", "Sierra Leone", "🇸🇱", "SLL"),
  c("SO", "Somalie", "🇸🇴", "SOS"),
  c("SD", "Soudan", "🇸🇩", "SDG"),
  c("SS", "Soudan du Sud", "🇸🇸", "SSP"),
  c("ZA", "Afrique du Sud", "🇿🇦", "ZAR"),
  c("TZ", "Tanzanie", "🇹🇿", "TZS"),
  c("TD", "Tchad", "🇹🇩", "XAF"),
  c("TG", "Togo", "🇹🇬", "XOF", "Entrepôt Lomé", true),
  c("TN", "Tunisie", "🇹🇳", "TND"),
  c("ZM", "Zambie", "🇿🇲", "ZMW"),
  c("ZW", "Zimbabwe", "🇿🇼", "ZWL"),
].sort((a, b) => a.name.localeCompare(b.name, "fr"));

/** Pays opérationnels chez Kamoo (utilisés dans l'app + mocks) */
export const COUNTRIES: Country[] = ALL_AFRICAN_COUNTRIES.filter(
  (c) => c.isSupported,
);

export const GLOBAL_OPTION: Country = {
  code: "GLOBAL",
  name: "Vue globale",
  flag: "🌍",
  warehouseCity: "Tous marchés consolidés (lecture seule)",
  currency: "XOF",
  isSupported: true,
  isGlobal: true,
};

export function getCountryByCode(code: CountryCode): Country {
  if (code === "GLOBAL") return GLOBAL_OPTION;
  return (
    ALL_AFRICAN_COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0]
  );
}
