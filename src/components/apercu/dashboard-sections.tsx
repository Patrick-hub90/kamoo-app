"use client";

/**
 * Sections du dashboard d'identité (aperçu), réutilisables.
 *
 * Ces composants portent le DESIGN validé (proto /apercu). Ils sont alimentés
 * par des PROPS de données — donc utilisables aussi bien par le proto (mock)
 * que par le vrai /dashboard (données réelles). C'est ça « afficher
 * l'information selon notre logique » : un seul design, deux sources.
 */

import { ArrowDownRight, ArrowUpRight, AlertTriangle, Clock, Package } from "lucide-react";
import { Panel, VoirTout, StatusPill, CARD, LABEL } from "@/components/apercu/preview-shell";
import { formatXOF } from "@/lib/format";

/* ════════════════ KPI ════════════════ */
export type KpiData = {
  caEncaisse: number;
  caDelta?: number | null;
  margeNette: number;
  margeDelta?: number | null;
  nbLivre: number;
  livreDelta?: number | null;
  aEncaisser: number;
  aEncaisserN: number;
  aRegler: number;
  aReglerN: number;
};

export function KpiRow({ k }: { k: KpiData }) {
  return (
    <div className="grid grid-cols-5 gap-4">
      <Kpi label="CA encaissé" value={formatXOF(k.caEncaisse, false)} unit="F" delta={k.caDelta} />
      <Kpi label="Marge nette" value={formatXOF(k.margeNette, false)} unit="F" delta={k.margeDelta} />
      <Kpi label="Commandes livrées" value={String(k.nbLivre)} unit="cmd" delta={k.livreDelta} />
      <Kpi label="À encaisser" value={formatXOF(k.aEncaisser, false)} unit="F" tone="pos" hint={`${k.aEncaisserN} livreur${k.aEncaisserN > 1 ? "s" : ""}`} />
      <Kpi label="À régler" value={formatXOF(k.aRegler, false)} unit="F" tone="neg" hint={`${k.aReglerN} partenaire${k.aReglerN > 1 ? "s" : ""}`} />
    </div>
  );
}

export function Kpi({
  label,
  value,
  unit,
  delta,
  tone,
  hint,
}: {
  label: string;
  value: string;
  unit?: string;
  delta?: number | null;
  tone?: "pos" | "neg";
  hint?: string;
}) {
  const valueColor = tone === "pos" ? "text-emerald-600" : tone === "neg" ? "text-red-600" : "text-ink-900";
  const hasDelta = delta !== undefined && delta !== null;
  const pos = (delta ?? 0) >= 0;
  return (
    <div className={`${CARD} flex flex-col gap-2 px-4 py-3`}>
      <div className={LABEL}>{label}</div>
      <div className="flex items-end justify-between gap-2">
        <div className="flex items-baseline gap-1">
          <span className={`text-[21px] font-bold leading-none tracking-tight tabular-nums ${valueColor}`}>
            {tone === "pos" ? "+" : ""}
            {value}
          </span>
          {unit && <span className="text-[12px] font-medium text-[#A7AEBA]">{unit}</span>}
        </div>
        {hasDelta ? (
          <span
            className={[
              "inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
              pos ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600",
            ].join(" ")}
          >
            {pos ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta as number)}%
          </span>
        ) : hint ? (
          <span className="shrink-0 whitespace-nowrap text-[11px] text-[#A7AEBA]">{hint}</span>
        ) : null}
      </div>
    </div>
  );
}

