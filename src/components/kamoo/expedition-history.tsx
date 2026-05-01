"use client";

import { useState } from "react";
import {
  Box,
  Camera,
  Check,
  ChevronDown,
  Clock,
  Globe,
  Plus,
  Ship,
  Sparkles,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { HistoryEvent } from "@/lib/types/expedition-detail";

const ICON_MAP = {
  plus: Plus,
  box: Box,
  camera: Camera,
  sparkle: Sparkles,
  ship: Ship,
  globe: Globe,
  wallet: Wallet,
  check: Check,
} as const;

type Props = {
  events: HistoryEvent[];
};

/**
 * Historique de l'expédition.
 * Replié par défaut. Quand ouvert : timeline verticale, événements
 * triés du plus récent au plus ancien, dot du plus récent en orange.
 */
export function ExpeditionHistory({ events }: Props) {
  const [open, setOpen] = useState(false);
  const reversed = [...events].reverse();

  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-kamoo-blue-50 text-kamoo-blue-700">
            <Clock className="h-3.5 w-3.5" />
          </div>
          <div className="text-left">
            <div className="text-[13px] font-bold text-ink-900">Historique</div>
            <div className="mt-0.5 text-[11px] text-ink-500">
              {events.length} événement{events.length > 1 ? "s" : ""}
            </div>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-ink-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="mt-4 flex flex-col gap-3.5 border-t border-line pt-4">
          {reversed.map((event, i) => {
            const Icon = ICON_MAP[event.icon];
            const isFirst = i === 0; // le plus récent
            const isLast = i === reversed.length - 1;
            return (
              <div key={i} className="flex gap-3">
                <div className="flex shrink-0 flex-col items-center">
                  <div
                    className={cn(
                      "grid h-[26px] w-[26px] place-items-center rounded-full border",
                      isFirst
                        ? "border-transparent bg-kamoo-orange-500 text-white ring-4 ring-kamoo-orange-500/20"
                        : "border-line bg-paper-2 text-ink-500",
                    )}
                  >
                    <Icon className="h-3 w-3" />
                  </div>
                  {!isLast && (
                    <div className="mt-1 min-h-[20px] w-[1.5px] flex-1 bg-line" />
                  )}
                </div>
                <div className={cn("flex-1", !isLast && "pb-1")}>
                  <div className="text-[13px] font-bold text-ink-900">
                    {event.label}
                  </div>
                  <div className="mt-0.5 text-[11px] text-ink-500">
                    {event.date} · {event.authorName}
                  </div>
                  {event.detail && (
                    <div className="mt-1 text-[11.5px] italic text-ink-500">
                      {event.detail}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
