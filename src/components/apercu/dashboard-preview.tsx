"use client";

/**
 * DashboardPreview — prototype d'identité (dashboard), branché sur PreviewShell.
 * Le shell (sidebar/header/canvas) est partagé ; ici seul le CONTENU vit.
 */

import { useMemo } from "react";
import { ArrowDownRight, ArrowUpRight, AlertTriangle, Clock, Package } from "lucide-react";
import {
  PreviewShell,
  Header,
  Panel,
  VoirTout,
  StatusPill,
  CARD,
  LABEL,
  type Variant,
} from "@/components/apercu/preview-shell";
import { MOCK_PRODUITS } from "@/lib/data/mock-produits";
import { MOCK_CLOSING_ASSIGNMENTS } from "@/lib/data/mock-closing";
import { MOCK_FINANCE_MOVEMENTS, MOCK_TODAY } from "@/lib/data/mock-finances";
import { MOCK_VENDOR } from "@/lib/data/mock-vendor";
import { orderTotalXof } from "@/lib/types/closing";
import { formatXOF } from "@/lib/format";

export type { Variant };

export function DashboardPreview({
  variant = "navy",
  fontFamily,
}: {
  variant?: Variant;
  fontFamily?: string;
}) {
  const data = useMemo(buildData, []);

  return (
    <PreviewShell
      variant={variant}
      fontFamily={fontFamily}
      activeHref="/apercu"
      header={<Header eyebrow={data.dateLabel} title={`Bonjour ${MOCK_VENDOR.firstName}`} />}
    >
      <div className="mx-auto flex max-w-[1320px] flex-col gap-4 px-6 py-6">
        <KpiRow k={data.kpis} />

        <div className="grid grid-cols-[1.55fr_1fr] gap-4">
          <CaChart series={data.caSeries} total={data.kpis.caEncaisse} />
          <ClosingCard buckets={data.closingBuckets} leads={data.closingLeads} />
        </div>

        <div className="grid grid-cols-[1.55fr_1fr] gap-4">
          <TopProducts rows={data.topProducts} />
          <LiveDeliveries rows={data.liveDeliveries} />
        </div>

        <div className="grid grid-cols-[1.55fr_1fr] gap-4">
          <RecentOps rows={data.recentOps} />
          <StockAlerts rows={data.stockAlerts} />
        </div>

        <div className="py-2 text-center text-[11px] text-[#A7AEBA]">
          Prototype d'identité · sidebar {variant} — /dashboard actuel intact
        </div>
      </div>
    </PreviewShell>
  );
}

/* ── KPI ── */
type Kpis = ReturnType<typeof buildData>["kpis"];

function KpiRow({ k }: { k: Kpis }) {
  return (
    <div className="grid grid-cols-5 gap-4">
      <Kpi label="CA encaissé" value={formatXOF(k.caEncaisse, false)} unit="F" delta={k.caDelta} pos />
      <Kpi label="Marge nette" value={formatXOF(k.margeNette, false)} unit="F" delta={k.margeDelta} pos />
      <Kpi label="Commandes livrées" value={String(k.nbLivre)} unit="cmd" delta={k.livreDelta} pos />
      <Kpi label="À encaisser" value={formatXOF(k.aEncaisser, false)} unit="F" tone="pos" hint={`${k.aEncaisserN} livreurs`} />
      <Kpi label="À régler" value={formatXOF(k.aRegler, false)} unit="F" tone="neg" hint={`${k.aReglerN} partenaires`} />
    </div>
  );
}

function Kpi({
  label,
  value,
  unit,
  delta,
  pos,
  tone,
  hint,
}: {
  label: string;
  value: string;
  unit?: string;
  delta?: number;
  pos?: boolean;
  tone?: "pos" | "neg";
  hint?: string;
}) {
  const valueColor = tone === "pos" ? "text-emerald-600" : tone === "neg" ? "text-red-600" : "text-ink-900";
  return (
    <div className={`${CARD} flex flex-col gap-2 p-4`}>
      <div className={LABEL}>{label}</div>
      <div className="flex items-baseline gap-1">
        <span className={`text-[24px] font-bold tracking-tight tabular-nums ${valueColor}`}>
          {tone === "pos" ? "+" : ""}
          {value}
        </span>
        {unit && <span className="text-[12px] font-medium text-[#A7AEBA]">{unit}</span>}
      </div>
      {delta !== undefined ? (
        <div className="flex items-center gap-1">
          <span
            className={[
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
              pos ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600",
            ].join(" ")}
          >
            {pos ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta)}%
          </span>
          <span className="text-[11px] text-[#A7AEBA]">vs mois dernier</span>
        </div>
      ) : (
        <div className="text-[11px] text-[#A7AEBA]">{hint}</div>
      )}
    </div>
  );
}

