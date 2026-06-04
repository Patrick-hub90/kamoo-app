/**
 * Regroupe une liste d'objets par date (style Shopify).
 * Labels : "Aujourd'hui", "Hier", "Avant-hier", "DD MMM" sinon.
 *
 * `today` est paramétré (default `now()`) pour rester cohérent avec les
 * fixtures mock (MOCK_TODAY = 2026-05-04). Sans ça, sur une vraie horloge
 * réelle, les commandes datées 2026-05-04 seraient labellisées « 4 mai »
 * au lieu de « Aujourd'hui ».
 */

import { now as appNow } from "@/lib/clock";

export type DateBucket<T> = {
  label: string;
  items: T[];
};

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function bucketLabel(date: Date, today: Date): string {
  const t = startOfDay(today);
  const target = startOfDay(date);
  const diffDays = Math.round((t.getTime() - target.getTime()) / 86_400_000);
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays === 2) return "Avant-hier";

  return target.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: target.getFullYear() !== t.getFullYear() ? "numeric" : undefined,
  });
}

export function groupByDate<T>(
  items: T[],
  getDate: (item: T) => string,
  today: Date = appNow(),
): DateBucket<T>[] {
  const sorted = [...items].sort(
    (a, b) => new Date(getDate(b)).getTime() - new Date(getDate(a)).getTime(),
  );

  const buckets = new Map<string, T[]>();
  for (const item of sorted) {
    const label = bucketLabel(new Date(getDate(item)), today);
    if (!buckets.has(label)) buckets.set(label, []);
    buckets.get(label)!.push(item);
  }

  return Array.from(buckets, ([label, items]) => ({ label, items }));
}
