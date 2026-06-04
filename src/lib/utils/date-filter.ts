import type { DateFilterValue } from "@/components/kamoo/date-range-filter";
import type { TimelinePeriod } from "@/lib/types/finance";

/**
 * Helpers de filtrage par DateFilterValue, partagés entre les pages
 * Finances (Aperçu, Journal, Pubs…). Garantit que tous les modules ont
 * la même logique de découpage temporel.
 */

/**
 * Normalise une date locale vers UTC minuit en gardant la même valeur calendrier.
 * Ex: "28 avril 23h local UTC+1" → "28 avril 00h UTC".
 *
 * Indispensable car le DateRangeFilter retourne des Date en heure locale, mais
 * notre logique de buckets (computeCashflowTimeline / filtrage) opère en UTC.
 */
export function localDateToUTC(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

/**
 * Renvoie l'intervalle [fromMs, toMs[ correspondant à un DateFilterValue.
 *  - `today`      : 1 jour finissant à la fin du jour courant
 *  - `yesterday`  : 1 jour complet précédent
 *  - `7j/30j/3m`  : N derniers jours (inclusif aujourd'hui)
 *  - `month`      : du 1er du mois courant à aujourd'hui inclus
 *  - `lastMonth`  : mois précédent en entier (1er au dernier jour)
 *  - `year`       : du 1er janvier de l'année courante à aujourd'hui inclus
 *  - `custom`     : range explicite, fin = fin du jour `to`
 *  - `all`        : pas de filtre (renvoie null)
 *
 * Renvoie null si le filtre est `all` ou `custom` sans `from`.
 */
export function dateFilterRange(
  filter: DateFilterValue,
  today: Date,
): { fromMs: number; toMs: number } | null {
  if (filter.preset === "all") return null;
  if (filter.preset === "custom") {
    if (!filter.range?.from) return null;
    const from = localDateToUTC(filter.range.from);
    const to = localDateToUTC(filter.range.to ?? filter.range.from);
    return { fromMs: from.getTime(), toMs: to.getTime() + 86400000 };
  }
  // Helper : début du jour aujourd'hui (UTC)
  const todayStart = new Date(today);
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayEndMs = todayStart.getTime() + 86400000;

  if (filter.preset === "yesterday") {
    const from = new Date(todayStart);
    from.setUTCDate(from.getUTCDate() - 1);
    return { fromMs: from.getTime(), toMs: todayStart.getTime() };
  }
  if (filter.preset === "month") {
    const from = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
    );
    return { fromMs: from.getTime(), toMs: todayEndMs };
  }
  if (filter.preset === "lastMonth") {
    const from = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1),
    );
    // Dernier ms du mois précédent = 1er du mois courant à 00:00
    const to = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
    );
    return { fromMs: from.getTime(), toMs: to.getTime() };
  }
  if (filter.preset === "year") {
    const from = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
    return { fromMs: from.getTime(), toMs: todayEndMs };
  }
  // today / 7j / 30j / 3m → fenêtre glissante "N derniers jours"
  const days =
    filter.preset === "today"
      ? 1
      : filter.preset === "7j"
        ? 7
        : filter.preset === "30j"
          ? 30
          : 90;
  const from = new Date(todayStart);
  from.setUTCDate(from.getUTCDate() - days + 1);
  return { fromMs: from.getTime(), toMs: todayEndMs };
}

/** Filtre un tableau d'items (avec champ `date: string` ISO) selon le filtre. */
export function filterByDate<T extends { date: string }>(
  items: T[],
  filter: DateFilterValue,
  today: Date,
): T[] {
  return filterByDateWith(items, filter, today, (m) => m.date);
}

/**
 * Variante générique : permet de passer un selector pour les items dont
 * la date ne s'appelle pas `date` (ex : `createdAt`, `scheduledAt`,
 * `deliveredAt`). Évite aux pages de réimplémenter leur propre
 * `applyDateFilter` avec `new Date()` (qui casse les fixtures mock).
 *
 * Le selector peut retourner string | Date | undefined ; undefined exclut
 * l'item du résultat (utile pour les commandes pas encore livrées).
 */
export function filterByDateWith<T>(
  items: T[],
  filter: DateFilterValue,
  today: Date,
  getDate: (item: T) => string | Date | undefined,
): T[] {
  const range = dateFilterRange(filter, today);
  if (!range) return items;
  return items.filter((item) => {
    const raw = getDate(item);
    if (!raw) return false;
    const t = raw instanceof Date ? raw.getTime() : new Date(raw).getTime();
    return t >= range.fromMs && t < range.toMs;
  });
}

/**
 * Normalise un DateFilterValue rehydraté depuis sessionStorage.
 * JSON.parse ne restaure pas les Date — elles redeviennent des strings.
 * Cet helper reconvertit en vrais Date pour que toute la logique aval
 * travaille avec le bon type.
 */