/* ════════════════ CHART (barres sobres) ════════════════ */
function niceMax(v: number): number {
  if (v <= 0) return 100;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return m * p;
}
function axisFmt(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}k`;
  return String(Math.round(v));
}

export function CaChart({
  series,
  labels,
  total,
  title = "CA encaissé · période",
  periodLabel,
}: {
  series: number[];
  labels?: string[];
  total: number;
  title?: string;
  periodLabel?: string;
}) {
  const peak = Math.max(1, ...series);
  const max = niceMax(peak);
  const lines = [max, (max * 2) / 3, max / 3, 0];
  return (
    <Panel
      title={title}
      right={
        <span className="text-[12px] font-medium text-[#8A92A0]">
          {periodLabel ? <span className="mr-2">{periodLabel}</span> : null}
          Total <span className="font-semibold text-ink-900 tabular-nums">{formatXOF(total, false)} F</span>
        </span>
      }
    >
      <div className="px-5 py-4">
        <div className="flex gap-3">
          <div className="flex w-10 flex-col justify-between py-1 text-right text-[10px] tabular-nums text-[#B4BAC4]">
            {lines.map((l, i) => (
              <div key={i}>{l === 0 ? "0" : axisFmt(l)}</div>
            ))}
          </div>
          <div className="relative flex-1">
            <div className="absolute inset-0 flex flex-col justify-between">
              {lines.map((_, i) => (
                <div key={i} className="border-t border-dashed border-[#F0F1F3]" />
              ))}
            </div>
            <div className="relative flex h-[210px] items-stretch gap-[5px]">
              {series.map((v, i) => (
                <div key={i} className="group flex h-full flex-1 flex-col items-center justify-end">
                  <div
                    className="w-full rounded-t-[3px] bg-kamoo-blue-900/85 transition-all group-hover:bg-kamoo-blue-900"
                    style={{ height: `${Math.max(2, (v / max) * 100)}%` }}
                    title={`${formatXOF(v, false)} F`}
                  />
                </div>
              ))}
            </div>
            {labels && (
              <div className="mt-2 flex gap-[5px] text-[10px] tabular-nums text-[#B4BAC4]">
                {labels.map((lab, i) => (
                  <div key={i} className="flex-1 truncate text-center">
                    {lab}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ════════════════ CLOSING ════════════════ */
export type Bucket = { label: string; count: number; color: string };
export type Lead = { id: string; product: string; extra: number; amount: string; status: string; time: string };

export function ClosingCard({ buckets, leads, title = "Closing en direct" }: { buckets: Bucket[]; leads: Lead[]; title?: string }) {
  return (
    <Panel title={title} right={<VoirTout />}>
      <div className="grid grid-cols-3 gap-px border-b border-[#F1F2F4] bg-[#F1F2F4]">
        {buckets.map((b) => (
          <div key={b.label} className="flex flex-col items-center gap-1 bg-white py-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: b.color }} />
              <span className="text-[18px] font-bold tabular-nums text-ink-900">{b.count}</span>
            </div>
            <span className="text-[11px] font-medium text-[#8A92A0]">{b.label}</span>
          </div>
        ))}
      </div>
      <ul className="divide-y divide-[#F4F5F6]">
        {leads.length === 0 && (
          <li className="px-5 py-10 text-center text-[12.5px] text-ink-400">
            Aucune commande à appeler.
          </li>
        )}
        {leads.map((l) => (
          <li key={l.id} className="flex items-center gap-3 px-5 py-2.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[12.5px] font-semibold text-ink-900">{l.id}</span>
                <StatusPill status={l.status} />
              </div>
              <div className="truncate text-[11.5px] text-[#8A92A0]">
                {l.product}
                {l.extra > 0 && <span className="text-[#B4BAC4]"> +{l.extra}</span>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[12.5px] font-semibold tabular-nums text-ink-900">{l.amount}</div>
              <div className="text-[10.5px] text-[#B4BAC4]">{l.time}</div>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* ════════════════ TOP PRODUITS ════════════════ */
export type ProdRow = {
  emoji: string;
  bg: string;
  name: string;
  cover?: string | null;
  ventes: number;
  ca: number;
  benefice: number;
  margePct: number;
};

export function TopProducts({ rows, title = "Top produits" }: { rows: ProdRow[]; title?: string }) {
  return (
    <Panel title={title} right={<VoirTout />}>
      <table className="w-full">
        <thead>
          <tr className="text-[10.5px] uppercase tracking-[0.05em] text-[#A7AEBA]">
            <th className="px-5 py-2 text-left font-semibold">Produit</th>
            <th className="px-3 py-2 text-right font-semibold">Ventes</th>
            <th className="px-3 py-2 text-right font-semibold">CA</th>
            <th className="px-3 py-2 text-right font-semibold">Bénéfice</th>
            <th className="px-5 py-2 text-right font-semibold">Marge</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F4F5F6]">
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="px-5 py-10 text-center text-[12.5px] text-ink-400">
                Aucune vente sur la période.
              </td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.name} className="transition hover:bg-[#FAFBFC]">
              <td className="px-5 py-2.5">
                <div className="flex items-center gap-2.5">
                  {r.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.cover} alt={r.name} className="h-8 w-8 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[15px]" style={{ background: r.bg }}>
                      {r.emoji}
                    </span>
                  )}
                  <span className="truncate text-[12.5px] font-medium text-ink-900">{r.name}</span>
                </div>
              </td>
              <td className="px-3 py-2.5 text-right text-[12.5px] tabular-nums text-ink-700">{r.ventes}</td>
              <td className="px-3 py-2.5 text-right text-[12.5px] tabular-nums text-ink-700">{formatXOF(r.ca, false)}</td>
              <td className="px-3 py-2.5 text-right text-[12.5px] font-semibold tabular-nums text-ink-900">{formatXOF(r.benefice, false)}</td>
              <td className="px-5 py-2.5 text-right">
                <span className="inline-block rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-emerald-700">
                  {r.margePct}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

/* ════════════════ LIVRAISONS ════════════════ */
export type DelRow = { id: string; product: string; extra: number; amount: string; time: string; status: string };

export function LiveDeliveries({ rows, activeCount, title = "Livraisons en direct" }: { rows: DelRow[]; activeCount?: number; title?: string }) {
  return (
    <Panel
      title={title}
      right={
        <span className="rounded-full bg-kamoo-blue-50 px-2 py-0.5 text-[11px] font-semibold text-kamoo-blue-700">
          {activeCount ?? rows.length} actives
        </span>
      }
    >
      <ul className="divide-y divide-[#F4F5F6]">
        {rows.length === 0 && (
          <li className="px-5 py-10 text-center text-[12.5px] text-ink-400">
            Aucune livraison en cours.
          </li>
        )}
        {rows.map((r) => (
          <li key={r.id} className="flex items-center gap-3 px-5 py-2.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[12.5px] font-semibold text-ink-900">{r.id}</span>
                <StatusPill status={r.status} />
              </div>
              <div className="truncate text-[11.5px] text-[#8A92A0]">
                {r.product}
                {r.extra > 0 && <span className="text-[#B4BAC4]"> +{r.extra}</span>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[12.5px] font-semibold tabular-nums text-ink-900">{r.amount}</div>
              <div className="text-[10.5px] text-[#B4BAC4]">{r.time}</div>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* ════════════════ OPÉRATIONS ════════════════ */
export type OpRow = { dir: "in" | "out"; label: string; sub: string; amount: number; time: string };

export function RecentOps({ rows, title = "Dernières opérations" }: { rows: OpRow[]; title?: string }) {
  return (
    <Panel title={title} right={<VoirTout />}>
      <ul className="divide-y divide-[#F4F5F6]">
        {rows.length === 0 && (
          <li className="px-5 py-10 text-center text-[12.5px] text-ink-400">
            Aucune opération récente.
          </li>
        )}
        {rows.map((r, i) => (
          <li key={i} className="flex items-center gap-3 px-5 py-2.5">
            <span
              className={[
                "grid h-7 w-7 shrink-0 place-items-center rounded-full",
                r.dir === "in" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500",
              ].join(" ")}
            >
              {r.dir === "in" ? <ArrowDownRight className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] font-medium text-ink-900">{r.label}</div>
              <div className="truncate text-[11px] text-[#A7AEBA]">{r.sub}</div>
            </div>
            <div className="text-right">
              <div
                className={[
                  "text-[12.5px] font-semibold tabular-nums",
                  r.dir === "in" ? "text-emerald-600" : "text-ink-900",
                ].join(" ")}
              >
                {r.dir === "in" ? "+" : "−"}
                {formatXOF(r.amount, false)}
              </div>
              <div className="text-[10.5px] text-[#B4BAC4]">{r.time}</div>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* ════════════════ ALERTES STOCK ════════════════ */
export type AlertRow = { name: string; sub: string; level: "rupture" | "bas" | "info" };

export function StockAlerts({ rows, title = "Alertes stock" }: { rows: AlertRow[]; title?: string }) {
  const tone = {
    rupture: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50" },
    bas: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    info: { icon: Package, color: "text-kamoo-blue-700", bg: "bg-kamoo-blue-50" },
  };
  return (
    <Panel title={title} right={<VoirTout />}>
      <ul className="divide-y divide-[#F4F5F6]">
        {rows.length === 0 && (
          <li className="px-5 py-10 text-center text-[12.5px] text-ink-400">
            Aucune alerte stock.
          </li>
        )}
        {rows.map((r, i) => {
          const tn = tone[r.level];
          const Icon = tn.icon;
          return (
            <li key={i} className="flex items-center gap-3 px-5 py-3">
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${tn.bg} ${tn.color}`}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-medium text-ink-900">{r.name}</div>
                <div className="truncate text-[11px] text-[#A7AEBA]">{r.sub}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
