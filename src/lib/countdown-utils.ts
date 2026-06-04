/**
 * Helpers liés aux countdowns, utilisables aussi bien côté serveur que client.
 * (Le composant <Countdown /> reste dans components/kamoo/countdown.tsx avec "use client"
 * car il a besoin de useState/useEffect pour s'auto-rafraîchir.)
 */

export function isCountdownExpired(
  targetIso: string,
  now: Date = new Date(),
): boolean {
  return new Date(targetIso).getTime() < now.getTime();
}
