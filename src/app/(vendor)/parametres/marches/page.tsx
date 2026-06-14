"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { MOCK_MARKETS } from "@/lib/data/mock-markets";
import {
  MARKET_STATUS_LABELS,
  MARKET_STATUS_TONE,
  type Market,
} from "@/lib/types/market";
import { SUPPORTED_CURRENCIES } from "@/lib/format";
import { useShopify } from "@/lib/hooks/use-shopify";
import {
  SettingsCard,
  SettingsSection,
} from "@/components/parametres/settings-ui";
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
    <SettingsCard>
      <SettingsSection
        title="Vos marchés"
        description="Chaque marché a ses partenaires, sa boutique Shopify, sa devise et son fuseau horaire. Bascule entre marchés via la topbar."
        wide
      >
        <div className="flex justify-end">
          <Link
            href="/marches/nouveau"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-kamoo-orange-500 px-4 py-2 text-[13px] font-bold text-white hover:bg-kamoo-orange-600"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="whitespace-nowrap">Ajouter un marché</span>
          </Link>
        </div>

        <div className="mt-4 flex flex-col gap-2.5">
          {markets.map((m) => (
            <MarketRow key={m.id} market={m} />
          ))}
        </div>
      </SettingsSection>
    </SettingsCard>
  );
}

function MarketRow({ market }: { market: Market }) {
  const tone = MARKET_STATUS_TONE[market.status];
  const { currencyFor, detectedCurrencyFor, isManualCurrency, setCurrencyOverride } = useShopify();
  const currency = currencyFor(market.id);
  const detected = detectedCurrencyFor(market.id);
  const manual = isManualCurrency(market.id);

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
          Devise d&apos;affichage{" "}
          <span className="font-semibold text-ink-700">{currency}</span>
          {detected && (
            <span className="text-ink-400">
              {manual
                ? ` · auto-détecté Shopify : ${detected}`
                : " · auto-détecté depuis Shopify"}
            </span>
          )}
        </div>
      </div>

      {/* Choix MANUEL de la devise — prime sur l'auto-détection Shopify */}
      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:ml-0">
        <select
          value={manual ? currency : "__auto"}
          onChange={(e) => {
            const v = e.target.value;
            setCurrencyOverride(market.id, v === "__auto" ? null : v);
          }}
          className="h-9 rounded-lg border border-line bg-white px-2.5 text-[12px] font-semibold text-ink-800 outline-none focus:border-kamoo-blue-600"
          title="Devise d'affichage de ce marché"
        >
          <option value="__auto">
            Auto{detected ? ` (${detected})` : " (XOF)"}
          </option>
          {SUPPORTED_CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
