"use client";

/**
 * Sections du dashboard d'identité (aperçu), réutilisables.
 *
 * Ces composants portent le DESIGN validé (proto /apercu). Ils sont alimentés
 * par des PROPS de données — donc utilisables aussi bien par le proto (mock)
 * que par le vrai /dashboard (données réelles). C'est ça « afficher
 * l'information selon notre logique » : un seul design, deux sources.
 *
 * Doctrine dashboard premium (skill directeur-design-produit) :
 *  - hiérarchie : tous les widgets ne sont pas au même niveau.
 *  - couleur = sens (accent navy réservé au graphe héros ; rouge = alerte).
 *  - états vides soignés (cause + action), pas un simple « aucune donnée ».
 */

import {
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  Clock,
  Package,
  PackageCheck,
  PhoneCall,
  Receipt,
  Star,
  TrendingUp,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { Panel, VoirTout, StatusPill, CARD, LABEL } from "@/components/apercu/preview-shell";
import { formatXOF } from "@/lib/format";

/* ════════════════ État vide partagé ════════════════ */
function PanelEmpty({
  icon: Icon,
  title,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-paper-2 text-ink-400">
        <Icon className="h-5 w-5" />
      </span>
      <p className="text-[13px] font-semibold text-ink-700">{title}</p>
      {sub && <p className="max-w-[280px] text-[11.5px] leading-relaxed text-ink-400">{sub}</p>}
    </div>
  );
}

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

/**
 * Bande KPI — 5 indicateurs : 3 de PERFORMANCE (CA, marge, livrées, avec
 * comparaison) + 2 de TRÉSORERIE (à encaisser / à payer, avec le nombre de
 * contreparties en contexte).
 */
export function KpiRow({ k }: { k: KpiData }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      <Kpi
        label="CA encaissé"
        value={formatXOF(k.caEncaisse, false)}
        unit="F"
        delta={k.caDelta}
      />
      <Kpi
        label="Marge nette"
        value={formatXOF(k.margeNette, false)}
        unit="F"
        delta={k.margeDelta}
      />
      <Kpi
        label="Commandes livrées"
        value={String(k.nbLivre)}
        unit="cmd"
        delta={k.livreDelta}
      />
      <Kpi
        label="À encaisser"
        value={formatXOF(k.aEncaisser, false)}
        unit="F"
        hint={`${k.aEncaisserN} livreur${k.aEncaisserN > 1 ? "s" : ""}`}
      />
      <Kpi
        label="À payer"
        value={formatXOF(k.aRegler, false)}
        unit="F"
        hint={`${k.aReglerN} partenaire${k.aReglerN > 1 ? "s" : ""}`}
      />
    </div>
  );
}

