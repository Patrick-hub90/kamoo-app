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
  const seconds = Math.floor((ms % 60_000) / 1000);
  return { past, days, hours, minutes, seconds };
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

/**
 * Compteur format HH:MM:SS ou Dj:HH:MM:SS, toujours en rouge gras.
 * Met à jour chaque seconde.
 */
export function Countdown({ targetIso }: Props) {
  const target = new Date(targetIso);
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const { past, days, hours, minutes, seconds } = diffParts(target, now);

  const time = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  const label = days > 0 ? `${days}j:${time}` : time;

  return (
    <span
      className={`font-mono-kamoo text-[15px] font-extrabold ${
        past ? "text-red-700" : "text-ink-900"
      }`}
    >
      {past && "−"}
      {label}
    </span>
  );
}

/** Helper exporté pour vérifier expiration sans monter le composant */
export function isCountdownExpired(targetIso: string, now = new Date()): boolean {
  return new Date(targetIso).getTime() < now.getTime();
}
