"use client";

import { useState } from "react";
import {
  Calendar as CalendarIcon,
  Check,
  ChevronRight,
} from "lucide-react";
import { fr } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * DateRangeFilter — sélecteur de période style Meta Business.
 *
 * Brief design (validé user) :
 *  - Menu vertical simple (260px) — liste de presets + Personnalisé + Effacer
 *  - Calendrier CACHÉ par défaut, n'apparaît que quand on clique
 *    « Personnalisé » → le menu s'élargit (660px) en grille 240px + 1fr
 *  - Clic sur preset rapide = sélection immédiate + fermeture
 *  - Clic sur Personnalisé = expand vers la droite, le calendrier apparaît
 *
 * Principe : petit menu rapide au quotidien, calendrier uniquement quand
 * nécessaire. Beaucoup plus efficace qu'une grosse modale tout-en-un.
 */

export type DateFilterPreset =
  | "all"
  | "today"
  | "yesterday"
  | "7j"
  | "30j"
  | "month"
  | "lastMonth"
  | "3m"
  | "year"
  | "custom";

export type DateFilterValue = {
  preset: DateFilterPreset;
  range?: DateRange;
};

/* Presets en liste verticale (ordre Meta Business — du plus court au
 *  plus long, puis "Tout l'historique" en bas avant Personnalisé). */
const PRESETS: { id: Exclude<DateFilterPreset, "custom">; label: string }[] = [
  { id: "today", label: "Aujourd'hui" },
  { id: "yesterday", label: "Hier" },
  { id: "7j", label: "7 derniers jours" },
  { id: "30j", label: "30 derniers jours" },
  { id: "month", label: "Ce mois" },
  { id: "lastMonth", label: "Mois dernier" },
  { id: "3m", label: "3 derniers mois" },
  { id: "year", label: "Cette année" },
  { id: "all", label: "Tout l'historique" },
];

/* Labels du trigger button — sans le mot « Période: », pour rester compact. */
const PRESET_LABELS: Record<Exclude<DateFilterPreset, "custom">, string> = {
  all: "Tout l'historique",
  today: "Aujourd'hui",
  yesterday: "Hier",
  "7j": "7 derniers jours",
  "30j": "30 derniers jours",
  month: "Ce mois",
  lastMonth: "Mois dernier",
  "3m": "3 derniers mois",
  year: "Cette année",
};

