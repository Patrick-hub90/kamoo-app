"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Comme `useState` mais persisté dans `localStorage`. Survit donc aux
 * navigations, à la fermeture de l'onglet ET du navigateur — utile pour une
 * préférence d'affichage durable (ex. vue tableau vs grille).
 *
 * Note hydration : le state est initialisé à `defaultValue`, puis on lit le
 * localStorage en useEffect (1er render serveur + 1er client = identique,
 * puis 2e render client avec la valeur stockée). Pas de hydration mismatch.
 */
export function useLocalStorageState<T>(
  key: string,
  defaultValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(defaultValue);
  const isHydrated = useRef(false);

  // Charge depuis localStorage au mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        setValue(JSON.parse(stored) as T);
      }
    } catch {
      /* ignore — JSON corrompu ou storage indisponible */
    }
    isHydrated.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sauvegarde quand value change (mais pas au tout 1er rendu)
  useEffect(() => {
    if (!isHydrated.current) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [key, value]);

  return [value, setValue];
}
