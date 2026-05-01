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
  icon: React.ReactNode;
  tone?: Tone;
  highlight?: boolean; // entoure de bordure orange pour mettre en avant
  badge?: boolean; // pastille orange pulsante
};

export function StatCard({
  label,
  value,
  unit,
  icon,
  tone = "blue",
  highlight = false,
  badge = false,
}: Props) {
  const t = TONE_CLASSES[tone];
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-white p-4 transition",
        highlight ? "border-kamoo-orange-400 ring-1 ring-kamoo-orange-100" : "border-line",
      )}
    >
      {badge && (
        <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-kamoo-orange-500 ring-4 ring-kamoo-orange-500/20" />
      )}
      <div
        className={cn(
          "mb-3 grid h-8 w-8 place-items-center rounded-lg",
          t.bg,
          t.fg,
        )}
      >
        {icon}
      </div>
      <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span
          className={cn(
            "font-display text-2xl font-extrabold leading-none",
            highlight ? "text-kamoo-orange-600" : "text-ink-900",
          )}
        >
          {value}
        </span>
        {unit && (
          <span className="text-xs font-bold text-ink-500">{unit}</span>
        )}
      </div>
    </div>
  );
}
