import { cn } from "@/lib/utils";

type Tone = "blue" | "orange" | "green" | "gray";

const TONE_CLASSES: Record<Tone, { bg: string; fg: string }> = {
  blue: { bg: "bg-kamoo-blue-50", fg: "text-kamoo-blue-700" },
  orange: { bg: "bg-kamoo-orange-50", fg: "text-kamoo-orange-600" },
  green: { bg: "bg-emerald-50", fg: "text-emerald-700" },
  gray: { bg: "bg-paper-2", fg: "text-ink-700" },
};

type Props = {
  label: string;
  value: string | number;
  unit?: string;
  /** Complément affiché à côté de la valeur, gros et gras (ex: "(80%)" à côté de "5/7") */
  valueAccent?: string;
  /** Sous-titre visible sous la valeur (taille moyenne, gras) */
  subtitle?: string;
  icon: React.ReactNode;
  tone?: Tone;
  highlight?: boolean;
  badge?: boolean;
};

export function StatCard({
  label,
  value,
  unit,
  valueAccent,
  subtitle,
  icon,
  tone = "blue",
  highlight = false,
  badge = false,
}: Props) {
  const t = TONE_CLASSES[tone];
  return (
    <div
      className={cn(
        "relative flex items-center gap-3.5 overflow-hidden rounded-2xl border bg-white px-4 py-3.5 transition",
        highlight
          ? "border-kamoo-orange-400 ring-1 ring-kamoo-orange-100"
          : "border-line",
      )}
    >
      {badge && (
        <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-kamoo-orange-500 ring-4 ring-kamoo-orange-500/20" />
      )}
      <div
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
          t.bg,
          t.fg,
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
          {label}
        </div>
        <div className="mt-1 flex items-baseline gap-1">
          <span
            className={cn(
              "font-display text-[24px] font-extrabold leading-none tabular-nums",
              highlight ? "text-kamoo-orange-600" : "text-ink-900",
            )}
            style={{ letterSpacing: "-0.02em" }}
          >
            {value}
          </span>
          {valueAccent && (
            <span
              className={cn(
                "font-display text-[13px] font-extrabold leading-none",
                highlight ? "text-kamoo-orange-500" : "text-ink-500",
              )}
            >
              {valueAccent}
            </span>
          )}
          {unit && (
            <span className="whitespace-nowrap text-[10.5px] font-bold text-ink-500">
              {unit}
            </span>
          )}
        </div>
        {subtitle && (
          <div className={cn("mt-1 text-[12px] font-bold", t.fg)}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
