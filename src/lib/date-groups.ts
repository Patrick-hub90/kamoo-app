/**
 * Regroupe une liste d'objets par date (style Shopify).
 * Labels : "Aujourd'hui", "Hier", "Avant-hier", "DD MMM" sinon.
 */

export type DateBucket<T> = {
  label: string;
  items: T[];
};

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function bucketLabel(date: Date): string {
  const today = startOfDay(new Date());
  const target = startOfDay(date);
  const diffDays = Math.round(
    (today.getTime() - target.getTime()) / 86_400_000,
  );
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays === 2) return "Avant-hier";

  return target.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: target.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

export function groupByDate<T>(
  items: T[],
  getDate: (item: T) => string,
): DateBucket<T>[] {
  const sorted = [...items].sort(
    (a, b) => new Date(getDate(b)).getTime() - new Date(getDate(a)).getTime(),
  );

  const buckets = new Map<string, T[]>();
  for (const item of sorted) {
    const label = bucketLabel(new Date(getDate(item)));
    if (!buckets.has(label)) buckets.set(label, []);
    buckets.get(label)!.push(item);
  }

  return Array.from(buckets, ([label, items]) => ({ label, items }));
}