function toDate(d: Date | string | undefined): Date | undefined {
  if (!d) return undefined;
  return d instanceof Date ? d : new Date(d);
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTriggerLabel(value: DateFilterValue): string {
  if (value.preset === "custom") {
    const from = toDate(value.range?.from);
    const to = toDate(value.range?.to);
    if (from && to) {
      if (startOfDay(from).getTime() === startOfDay(to).getTime()) {
        return formatDateShort(from);
      }
      return `${formatDateShort(from)} - ${formatDateShort(to)}`;
    }
    if (from) return formatDateShort(from);
    return "Période personnalisée";
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

type Props = {
  value: DateFilterValue;
  onChange: (next: DateFilterValue) => void;
};

export function DateRangeFilter({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  /* État brouillon pour le mode Personnalisé. Le menu lui-même se ferme
     instantanément sur clic d'un preset rapide ; seul le custom a besoin
     d'un draft + Annuler/Appliquer. */
  const [showCalendar, setShowCalendar] = useState(value.preset === "custom");
  const [draftFrom, setDraftFrom] = useState<Date | undefined>(
    toDate(value.range?.from),
  );
  const [draftTo, setDraftTo] = useState<Date | undefined>(
    toDate(value.range?.to),
  );
  const [displayedMonth, setDisplayedMonth] = useState<Date>(
    toDate(value.range?.from) ?? new Date(),
  );

  const triggerLabel = formatTriggerLabel(value);
  const isActive = value.preset !== "all";

  const handleOpenChange = (next: boolean) => {
    if (next) {
      const from = toDate(value.range?.from);
      const to = toDate(value.range?.to);
      setDraftFrom(from);
      setDraftTo(to);
      setDisplayedMonth(from ?? new Date());
      setShowCalendar(value.preset === "custom");
    }
    setOpen(next);
  };

  /** Clic sur un preset rapide → applique direct et ferme. */
  const handleSelectPreset = (preset: Exclude<DateFilterPreset, "custom">) => {
    onChange({ preset });
    setOpen(false);
  };

  /** Clic sur "Personnalisé" → ouvre le calendrier à droite (ne ferme pas). */
  const handleOpenCustom = () => {
    setShowCalendar(true);
  };

  /** Logique de sélection unifiée dans le calendrier (1 ou 2 clics). */
  const handleDayClick = (day: Date) => {
    const d = startOfDay(day);
    if (isFuture(d)) return;

    if (!draftFrom || !draftTo) {
      setDraftFrom(d);
      setDraftTo(d);
      return;
    }
    const isSingleDay = isSameDay(draftFrom, draftTo);
    if (isSingleDay) {
      if (isSameDay(d, draftFrom)) return; // garde la sélection
      if (d < draftFrom) {
        setDraftTo(draftFrom);
        setDraftFrom(d);
      } else {
        setDraftTo(d);
      }
      return;
    }
    // Range existante → repart sur un single
    setDraftFrom(d);
    setDraftTo(d);
  };

  const handleApply = () => {
    onChange({
      preset: "custom",
      range:
        draftFrom && draftTo
          ? { from: draftFrom, to: draftTo }
          : draftFrom
            ? { from: draftFrom, to: draftFrom }
            : undefined,
    });
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const handleClear = () => {
    onChange({ preset: "all" });
    setOpen(false);
  };

  const isFuture = (date: Date): boolean => {
    return startOfDay(date).getTime() > startOfDay(new Date()).getTime();
  };

  const rangeMiddle = (date: Date): boolean => {
    if (!draftFrom || !draftTo) return false;
    if (isSameDay(draftFrom, draftTo)) return false;
    const d = startOfDay(date).getTime();
    return (
      d > startOfDay(draftFrom).getTime() &&
      d < startOfDay(draftTo).getTime()
    );
  };

  const canApply = draftFrom !== undefined;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        className={cn(
          "inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-lg border border-line bg-white px-3 text-[13px] font-semibold text-ink-900 transition hover:bg-paper-2",
          isActive && "border-ink-300",
        )}
      >
        <CalendarIcon className="h-3.5 w-3.5 text-ink-500" />
        <span className="max-w-[220px] truncate">{triggerLabel}</span>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className={cn(
          /* Largeur dynamique : 220px en mode compact (juste les presets),
              560px quand le calendrier est ouvert. Compact partout pour
              réduire l'espace inutile. */
          "rounded-xl border border-line bg-white p-0 shadow-[0_16px_40px_rgba(16,24,40,0.14)] transition-[width] duration-150",
          showCalendar
            ? "grid w-[min(560px,calc(100vw-32px))] grid-cols-[220px_1fr]"
            : "w-[220px]",
        )}
      >
        {/* COLONNE 1 : Menu vertical des presets — police normale (Inter)
            comme le trigger, items séparés par une hairline. */}
        <div className="flex flex-col py-1">
          {PRESETS.map((p, i) => {
            const isSelected = value.preset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p.id)}
                className={cn(
                  "flex h-9 items-center justify-between px-3 text-left text-[13px] font-semibold transition",
                  i < PRESETS.length - 1 && "border-b border-line/40",
                  isSelected
                    ? "bg-kamoo-blue-50 text-kamoo-blue-900"
                    : "text-ink-700 hover:bg-paper-2",
                )}
              >
                <span>{p.label}</span>
                {isSelected && (
                  <Check className="h-3 w-3 text-kamoo-blue-700" />
                )}
              </button>
            );
          })}

          {/* Séparateur plus marqué avant Personnalisé / Effacer */}
          <div className="my-1 h-px bg-line" />

          <button
            onClick={handleOpenCustom}
            className={cn(
              "flex h-9 items-center justify-between px-3 text-left text-[13px] font-semibold transition",
              value.preset === "custom" || showCalendar
                ? "bg-kamoo-blue-50 text-kamoo-blue-900"
                : "text-ink-700 hover:bg-paper-2",
            )}
          >
            <span>Personnalisé</span>
            {value.preset === "custom" || showCalendar ? (
              <Check className="h-3 w-3 text-kamoo-blue-700" />
            ) : (
              <ChevronRight className="h-3 w-3 text-ink-400" />
            )}
          </button>

          {isActive && (
            <button
              onClick={handleClear}
              className="flex h-9 items-center justify-between px-3 text-left text-[13px] font-semibold text-kamoo-orange-600 transition hover:bg-kamoo-orange-50"
            >
              <span>Effacer</span>
            </button>
          )}
        </div>

        {/* COLONNE 2 : Calendrier (visible uniquement en mode custom) */}
        {showCalendar && (
          <div className="flex flex-col border-l border-line p-3">
            {/* En-tête compact : titre + range sélectionnée (police normale) */}
            <div className="mb-2">
              <h4 className="text-[12px] font-semibold text-ink-500">
                Personnalisé
              </h4>
              <p className="mt-0.5 text-[13px] font-semibold text-ink-900">
                {draftFrom && draftTo
                  ? isSameDay(draftFrom, draftTo)
                    ? formatDateShort(draftFrom)
                    : `${formatDateShort(draftFrom)} - ${formatDateShort(draftTo)}`
                  : "Sélectionnez un jour ou une plage"}
              </p>
            </div>

            <Calendar
              mode="single"
              selected={draftFrom}
              onDayClick={handleDayClick}
              month={displayedMonth}
              onMonthChange={setDisplayedMonth}
              numberOfMonths={1}
              captionLayout="dropdown"
              locale={fr}
              weekStartsOn={1}
              disabled={isFuture}
              modifiers={{
                range_start: draftFrom ? [draftFrom] : [],
                range_end:
                  draftTo && draftFrom && !isSameDay(draftFrom, draftTo)
                    ? [draftTo]
                    : [],
                range_middle: rangeMiddle,
              }}
              modifiersClassNames={{
                range_start:
                  "!rounded-full !bg-kamoo-blue-900 !text-white hover:!bg-kamoo-blue-900",
                range_end:
                  "!rounded-full !bg-kamoo-blue-900 !text-white hover:!bg-kamoo-blue-900",
                range_middle:
                  "!rounded-none !bg-kamoo-blue-50 !text-kamoo-blue-900 hover:!bg-kamoo-blue-50",
              }}
              className="bg-transparent p-0 [--cell-size:--spacing(8)]"
            />

            {/* Footer Annuler / Appliquer (police normale) */}
            <div className="mt-2 flex items-center justify-end gap-2 border-t border-line pt-2">
              <button
                onClick={handleCancel}
                className="rounded-md border border-line bg-white px-3 py-1.5 text-[12px] font-semibold text-ink-700 transition hover:bg-paper-2"
              >
                Annuler
              </button>
              <button
                onClick={handleApply}
                disabled={!canApply}
                className={cn(
                  "rounded-md bg-kamoo-blue-900 px-3.5 py-1.5 text-[12px] font-semibold text-white transition hover:bg-kamoo-blue-800",
                  !canApply && "cursor-not-allowed opacity-40",
                )}
              >
                Appliquer
              </button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
