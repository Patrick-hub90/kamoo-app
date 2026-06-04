import type {
  DateFilterPreset,
  DateFilterValue,
} from "@/components/kamoo/date-range-filter";

/**
 * Helpers pour passer un DateFilterValue dans l'URL et le récupérer
 * proprement de l'autre côté. Permet d'ouvrir une page (ex: Boutique)
 * avec une période préselectionnée transmise depuis une autre page (Finances).
 *
 * Format URL :
 *   ?preset=all|today|yesterday|7j|30j|month|lastMonth|3m|year|custom
 *   ?preset=custom&from=2026-04-01&to=2026-04-30
 */

const VALID_PRESETS = new Set<DateFilterPreset>([
  "all",
  "today",
  "yesterday",
  "7j",
  "30j",
  "month",
  "lastMonth",
  "3m",
  "year",
  "custom",
]);

/** Sérialise un DateFilterValue en query-string (sans le `?` de tête). */
export function dateFilterToSearchParams(filter: DateFilterValue): string {
  const params = new URLSearchParams();
  params.set("preset", filter.preset);
  if (filter.preset === "custom") {
    if (filter.range?.from) {
      params.set("from", toIsoDate(filter.range.from));
    }
    if (filter.range?.to) {
      params.set("to", toIsoDate(filter.range.to));
    }
  }
  return params.toString();
}

/** Extrait un DateFilterValue depuis URLSearchParams (ou ReadonlyURLSearchParams). */
export function dateFilterFromSearchParams(
  sp: { get(name: string): string | null },
): DateFilterValue | null {
  const preset = sp.get("preset");
  if (!preset || !VALID_PRESETS.has(preset as DateFilterPreset)) return null;
  if (preset === "custom") {
    const from = sp.get("from");
    const to = sp.get("to");
    return {
      preset: "custom",
      range: {
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
      },
    };
  }
  return { preset: preset as DateFilterPreset };
}

function toIsoDate(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d);
  // YYYY-MM-DD format en heure locale (pas UTC) pour cohérence visuelle
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
