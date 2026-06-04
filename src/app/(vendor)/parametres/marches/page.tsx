"use client";

import Link from "next/link";
import { ArrowRight, Plus, Settings2 } from "lucide-react";
import { MOCK_MARKETS } from "@/lib/data/mock-markets";
import {
  MARKET_STATUS_LABELS,
  MARKET_STATUS_TONE,
  type Market,
} from "@/lib/types/market";
import { formatXOF } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Marchés — liste les pays sur lesquels la vendeuse opère, avec un aperçu
 * d'activité (commandes en cours + revenu du mois). Permet d'accéder à la
 * config par marché (paiement / shipping / Shopify) ou d'en ajouter un.
 *
 * Les commandes/MRR viennent de `Market.stats.{activeOrdersCount, mrrXof}`
 * — V2 ces chiffres seront recalculés en live depuis la DB.
 */
export default function MarchesPage() {
  const markets = MOCK_MARKETS;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-line bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-display text-base font-extrabold text-ink-900">
              Vos marchés
            </h2>
            <p className="mt-1 text-[13px] text-ink-500">
              Chaque marché a ses partenaires, sa boutique Shopify, sa devise
              et son fuseau horaire. Bascule entre marchés via la topbar.
            </p>
          </div>
          <Link
            href="/marches/nouveau"
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-kamoo-orange-500 px-4 py-2 text-[13px] font-bold text-white hover:bg-kamoo-orange-600"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="whitespace-nowrap">Ajouter un marché</span>
          </Link>
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          {markets.map((m) => (
            <MarketRow key={m.id} market={m} />
          ))}
        </div>
      </section>
    </div>
  );
}

function MarketRow({ market }: { market: Market }) {
  const tone = MARKET_STATUS_TONE[market.status];
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-paper-2/40 p-3.5 sm:flex-nowrap sm:gap-4">
      {/* Avatar pays — code 2 lettres */}
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-[13px] font-extrabold text-ink-900 ring-1 ring-line">
        {market.country.code}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[14px] font-bold text-ink-900">
            {market.country.flag} {market.country.name}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold",
              tone.bg,
              tone.fg,
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
            {MARKET_STATUS_LABELS[market.status]}
          </span>
        </div>
        <div className="mt-0.5 text-[11.5px] text-ink-500">
          <span className="font-semibold text-ink-700">
            {market.stats.activeOrdersCount}
          </span>{" "}
          commandes actives{" · "}
          <span className="font-semibold text-ink-700">
            MRR {formatXOF(market.stats.mrrXof, false)} F CFA
          </span>
        </div>
      </div>

      <Link
        href={`/parametres/marches/${market.id}`}
        className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-[12px] font-bold text-ink-700 hover:border-kamoo-blue-600 hover:text-kamoo-blue-700 sm:ml-0"
      >
        <Settings2 className="h-3 w-3" />
        Configurer
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
