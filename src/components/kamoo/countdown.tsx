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
 * Compte à rebours minimaliste, mis à jour chaque minute.
 * Si la date est passée → affiche "il y a X" en rouge.
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

  const label = past ? `-${parts.join(" ")}` : parts.join(" ");

  return (
    <span
      className={`font-mono-kamoo text-[12px] ${
        past ? "text-red-600" : "text-ink-900"
      }`}
    >
      {label}
    </span>
  );
}
