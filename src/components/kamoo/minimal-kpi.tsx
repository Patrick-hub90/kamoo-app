import { Info } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/* ─── MinimalKpi : card KPI minimaliste (label + ⓘ · valeur · unité) ── */

export function MinimalKpi({
  label,
  value,
  unit,
  valueAccent,
  trend,
  color = "default",
  hint,
  caption,
  bigUnit = false,
}: {
  label: string;
  value: string;
  unit?: string;
  /** Petit complément après la valeur (ex. ratio « 6/9 ») */
  valueAccent?: string;
  /** Pill de tendance optionnelle (ex. {direction:"down", value:"77%"}) */
  trend?: { direction: "up" | "down"; value: string };
  /** Couleur de la valeur — default ink, emerald (positif), rose (négatif) */
  color?: "default" | "emerald" | "rose";
  /** Explication affichée en info-bulle au survol de l'icône ⓘ */
  hint?: string;
  /** Fine ligne sous la valeur (ex. rapport « 6/9 confirmées ») */
  caption?: React.ReactNode;
  /** Affiche l'unité à la même taille/couleur que la valeur (ex. « 67 % ») */
  bigUnit?: boolean;
}) {
  const valueColor =
    color === "emerald"
      ? "text-emerald-700"
      : color === "rose"
        ? "text-red-700"
        : "text-ink-900";
  return (
    <div className="rounded-2xl border border-line bg-white px-5 py-4">
      {/* Header : label mono + ⓘ · trend pill optionnelle à droite */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span
            className="font-mono-kamoo text-[10.5px] font-bold uppercase text-ink-500"
            style={{ letterSpacing: "0.08em" }}
          >
            {label}
          </span>
          {hint ? (
            <Tooltip content={hint}>
              <Info className="h-3 w-3 cursor-help text-ink-300 transition hover:text-ink-500" />
            </Tooltip>
          ) : (
            <Info className="h-3 w-3 text-ink-300" />
          )}
        </div>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold",
              trend.direction === "down"
                ? "bg-rose-50 text-rose-600"
                : "bg-emerald-50 text-emerald-600",
            )}
          >
            <span>{trend.direction === "down" ? "↓" : "↑"}</span>
            {trend.value}
          </span>
        )}
      </div>

      {/* Valeur géante + unité petite + accent optionnel */}
      <div className="mt-2 flex items-baseline gap-1.5">
        <span
          className={cn(
            "font-display font-extrabold leading-none tabular-nums",
            valueColor,
          )}
          style={{ fontSize: 30, letterSpacing: "-0.03em" }}
        >
          {value}
        </span>
        {unit &&
          (bigUnit ? (
            <span
              className={cn(
                "font-display font-extrabold leading-none",
                valueColor,
              )}
              style={{ fontSize: 30, letterSpacing: "-0.03em" }}
            >
              {unit}
            </span>
          ) : (
            <span className="text-[13px] font-medium text-ink-400">{unit}</span>
          ))}
        {valueAccent && (
          <span className="ml-1 text-[12px] font-bold text-ink-400 tabular-nums">
            {valueAccent}
          </span>
        )}
      </div>

      {/* Fine ligne sous la valeur (rapport / contexte) */}
      {caption && (
        <div className="mt-2 text-[11.5px] text-ink-400">{caption}</div>
      )}
    </div>
  );
}
