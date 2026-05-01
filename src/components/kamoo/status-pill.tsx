import { cn } from "@/lib/utils";

type Tone = "blue" | "orange" | "green" | "gray" | "red" | "amber";

const TONE_CLASSES: Record<Tone, string> = {
  blue: "bg-kamoo-blue-50 text-kamoo-blue-700 ring-kamoo-blue-100",
  orange: "bg-kamoo-orange-50 text-kamoo-orange-700 ring-kamoo-orange-100",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  gray: "bg-paper-2 text-ink-700 ring-line",
  red: "bg-red-50 text-red-700 ring-red-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
};

type Props = {
  tone: Tone;
  label: string;
  icon?: React.ReactNode;
  size?: "sm" | "md";
};

/**
 * Étiquette de statut compacte. Une seule par card par convention.
 */
export function StatusPill({ tone, label, icon, size = "sm" }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-bold ring-1 ring-inset",
        TONE_CLASSES[tone],
        size === "sm"
          ? "px-2 py-0.5 text-[10.5px] tracking-wide"
          : "px-2.5 py-1 text-xs tracking-wide",
      )}
    >
      {icon}
      {label}
    </span>
  );
}
