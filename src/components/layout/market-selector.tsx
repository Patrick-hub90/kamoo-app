"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Plus } from "lucide-react";
import { useCurrentMarket } from "@/lib/hooks/use-current-market";
import {
  MARKET_STATUS_LABELS,
  MARKET_STATUS_TONE,
  type Market,
} from "@/lib/types/market";
import { cn } from "@/lib/utils";

/**
 * Sélecteur de marché dans la topbar. Lit/écrit via useCurrentMarket
 * (sessionStorage) — toutes les pages de l'app voient le même contexte actif.
 *
 *  - Affiche le marché actif avec drapeau + nom
 *  - Dropdown liste tous les marchés
 *  - Bouton "+ Ajouter un nouveau marché" en bas → lance le wizard standalone
 */
export function MarketSelector() {
  const { markets, currentMarket, switchToMarket } = useCurrentMarket();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 rounded-full border border-line bg-white px-3.5 py-2 text-sm transition hover:border-ink-300"
      >
        <span className="text-base">{currentMarket.country.flag}</span>
        <div className="text-left leading-tight">
          <div className="text-[13px] font-bold text-ink-900">
            Marché {currentMarket.country.name}
          </div>
          <div className="text-[10px] text-ink-500">
            {currentMarket.country.warehouseCity}
          </div>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-ink-400" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-80 rounded-xl border border-line bg-white p-1.5 shadow-[var(--shadow-kamoo-lg)]">
            <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              Vos marchés
            </div>

            {markets.map((m) => (
              <MarketRow
                key={m.id}
                market={m}
                selected={currentMarket.id === m.id}
                disabled={m.status === "inactive"}
                onClick={() => {
                  if (m.status !== "inactive") {
                    switchToMarket(m.id);
                    setOpen(false);
                  }
                }}
              />
            ))}

            <div className="my-1.5 h-px bg-line" />

            {/* CTA création nouveau marché — wizard standalone */}
            <Link
              href="/marches/nouveau"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition hover:bg-kamoo-blue-50"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-kamoo-blue-900 text-white">
                <Plus className="h-4 w-4" />
              </span>
              <span className="text-[13px] font-bold text-kamoo-blue-700">
                Ajouter un nouveau marché
              </span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function MarketRow({
  market,
  selected,
  disabled,
  onClick,
}: {
  market: Market;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const tone = MARKET_STATUS_TONE[market.status];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition",
        disabled
          ? "cursor-not-allowed opacity-60"
          : "hover:bg-paper-2",
        selected && "bg-kamoo-blue-50",
      )}
    >
      <span className="text-lg">{market.country.flag}</span>
      <div className="flex-1 leading-tight">
        <div
          className={cn(
            "flex items-center gap-1.5 text-[13px] font-semibold",
            selected ? "text-kamoo-blue-700" : "text-ink-900",
          )}
        >
          {market.country.name}
          {market.status !== "active" && (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-1.5 py-0.5 text-[9.5px] font-bold",
                tone.bg,
                tone.fg,
              )}
            >
              {MARKET_STATUS_LABELS[market.status]}
            </span>
          )}
        </div>
        <div className="text-[10.5px] text-ink-500">
          {market.country.warehouseCity} ·{" "}
          {market.stats.partnersCount} partenaires
        </div>
      </div>
      {selected && <Check className="h-4 w-4 text-kamoo-blue-700" />}
    </button>
  );
}
