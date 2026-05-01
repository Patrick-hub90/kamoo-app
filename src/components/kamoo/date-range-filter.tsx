"use client";

import { useState } from "react";
import { Calendar as CalendarIcon, Check, ChevronDown, X } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type DateFilterPreset = "all" | "7j" | "30j" | "3m" | "custom";

export type DateFilterValue = {
  preset: DateFilterPreset;
  range?: DateRange; // utilisé seulement si preset === "custom"
};

const PRESETS: { id: DateFilterPreset; label: string }[] = [
  { id: "7j", label: "7 jours" },
  { id: "30j", label: "30 jours" },
  { id: "3m", label: "3 mois" },
  { id: "custom", label: "Personnalisé" },
];

const PRESET_LABELS: Record<Exclude<DateFilterPreset, "custom">, string> = {
  all: "Toutes les dates",
  "7j": "Derniers 7 jours",
  "30j": "Derniers 30 jours",
  "3m": "Derniers 3 mois",
};

function formatDateShort(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

function formatTriggerLabel(value: DateFilterValue): string {
  if (value.preset === "custom") {
    if (value.range?.from && value.range?.to) {
      return `${formatDateShort(value.range.from)} → ${formatDateShort(value.range.to)}`;
    }
    if (value.range?.from) {
      return `Depuis le ${formatDateShort(value.range.from)}`;
    }
    return "Sélectionner les dates";
  }
  return PRESET_LABELS[value.preset];
}

type Props = {
  value: DateFilterValue;
  onChange: (next: DateFilterValue) => void;
};

/**
 * Filtre de plage de date :
 * - Trigger : bouton dropdown avec valeur courante
 * - Popover : 4 presets + calendrier range (visible si "Personnalisé")
 */
export function DateRangeFilter({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const isActive = value.preset !== "all";
  const triggerLabel = formatTriggerLabel(value);

  const handleSelectPreset = (preset: DateFilterPreset) => {
    if (preset === "custom") {
      // Garde le range existant ou le réinitialise
      onChange({ preset: "custom", range: value.range });
    } else {
      onChange({ preset });
      setOpen(false);
    }
  };

  const handleRangeSelect = (range: DateRange | undefined) => {
    onChange({ preset: "custom", range });
    if (range?.from && range?.to) {
      // Ferme automatiquement quand la plage est complète
      setTimeout(() => setOpen(false), 200);
    }
  };

  const handleClear = () => {
    onChange({ preset: "all" });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-lg border bg-white px-3 text-[13px] font-semibold text-ink-900 hover:border-ink-300",
          isActive ? "border-kamoo-blue-600" : "border-line",
        )}
      >
        <CalendarIcon className="h-3.5 w-3.5 text-ink-400" />
        <span className="text-ink-500">Période :</span>
        <span>{triggerLabel}</span>
        <ChevronDown className="h-3 w-3 text-ink-400" />
      </PopoverTrigger>

      <PopoverContent
        className="w-auto rounded-xl border border-line bg-white p-2 shadow-[var(--shadow-kamoo-lg)]"
        align="start"
      >
        {/* Presets */}
        <div className="flex flex-col gap-0.5">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelectPreset(p.id)}
              className={cn(
                "flex items-center justify-between rounded-md px-2.5 py-1.5 text-[13px] hover:bg-paper-2",
                value.preset === p.id
                  ? "font-bold text-kamoo-blue-700"
                  : "font-medium text-ink-700",
              )}
            >
              {p.label}
              {value.preset === p.id && (
                <Check className="h-3.5 w-3.5 text-kamoo-blue-700" />
              )}
            </button>
          ))}
        </div>

        {/* Calendrier range — visible si Personnalisé */}
        {value.preset === "custom" && (
          <div className="mt-2 border-t border-line pt-2">
            <Calendar
              mode="range"
              selected={value.range}
              onSelect={handleRangeSelect}
              numberOfMonths={1}
              defaultMonth={value.range?.from ?? new Date()}
              className="bg-transparent"
            />
            <div className="mt-1 px-1 text-[11px] text-ink-500">
              Clique sur la date de début, puis sur la date de fin.
            </div>
          </div>
        )}

        {/* Footer effacer */}
        {isActive && (
          <div className="mt-1.5 border-t border-line pt-1.5">
            <button
              onClick={handleClear}
              className="flex w-full items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-bold text-kamoo-orange-600 hover:bg-kamoo-orange-50"
            >
              <X className="h-3 w-3" />
              Effacer
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
