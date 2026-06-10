/**
 * Horloge de référence pour toute l'app.
 *
 * L'app vit maintenant en TEMPS RÉEL : `MOCK_TODAY` correspond à la date
 * courante (arrondie à l'heure pour limiter les écarts d'hydratation
 * serveur/client). Toutes les périodes (« Aujourd'hui », « 7 derniers
 * jours »…) sont calculées par rapport à maintenant.
 *
 * Les fixtures historiques avaient été écrites autour d'une ancre fixe
 * (2026-05-04). Pour qu'elles restent « fraîches » quelle que soit la date
 * réelle, `shiftToNow()` décale toute date legacy du nombre de jours entiers
 * qui sépare l'ancre d'aujourd'hui : une commande créée « le jour de l'ancre
 * à 15h » devient « aujourd'hui à 15h », « ancre − 3 jours » devient « il y
 * a 3 jours », etc. Les heures de la journée sont préservées.
 *
 * En V2 (Supabase), les dates seront réelles en BDD et `shiftToNow`
 * disparaîtra ; `now()` restera l'unique point d'accès à l'horloge.
 */

/** Ancre historique des fixtures (ne plus l'utiliser ailleurs). */
const LEGACY_ANCHOR = new Date("2026-05-04T12:00:00Z");

/** Date courante, arrondie à l'heure (stabilité d'hydratation). */
export const MOCK_TODAY: Date = (() => {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  return d;
})();

/** Décalage fixtures → aujourd'hui, en jours entiers (heures préservées). */
const DAY_MS = 86_400_000;
const OFFSET_MS =
  Math.round((MOCK_TODAY.getTime() - LEGACY_ANCHOR.getTime()) / DAY_MS) *
  DAY_MS;

/** Décale une date ISO legacy pour qu'elle soit relative à aujourd'hui. */
export function shiftToNow(iso: string): string {
  return new Date(new Date(iso).getTime() + OFFSET_MS).toISOString();
}

/**
 * Horloge applicative. Centraliser via cette fonction permet de stubber en
 * test et de basculer V1↔V2 en changeant une seule ligne.
 */
export function now(): Date {
  return MOCK_TODAY;
}
