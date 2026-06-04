/**
 * Horloge de référence pour toute l'app.
 *
 * En V1 (mock data), `MOCK_TODAY` est la « date courante » synthétique :
 * tous les calculs de période (« Aujourd'hui », « 7 derniers jours »…) en
 * découlent. Les pages NE DOIVENT PAS appeler `new Date()` pour filtrer les
 * mocks — elles afficheraient 0 résultat (les fixtures sont datées mai 2026).
 *
 * En V2 (Supabase), on remplacera `MOCK_TODAY` par `new Date()` et `now()`
 * deviendra l'horloge réelle. Tester avec une horloge stubbable simplifie
 * aussi les tests unitaires de logique de période.
 *
 * Single source of truth : importer `MOCK_TODAY` depuis ici partout, pas
 * depuis `lib/data/mock-finances.ts` (legacy import).
 */
export const MOCK_TODAY = new Date("2026-05-04T12:00:00Z");

/**
 * Horloge applicative. V1 : retourne `MOCK_TODAY`. V2 : retournera l'heure
 * réelle. Centraliser via cette fonction permet de stubber en test et de
 * basculer V1↔V2 en changeant une seule ligne.
 */
export function now(): Date {
  return MOCK_TODAY;
}
