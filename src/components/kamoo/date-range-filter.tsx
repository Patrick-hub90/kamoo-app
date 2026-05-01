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
 * - Popover : presets à gauche + calendrier range à droite (si "Personnalisé")
 * - Validation explicite : pas de fermeture automatique sur sélection
 */
export function DateRangeFilter({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<DateFilterPreset>(
    value.preset,
  );
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(
    value.range,
  );

  const isActive = value.preset !== "all";
  const triggerLabel = formatTriggerLabel(value);
  const showCalendar = selectedPreset === "custom";
  const canValidate =
    selectedPreset !== "custom" ||
    (draftRange?.from !== undefined && draftRange?.to !== undefined);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      // Réinitialise le draft à la valeur actuelle quand on ouvre
      setSelectedPreset(value.preset);
      setDraftRange(value.range);
    }
    setOpen(next);
  };

  const handleSelectPreset = (preset: DateFilterPreset) => {
    setSelectedPreset(preset);
    if (preset !== "custom") {
      // Validation immédiate pour les presets simples
      onChange({ preset });
      setOpen(false);
    }
  };

  const handleValidate = () => {
    if (selectedPreset === "custom") {
      onChange({ preset: "custom", range: draftRange });
    }
    setOpen(false);
  };

  const handleClear = () => {
    onChange({ preset: "all" });
    setSelectedPreset("all");
    setDraftRange(undefined);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
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
        align="start"
        className={cn(
          "rounded-xl border border-line bg-white p-0 shadow-[var(--shadow-kamoo-lg)]",
          showCalendar ? "w-auto" : "w-56",
        )}
      >
        <div className="flex">
          {/* Presets — colonne gauche */}
          <div className="flex w-44 shrink-0 flex-col gap-0.5 p-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p.id)}
                className={cn(
                  "flex items-center justify-between rounded-md px-2.5 py-1.5 text-left text-[13px] hover:bg-paper-2",
                  selectedPreset === p.id
                    ? "bg-kamoo-blue-50 font-bold text-kamoo-blue-700"
                    : "font-medium text-ink-700",
                )}
              >
                {p.label}
                {selectedPreset === p.id && (
                  <Check className="h-3.5 w-3.5 text-kamoo-blue-700" />
                )}
              </button>
            ))}

            {isActive && (
              <button
                onClick={handleClear}
                className="mt-1 flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-bold text-kamoo-orange-600 hover:bg-kamoo-orange-50"
              >
                <X className="h-3 w-3" />
                Effacer
              </button>
            )}
          </div>

          {/* Calendrier — colonne droite (visible si Personnalisé) */}
          {showCalendar && (
            <div className="flex flex-col border-l border-line">
              <Calendar
                mode="range"
                selected={draftRange}
                onSelect={setDraftRange}
                numberOfMonths={1}
                defaultMonth={draftRange?.from ?? new Date()}
                className="bg-transparent p-2"
              />
              <div className="flex items-center justify-between border-t border-line bg-paper-2/50 px-3 py-2">
                <div className="text-[11px] text-ink-500">
                  {draftRange?.from && !draftRange?.to && "Choisis la date de fin"}
                  {!draftRange?.from && "Choisis la date de début"}
                  {draftRange?.from && draftRange?.to && (
                    <>
                      {formatDateShort(draftRange.from)} →{" "}
                      {formatDateShort(draftRange.to)}
                    </>
                  )}
                </div>
                <button
                  onClick={handleValidate}
                  disabled={!canValidate}
                  className={cn(
                    "rounded-md bg-kamoo-orange-500 px-3 py-1.5 text-[12px] font-bold text-white hover:bg-kamoo-orange-600",
                    !canValidate && "cursor-not-allowed opacity-40",
                  )}
                >
                  Valider
                </button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
