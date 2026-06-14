/**
 * Formate un montant en F CFA avec espace insécable comme séparateur de
 * milliers. Ex : 3456222 -> "3 456 222 F CFA".
 *
 * On utilise explicitement U+00A0 (NO-BREAK SPACE) au lieu du U+202F (NARROW
 * NO-BREAK SPACE) que `toLocaleString("fr-FR")` produit par défaut, car U+202F
 * n'est pas rendu par certaines polices custom (font-display) → digits collés.
 */
const NBSP = " ";

/** Devises proposées au vendeur dans les paramètres (région + courantes). */
export const SUPPORTED_CURRENCIES: { code: string; label: string }[] = [
  { code: "XOF", label: "Franc CFA (XOF) — F CFA" },
  { code: "XAF", label: "Franc CFA (XAF) — FCFA" },
  { code: "NGN", label: "Naira nigérian (NGN) — ₦" },
  { code: "GHS", label: "Cedi ghanéen (GHS) — ₵" },
  { code: "MAD", label: "Dirham marocain (MAD) — DH" },
  { code: "USD", label: "Dollar US (USD) — $" },
  { code: "EUR", label: "Euro (EUR) — €" },
  { code: "GBP", label: "Livre sterling (GBP) — £" },
];

/** Devises sans décimales (le montant est affiché en entier). */
const ZERO_DECIMAL = new Set(["XOF", "XAF", "JPY", "KRW", "GNF", "RWF"]);

/** Symbole/suffixe court par devise (sinon on retombe sur le code ISO). */
const CURRENCY_SUFFIX: Record<string, string> = {
  XOF: "F CFA",
  XAF: "FCFA",
  USD: "$",
  EUR: "€",
  GBP: "£",
  NGN: "₦",
  GHS: "₵",
  MAD: "DH",
};

/**
 * Formate un montant dans la devise réelle (auto-détectée depuis Shopify).
 * XOF garde le format historique « 3 456 222 F CFA » ; les autres devises
 * sont affichées avec leur symbole et le bon nombre de décimales.
 *
 * C'est LE formateur à utiliser pour toute donnée issue de la boutique :
 * la devise n'est plus supposée XOF, elle suit la boutique connectée.
 */
export function formatMoney(
  amount: number,
  currencyCode = "XOF",
  withCurrency = true,
): string {
  const code = currencyCode.toUpperCase();
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const decimals = ZERO_DECIMAL.has(code) ? 0 : 2;
  const fixed = decimals === 0 ? String(Math.round(abs)) : abs.toFixed(2);
  const [intPart, decPart] = fixed.split(".");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  const num = decPart ? `${grouped},${decPart}` : grouped;
  const body = isNegative ? `−${num}` : num;
  if (!withCurrency) return body;
  const suffix = CURRENCY_SUFFIX[code];
  // Symboles courts ($, €, £, ₦…) en préfixe ; suffixes mots (F CFA) en suffixe.
  if (suffix && suffix.length <= 2 && !/[A-Z]/.test(suffix)) return `${suffix}${body}`;
  return `${body}${NBSP}${suffix ?? code}`;
}

export function formatXOF(amount: number, withCurrency = true): string {
  // Format manuel pour avoir un séparateur cohérent dans toutes les polices.
  // Ex: 3456222 → "3 456 222" (avec U+00A0 entre chaque groupe de 3 digits)
  const isNegative = amount < 0;
  const abs = Math.abs(Math.round(amount));
  const grouped = String(abs).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  const formatted = isNegative ? `−${grouped}` : grouped;
  return withCurrency ? `${formatted}${NBSP}F${NBSP}CFA` : formatted;
}

/**
 * Idem mais sans la devise (utile pour combiner dans un span).
 */
export function formatXOFNumber(amount: number): string {
  return formatXOF(amount, false);
}

/**
 * Format compact pour les gros montants — utilisé dans les KPI cards où
 * l'espace est limité. Ex : 63 817 512 → "63,8 M" / 44 109 → "44,1 k".
 *
 * Au-dessus de 1 M : suffixe " M" (1 décimale)
 * Au-dessus de 10 k : suffixe " k" (entier)
 * En-dessous : format complet avec espaces ("987" / "12 345")
 */
export function formatXOFCompact(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "−" : "";
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(1).replace(".", ",")}${NBSP}M`;
  }
  if (abs >= 10_000) {
    return `${sign}${formatXOF(Math.round(abs / 1_000), false)}${NBSP}k`;
  }
  return formatXOF(amount, false);
}
