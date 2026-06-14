"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { PageHeader } from "@/components/kamoo/page-header";
import {
  KpiRow,
  CaChart,
  CashflowCard,
  ClosingCard,
  TopProducts,
  LiveDeliveries,
  RecentOps,
  StockAlerts,
  type AlertRow,
  type Bucket,
  type Lead,
  type DelRow,
  type OpRow,
  type ProdRow,
} from "@/components/apercu/dashboard-sections";
import {
  DateRangeFilter,
  type DateFilterValue,
} from "@/components/kamoo/date-range-filter";
import {
  computeCashflowTimeline,
  type TimelinePoint,
} from "@/lib/types/finance";
import type { OperationRow } from "@/components/console/dashboard/recent-operations";
import type { DeliveryFeedItem } from "@/components/console/dashboard/live-deliveries";
import type { ClosingLead } from "@/components/console/dashboard/closing-leads";
import {
  MOCK_FINANCE_MOVEMENTS,
  MOCK_TODAY,
} from "@/lib/data/mock-finances";
import { MOCK_CLOSING_ASSIGNMENTS } from "@/lib/data/mock-closing";
import { MOCK_EXPEDITIONS } from "@/lib/data/mock-expeditions";
import { MOCK_PRODUITS } from "@/lib/data/mock-produits";
import { useSessionStorageState } from "@/lib/hooks/use-session-storage-state";
import { useProductsState } from "@/lib/hooks/use-products-state";
import { useClosingState } from "@/lib/hooks/use-closing-state";
import { MOCK_VENDOR } from "@/lib/data/mock-vendor";
import { useCurrentMarket } from "@/lib/hooks/use-current-market";
import { useShopify } from "@/lib/hooks/use-shopify";
import { formatMoney, formatXOF } from "@/lib/format";
import { displayOrderNo, orderTotalXof, type ClosingAssignment } from "@/lib/types/closing";
import { getStockLevel } from "@/lib/types/produit";
import {
  bucketingForDateFilter,
  chartEndDateForFilter,
  dateFilterRange,
  dateFilterSubtitle,
  normalizeDateFilter,
} from "@/lib/utils/date-filter";

/**
 * Dashboard « Vue d'ensemble » — identité Kamoo (refonte validée).
 *
 * Le DESIGN provient du proto /apercu (sections sobres, hiérarchie
 * libellé→valeur, couleur = sens). Les DONNÉES et la LOGIQUE sont réelles
 * (période filtrable, calculs `computeDashboardData`). Un seul design, vraie
 * source — c'est « afficher l'information selon notre logique ».
 */
