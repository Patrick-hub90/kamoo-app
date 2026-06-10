"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Comme `useState` mais persisté dans `sessionStorage`. Survit donc aux
 * navigations entre pages dans la même session (mais s'efface à la fermeture
 * de l'onglet).
 *
 * Sert notamment à conserver les filtres d'une liste (search, période, etc.)
 * quand on clique sur un item puis qu'on revient en arrière.
 *
 * Note hydration : le state est initialisé à `defaultValue`, puis on lit le
 * sessionStorage en useEffect (1er render serveur + 1er client = identique,
 * puis 2e render client avec la valeur stockée). Pas de hydration mismatch.
 */
export function useSessionStorageState<T>(
  key: string,
  defaultValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(defaultValue);
  const isHydrated = useRef(false);

  // Charge depuis sessionStorage au mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(key);
      if (stored !== null) {
        setValue(JSON.parse(stored) as T);
      }
    } catch {
      /* ignore — JSON corrompu ou storage indisponible */
    }
    isHydrated.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sauvegarde quand value change — mais JAMAIS lors de l'exécution initiale
  // des effets : sinon une instance fraîchement montée écrase le storage avec
  // sa defaultValue avant que les autres instances (même clé) n'aient lu.
  const isFirstPersist = useRef(true);
  useEffect(() => {
    if (isFirstPersist.current) {
      isFirstPersist.current = false;
      return;
    }
    if (!isHydrated.current) return;
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [key, value]);

  return [value, setValue];
}
