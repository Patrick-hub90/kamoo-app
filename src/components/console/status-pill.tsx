/**
 * StatusPill console — version « mono uppercase » du design ref.
 *
 * Coexiste avec l'ancien `src/components/kamoo/status-pill.tsx` (sentence
 * case classique). Le nouveau est utilisé dans les écrans Console (sidebar
 * rail, dashboard, listes ops…) pour matcher la direction « mission
 * control ». L'ancien reste pour les contextes legacy qui n'ont pas encore
 * été migrés.
 *
 * 6 tons sémantiques alignés sur le design ref :
 *   gray   · neutre / par défaut
 *   blue   · info / en cours
 *   green  · succès / payé / livré
 *   orange · attention / action requise
 *   red    · alerte / dispute
 *   purple · marketing / ads
 */

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type PillTone =
  | "gray"
  | "blue"
  | "green"
  | "orange"
  | "red"
  | "purple";

const TONE_STYLES: Record<PillTone, { bg: string; fg: string; dot: string }> = {
  gray: { bg: "bg-paper-2", fg: "text-ink-700", dot: "bg-ink-500" },
  blue: {
    bg: "bg-kamoo-blue-50",
    fg: "text-kamoo-blue-700",
    dot: "bg-kamoo-blue-600",
  },
  green: { bg: "bg-emerald-50", fg: "text-emerald-700", dot: "bg-emerald-500" },
  orange: {
    bg: "bg-kamoo-orange-50",
    fg: "text-kamoo-orange-700",
    dot: "bg-kamoo-orange-500",
  },
  red: { bg: "bg-red-50", fg: "text-red-700", dot: "bg-red-500" },
  purple: {
    bg: "bg-purple-50",
    fg: "text-purple-700",
    dot: "bg-purple-500",
  },
};

type ConsoleStatusPillProps = {
  label: string;
  tone?: PillTone;
  /** Icon avant le label (Lucide). */
  icon?: ReactNode;
  /** Pastille colorée pulsante à gauche. */
  dot?: boolean;
  className?: string;
};

export function ConsoleStatusPill({
  label,
  tone = "gray",
  icon,
  dot = false,
  className,
}: ConsoleStatusPillProps) {
  const t = TONE_STYLES[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em]",
        t.bg,
        t.fg,
        className,
      )}
    >
      {dot && (
        <span
          aria-hidden
          className={cn("h-1.5 w-1.5 shrink-0 rounded-full", t.dot)}
        />
      )}
      {icon}
      {label}
    </span>
  );
}