export default function DashboardPage() {
  const { currentMarket } = useCurrentMarket();
  const { currencyFor } = useShopify();
  const currency = currencyFor(currentMarket.id);
  const { products: liveProducts } = useProductsState();
  /* Commandes LIVE : la machine d'etats closing (synchronisee app closeuse) */
  const liveOrders = useClosingState().all;
  const searchParams = useSearchParams();
  void searchParams; // réservé (deep-link période à venir)
  const router = useRouter();

  /* Onboarding 1ʳᵉ connexion : tant que le wizard n'a pas été terminé (ou
   * passé), on y emmène l'utilisateur. */
  useEffect(() => {
    try {
      if (!localStorage.getItem("kamoo.onboarded")) router.replace("/bienvenue");
    } catch {}
  }, [router]);

  /* ─── Période (synchronisée avec /finances) ─── */
  const [dateFilter, setDateFilter] = useSessionStorageState<DateFilterValue>(
    "kamoo.financePeriod",
    { preset: "30j" },
  );
  const normalizedFilter = useMemo(
    () => normalizeDateFilter(dateFilter),
    [dateFilter],
  );

  const bucketing = useMemo(
    () => bucketingForDateFilter(normalizedFilter),
    [normalizedFilter],
  );
  const chartEndDate = useMemo(() => {
    const base = chartEndDateForFilter(normalizedFilter, MOCK_TODAY);
    if (bucketing.granularity === "hour") {
      const d = new Date(base);
      d.setUTCHours(23, 0, 0, 0);
      return d;
    }
    return base;
  }, [normalizedFilter, bucketing.granularity]);

  /* ─── Timeline CA (encaissements bucketés sur la période) ─── */
  const caTimeline = useMemo<TimelinePoint[]>(() => {
    const grid = computeCashflowTimeline(
      [],
      bucketing.granularity,
      bucketing.count,
      chartEndDate,
    );
    const buckets: TimelinePoint[] = grid.map((p) => ({
      ...p,
      in: 0,
      out: 0,
      net: 0,
    }));
    if (grid.length === 0) return buckets;
    const advance = (startMs: number): number => {
      const d = new Date(startMs);
      switch (bucketing.granularity) {
        case "hour":
          d.setUTCHours(d.getUTCHours() + 1);
          break;
        case "day":
          d.setUTCDate(d.getUTCDate() + 1);
          break;
        case "week":
          d.setUTCDate(d.getUTCDate() + 7);
          break;
        case "month":
          d.setUTCMonth(d.getUTCMonth() + 1);
          break;
        case "year":
          d.setUTCFullYear(d.getUTCFullYear() + 1);
          break;
      }
      return d.getTime();
    };
    const bounds = grid.map((b, i) => {
      const start = new Date(b.date).getTime();
      const end =
        i + 1 < grid.length
          ? new Date(grid[i + 1].date).getTime()
          : advance(start);
      return { start, end };
    });
    const findBucket = (iso?: string): number => {
      if (!iso) return -1;
      const t = new Date(iso).getTime();
      return bounds.findIndex((b) => t >= b.start && t < b.end);
    };
    // Encaissements = mouvements finance (fixtures dérivées + historique 12 mois)
    for (const m of MOCK_FINANCE_MOVEMENTS) {
      if (m.type !== "vente_encaissee") continue;
      const idx = findBucket(m.date);
      if (idx >= 0) buckets[idx].in += m.amountXof;
    }
    return buckets;
  }, [bucketing, chartEndDate]);

  /* ─── Compute principal ─── */
  const computed = useMemo(
    () => computeDashboardData({ normalizedFilter, assignments: liveOrders, currency }),
    [normalizedFilter, liveOrders, currency],
  );
  void currentMarket.country.code;

  /* ─── Alertes stock (état live des produits) ─── */
  const stockAlerts = useMemo(
    () => computeStockAlerts(liveProducts),
    [liveProducts],
  );

  /* ─── Mapping vers les sections d'identité ─── */
  const kpiData = {
    caEncaisse: computed.kpis.caEncaisse,
    caDelta: computed.kpis.caEncaisseDeltaPct,
    margeNette: computed.kpis.margeNette,
    margeDelta: computed.kpis.margeNetteDeltaPct,
    nbLivre: computed.kpis.nbLivre,
    livreDelta: computed.kpis.nbLivreDeltaPct,
    aEncaisser: computed.kpis.aEncaisser,
    aEncaisserN: computed.kpis.aEncaisserPorters,
    aRegler: computed.kpis.aRegler,
    aReglerN: computed.kpis.aReglerPartners,
  };

  const chartSeries = caTimeline.map((p) => p.in);
  const step = Math.max(1, Math.ceil(caTimeline.length / 8));
  const chartLabels = caTimeline.map((p, i) => (i % step === 0 ? p.label : ""));

  const closingLeads: Lead[] = computed.closing.leads.map((l: ClosingLead) => ({
    id: l.orderId,
    product: l.productLabel,
    extra: l.extraItemsCount,
    amount: l.amountLabel,
    status: l.status,
    time: l.mins,
  }));

  const topRows: ProdRow[] = computed.topProducts.map((p) => ({
    emoji: p.emoji,
    bg: p.bg,
    name: p.name,
    ventes: p.sales,
    ca: p.caXof,
    benefice: p.beneficeXof,
    margePct: p.beneficePct,
  }));

  const deliveryRows: DelRow[] = computed.liveDeliveries.map((d: DeliveryFeedItem) => ({
    id: d.orderId,
    product: d.productLabel,
    extra: d.extraItemsCount,
    amount: d.amountLabel,
    time: d.lastActivityLabel,
    status: d.status,
  }));

  const opRows: OpRow[] = computed.recentOps.map((o: OperationRow) => ({
    dir: o.kind,
    label: o.who,
    sub: o.what,
    amount: o.amountXof,
    time: o.time,
  }));

  const greeting = getGreeting();
  const todaySubtitle = formatTodayLabel(MOCK_TODAY);

  return (
    <div className="min-h-full bg-paper">
      {/* Header commun (PageHeader) : période + cloche, même ordre partout. */}
      <PageHeader kicker={todaySubtitle} title={`${greeting} ${MOCK_VENDOR.firstName}`}>
        <DateRangeFilter value={dateFilter} onChange={setDateFilter} />
      </PageHeader>

      <div className="mx-auto flex max-w-[1320px] flex-col gap-4 px-6 py-6">
        {/* Amorçage : aucune commande encore reçue → guider vers la connexion. */}
        {liveOrders.length === 0 && (
          <Link
            href="/parametres/connexions"
            className="group flex items-center gap-3 rounded-xl border border-kamoo-blue-100 bg-kamoo-blue-50/40 px-4 py-3 transition hover:bg-kamoo-blue-50"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-kamoo-blue-700 ring-1 ring-kamoo-blue-100">
              <ShoppingBag className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-ink-900">
                Connecte ta boutique Shopify pour démarrer
              </div>
              <div className="text-[11.5px] text-ink-500">
                Tes commandes arriveront automatiquement dans Closing, et ce tableau de bord prendra vie.
              </div>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-kamoo-blue-700 transition group-hover:translate-x-0.5" />
          </Link>
        )}

        {/* Bande KPI — performance (4 indicateurs, comparaison incluse) */}
        <KpiRow k={kpiData} />

        {/* Zone principale : graphe héros (évolution CA) + action n°1 (closing) */}
        <div className="grid grid-cols-[1.7fr_1fr] gap-4">
          <CaChart
            series={chartSeries}
            labels={chartLabels}
            total={computed.kpis.caEncaisse}
            title="CA encaissé"
            periodLabel={dateFilterSubtitle(normalizedFilter)}
          />
          <ClosingCard buckets={computed.closing.buckets} leads={closingLeads} />
        </div>

        {/* Opérations : ce qui se vend + ce qui est en livraison */}
        <div className="grid grid-cols-[1.7fr_1fr] gap-4">
          <TopProducts rows={topRows} title="Top produits" />
          <LiveDeliveries
            rows={deliveryRows}
            activeCount={computed.liveDeliveriesActiveCount}
          />
        </div>

        {/* Journal + (trésorerie & alertes empilées) */}
        <div className="grid grid-cols-[1.7fr_1fr] gap-4">
          <RecentOps rows={opRows} />
          <div className="flex flex-col gap-4">
            <CashflowCard
              aEncaisser={kpiData.aEncaisser}
              aEncaisserN={kpiData.aEncaisserN}
              aRegler={kpiData.aRegler}
              aReglerN={kpiData.aReglerN}
            />
            <StockAlerts rows={stockAlerts} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers de format ─────────────────────────────────────────── */

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

function formatLastActivity(iso: string): string {
  const t = new Date(iso).getTime();
  const now = MOCK_TODAY.getTime();
  const diffMin = Math.max(0, Math.round((now - t) / 60_000));
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `${diffMin} min`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} h`;
  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 7) return `${diffDay} j`;
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function formatTodayLabel(d: Date): string {
  // Date seule (pas d'heure) : MOCK_TODAY est ancré à midi UTC pour la
  // stabilité d'hydratation — afficher cette heure serait trompeur.
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/* ─── Compute dashboard data ────────────────────────────────────── */

type DashboardData = {
  kpis: {
    caEncaisse: number;
    margeNette: number;
    aEncaisser: number;
    aEncaisserPorters: number;
    aRegler: number;
    aReglerPartners: number;
    nbLivre: number;
    caEncaisseDeltaPct: number | null;
    margeNetteDeltaPct: number | null;
    nbLivreDeltaPct: number | null;
  };
  recentOps: OperationRow[];
  closing: {
    totalCalled: number;
    buckets: Bucket[];
    leads: ClosingLead[];
  };
  liveDeliveries: DeliveryFeedItem[];
  liveDeliveriesActiveCount: number;
  liveDeliveriesChipLabel: string;
  topProducts: {
    emoji: string;
    bg: string;
    name: string;
    sales: number;
    called: number;
    tauxLivPct: number;
    caXof: number;
    beneficeXof: number;
    beneficePct: number;
  }[];
};

function computeDashboardData(args: {
  normalizedFilter: DateFilterValue;
  /** Commandes LIVE (machine d etats closing) — pas les fixtures brutes */
  assignments: ClosingAssignment[];
  /** Devise d affichage du marche */
  currency: string;
}): DashboardData {
  const { normalizedFilter, assignments, currency } = args;

  const range = dateFilterRange(normalizedFilter, MOCK_TODAY);
  const inRange = (iso: string | undefined): boolean => {
    if (!iso) return false;
    if (!range) return true;
    const t = new Date(iso).getTime();
    return t >= range.fromMs && t < range.toMs;
  };

  /* KPIs */
  const caPeriod = MOCK_FINANCE_MOVEMENTS.filter(
    (m) => m.type === "vente_encaissee" && inRange(m.date),
  ).reduce((s, m) => s + m.amountXof, 0);

  const movementsPeriod = MOCK_FINANCE_MOVEMENTS.filter((m) => inRange(m.date));
  const sumByType = (type: string) =>
    movementsPeriod.filter((m) => m.type === type).reduce((s, m) => s + m.amountXof, 0);

  const coutMarch = sumByType("cout_marchandise");
  const commCloseuse = sumByType("commission_closeuse");
  const fraisLivreur = sumByType("frais_livreur");
  const fraisTransit = sumByType("frais_transit");
  const coutPub = sumByType("depense_pub");

  const margeBrute = caPeriod - coutMarch - commCloseuse - fraisLivreur - fraisTransit;
  const margeNette = margeBrute - coutPub;

  const aRecevoirMvts = MOCK_FINANCE_MOVEMENTS.filter(
    (m) => m.type === "vente_encaissee" && m.status === "a_recevoir",
  );
  const aEncaisser = aRecevoirMvts.reduce((s, m) => s + m.amountXof, 0);
  const aEncaisserPorters = new Set(
    aRecevoirMvts.map((m) => m.partner?.ref ?? m.partner?.name).filter((x): x is string => !!x),
  ).size;

  const aPayerMvts = MOCK_FINANCE_MOVEMENTS.filter(
    (m) => m.direction === "out" && m.status === "a_payer" && m.type !== "frais_livreur",
  );
  const aRegler = aPayerMvts.reduce((s, m) => s + m.amountXof, 0);
  const aReglerPartners = new Set(
    aPayerMvts.map((m) => m.partner?.ref ?? m.partner?.name).filter((x): x is string => !!x),
  ).size;

  // 1 vente encaissée = 1 commande livrée (fixtures dérivées + historique)
  const nbLivre = MOCK_FINANCE_MOVEMENTS.filter(
    (m) => m.type === "vente_encaissee" && inRange(m.date),
  ).length;

  /* Période précédente → deltas */
  let caEncaissePrev = 0;
  let margeNettePrev = 0;
  let nbLivrePrev = 0;
  if (range) {
    const periodLength = range.toMs - range.fromMs;
    const prevFromMs = range.fromMs - periodLength;
    const prevToMs = range.fromMs;
    const inPrev = (iso: string | undefined): boolean => {
      if (!iso) return false;
      const t = new Date(iso).getTime();
      return t >= prevFromMs && t < prevToMs;
    };
    const movPrev = MOCK_FINANCE_MOVEMENTS.filter((m) => inPrev(m.date));
    caEncaissePrev = movPrev
      .filter((m) => m.type === "vente_encaissee")
      .reduce((s, m) => s + m.amountXof, 0);
    const sumPrev = (type: string) =>
      movPrev.filter((m) => m.type === type).reduce((s, m) => s + m.amountXof, 0);
    const margeBrutePrev =
      caEncaissePrev -
      sumPrev("cout_marchandise") -
      sumPrev("commission_closeuse") -
      sumPrev("frais_livreur") -
      sumPrev("frais_transit");
    margeNettePrev = margeBrutePrev - sumPrev("depense_pub");
    nbLivrePrev = MOCK_FINANCE_MOVEMENTS.filter(
      (m) => m.type === "vente_encaissee" && inPrev(m.date),
    ).length;
  }

  const computePct = (cur: number, prev: number): number | null => {
    if (!range) return null;
    if (prev === 0) return null;
    return Math.round(((cur - prev) / Math.abs(prev)) * 100);
  };
  const caEncaisseDeltaPct = computePct(caPeriod, caEncaissePrev);
  const margeNetteDeltaPct = computePct(margeNette, margeNettePrev);
  const nbLivreDeltaPct = computePct(nbLivre, nbLivrePrev);

  /* Top products (période) */
  const salesByProductPeriod = new Map<string, { sales: number; ca: number }>();
  for (const a of assignments) {
    if (a.delivery?.progress !== "effectue") continue;
    if (!inRange(a.delivery.deliveredAt)) continue;
    for (const item of a.items) {
      if (!item.productId) continue;
      const cur = salesByProductPeriod.get(item.productId) ?? { sales: 0, ca: 0 };
      cur.sales += item.quantity;
      cur.ca += item.quantity * item.unitPriceXof;
      salesByProductPeriod.set(item.productId, cur);
    }
  }
  // + ventes issues du livre de comptes (historique mensuel lissé + ventes
  // récentes). Les fixtures (orderId "ORD-…") sont déjà comptées via les
  // assignments ci-dessus → exclues pour éviter le double comptage. La
  // quantité est estimée depuis le prix unitaire du produit.
  for (const m of MOCK_FINANCE_MOVEMENTS) {
    if (m.type !== "vente_encaissee" || !m.productId) continue;
    if (m.orderId?.startsWith("ORD-")) continue;
    if (!inRange(m.date)) continue;
    const price = MOCK_PRODUITS.find((p) => p.id === m.productId)?.priceXof;
    const qty = price ? Math.max(1, Math.round(m.amountXof / price)) : 1;
    const cur = salesByProductPeriod.get(m.productId) ?? { sales: 0, ca: 0 };
    cur.sales += qty;
    cur.ca += m.amountXof;
    salesByProductPeriod.set(m.productId, cur);
  }

  /* Recent ops */
  const ALLOWED_OP_TYPES = new Set([
    "vente_encaissee",
    "commission_closeuse",
    "frais_transit",
    "depense_pub",
    "remboursement",
  ]);
  const opTypePrefix: Record<string, string> = {
    vente_encaissee: "Versement livreur",
    commission_closeuse: "Commission closeuse",
    frais_transit: "Frais expédition",
    depense_pub: "Dépense pub",
    remboursement: "Dépense",
  };
  const todayMs = MOCK_TODAY.getTime();
  const recentOps: OperationRow[] = [...MOCK_FINANCE_MOVEMENTS]
    .filter((m) => new Date(m.date).getTime() <= todayMs)
    .filter((m) => ALLOWED_OP_TYPES.has(m.type))
    .filter((m) => (m.direction === "in" ? m.status === "encaisse" : m.status === "paye"))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .map((m) => {
      const prefix = opTypePrefix[m.type] ?? "—";
      const partnerSuffix = m.partner?.name
        ? ` · ${m.partner.name}`
        : m.type === "depense_pub"
          ? " · Meta Ads"
          : "";
      return {
        time: new Date(m.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        kind: m.direction === "in" ? "in" : "out",
        who: `${prefix}${partnerSuffix}`,
        what: m.description,
        amountXof: m.amountXof,
      };
    });

  /* Closing */
  const toCallStatuses = ["nouvelle", "rappele", "injoignable"];
  const toCallList = assignments.filter((a) =>
    toCallStatuses.includes(a.status),
  );
  const aAppeler = toCallList.length;
  const confirmes = assignments.filter(
    (a) => a.status === "livraison_en_cours" || a.status === "livre",
  ).length;
  const annules = assignments.filter((a) => a.status === "annule").length;
  const leadsPreview: ClosingLead[] = toCallList.slice(0, 4).map((a) => {
    const firstItem = a.items[0];
    const productLabel = firstItem ? `${firstItem.quantity}× ${firstItem.productName}` : "—";
    const extraItemsCount = Math.max(0, a.items.length - 1);
    const amountLabel = formatMoney(orderTotalXof(a), currency);
    return {
      orderId: displayOrderNo(a),
      amountLabel,
      productLabel,
      extraItemsCount,
      status: a.status,
      mins: formatLastActivity(a.lastActivityAt),
    };
  });

  /* Live deliveries */
  const activeDeliveriesAll = assignments.filter(
    (a) => a.delivery && (a.delivery.progress === "en_attente" || a.delivery.progress === "alerte"),
  );
  const enCoursCount = activeDeliveriesAll.filter(
    (a) => a.delivery!.progress === "en_attente",
  ).length;
  const liveDeliveriesActiveCount = activeDeliveriesAll.length;
  const liveDeliveriesChipLabel = `${enCoursCount} en cours`;
  const livePool = activeDeliveriesAll
    .sort((a, b) => {
      const aAlert = a.delivery!.progress === "alerte" ? 0 : 1;
      const bAlert = b.delivery!.progress === "alerte" ? 0 : 1;
      if (aAlert !== bAlert) return aAlert - bAlert;
      const aEta = a.delivery!.scheduledAt ? new Date(a.delivery!.scheduledAt).getTime() : Number.POSITIVE_INFINITY;
      const bEta = b.delivery!.scheduledAt ? new Date(b.delivery!.scheduledAt).getTime() : Number.POSITIVE_INFINITY;
      return aEta - bEta;
    })
    .slice(0, 5)
    .map<DeliveryFeedItem>((a) => {
      const firstItem = a.items[0];
      const productLabel = firstItem ? `${firstItem.quantity}× ${firstItem.productName}` : "—";
      const extraItemsCount = Math.max(0, a.items.length - 1);
      return {
        orderId: displayOrderNo(a),
        amountLabel: formatMoney(orderTotalXof(a), currency),
        productLabel,
        extraItemsCount,
        lastActivityLabel: formatLastActivity(a.lastActivityAt),
        status: a.delivery!.progress,
      };
    });

  /* Top products rows */
  const topProducts = Array.from(salesByProductPeriod.entries())
    .map(([productId, { sales, ca }]) => {
      const product = MOCK_PRODUITS.find((p) => p.id === productId);
      if (!product) return null;
      const called = assignments.filter(
        (a) =>
          a.status !== "nouvelle" &&
          inRange(a.createdAt) &&
          a.items.some((it) => it.productId === productId),
      ).length;
      const tauxLivPct = called > 0 ? Math.round((sales / called) * 100) : 0;
      const cost = (product.costPriceXof ?? 0) * sales;
      const beneficeXof = ca - cost;
      const beneficePct = ca > 0 ? Math.round((beneficeXof / ca) * 100) : 0;
      return {
        emoji: product.emoji,
        bg: product.bg,
        name: product.name,
        sales,
        called,
        tauxLivPct,
        caXof: ca,
        beneficeXof,
        beneficePct,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.beneficeXof - a.beneficeXof)
    .slice(0, 5);

  const buckets: Bucket[] = [
    { count: aAppeler, label: "À appeler", color: "#D97706" },
    { count: confirmes, label: "Confirmés", color: "#2563EB" },
    { count: annules, label: "Annulés", color: "#9CA3AF" },
  ];

  return {
    kpis: {
      caEncaisse: caPeriod,
      margeNette,
      aEncaisser,
      aEncaisserPorters,
      aRegler,
      aReglerPartners,
      nbLivre,
      caEncaisseDeltaPct,
      margeNetteDeltaPct,
      nbLivreDeltaPct,
    },
    recentOps,
    closing: {
      totalCalled: assignments.filter((a) => a.status !== "nouvelle").length,
      buckets,
      leads: leadsPreview,
    },
    liveDeliveries: livePool,
    liveDeliveriesActiveCount,
    liveDeliveriesChipLabel,
    topProducts,
  };
}

/* ─── Alertes stock (live) ──────────────────────────────────────── */
function computeStockAlerts(
  products: ReturnType<typeof useProductsState>["products"],
): AlertRow[] {
  const alerts: AlertRow[] = [];
  for (const p of products) {
    if (!p.isActive) continue;
    const level = getStockLevel(p);
    if (level === "rupture") {
      alerts.push({ name: p.name, sub: "Stock épuisé · à réapprovisionner", level: "rupture" });
    } else if (level === "bas") {
      alerts.push({ name: p.name, sub: `Stock bas · ${p.stock} unités restantes`, level: "bas" });
    }
  }
  // Réception prévue : dérivée de la première expédition réellement en transit
  const inbound = MOCK_EXPEDITIONS.find((e) => e.status !== "arrived_destination");
  if (inbound) {
    alerts.push({
      name: inbound.productName,
      sub: `Réception prévue · ${inbound.eta}`,
      level: "info",
    });
  }
  return alerts.slice(0, 4);
}
