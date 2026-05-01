"use client";

import { useState } from "react";
import {
  Box,
  Camera,
  Check,
  ChevronDown,
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
 * Historique de l'expédition, replié par défaut.
 * Audit trail visible pour le vendeur.
 */
export function ExpeditionHistory({ events }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-6 rounded-2xl border border-line bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-5 text-left"
      >
        <div>
          <h3 className="font-display text-lg font-bold text-ink-900">
            Historique
          </h3>
          <p className="mt-0.5 text-[12px] text-ink-500">
            {events.length} événement{events.length > 1 ? "s" : ""}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-ink-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="border-t border-line p-5">
          <div className="flex flex-col gap-4">
            {events.map((event, i) => {
              const Icon = ICON_MAP[event.icon];
              return (
                <div key={i} className="flex gap-3">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-paper-2 text-ink-700">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="text-[13px] font-bold text-ink-900">
                      {event.label}
                    </div>
                    {event.detail && (
                      <div className="mt-0.5 text-[12px] text-ink-500">
                        {event.detail}
                      </div>
                    )}
                    <div className="mt-1 text-[10px] text-ink-400">
                      {event.date} · {event.authorName}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
