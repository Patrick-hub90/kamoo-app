"use client";

import { useEffect, useState } from "react";

type Props = {
  /** Date cible ISO */
  targetIso: string;
};

function diffParts(target: Date, now: Date) {
  const diffMs = target.getTime() - now.getTime();
  const past = diffMs < 0;
  const ms = Math.abs(diffMs);
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  return { past, days, hours, minutes };
}

/**
 * Compteur épuré mais remarquable : font-display gras, taille un peu plus grande,
 * couleur (vert futur / rouge dépassé). Pas de fond, pas d'icône.
 */
export function Countdown({ targetIso }: Props) {
  const target = new Date(targetIso);
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const { past, days, hours, minutes } = diffParts(target, now);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}j`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}min`);

  return (
    <span
      className={`font-display text-[14px] font-extrabold tracking-tight ${
        past ? "text-red-600" : "text-emerald-700"
      }`}
    >
      {past && "− "}
      {parts.join(" ")}
    </span>
  );
}
