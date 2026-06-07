"use client";

/**
 * DashboardPreview — proto d'identité (mock), branché sur PreviewShell +
 * les sections partagées (dashboard-sections). Même design que le vrai
 * /dashboard ; seule la SOURCE de données diffère (ici : mock).
 */

import { useMemo } from "react";
import { PreviewShell, Header, type Variant } from "@/components/apercu/preview-shell";
import {
  KpiRow,
  CaChart,
  ClosingCard,
  TopProducts,
  LiveDeliveries,
  RecentOps,
  StockAlerts,
  type Bucket,
  type Lead,
  type ProdRow,
  type DelRow,
  type OpRow,
  type AlertRow,
} from "@/components/apercu/dashboard-sections";
import { MOCK_PRODUITS } from "@/lib/data/mock-produits";
import { MOCK_CLOSING_ASSIGNMENTS } from "@/lib/data/mock-closing";
import { MOCK_FINANCE_MOVEMENTS, MOCK_TODAY } from "@/lib/data/mock-finances";
import { MOCK_VENDOR } from "@/lib/data/mock-vendor";
import { orderTotalXof } from "@/lib/types/closing";
import { formatXOF } from "@/lib/format";

export type { Variant };

export function DashboardPreview({ variant = "navy", fontFamily }: { variant?: Variant; fontFamily?: string }) {
  const data = useMemo(buildData, []);
  const labels = data.caSeries.map((_, i) => (i % 2 === 0 ? String(i + 1) : ""));

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
          <CaChart series={data.caSeries} labels={labels} total={data.kpis.caEncaisse} title="CA encaissé · 14 derniers jours" />
          <ClosingCard buckets={data.closingBuckets} leads={data.closingLeads} />
        </div>

        <div className="grid grid-cols-[1.55fr_1fr] gap-4">
          <TopProducts rows={data.topProducts} title="Top produits du mois" />
          <LiveDeliveries rows={data.liveDeliveries} />
        </div>

        <div className="grid grid-cols-[1.55fr_1fr] gap-4">
          <RecentOps rows={data.recentOps} />
          <StockAlerts rows={data.stockAlerts} />
        </div>

        <div className="py-2 text-center text-[11px] text-[#A7AEBA]">
          Prototype d'identité · sidebar {variant}
        </div>
      </div>
    </PreviewShell>
  );
}

/* ── mock data ── */
function buildData() {
  const products = MOCK_PRODUITS;

  const caEncaisse = products.reduce((s, p) => s + (p.revenueThisMonthXof ?? 0), 0);
  const margeNette = products.reduce((s, p) => s + (p.priceXof - (p.costPriceXof ?? 0)) * (p.soldThisMonth ?? 0), 0);
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

  const toCall = MOCK_CLOSING_ASSIGNMENTS.filter((a) => ["nouvelle", "rappele", "injoignable"].includes(a.status));
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