export function normalizeDateFilter(filter: DateFilterValue): DateFilterValue {
  if (filter.preset !== "custom" || !filter.range) return filter;
  return {
    preset: "custom",
    range: {
      from: filter.range.from ? new Date(filter.range.from) : undefined,
      to: filter.range.to ? new Date(filter.range.to) : undefined,
    },
  };
}

/**
 * Détermine la granularité adaptative et le nombre de buckets à afficher
 * pour un DateFilterValue donné. Logique inspirée de Shopify Analytics —
 * la granularité s'élargit au fur et à mesure que la période s'allonge,
 * pour garantir un axe X lisible (≤ ~36 points, le chart skip les labels
 * en trop) :
 *
 *   1 jour        → 24 buckets HEURE (00h → 23h, vue intraday)
 *   ≤ 30 jours    → bucket jour
 *   ≤ 90 jours    → bucket semaine (~13 max)
 *   ≤ 3 ans       → bucket mois  (cap 36 — comme Shopify: « mai/août/nov »)
 *   > 3 ans       → bucket année (cap 25 — comme Shopify: « 2020, 2021… »)
 *
 * Le cap garantit qu'une période de 19 ans ne génère pas 232 buckets
 * tassés à droite — on bascule sur des buckets annuels.
 */
export function bucketingForDateFilter(
  filter: DateFilterValue,
): { granularity: TimelinePeriod; count: number } {
  // Vue intraday : période = 1 jour → 24 buckets horaires 00h→23h
  if (filter.preset === "today") return { granularity: "hour", count: 24 };
  if (filter.preset === "yesterday")
    return { granularity: "hour", count: 24 };
  if (filter.preset === "7j") return { granularity: "day", count: 7 };
  if (filter.preset === "30j") return { granularity: "day", count: 30 };
  if (filter.preset === "month") return { granularity: "day", count: 31 };
  if (filter.preset === "lastMonth")
    return { granularity: "day", count: 31 };
  if (filter.preset === "3m") return { granularity: "week", count: 13 };
  if (filter.preset === "year") return { granularity: "month", count: 12 };
  if (filter.preset === "all") return { granularity: "month", count: 24 };
  // custom — bucketing dérivé du nombre de jours sélectionnés
  if (!filter.range?.from) return { granularity: "day", count: 7 };
  const to = filter.range.to ?? filter.range.from;
  const days = Math.max(
    1,
    Math.floor((to.getTime() - filter.range.from.getTime()) / 86400000) + 1,
  );
  // Custom 1 jour → également vue horaire
  if (days <= 1) return { granularity: "hour", count: 24 };
  if (days <= 30) return { granularity: "day", count: Math.max(7, days) };
  if (days <= 90)
    return {
      granularity: "week",
      count: Math.max(4, Math.ceil(days / 7)),
    };
  if (days <= 365 * 3)
    return {
      granularity: "month",
      count: Math.min(36, Math.max(3, Math.ceil(days / 30))),
    };
  return {
    granularity: "year",
    count: Math.min(25, Math.max(3, Math.ceil(days / 365))),
  };
}

/**
 * Date de fin à utiliser pour le bucketing du graphe.
 *
 * Pour les presets fixes, on utilise toujours `fallback` (aujourd'hui réel
 * ou MOCK_TODAY). Pour `custom`, on ancre le graphe sur la fin du range
 * sélectionné — sinon une période 2007→2020 afficherait les buckets
 * jusqu'en 2026 au lieu de s'arrêter à 2020.
 */
export function chartEndDateForFilter(
  filter: DateFilterValue,
  fallback: Date,
): Date {
  if (filter.preset === "custom") {
    if (filter.range?.to) return localDateToUTC(filter.range.to);
    if (filter.range?.from) return localDateToUTC(filter.range.from);
  }
  return fallback;
}

/** Sous-titre humain (« aujourd'hui », « 7 derniers jours », « du X au Y ») */
export function dateFilterSubtitle(f: DateFilterValue): string {
  switch (f.preset) {
    case "today":
      return "aujourd'hui";
    case "yesterday":
      return "hier";
    case "7j":
      return "7 derniers jours";
    case "30j":
      return "30 derniers jours";
    case "month":
      return "ce mois";
    case "lastMonth":
      return "mois dernier";
    case "3m":
      return "3 derniers mois";
    case "year":
      return "cette année";
    case "all":
      return "tout l'historique";
    case "custom":
      if (f.range?.from && f.range?.to) {
        const fromLabel = f.range.from.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
        });
        const toLabel = f.range.to.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        return `du ${fromLabel} au ${toLabel}`;
      }
      return "période personnalisée";
  }
}
