/**
 * Formate un montant en F CFA avec espace insécable narrow comme séparateur.
 * Ex : 245000 -> "245 000 F CFA"
 */
export function formatXOF(amount: number, withCurrency = true): string {
  const formatted = amount
    .toLocaleString("fr-FR")
    .replace(/ /g, " "); // espace fine insécable
  return withCurrency ? `${formatted} F CFA` : formatted;
}

/**
 * Idem mais sans la devise (utile pour combiner dans un span).
 */
export function formatXOFNumber(amount: number): string {
  return formatXOF(amount, false);
}