export function Kpi({
  label,
  value,
  unit,
  delta,
  hint,
}: {
  label: string;
  value: string;
  unit?: string;
  delta?: number | null;
  hint?: string;
}) {
  const hasDelta = delta !== undefined && delta !== null;
  const pos = (delta ?? 0) >= 0;
  const context = hint ?? (hasDelta ? "vs période précédente" : null);
  return (
    <div className={`${CARD} flex flex-col gap-1.5 px-4 py-3.5`}>
      <div className="flex items-center justify-between gap-2">
        <span className={LABEL}>{label}</span>
        {hasDelta && (
          <span
            className={[
              "inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
              pos ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600",
            ].join(" ")}
          >
            {pos ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta as number)}%
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-[22px] font-bold leading-none tracking-tight tabular-nums text-ink-900">
          {value}
        </span>
        {unit && <span className="text-[12px] font-medium text-[#A7AEBA]">{unit}</span>}
      </div>
      {context && <div className="text-[11px] text-[#A7AEBA]">{context}</div>}
    </div>
  );
}

/* ════════════════ CHART — aire (évolution) ════════════════ */
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
  const peak = series.length ? Math.max(0, ...series) : 0;
  const hasData = total > 0 && peak > 0;
  const max = niceMax(Math.max(1, peak));
  const lines = [max, (max * 2) / 3, max / 3, 0];

  /* Géométrie SVG (viewBox étiré horizontalement, trait non-scalé) */
  const W = 1000;
  const H = 210;
  const BASE = 204;
  const TOP = 8;
  const n = series.length;
  const xAt = (i: number) => (n <= 1 ? W / 2 : (i / (n - 1)) * W);
  const yAt = (v: number) => BASE - (v / max) * (BASE - TOP);
  const linePath = series
    .map((v, i) => `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)} ${yAt(v).toFixed(1)}`)
    .join(" ");
  const areaPath = n >= 2 ? `${linePath} L ${W} ${BASE} L 0 ${BASE} Z` : "";

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
      {!hasData ? (
        <PanelEmpty
          icon={TrendingUp}
          title="Aucun encaissement sur cette période"
          sub="Les ventes encaissées par tes livreurs s'afficheront ici, jour après jour."
        />
      ) : (
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
              <div className="relative h-[230px]">
                <svg
                  viewBox={`0 0 ${W} ${H}`}
                  preserveAspectRatio="none"
                  className="absolute inset-0 h-full w-full overflow-visible"
                  aria-hidden
                >
                  <defs>
                    <linearGradient id="caArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-kamoo-blue-900)" stopOpacity="0.16" />
                      <stop offset="100%" stopColor="var(--color-kamoo-blue-900)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {areaPath && <path d={areaPath} fill="url(#caArea)" />}
                  <path
                    d={linePath}
                    fill="none"
                    stroke="var(--color-kamoo-blue-900)"
                    strokeWidth={2}
                    vectorEffect="non-scaling-stroke"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </svg>
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
      )}
    </Panel>
  );
}

/* ════════════════ TRÉSORERIE (à encaisser / à régler) ════════════════ */
export function CashflowCard({
  aEncaisser,
  aEncaisserN,
  aRegler,
  aReglerN,
  title = "Trésorerie",
}: {
  aEncaisser: number;
  aEncaisserN: number;
  aRegler: number;
  aReglerN: number;
  title?: string;
}) {
  const empty = aEncaisser === 0 && aRegler === 0;
  return (
    <Panel title={title} right={<VoirTout />}>
      {empty ? (
        <PanelEmpty
          icon={Wallet}
          title="Rien en circulation"
          sub="Aucun encaissement à recevoir ni règlement à effectuer pour le moment."
        />
      ) : (
        <div className="divide-y divide-[#F4F5F6]">
          <CashRow
            tone="in"
            label="À encaisser"
            sub={`${aEncaisserN} livreur${aEncaisserN > 1 ? "s" : ""}`}
            value={aEncaisser}
          />
          <CashRow
            tone="out"
            label="À régler"
            sub={`${aReglerN} partenaire${aReglerN > 1 ? "s" : ""}`}
            value={aRegler}
          />
        </div>
      )}
    </Panel>
  );
}

function CashRow({
  tone,
  label,
  sub,
  value,
}: {
  tone: "in" | "out";
  label: string;
  sub: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <span
        className={[
          "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
          tone === "in" ? "bg-emerald-50 text-emerald-600" : "bg-paper-2 text-ink-500",
        ].join(" ")}
      >
        {tone === "in" ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] font-medium text-ink-900">{label}</div>
        <div className="text-[11px] text-[#A7AEBA]">{sub}</div>
      </div>
      <div
        className={[
          "text-[14px] font-semibold tabular-nums",
          tone === "in" ? "text-emerald-600" : "text-ink-900",
        ].join(" ")}
      >
        {formatXOF(value, false)} <span className="text-[10px] font-medium text-[#A7AEBA]">F</span>
      </div>
    </div>
  );
}

/* ════════════════ PRODUITS LES PLUS RENTABLES ════════════════ */
export type ProductPerfRow = {
  emoji: string;
  bg: string;
  name: string;
  cover?: string | null;
  ventes: number;
  ca: number;
  benefice: number;
  margePct: number;
  /** Taux de livraison (livrées / appelées) % */
  tauxLiv: number;
};

