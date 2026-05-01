"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { COUNTRIES, GLOBAL_OPTION, type Country } from "@/lib/data/countries";
import { cn } from "@/lib/utils";

type Props = {
  value: Country;
  onChange: (country: Country) => void;
};

export function CountrySelector({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 rounded-full border border-line bg-white px-3.5 py-2 text-sm transition hover:border-ink-300"
      >
        <span className="text-base">{value.flag}</span>
        <div className="text-left leading-tight">
          <div className="text-[13px] font-bold text-ink-900">
            {value.isGlobal ? "Vue globale" : `Marché ${value.name}`}
          </div>
          <div className="text-[10px] text-ink-500">{value.warehouseCity}</div>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-ink-400" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-72 rounded-xl border border-line bg-white p-1.5 shadow-[var(--shadow-kamoo-lg)]">
            <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              Mes marchés
            </div>
            {COUNTRIES.map((c) => (
              <CountryRow
                key={c.code}
                country={c}
                selected={value.code === c.code}
                onClick={() => {
                  onChange(c);
                  setOpen(false);
                }}
              />
            ))}
            <div className="my-1.5 h-px bg-line" />
            <CountryRow
              country={GLOBAL_OPTION}
              selected={value.code === GLOBAL_OPTION.code}
              onClick={() => {
                onChange(GLOBAL_OPTION);
                setOpen(false);
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

function CountryRow({
  country,
  selected,
  onClick,
}: {
  country: Country;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition hover:bg-paper-2",
        selected && "bg-kamoo-blue-50",
      )}
    >
      <span className="text-lg">{country.flag}</span>
      <div className="flex-1 leading-tight">
        <div
          className={cn(
            "text-[13px] font-semibold",
            selected ? "text-kamoo-blue-700" : "text-ink-900",
          )}
        >
          {country.name}
        </div>
        <div className="text-[11px] text-ink-500">{country.warehouseCity}</div>
      </div>
      {selected && <Check className="h-4 w-4 text-kamoo-blue-700" />}
    </button>
  );
}