/* ── CA chart ── */
function CaChart({ series, total }: { series: number[]; total: number }) {
  const max = 450_000;
  const lines = [450_000, 300_000, 150_000, 0];
  return (
    <Panel
      title="CA encaissé · 14 derniers jours"
      right={
        <span className="text-[12px] font-medium text-[#8A92A0]">
          Total <span className="font-semibold text-ink-900 tabular-nums">{formatXOF(total, false)} F</span>
        </span>
      }
    >
      <div className="px-5 py-4">
        <div className="flex gap-3">
          <div className="flex w-9 flex-col justify-between py-1 text-right text-[10px] tabular-nums text-[#B4BAC4]">
            {lines.map((l) => (
              <div key={l}>{l === 0 ? "0" : `${l / 1000}k`}</div>
            ))}
          </div>
          <div className="relative flex-1">
            <div className="absolute inset-0 flex flex-col justify-between">
              {lines.map((l) => (
                <div key={l} className="border-t border-dashed border-[#F0F1F3]" />
              ))}
            </div>
            <div className="relative flex h-[210px] items-stretch gap-[6px]">
              {series.map((v, i) => (
                <div key={i} className="group flex h-full flex-1 flex-col items-center justify-end">
                  <div
                    className="w-full rounded-t-[3px] bg-kamoo-blue-900/85 transition-all group-hover:bg-kamoo-blue-900"
                    style={{ height: `${Math.max(3, (v / max) * 100)}%` }}
                    title={`${formatXOF(v, false)} F`}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-[6px] text-[10px] tabular-nums text-[#B4BAC4]">
              {series.map((_, i) => (
                <div key={i} className="flex-1 text-center">
                  {i % 2 === 0 ? i + 1 : ""}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ── closing ── */
type Bucket = { label: string; count: number; color: string };
type Lead = { id: string; product: string; extra: number; amount: string; status: string; time: string };

function ClosingCard({ buckets, leads }: { buckets: Bucket[]; leads: Lead[] }) {
  return (
    <Panel title="Closing en direct" right={<VoirTout />}>
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

/* ── top produits ── */
type ProdRow = {
  emoji: string;
  bg: string;
  name: string;
  ventes: number;
  ca: number;
  benefice: number;
  margePct: number;
};

function TopProducts({ rows }: { rows: ProdRow[] }) {
  return (
    <Panel title="Top produits du mois" right={<VoirTout />}>
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
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[15px]"
                    style={{ background: r.bg }}
                  >
                    {r.emoji}
                  </span>
                  <span className="truncate text-[12.5px] font-medium text-ink-900">{r.name}</span>
                </div>
              </td>
              <td className="px-3 py-2.5 text-right text-[12.5px] tabular-nums text-ink-700">{r.ventes}</td>
              <td className="px-3 py-2.5 text-right text-[12.5px] tabular-nums text-ink-700">{formatXOF(r.ca, false)}</td>
              <td className="px-3 py-2.5 text-right text-[12.5px] font-semibold tabular-nums text-ink-900">
                {formatXOF(r.benefice, false)}
              </td>
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

/* ── livraisons ── */
type DelRow = { id: string; product: string; extra: number; amount: string; time: string; status: string };

function LiveDeliveries({ rows }: { rows: DelRow[] }) {
  return (
    <Panel
      title="Livraisons en direct"
      right={
        <span className="rounded-full bg-kamoo-blue-50 px-2 py-0.5 text-[11px] font-semibold text-kamoo-blue-700">
          {rows.length} actives
        </span>
      }
    >
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
    </Panel>
  );
}

/* ── opérations ── */
type OpRow = { dir: "in" | "out"; label: string; sub: string; amount: number; time: string };

function RecentOps({ rows }: { rows: OpRow[] }) {
  return (
    <Panel title="Dernières opérations" right={<VoirTout />}>
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
    </Panel>
  );
}

/* ── alertes stock ── */
type AlertRow = { name: string; sub: string; level: "rupture" | "bas" | "info" };

function StockAlerts({ rows }: { rows: AlertRow[] }) {
  const tone = {
    rupture: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50" },
    bas: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    info: { icon: Package, color: "text-kamoo-blue-700", bg: "bg-kamoo-blue-50" },
  };
  return (
    <Panel title="Alertes stock" right={<VoirTout />}>
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
    </Panel>
  );
}

/* ── data ── */
function buildData() {
  const products = MOCK_PRODUITS;

  const caEncaisse = products.reduce((s, p) => s + (p.revenueThisMonthXof ?? 0), 0);
  const margeNette = products.reduce(
    (s, p) => s + (p.priceXof - (p.costPriceXof ?? 0)) * (p.soldThisMonth ?? 0),
    0,
  );
  const nbLivre = products.reduce((s, p) => s + (p.soldThisMonth ?? 0), 0);

  const topProducts: ProdRow[] = [...products]
    .map((p) => {
      const ca = p.revenueThisMonthXof ?? 0;
      const benefice = (p.priceXof - (p.costPriceXof ?? 0)) * (p.soldThisMonth ?? 0);
      return {
        emoji: p.emoji,
        bg: p.bg,
        name: p.name,
        ventes: p.soldThisMonth ?? 0,
        ca,
        benefice,
        margePct: ca > 0 ? Math.round((benefice / ca) * 100) : 0,
      };
    })
    .filter((p) => p.ventes > 0)
    .sort((a, b) => b.benefice - a.benefice)
    .slice(0, 5);

  const stockAlerts: AlertRow[] = products
    .filter((p) => p.isActive && p.stock <= (p.lowStockThreshold ?? 10))
    .slice(0, 3)
    .map((p) => ({
      name: p.name,
      sub: p.stock === 0 ? "Stock épuisé · à réapprovisionner" : `Stock bas · ${p.stock} unités restantes`,
      level: (p.stock === 0 ? "rupture" : "bas") as AlertRow["level"],
    }));
  stockAlerts.push({ name: "Power Bank 10 000mAh", sub: "Réception prévue · J+4 (8 juin)", level: "info" });

  const toCall = MOCK_CLOSING_ASSIGNMENTS.filter((a) =>
    ["nouvelle", "rappele", "injoignable"].includes(a.status),
  );
  const closingBuckets: Bucket[] = [
    { label: "À appeler", count: toCall.length, color: "#D97706" },
    {
      label: "Confirmés",
      count: MOCK_CLOSING_ASSIGNMENTS.filter((a) => a.status === "livraison_en_cours" || a.status === "livre").length,
      color: "#2563EB",
    },
    { label: "Annulés", count: MOCK_CLOSING_ASSIGNMENTS.filter((a) => a.status === "annule").length, color: "#9CA3AF" },
  ];
  const closingLeads: Lead[] = toCall.slice(0, 4).map((a) => {
    const first = a.items[0];
    return {
      id: a.id.toUpperCase(),
      product: first ? `${first.quantity}× ${first.productName}` : "—",
      extra: Math.max(0, a.items.length - 1),
      amount: `${formatXOF(orderTotalXof(a), false)} F`,
      status: a.status,
      time: relTime(a.lastActivityAt),
    };
  });

  const liveDeliveries: DelRow[] = MOCK_CLOSING_ASSIGNMENTS.filter(
    (a) => a.delivery && (a.delivery.progress === "en_attente" || a.delivery.progress === "alerte"),
  )
    .slice(0, 4)
    .map((a) => {
      const first = a.items[0];
      return {
        id: a.id.toUpperCase(),
        product: first ? `${first.quantity}× ${first.productName}` : "—",
        extra: Math.max(0, a.items.length - 1),
        amount: `${formatXOF(orderTotalXof(a), false)} F`,
        time: relTime(a.lastActivityAt),
        status: a.delivery!.progress,
      };
    });

  const opPrefix: Record<string, string> = {
    vente_encaissee: "Versement livreur",
    commission_closeuse: "Commission closeuse",
    frais_transit: "Frais expédition",
    depense_pub: "Dépense pub",
    remboursement: "Dépense",
    cout_marchandise: "Achat marchandise",
    frais_livreur: "Frais livreur",
  };
  const recentOps: OpRow[] = [...MOCK_FINANCE_MOVEMENTS]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .map((m) => ({
      dir: (m.direction === "in" ? "in" : "out") as OpRow["dir"],
      label: opPrefix[m.type] ?? "Opération",
      sub: m.partner?.name ?? m.description ?? "",
      amount: m.amountXof,
      time: new Date(m.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    }));

  const caSeries = [148, 96, 210, 175, 132, 288, 240, 168, 312, 264, 198, 360, 305, 412].map((v) => v * 1000);
  const dateLabel = MOCK_TODAY.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return {
    dateLabel,
    kpis: {
      caEncaisse,
      caDelta: 12,
      margeNette,
      margeDelta: 8,
      nbLivre,
      livreDelta: 5,
      aEncaisser: 1_240_000,
      aEncaisserN: 3,
      aRegler: 380_000,
      aReglerN: 2,
    },
    topProducts,
    stockAlerts,
    closingBuckets,
    closingLeads,
    liveDeliveries,
    recentOps,
    caSeries,
  };
}

function relTime(iso: string): string {
  const diffMin = Math.max(0, Math.round((MOCK_TODAY.getTime() - new Date(iso).getTime()) / 60_000));
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `${diffMin} min`;
  const h = Math.round(diffMin / 60);
  if (h < 24) return `${h} h`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}
