/**
 * Formate un montant en F CFA avec espace insécable comme séparateur de
 * milliers. Ex : 3456222 -> "3 456 222 F CFA".
 *
 * On utilise explicitement U+00A0 (NO-BREAK SPACE) au lieu du U+202F (NARROW
 * NO-BREAK SPACE) que `toLocaleString("fr-FR")` produit par défaut, car U+202F
 * n'est pas rendu par certaines polices custom (font-display) → digits collés.
 */
const NBSP = " ";

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
