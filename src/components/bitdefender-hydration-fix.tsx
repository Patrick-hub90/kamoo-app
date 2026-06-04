"use client";

import { useEffect } from "react";

/**
 * Strip l'attribut `bis_skin_checked` injecté par l'extension Bitdefender
 * (Antivirus/Safepay) qui provoque un hydration mismatch React.
 *
 * Implémentation : Client Component avec useEffect.
 * Un `<script>` inline dans le layout ne s'exécute pas en React 18+
 * (ignoré côté client).
 *
 * Le MutationObserver retire l'attribut dès qu'il apparaît, sur tout le DOM.
 */
export function BitdefenderHydrationFix() {
  useEffect(() => {
    const strip = () => {
      document
        .querySelectorAll("[bis_skin_checked]")
        .forEach((el) => el.removeAttribute("bis_skin_checked"));
    };
    strip();
    const observer = new MutationObserver(strip);
    observer.observe(document.documentElement, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ["bis_skin_checked"],
    });
    return () => observer.disconnect();
  }, []);

  return null;
}
