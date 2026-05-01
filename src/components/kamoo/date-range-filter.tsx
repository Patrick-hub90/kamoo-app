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
  range?: DateRange;
};

const PRESETS: { id: DateFilterPreset; label: string }[] = [
  { id: "all", label: "Tout" },
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
    year: "numeric",
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

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

type Props = {
  value: DateFilterValue;
  onChange: (next: DateFilterValue) => void;
};

export function DateRangeFilter({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<DateFilterPreset>(
    value.preset,
  );
  const [draftFrom, setDraftFrom] = useState<Date | undefined>(
    value.range?.from,
  );
  const [draftTo, setDraftTo] = useState<Date | undefined>(value.range?.to);
  const [displayedMonth, setDisplayedMonth] = useState<Date>(
    value.range?.from ?? new Date(),
  );

  const isActive = value.preset !== "all";
  const triggerLabel = formatTriggerLabel(value);
  const showCalendar = selectedPreset === "custom";
  const canValidate =
    selectedPreset !== "custom" ||
    (draftFrom !== undefined && draftTo !== undefined);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setSelectedPreset(value.preset);
      setDraftFrom(value.range?.from);
      setDraftTo(value.range?.to);
      setDisplayedMonth(value.range?.from ?? new Date());
    }
    setOpen(next);
  };

  const handleSelectPreset = (preset: DateFilterPreset) => {
    setSelectedPreset(preset);
    if (preset !== "custom") {
      onChange({ preset });
      setOpen(false);
    }
  };

  /**
   * Règles custom de sélection :
   * - Aucune sélection → 1er clic : from = to = day (plage 1 jour, validable)
   * - Single day (from===to) :
   *     - Clic même jour : reset
   *     - Clic avant : NOUVELLE sélection (annule l'ancienne)
   *     - Clic après : étend pour faire une plage (from=ancien, to=nouveau)
   * - Plage [A, B] :
   *     - Clic dans [A, B] (boundaries incluses) : la date devient la fin
   *       (from = A inchangé, to = day) → permet de raccourcir la plage
   *     - Clic hors de [A, B] : la plage s'annule, nouvelle sélection 1 jour
   * - Jours futurs et hors-mois : non cliquables
   */
  const handleDayClick = (day: Date) => {
    const d = startOfDay(day);
    if (isOutsideMonth(d) || isFuture(d)) return;

    // Aucune sélection
    if (!draftFrom || !draftTo) {
      setDraftFrom(d);
      setDraftTo(d);
      return;
    }

    const isSingleDay = isSameDay(draftFrom, draftTo);

    // Single day [A, A]
    if (isSingleDay) {
      if (isSameDay(d, draftFrom)) {
        // Reset
        setDraftFrom(undefined);
        setDraftTo(undefined);
        return;
      }
      if (d < draftFrom) {
        // Annule l'ancienne, nouvelle sélection
        setDraftFrom(d);
        setDraftTo(d);
        return;
      }
      // Clic après → étend (devient une plage)
      setDraftTo(d);
      return;
    }

    // Plage [A, B] (A < B)
    const inRange =
      d.getTime() >= startOfDay(draftFrom).getTime() &&
      d.getTime() <= startOfDay(draftTo).getTime();

    if (inRange) {
      // Devient la nouvelle date de fin (raccourcit la plage)
      setDraftTo(d);
      return;
    }

    // Hors de la plage → la plage s'annule, nouvelle sélection 1 jour
    setDraftFrom(d);
    setDraftTo(d);
  };

  const handleValidate = () => {
    if (selectedPreset === "custom") {
      onChange({
        preset: "custom",
        range:
          draftFrom && draftTo ? { from: draftFrom, to: draftTo } : undefined,
      });
    }
    setOpen(false);
  };

  const handleClear = () => {
    onChange({ preset: "all" });
    setSelectedPreset("all");
    setDraftFrom(undefined);
    setDraftTo(undefined);
    setOpen(false);
  };

  // Modifiers
  const rangeMiddle = (date: Date): boolean => {
    if (!draftFrom || !draftTo) return false;
    const d = startOfDay(date).getTime();
    return (
      d > startOfDay(draftFrom).getTime() &&
      d < startOfDay(draftTo).getTime()
    );
  };

  // Désactive les jours hors du mois affiché (visibles mais non cliquables)
  const isOutsideMonth = (date: Date): boolean =>
    !isSameMonth(date, displayedMonth);

  // Désactive les jours dans le futur
  const isFuture = (date: Date): boolean => {
    const today = startOfDay(new Date());
    return startOfDay(date).getTime() > today.getTime();
  };

  // Combine les contraintes pour la prop disabled de react-day-picker
  const isDisabled = (date: Date): boolean =>
    isOutsideMonth(date) || isFuture(date);

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
          showCalendar ? "w-auto" : "w-44",
        )}
      >
        <div className="flex">
          {/* Presets — séparateurs entre chaque ligne */}
          <div className="flex w-44 shrink-0 flex-col p-1">
            {PRESETS.map((p, i) => (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p.id)}
                className={cn(
                  "flex items-center justify-between px-2.5 py-2 text-left text-[13px] hover:bg-paper-2",
                  i < PRESETS.length - 1 && "border-b border-line",
                  selectedPreset === p.id
                    ? "font-bold text-kamoo-blue-700"
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

          {showCalendar && (
            <div className="flex flex-col border-l border-line">
              <Calendar
                mode="single"
                selected={draftFrom}
                onDayClick={handleDayClick}
                month={displayedMonth}
                onMonthChange={setDisplayedMonth}
                numberOfMonths={1}
                captionLayout="dropdown"
                disabled={isDisabled}
                modifiers={{
                  range_start: draftFrom ? [draftFrom] : [],
                  range_end: draftTo ? [draftTo] : [],
                  range_middle: rangeMiddle,
                }}
                modifiersClassNames={{
                  range_start:
                    "!rounded-full !bg-kamoo-blue-700 !text-white hover:!bg-kamoo-blue-700",
                  range_end:
                    "!rounded-full !bg-kamoo-blue-700 !text-white hover:!bg-kamoo-blue-700",
                  range_middle:
                    "!rounded-full !bg-kamoo-blue-700 !text-white hover:!bg-kamoo-blue-700",
                }}
                className="bg-transparent p-2 [--cell-size:--spacing(9)] [--cell-radius:9999px]"
              />
              <div className="flex items-center justify-end gap-2 border-t border-line bg-paper-2/50 px-3 py-2">
                <button
                  onClick={handleClear}
                  className="rounded-md border border-line bg-white px-3 py-1.5 text-[12px] font-bold text-ink-700 hover:bg-paper-2"
                >
                  Reset
                </button>
                <button
                  onClick={handleValidate}
                  disabled={!canValidate}
                  className={cn(
                    "rounded-md bg-kamoo-orange-500 px-3.5 py-1.5 text-[12px] font-bold text-white hover:bg-kamoo-orange-600",
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
