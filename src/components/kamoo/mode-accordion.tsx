"use client";

import { useState } from "react";
import {
  ChevronDown,
  Plane,
  Ship,
  Zap,
  Check,
  X as XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ModeOffer } from "@/lib/types/transitaire";
import type { TransportMode } from "@/lib/types/expedition";
import { TRANSPORT_MODE_LABELS } from "@/lib/types/expedition";

const MODE_ICON: Record<TransportMode, typeof Ship> = {
  sea: Ship,
  air_standard: Plane,
  air_express: Zap,
};

function fmtNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

type Props = {
  modes: ModeOffer[];
};

export function ModeAccordion({ modes }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {modes.map((m, i) => {
        const Icon = MODE_ICON[m.mode];
        const isOpen = openIndex === i;
        const hasDetails = !!(m.description || m.accepted?.length || m.forbidden?.length);

        return (
          <div
            key={m.mode}
            className={cn(
              "overflow-hidden rounded-xl border transition",
              isOpen ? "border-kamoo-blue-300 bg-white" : "border-line bg-paper-2",
            )}
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="flex w-full items-center gap-4 p-4 text-left hover:bg-paper-2/70"
              disabled={!hasDetails}
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-ink-700 shadow-sm">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-bold text-ink-900">
                  {TRANSPORT_MODE_LABELS[m.mode]}
                </div>
                <div className="text-[12px] text-ink-500">{m.delay}</div>
              </div>
              <div className="text-right">
                <div className="font-display text-[16px] font-extrabold leading-none text-ink-900">
                  {fmtNumber(m.fromXof)}{" "}
                  <span className="text-ink-300">–</span>{" "}
                  {fmtNumber(m.toXof)}
                </div>
                <div className="mt-1 text-[10.5px] font-semibold text-ink-500">
                  F CFA / {m.unit === "kg" ? "kg" : "CBM"}
                </div>
              </div>
              {hasDetails && (
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-ink-400 transition-transform",
                    isOpen && "rotate-180",
                  )}
                />
              )}
            </button>

            {isOpen && hasDetails && (
              <div className="border-t border-line bg-white px-4 pb-4 pt-3">
                {m.description && (
                  <p className="text-[13px] leading-relaxed text-ink-700">
                    {m.description}
                  </p>
                )}

                <div className="mt-3 grid grid-cols-2 gap-3">
                  {m.accepted && m.accepted.length > 0 && (
                    <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
                      <div className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider text-emerald-700">
                        <Check className="h-3 w-3" />
                        Produits acceptés
                      </div>
                      <ul className="mt-1.5 flex flex-col gap-0.5">
                        {m.accepted.map((c) => (
                          <li
                            key={c}
                            className="flex items-center gap-1.5 text-[12.5px] text-ink-900"
                          >
                            <span className="h-1 w-1 rounded-full bg-emerald-500" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {m.forbidden && m.forbidden.length > 0 && (
                    <div className="rounded-lg border border-red-100 bg-red-50/60 p-3">
                      <div className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider text-red-700">
                        <XIcon className="h-3 w-3" />
                        Produits refusés
                      </div>
                      <ul className="mt-1.5 flex flex-col gap-0.5">
                        {m.forbidden.map((c) => (
                          <li
                            key={c}
                            className="flex items-center gap-1.5 text-[12.5px] text-ink-900"
                          >
                            <span className="h-1 w-1 rounded-full bg-red-500" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