export function ProductPerformance({
  rows,
  title = "Produits les plus rentables",
}: {
  rows: ProductPerfRow[];
  title?: string;
}) {
  return (
    <Panel title={title} right={<VoirTout />}>
      {rows.length === 0 ? (
        <PanelEmpty
          icon={Package}
          title="Pas encore de produit rentable"
          sub="Dès que des commandes seront livrées, tes produits les plus rentables — bénéfice, marge et taux de livraison — apparaîtront ici."
        />
      ) : (
        <table className="w-full">
          <thead>
            <tr className="text-[10.5px] uppercase tracking-[0.05em] text-[#A7AEBA]">
              <th className="px-5 py-2 text-left font-semibold">Produit</th>
              <th className="px-3 py-2 text-right font-semibold">Ventes</th>
              <th className="px-3 py-2 text-right font-semibold">CA</th>
              <th className="px-3 py-2 text-right font-semibold">Bénéfice</th>
              <th className="px-3 py-2 text-right font-semibold">Marge</th>
              <th className="px-5 py-2 text-right font-semibold">Taux livr.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F4F5F6]">
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
                <td className="px-3 py-2.5 text-right">
                  <span className="inline-block rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-emerald-700">
                    {r.margePct}%
                  </span>
                </td>
                <td className="px-5 py-2.5 text-right">
                  <span
                    className={[
                      "text-[12.5px] font-semibold tabular-nums",
                      r.tauxLiv < 50 ? "text-amber-700" : "text-ink-700",
                    ].join(" ")}
                  >
                    {r.tauxLiv}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
}

/* ════════════════ PERFORMANCE DES PARTENAIRES ════════════════ */
export type CloseusePerf = {
  name: string;
  avatarBg: string;
  rating: number;
  /** Taux de confirmation (confirmées / appelées) % */
  confirmRate: number;
  /** Nombre de commandes traitées (appelées) */
  handled: number;
};

export type LivreurPerf = {
  name: string;
  avatarBg: string;
  rating: number;
  delivered: number;
  assigned: number;
  /** Taux de livraison (effectuées / assignées) % */
  rate: number;
};

export function PartnerPerformance({
  closeuse,
  livreurs,
  title = "Performance des partenaires",
}: {
  closeuse: CloseusePerf | null;
  livreurs: LivreurPerf[];
  title?: string;
}) {
  const empty = !closeuse && livreurs.length === 0;
  return (
    <Panel title={title} right={<VoirTout />}>
      {empty ? (
        <PanelEmpty
          icon={Users}
          title="Aucun partenaire actif"
          sub="Recrute une closeuse et des livreurs depuis la Marketplace : tu suivras ici leur taux de confirmation et de livraison."
        />
      ) : (
        <ul className="divide-y divide-[#F4F5F6]">
          {closeuse && (
            <PartnerPerfRow
              avatarBg={closeuse.avatarBg}
              name={closeuse.name}
              role="Closeuse"
              rating={closeuse.rating}
              pct={closeuse.confirmRate}
              metric="confirmation"
              sub={`${closeuse.handled} commande${closeuse.handled > 1 ? "s" : ""} traitée${closeuse.handled > 1 ? "s" : ""}`}
            />
          )}
          {livreurs.map((l) => (
            <PartnerPerfRow
              key={l.name}
              avatarBg={l.avatarBg}
              name={l.name}
              role="Livreur"
              rating={l.rating}
              pct={l.rate}
              metric="livraison"
              sub={`${l.delivered} livrée${l.delivered > 1 ? "s" : ""} / ${l.assigned}`}
            />
          ))}
        </ul>
      )}
    </Panel>
  );
}

function PartnerPerfRow({
  avatarBg,
  name,
  role,
  rating,
  pct,
  metric,
  sub,
}: {
  avatarBg: string;
  name: string;
  role: "Closeuse" | "Livreur";
  rating: number;
  pct: number;
  metric: string;
  sub: string;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const pctCls =
    pct >= 70
      ? "bg-emerald-50 text-emerald-700"
      : pct >= 40
        ? "bg-amber-50 text-amber-700"
        : "bg-paper-2 text-ink-600";
  const roleCls =
    role === "Closeuse"
      ? "bg-kamoo-blue-50 text-kamoo-blue-700"
      : "bg-paper-2 text-ink-600";
  return (
    <li className="flex items-center gap-3 px-5 py-3">
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white"
        style={{ backgroundColor: avatarBg }}
      >
        {initials}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[12.5px] font-semibold text-ink-900">{name}</span>
          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase ${roleCls}`}>
            {role}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-[#8A92A0]">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          <span className="tabular-nums">{rating.toFixed(1)}</span>
          <span className="text-[#D0D4DB]">·</span>
          <span className="truncate">{sub}</span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <span className={`inline-block rounded-md px-1.5 py-0.5 text-[12px] font-bold tabular-nums ${pctCls}`}>
          {pct}%
        </span>
        <div className="mt-0.5 text-[10px] text-[#B4BAC4]">{metric}</div>
      </div>
    </li>
  );
}

/* ════════════════ CLOSING ════════════════ */
export type Bucket = { label: string; count: number; color: string };
export type Lead = { id: string; product: string; extra: number; amount: string; status: string; time: string };

export function ClosingCard({ buckets, leads, title = "Closing en direct" }: { buckets: Bucket[]; leads: Lead[]; title?: string }) {
  const total = buckets.reduce((s, b) => s + b.count, 0);
  return (
    <Panel title={title} right={<VoirTout />}>
      {/* États des commandes — répartition en un coup d'œil */}
      <div className="border-b border-[#F1F2F4] px-5 py-4">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8A92A0]">
            États des commandes
          </span>
          <span className="text-[11.5px] tabular-nums text-[#A7AEBA]">
            {total} commande{total > 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-paper-2">
          {total > 0 &&
            buckets.map((b) =>
              b.count > 0 ? (
                <div
                  key={b.label}
                  className="h-full"
                  style={{ width: `${(b.count / total) * 100}%`, backgroundColor: b.color }}
                  title={`${b.label} · ${b.count}`}
                />
              ) : null,
            )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5">
          {buckets.map((b) => (
            <div key={b.label} className="flex items-baseline gap-1.5">
              <span
                className="h-2 w-2 shrink-0 translate-y-[-1px] rounded-full"
                style={{ backgroundColor: b.color }}
              />
              <span className="text-[15px] font-bold tabular-nums text-ink-900">{b.count}</span>
              <span className="text-[11.5px] font-medium text-[#8A92A0]">{b.label}</span>
            </div>
          ))}
        </div>
      </div>
      {leads.length === 0 ? (
        <PanelEmpty
          icon={PhoneCall}
          title="Aucune commande à appeler"
          sub="Les nouvelles commandes à confirmer apparaîtront ici dès leur arrivée."
        />
      ) : (
        <ul className="divide-y divide-[#F4F5F6]">
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
      )}
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
      {rows.length === 0 ? (
        <PanelEmpty
          icon={Package}
          title="Aucune vente sur la période"
          sub="Le classement de tes meilleurs produits (CA, bénéfice, marge) s'affichera ici."
        />
      ) : (
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
      )}
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
      {rows.length === 0 ? (
        <PanelEmpty
          icon={Truck}
          title="Aucune livraison en cours"
          sub="Les colis confiés à tes livreurs et leur statut s'afficheront ici en temps réel."
        />
      ) : (
        <ul className="divide-y divide-[#F4F5F6]">
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
      )}
    </Panel>
  );
}

/* ════════════════ OPÉRATIONS ════════════════ */
export type OpRow = { dir: "in" | "out"; label: string; sub: string; amount: number; time: string };

export function RecentOps({ rows, title = "Dernières opérations" }: { rows: OpRow[]; title?: string }) {
  return (
    <Panel title={title} right={<VoirTout />}>
      {rows.length === 0 ? (
        <PanelEmpty
          icon={Receipt}
          title="Aucune opération récente"
          sub="Versements livreurs, commissions et dépenses apparaîtront dans ce journal."
        />
      ) : (
        <ul className="divide-y divide-[#F4F5F6]">
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
      )}
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
      {rows.length === 0 ? (
        <PanelEmpty
          icon={PackageCheck}
          title="Stock sous contrôle"
          sub="Aucune rupture ni alerte de réapprovisionnement sur tes produits actifs."
        />
      ) : (
        <ul className="divide-y divide-[#F4F5F6]">
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
      )}
    </Panel>
  );
}
