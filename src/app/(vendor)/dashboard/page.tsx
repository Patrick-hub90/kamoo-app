"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Clock,
  Plus,
  Sparkles,
} from "lucide-react";
import { Bento, KpiTile } from "@/components/console/primitives";
import {
  HeroCaDirect,
  deriveHeroState,
  type HeroState,
} from "@/components/console/dashboard/hero-ca-direct";
import {
  RevenueExpenseChart,
  type RevenueExpensePoint,
} from "@/components/finance/revenue-expense-chart";
import {
  CalledDeliveredChart,
  type CalledDeliveredPoint,
} from "@/components/finance/called-delivered-chart";
import { cn } from "@/lib/utils";
import {
  computeCashflowTimeline,
  type TimelinePoint,
} from "@/lib/types/finance";
import {
  RecentOperations,
  type OperationRow,
} from "@/components/console/dashboard/recent-operations";
import { ClosingLeadsCard } from "@/components/console/dashboard/closing-leads";
import {
  LiveDeliveriesFeed,
  type DeliveryFeedItem,
} from "@/components/console/dashboard/live-deliveries";
import {
  TopProducts,
  type TopProductRow,
} from "@/components/console/dashboard/top-products";
import {
  StockAlerts,
  type StockAlertItem,
} from "@/components/console/dashboard/stock-alerts";
import {
  DateRangeFilter,
  type DateFilterValue,
} from "@/components/kamoo/date-range-filter";
import {
  MOCK_FINANCE_MOVEMENTS,
  MOCK_TODAY,
} from "@/lib/data/mock-finances";
import { MOCK_CLOSING_ASSIGNMENTS } from "@/lib/data/mock-closing";
import { MOCK_PRODUITS } from "@/lib/data/mock-produits";
import { useSessionStorageState } from "@/lib/hooks/use-session-storage-state";
import { useProductsState } from "@/lib/hooks/use-products-state";
import { MOCK_VENDOR } from "@/lib/data/mock-vendor";
import { useCurrentMarket } from "@/lib/hooks/use-current-market";
import { formatXOF } from "@/lib/format";
import { orderTotalXof } from "@/lib/types/closing";
import { getStockLevel } from "@/lib/types/produit";
import {
  bucketingForDateFilter,
  chartEndDateForFilter,
  dateFilterRange,
  dateFilterSubtitle,
  normalizeDateFilter,
} from "@/lib/utils/date-filter";

/**
 * Dashboard « Vue d'ensemble » — Kamoo Console.
 *
 * Réimplémentation du design ref dans `design-ref/kamoo/project/console-dashboard.jsx`,
 * adapté avec nos données mock réelles (MOCK_CLOSING_ASSIGNMENTS,
 * MOCK_FINANCE_MOVEMENTS, MOCK_PRODUITS, MOCK_AD_CAMPAIGNS).
 *
 * Direction : « front page éditoriale » — un hero identitaire (CA en direct,
 * pour les screenshots réseaux sociaux), une grille KPI, deux bentos avec
 * efficacité du pipeline + closing/livraisons live, et un bottom avec top
 * produits + alertes stock.
 *
 * Décisions design validées avec le user :
 *  - Pas de carousel — un seul hero « CA en direct » (identité Kamoo)
 *  - Pas de sparkline dans les KPI tiles (calme visuel)
 *  - Pas de period selector global — on garde la `DateRangeFilter` actuelle
 *    pour la cohérence avec /finances
 */
export default function DashboardPage() {
  const { currentMarket } = useCurrentMarket();
  const { products: liveProducts } = useProductsState();
  const searchParams = useSearchParams();

  /* ─── Période (synchronisée avec /finances) ─── */
  const [dateFilter, setDateFilter] = useSessionStorageState<DateFilterValue>(
    "kamoo.financePeriod",
    { preset: "today" },
  );
  const normalizedFilter = useMemo(
    () => normalizeDateFilter(dateFilter),
    [dateFilter],
  );

  /* État de la tab active (CA ou Commandes) — persisté en sessionStorage
     pour que l'utilisateur retrouve sa vue au retour sur le dashboard. */
  type ChartMode = "ca" | "commandes";
  const [chartMode, setChartMode] = useSessionStorageState<ChartMode>(
    "dashboard.chartMode",
    "ca",
  );

  const bucketing = useMemo(
    () => bucketingForDateFilter(normalizedFilter),
    [normalizedFilter],
  );
  const chartEndDate = useMemo(() => {
    const base = chartEndDateForFilter(normalizedFilter, MOCK_TODAY);
    // Vue intraday (granularité « hour ») : on ancre à la fin du jour
    // sélectionné (23h) pour que les 24 buckets couvrent 00h → 23h.
    if (bucketing.granularity === "hour") {
      const d = new Date(base);
      d.setUTCHours(23, 0, 0, 0);
      return d;
    }
    return base;
  }, [normalizedFilter, bucketing.granularity]);

  /* Timeline CA + Dépenses — bucketing régulier sur la période sélectionnée.
     Source CA = ventes COD encaissées (a.delivery.amountCollected ou
     fallback orderTotalXof). Source dépenses = sorties cash vendeur
     (commission closeuse, frais transit, pubs, dépenses manuelles).
     Tous les buckets sont créés même ceux à 0 (axe X régulier). */
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
    for (const a of MOCK_CLOSING_ASSIGNMENTS) {
      if (a.delivery?.progress === "effectue" && a.delivery.deliveredAt) {
        const idx = findBucket(a.delivery.deliveredAt);
        if (idx >= 0) {
          buckets[idx].in +=
            a.delivery.amountCollected ?? orderTotalXof(a);
        }
      }
    }
    const expenseTypes = new Set([
      "commission_closeuse",
      "frais_transit",
      "depense_pub",
      "remboursement",
    ]);
    for (const m of MOCK_FINANCE_MOVEMENTS) {
      if (m.direction !== "out") continue;
      if (!expenseTypes.has(m.type)) continue;
      const idx = findBucket(m.date);
      if (idx >= 0) buckets[idx].out += m.amountXof;
    }
    for (const b of buckets) b.net = b.in - b.out;
    return buckets;
  }, [bucketing, chartEndDate]);

  /* Données pour RevenueExpenseChart (CA en barres + Dépenses en ligne) */
  const revenueExpenseData: RevenueExpensePoint[] = useMemo(
    () =>
      caTimeline.map((p) => ({
        label: p.label,
        date: p.date,
        ca: p.in,
        depenses: p.out,
      })),
    [caTimeline],
  );

  /* Données pour CalledDeliveredChart (Appelées en barres + Livrées en
     ligne). Cohorte par bucket :
       - Appelées : commandes status != "nouvelle" ET createdAt dans le bucket
       - Livrées  : commandes delivery.progress = "effectue" ET deliveredAt
                    dans le bucket
     Les 2 séries sont des comptes (allowDecimals=false côté chart). */
  const calledDeliveredData: CalledDeliveredPoint[] = useMemo(() => {
    const grid = computeCashflowTimeline(
      [],
      bucketing.granularity,
      bucketing.count,
      chartEndDate,
    );
    const buckets: CalledDeliveredPoint[] = grid.map((p) => ({
      label: p.label,
      date: p.date,
      called: 0,
      delivered: 0,
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
    for (const a of MOCK_CLOSING_ASSIGNMENTS) {
      // Appelées : on bucketise par createdAt si la commande a été
      // appelée (status != "nouvelle" = nouvelle = jamais appelée).
      if (a.status !== "nouvelle") {
        const idx = findBucket(a.createdAt);
        if (idx >= 0) buckets[idx].called += 1;
      }
      // Livrées : bucketise par deliveredAt
      if (a.delivery?.progress === "effectue" && a.delivery.deliveredAt) {
        const idx = findBucket(a.delivery.deliveredAt);
        if (idx >= 0) buckets[idx].delivered += 1;
      }
    }
    return buckets;
  }, [bucketing, chartEndDate]);




  /* ─── Compute principal — re-calculé à chaque changement de période ─── */
  const computed = useMemo(
    () => computeDashboardData({ normalizedFilter }),
    [normalizedFilter],
  );
  // Le marché actif est exposé au compute V2 — pour l'instant la donnée mock
  // est unique (Sénégal). Référencé ici pour éviter un warning ESLint sur
  // l'usage de `currentMarket` dans la page.
  void currentMarket.country.code;

  /* ─── Alertes stock — recalculées avec l'état live des produits ─── */
  const stockAlerts = useMemo(
    () => computeStockAlerts(liveProducts),
    [liveProducts],
  );

  /* ─── Hero state : dérivé du contexte (thriving / normal / quiet)
   *  avec override possible via ?demo=thriving|normal|quiet pour faire
   *  les screenshots des 3 variantes individuellement. ─── */
  const demoParam = searchParams.get("demo");
  const heroState: HeroState = useMemo(() => {
    if (
      demoParam === "thriving" ||
      demoParam === "normal" ||
      demoParam === "quiet"
    ) {
      return demoParam;
    }
    return deriveHeroState(
      computed.caMonthXof,
      computed.caPreviousMonthsXof,
    );
  }, [demoParam, computed]);

  /* Delta CA mois courant vs mois précédent — label « +18% » ou « −12% »
   *  + flag positif pour coloration verte/rouge dans le hero. */
  const { heroDelta, heroDeltaPositive } = useMemo(() => {
    if (!computed.caPrevMonthXof)
      return { heroDelta: "+0%", heroDeltaPositive: true };
    const pct = Math.round(
      ((computed.caMonthXof - computed.caPrevMonthXof) /
        computed.caPrevMonthXof) *
        100,
    );
    const positive = pct >= 0;
    const sign = positive ? "+" : "−";
    return {
      heroDelta: `${sign}${Math.abs(pct)}%`,
      heroDeltaPositive: positive,
    };
  }, [computed.caMonthXof, computed.caPrevMonthXof]);

  // greeting basé sur l'heure réelle (l'horloge réelle ici a du sens)
  const greeting = getGreeting();
  // Sous-titre de page (date + heure mock, comme dans le design ref)
  const todaySubtitle = formatTodayLabel(MOCK_TODAY);

  return (
    <div className="flex h-full flex-col">
      {/* PAGE HEADER : greeting + date (gauche) | période + CTA (droite) */}
      <div className="flex flex-col gap-3 border-b border-line bg-white px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:gap-4 lg:px-7 lg:py-5">
        <div className="min-w-0 flex-1">
          <div className="font-mono-kamoo text-[10px] font-bold uppercase tracking-[0.12em] text-ink-500">
            {todaySubtitle}
          </div>
          <h1
            className="mt-0.5 font-display text-2xl font-extrabold tracking-tight text-ink-900 lg:text-[28px]"
            style={{ letterSpacing: "-0.02em" }}
          >
            {greeting} {MOCK_VENDOR.firstName}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <DateRangeFilter value={dateFilter} onChange={setDateFilter} />
          <Link
            href="/expeditions/nouvelle"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-kamoo-blue-900 px-4 text-[13px] font-bold text-white transition hover:bg-kamoo-blue-800"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="whitespace-nowrap">Nouvelle expédition</span>
          </Link>
        </div>
      </div>

      {/* BODY scroll */}
      <div className="flex-1 overflow-y-auto bg-paper">
        <div className="flex flex-col gap-4 px-4 py-6 sm:px-6 lg:px-7">
          {/* HERO CA EN DIRECT — état contextuel (thriving/normal/quiet),
              override via ?demo=thriving|normal|quiet pour screenshots. */}
          <HeroCaDirect
            state={heroState}
            caMonthXof={
              heroState === "quiet"
                ? Math.min(computed.caMonthXof, 0)
                : computed.caMonthXof
            }
            monthObjectiveXof={computed.monthObjectiveXof}
            deltaVsLastMonth={heroDelta}
            deltaPositive={heroDeltaPositive}
            monthLabel={computed.monthLabel}
          />

          {/* 5 KPI tiles — sans sparkline (calme identitaire).
              Les deltas % comparent la période sélectionnée à la même
              fenêtre de durée glissée juste avant. */}
          <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-5">
            <KpiTile
              label="CA encaissé"
              info="Chiffre d'affaires effectué durant la période sélectionnée."
              value={formatXOF(computed.kpis.caEncaisse, false)}
              unit="F"
              delta={
                computed.kpis.caEncaisseDeltaPct !== null
                  ? `${Math.abs(computed.kpis.caEncaisseDeltaPct)}%`
                  : undefined
              }
              deltaPos={(computed.kpis.caEncaisseDeltaPct ?? 0) >= 0}
            />
            <KpiTile
              label="Marge nette"
              info="Bénéfice après tous les coûts : marchandise, transit, commission closeuse, frais livreur, publicité."
              value={formatXOF(computed.kpis.margeNette, false)}
              unit="F"
              delta={
                computed.kpis.margeNetteDeltaPct !== null
                  ? `${Math.abs(computed.kpis.margeNetteDeltaPct)}%`
                  : undefined
              }
              deltaPos={(computed.kpis.margeNetteDeltaPct ?? 0) >= 0}
            />
            <KpiTile
              label="Nbr livré"
              info="Nombre de commandes effectivement livrées et encaissées (COD) durant la période."
              value={String(computed.kpis.nbLivre)}
              unit={computed.kpis.nbLivre > 1 ? "cmds" : "cmd"}
              delta={
                computed.kpis.nbLivreDeltaPct !== null
                  ? `${Math.abs(computed.kpis.nbLivreDeltaPct)}%`
                  : undefined
              }
              deltaPos={(computed.kpis.nbLivreDeltaPct ?? 0) >= 0}
            />
            <KpiTile
              label="À encaisser"
              info="Argent collecté par tes livreurs lors des livraisons, pas encore versé sur tes wallets. Indépendant de la période."
              value={`+${formatXOF(computed.kpis.aEncaisser, false)}`}
              unit="F"
              valueTone="emerald"
            />
            <KpiTile
              label="À régler"
              info="Argent dû à tes partenaires (closeuse, transitaire), pas encore payé. Indépendant de la période."
              value={`−${formatXOF(computed.kpis.aRegler, false)}`}
              unit="F"
              valueTone="red"
            />
          </div>

          {/* MAIN BENTO — vraie grille 2x2 : chaque RANGÉE s'aligne
              automatiquement (les 2 cards d'une rangée prennent la
              hauteur de la plus grande). `[&>*]:h-full` force toutes
              les cards à remplir leur cellule pour un alignement
              vertical pixel-perfect. */}
          <div className="grid items-stretch gap-4 lg:grid-cols-[1.4fr_1fr] [&>*]:h-full">
            {/* RANGÉE 1 : Chart (col gauche) + ClosingLeadsCard (col droite) */}
            {(() => {
              const tabs = (
                <div className="inline-flex items-stretch gap-1 rounded-lg bg-paper-2 p-1">
                  <ChartTab
                    active={chartMode === "ca"}
                    onClick={() => setChartMode("ca")}
                    label="CA"
                  />
                  <ChartTab
                    active={chartMode === "commandes"}
                    onClick={() => setChartMode("commandes")}
                    label="Commandes"
                  />
                </div>
              );
              return chartMode === "ca" ? (
                <RevenueExpenseChart
                  data={revenueExpenseData}
                  periodLabel={dateFilterSubtitle(normalizedFilter)}
                  height={280}
                  headerRight={tabs}
                />
              ) : (
                <CalledDeliveredChart
                  data={calledDeliveredData}
                  periodLabel={dateFilterSubtitle(normalizedFilter)}
                  height={280}
                  headerRight={tabs}
                />
              );
            })()}

            <ClosingLeadsCard
              totalCalled={computed.closing.totalCalled}
              buckets={computed.closing.buckets}
              leads={computed.closing.leads}
            />

            {/* RANGÉE 2 : Dernières ops (col gauche) + LiveDeliveries (col droite) */}
            <Bento padding={24}>
              <RecentOperations operations={computed.recentOps} />
            </Bento>

            <LiveDeliveriesFeed
              deliveries={computed.liveDeliveries}
              totalActiveCount={computed.liveDeliveriesActiveCount}
              activeChipLabel={computed.liveDeliveriesChipLabel}
            />
          </div>

          {/* BOTTOM ROW : Top produits + Alertes stock — même règle
              d'alignement que la main bento (h-full sur les enfants pour
              que les 2 cards aient strictement la même hauteur). */}
          <div className="grid items-stretch gap-4 lg:grid-cols-[1.4fr_1fr] [&>*]:h-full">
            <Bento padding={24}>
              <TopProducts products={computed.topProducts} />
            </Bento>
            <Bento padding={24}>
              <StockAlerts alerts={stockAlerts} />
            </Bento>
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

/**
 * Formate l'heure de dernière activité pour un feed live, en mode RELATIF
 * court (style identique à la colonne « délai » des leads closing) :
 *
 *  - < 1 min  → « à l'instant »
 *  - < 1 h    → « 12 min »
 *  - < 24 h   → « 3 h »
 *  - < 7 j    → « 2 j »
 *  - sinon    → date courte « 02/05 »
 *
 * On compare contre MOCK_TODAY (horloge mock du V1) — pas `new Date()`
 * pour rester déterministe avec les mocks.
 */
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
  // ex: « LUNDI 4 MAI · 11:42 »
  const day = d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const time = d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${day} · ${time}`;
}


/* ─── Compute dashboard data from existing mocks ────────────────── */

type DashboardData = {
  /* ─── Hero (toujours mois en cours, indépendant du filtre) ─── */
  caMonthXof: number;
  /** CA du mois précédent — sert au label « +X% vs mois dernier » */
  caPrevMonthXof: number;
  /** CA de chaque mois précédent (tableau, ordre arbitraire) — sert à
   *  déterminer si le mois courant est le RECORD (meilleur mois vrai). */
  caPreviousMonthsXof: number[];
  monthObjectiveXof: number;
  monthLabel: string;
  starProduct: { name: string; sales: number; caXof: number };

  /* ─── KPIs (suivent le filtre période) ─── */
  kpis: {
    caEncaisse: number;
    margeNette: number;
    /** Argent encaissé par les livreurs sur la période, pas encore versé au vendeur */
    aEncaisser: number;
    /** Nb de livreurs qui détiennent ce cash */
    aEncaisserPorters: number;
    /** Argent dû aux partenaires (closeuse + transit) sur la période, pas encore payé */
    aRegler: number;
    /** Nb de partenaires distincts à qui le vendeur doit de l'argent */
    aReglerPartners: number;
    nbLivre: number;
    /** Deltas vs période précédente (même longueur) — null si pas calculable */
    caEncaisseDeltaPct: number | null;
    margeNetteDeltaPct: number | null;
    nbLivreDeltaPct: number | null;
  };

  /* ─── Listes (recentOps / closing / live deliveries = état live) ─── */
  recentOps: OperationRow[];
  closing: {
    /** Total commandes APPELÉES par la closeuse (tous statuts sauf
     *  `nouvelle`). Mesure le volume de travail traité. */
    totalCalled: number;
    /** Buckets À appeler / Confirmés / Annulés (live) */
    buckets: { count: number; label: string; color: string }[];
    /** Liste des 3 prochains leads à appeler (LIVE, état courant) */
    leads: import("@/components/console/dashboard/closing-leads").ClosingLead[];
  };
  liveDeliveries: DeliveryFeedItem[];
  /** Nombre TOTAL de livraisons actives (en_attente + alerte) dans le
   *  système. Sert au chip header de LiveDeliveriesFeed — peut être
   *  > liveDeliveries.length puisque le feed est tronqué à 5. */
  liveDeliveriesActiveCount: number;
  /** Label précomputé du chip header (sépare en_cours et alertes) :
   *  « 4 en cours » ou « 4 en cours · 1 alerte ». */
  liveDeliveriesChipLabel: string;

  /* ─── Top produits (suit le filtre période) ─── */
  topProducts: TopProductRow[];
};

/**
 * Compute principal : prend le filtre période en entrée et calcule tout
 * dynamiquement. Le hero reste mois-en-cours (indépendant du filtre car
 * c'est son identité : carte du mois), mais les 5 KPI et top produits
 * suivent le filtre.
 */
function computeDashboardData(args: {
  normalizedFilter: DateFilterValue;
}): DashboardData {
  const { normalizedFilter } = args;

  /* Borne période du filtre.
     null = preset "all" → on prend tout (pas de filtre). */
  const range = dateFilterRange(normalizedFilter, MOCK_TODAY);
  const inRange = (iso: string | undefined): boolean => {
    if (!iso) return false;
    if (!range) return true; // preset "all"
    const t = new Date(iso).getTime();
    return t >= range.fromMs && t < range.toMs;
  };

  /* ─── HERO : mois en cours (indépendant du filtre) ─── */
  const monthStart = new Date(MOCK_TODAY);
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const monthStartMs = monthStart.getTime();
  const caMonth = MOCK_FINANCE_MOVEMENTS.filter(
    (m) =>
      m.type === "vente_encaissee" &&
      new Date(m.date).getTime() >= monthStartMs,
  ).reduce((s, m) => s + m.amountXof, 0);

  /* CA mois précédent — pour calculer le delta « +X% vs mois dernier » */
  const prevMonthStart = new Date(monthStart);
  prevMonthStart.setUTCMonth(prevMonthStart.getUTCMonth() - 1);
  const prevMonthStartMs = prevMonthStart.getTime();
  const caPrevMonth = MOCK_FINANCE_MOVEMENTS.filter((m) => {
    const t = new Date(m.date).getTime();
    return (
      m.type === "vente_encaissee" &&
      t >= prevMonthStartMs &&
      t < monthStartMs
    );
  }).reduce((s, m) => s + m.amountXof, 0);

  /* CA agrégé par mois historique — pour comparer le mois courant à
     TOUS les mois précédents (record absolu = vrai « meilleur mois »). */
  const monthlyAggregate = new Map<string, number>();
  for (const m of MOCK_FINANCE_MOVEMENTS) {
    if (m.type !== "vente_encaissee") continue;
    const d = new Date(m.date);
    const monthKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    monthlyAggregate.set(
      monthKey,
      (monthlyAggregate.get(monthKey) ?? 0) + m.amountXof,
    );
  }
  const currentMonthKey = `${MOCK_TODAY.getUTCFullYear()}-${String(MOCK_TODAY.getUTCMonth() + 1).padStart(2, "0")}`;
  const caPreviousMonths = Array.from(monthlyAggregate.entries())
    .filter(([key]) => key !== currentMonthKey)
    .map(([, ca]) => ca);

  /* ─── KPIs : tout filtré par la période sélectionnée ─── */
  // CA encaissé sur la période (vente_encaissee dans la fenêtre)
  const caPeriod = MOCK_FINANCE_MOVEMENTS.filter(
    (m) => m.type === "vente_encaissee" && inRange(m.date),
  ).reduce((s, m) => s + m.amountXof, 0);

  // Coûts ventilés sur la période
  const movementsPeriod = MOCK_FINANCE_MOVEMENTS.filter((m) => inRange(m.date));
  const sumByType = (type: string) =>
    movementsPeriod
      .filter((m) => m.type === type)
      .reduce((s, m) => s + m.amountXof, 0);

  const coutMarch = sumByType("cout_marchandise");
  const commCloseuse = sumByType("commission_closeuse");
  const fraisLivreur = sumByType("frais_livreur");
  const fraisTransit = sumByType("frais_transit");
  const coutPub = sumByType("depense_pub");

  const margeBrute = caPeriod - coutMarch - commCloseuse - fraisLivreur - fraisTransit;
  const margeNette = margeBrute - coutPub;

  /* À encaisser & À régler : FIXES, indépendants du filtre période.
     Ces 2 KPI représentent l'état COURANT des créances/dettes du vendeur
     — pas une agrégation historique. Peu importe quand la vente a été
     faite ou la dette contractée : ce qui compte c'est ce qu'il faut
     encaisser/régler MAINTENANT.
     V2 : ces stocks seront recalculés à chaque mouvement côté serveur. */

  // À encaisser : tout vente_encaissee dont le status est encore
  // "a_recevoir" — le cash est chez le livreur, pas encore versé au vendeur.
  // Snapshot global, peu importe quand la vente a été faite.
  const aRecevoirMvts = MOCK_FINANCE_MOVEMENTS.filter(
    (m) => m.type === "vente_encaissee" && m.status === "a_recevoir",
  );
  const aEncaisser = aRecevoirMvts.reduce((s, m) => s + m.amountXof, 0);
  const aEncaisserPorters = new Set(
    aRecevoirMvts
      .map((m) => m.partner?.ref ?? m.partner?.name)
      .filter((x): x is string => !!x),
  ).size;

  // À régler : toutes les sorties dues à des partenaires dont le status est
  // encore "a_payer". On exclut `frais_livreur` (auto-déduit du cash COD,
  // pas un virement explicite du vendeur).
  const aPayerMvts = MOCK_FINANCE_MOVEMENTS.filter(
    (m) =>
      m.direction === "out" &&
      m.status === "a_payer" &&
      m.type !== "frais_livreur",
  );
  const aRegler = aPayerMvts.reduce((s, m) => s + m.amountXof, 0);
  const aReglerPartners = new Set(
    aPayerMvts
      .map((m) => m.partner?.ref ?? m.partner?.name)
      .filter((x): x is string => !!x),
  ).size;

  // Nb livraisons sur la période (deliveries effectuées dans la fenêtre)
  const nbLivre = MOCK_CLOSING_ASSIGNMENTS.filter(
    (a) =>
      a.delivery?.progress === "effectue" &&
      inRange(a.delivery.deliveredAt),
  ).length;

  /* ─── Période précédente (même longueur, fenêtre glissée vers le passé)
         → sert à calculer les deltas % « vs période précédente ». ─── */
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
    nbLivrePrev = MOCK_CLOSING_ASSIGNMENTS.filter(
      (a) =>
        a.delivery?.progress === "effectue" &&
        inPrev(a.delivery.deliveredAt),
    ).length;
  }

  /** Calcule un delta % entre 2 valeurs. Renvoie null si non calculable
   *  (période "all" → pas de prev, ou prev = 0). */
  const computePct = (cur: number, prev: number): number | null => {
    if (!range) return null; // preset "all"
    if (prev === 0) return null;
    return Math.round(((cur - prev) / Math.abs(prev)) * 100);
  };
  const caEncaisseDeltaPct = computePct(caPeriod, caEncaissePrev);
  const margeNetteDeltaPct = computePct(margeNette, margeNettePrev);
  const nbLivreDeltaPct = computePct(nbLivre, nbLivrePrev);

  /* ─── Star product : produit le plus vendu DU MOIS (pour le hero,
         qui est mois-locked). Compte les ventes confirmées par livraison. */
  const salesByProductMonth = new Map<string, { sales: number; ca: number }>();
  for (const a of MOCK_CLOSING_ASSIGNMENTS) {
    if (a.delivery?.progress !== "effectue") continue;
    if (!a.delivery.deliveredAt) continue;
    if (new Date(a.delivery.deliveredAt).getTime() < monthStartMs) continue;
    for (const item of a.items) {
      if (!item.productId) continue;
      const cur = salesByProductMonth.get(item.productId) ?? {
        sales: 0,
        ca: 0,
      };
      cur.sales += item.quantity;
      cur.ca += item.quantity * item.unitPriceXof;
      salesByProductMonth.set(item.productId, cur);
    }
  }
  const starEntry = Array.from(salesByProductMonth.entries()).sort(
    (a, b) => b[1].ca - a[1].ca,
  )[0];
  const starProductMeta = starEntry
    ? MOCK_PRODUITS.find((p) => p.id === starEntry[0])
    : undefined;
  const starProduct = {
    name: starProductMeta?.name ?? "—",
    sales: starEntry?.[1].sales ?? 0,
    caXof: starEntry?.[1].ca ?? 0,
  };

  /* ─── Top products : produit le plus vendu SUR LA PÉRIODE filtrée
         (pour la liste bottom-left du dashboard, qui suit le filtre). */
  const salesByProductPeriod = new Map<string, { sales: number; ca: number }>();
  for (const a of MOCK_CLOSING_ASSIGNMENTS) {
    if (a.delivery?.progress !== "effectue") continue;
    if (!inRange(a.delivery.deliveredAt)) continue;
    for (const item of a.items) {
      if (!item.productId) continue;
      const cur = salesByProductPeriod.get(item.productId) ?? {
        sales: 0,
        ca: 0,
      };
      cur.sales += item.quantity;
      cur.ca += item.quantity * item.unitPriceXof;
      salesByProductPeriod.set(item.productId, cur);
    }
  }

  /* Recent ops feed — feed live des opérations cash réellement effectuées :
       IN  : versements du livreur effectivement encaissés (vente_encaissee
             status="encaisse" — le cash est dans le wallet vendeur)
       OUT : règlements de dépenses payés (status="paye") sur les catégories
             communiquées au vendeur (closeuse, transitaire, pubs, dépenses
             manuelles). On exclut cout_marchandise (cycle achat séparé) et
             frais_livreur (auto-déduit, pas une op vendeur).
     4 plus récents (live, indépendant du filtre période). */
  const ALLOWED_OP_TYPES = new Set([
    "vente_encaissee",
    "commission_closeuse",
    "frais_transit",
    "depense_pub",
    "remboursement",
  ]);
  /* Préfixe explicite par type pour distinguer la nature de l'op dans le
     feed compact ("Versement livreur · Mamadou Sy" lit mieux que juste
     "Mamadou Sy" qu'on prendrait pour un client). */
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
    .filter((m) => {
      // IN : effectivement reçu (status encaisse). OUT : effectivement payé.
      if (m.direction === "in") return m.status === "encaisse";
      return m.status === "paye";
    })
    .sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )
    .slice(0, 4)
    .map((m) => {
      const prefix = opTypePrefix[m.type] ?? "—";
      const partnerSuffix = m.partner?.name
        ? ` · ${m.partner.name}`
        : m.type === "depense_pub"
          ? " · Meta Ads"
          : "";
      return {
        time: new Date(m.date).toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        kind: m.direction === "in" ? "in" : "out",
        who: `${prefix}${partnerSuffix}`,
        what: m.description,
        amountXof: m.amountXof,
      };
    });

  /* Closing card data — funnel à 3 étapes : à appeler / confirmé / annulé.
     - À appeler = nouvelle + rappele + injoignable (tout ce qui demande
       un coup de fil de la closeuse pour avancer)
     - Confirmés = livraison_en_cours + livre (commande validée par la
       closeuse, soit en route soit déjà payée)
     - Annulés = annule (commande perdue)

     Le card est titré « Closing EN DIRECT » : tout est LIVE, non filtré
     par la période. Sinon on a une incohérence absurde (« 0 commandes
     obtenues » en haut quand le filtre est sur aujourd'hui, mais 3 leads
     à appeler dans la liste — qui viennent d'avant). */
  const toCallStatuses = ["nouvelle", "rappele", "injoignable"];
  const toCallList = MOCK_CLOSING_ASSIGNMENTS.filter((a) =>
    toCallStatuses.includes(a.status),
  );
  const aAppeler = toCallList.length;
  const confirmes = MOCK_CLOSING_ASSIGNMENTS.filter(
    (a) => a.status === "livraison_en_cours" || a.status === "livre",
  ).length;
  const annules = MOCK_CLOSING_ASSIGNMENTS.filter(
    (a) => a.status === "annule",
  ).length;
  const leadsPreview: import("@/components/console/dashboard/closing-leads").ClosingLead[] = toCallList
    .slice(0, 3)
    .map((a) => {
      // Article principal = 1er item ; le reste est résumé en « +N » discret
      // pour ne pas pourrir la lisibilité avec un join trop long.
      const firstItem = a.items[0];
      const productLabel = firstItem
        ? `${firstItem.quantity}× ${firstItem.productName}`
        : "—";
      const extraItemsCount = Math.max(0, a.items.length - 1);
      const amountLabel = `${formatXOF(orderTotalXof(a), false)} F`;
      return {
        orderId: a.id,
        amountLabel,
        productLabel,
        extraItemsCount,
        status: a.status,
        mins: formatLastActivity(a.lastActivityAt),
      };
    });

  /* Live deliveries — feed des livraisons ACTIVES uniquement.
     Logique d'affichage (le card s'appelle « Livraisons en direct ») :
       1. Filtre : on garde en_attente + alerte (les livrées partent en
          historique sur /livraisons, elles n'ont rien à faire dans un
          feed live)
       2. Tri : alertes en premier (action immédiate vendor / closeuse),
          puis en_attente triées par ETA croissant (la plus proche en
          premier)
       3. Limit : top 5 dans le feed visible — mais le compteur du chip
          header (« N actives ») reste le TOTAL réel, pas le tronqué.
     Statut = `a.delivery.progress` brut, partagé avec /livraisons.
     Format identique à closing-leads : orderId + montant vert + produit
     principal + badge +N pour multi-articles. */
  const activeDeliveriesAll = MOCK_CLOSING_ASSIGNMENTS.filter(
    (a) =>
      a.delivery &&
      (a.delivery.progress === "en_attente" ||
        a.delivery.progress === "alerte"),
  );
  /* Chip header = uniquement le nombre de livraisons en cours (en_attente).
     Les alertes ne sont pas comptées ici — elles apparaissent déjà avec
     leur pill rouge dans les lignes du feed, pas besoin de bruiter le chip. */
  const enCoursCount = activeDeliveriesAll.filter(
    (a) => a.delivery!.progress === "en_attente",
  ).length;
  const liveDeliveriesActiveCount = activeDeliveriesAll.length;
  const liveDeliveriesChipLabel = `${enCoursCount} en cours`;
  const livePool = activeDeliveriesAll
    .sort((a, b) => {
      // Alertes toujours d'abord (urgence vendor)
      const aAlert = a.delivery!.progress === "alerte" ? 0 : 1;
      const bAlert = b.delivery!.progress === "alerte" ? 0 : 1;
      if (aAlert !== bAlert) return aAlert - bAlert;
      // À statut égal : par ETA croissant (la plus proche en premier).
      // Pas d'ETA → on relègue en fin de liste.
      const aEta = a.delivery!.scheduledAt
        ? new Date(a.delivery!.scheduledAt).getTime()
        : Number.POSITIVE_INFINITY;
      const bEta = b.delivery!.scheduledAt
        ? new Date(b.delivery!.scheduledAt).getTime()
        : Number.POSITIVE_INFINITY;
      return aEta - bEta;
    })
    .slice(0, 5)
    .map<DeliveryFeedItem>((a) => {
      const firstItem = a.items[0];
      const productLabel = firstItem
        ? `${firstItem.quantity}× ${firstItem.productName}`
        : "—";
      const extraItemsCount = Math.max(0, a.items.length - 1);
      const progress = a.delivery!.progress;
      return {
        orderId: a.id,
        amountLabel: `${formatXOF(orderTotalXof(a), false)} F`,
        productLabel,
        extraItemsCount,
        lastActivityLabel: formatLastActivity(a.lastActivityAt),
        status: progress,
      };
    });

  /* Top products — pour chaque produit vendu dans la période :
       - sales = nb d'orders livrées contenant ce produit (= ventes)
       - called = nb d'orders contenant ce produit dont status != nouvelle
         (cohorte appelée sur la même fenêtre)
       - tauxLivPct = sales / called × 100
       - beneficeXof = CA - coût marchandise (cost * sales)
       - beneficePct = bénéfice / CA × 100  */
  const topProducts: TopProductRow[] = Array.from(
    salesByProductPeriod.entries(),
  )
    .map(([productId, { sales, ca }]) => {
      const product = MOCK_PRODUITS.find((p) => p.id === productId);
      if (!product) return null;
      // Cohorte des commandes APPELÉES contenant ce produit sur la période
      const called = MOCK_CLOSING_ASSIGNMENTS.filter(
        (a) =>
          a.status !== "nouvelle" &&
          inRange(a.createdAt) &&
          a.items.some((it) => it.productId === productId),
      ).length;
      const tauxLivPct =
        called > 0 ? Math.round((sales / called) * 100) : 0;
      const cost = (product.costPriceXof ?? 0) * sales;
      const beneficeXof = ca - cost;
      const beneficePct = ca > 0 ? Math.round((beneficeXof / ca) * 100) : 0;
      const row: TopProductRow = {
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
      return row;
    })
    .filter((x): x is TopProductRow => x !== null)
    /* Sort par BÉNÉFICE descendant — c'est la métrique la plus utile
       pour "top produits" : un gros CA avec faible marge peut être
       trompeur (cf. brief design user). */
    .sort((a, b) => b.beneficeXof - a.beneficeXof)
    .slice(0, 4);

  const monthLabel = MOCK_TODAY.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  // Objectif mensuel : V1 hardcodé à 4.5M ; en V2 ce sera un paramètre vendor
  const monthObjectiveXof = 4_500_000;

  return {
    /* Hero (mois en cours, fixe) */
    caMonthXof: caMonth,
    caPrevMonthXof: caPrevMonth,
    caPreviousMonthsXof: caPreviousMonths,
    monthObjectiveXof,
    monthLabel,
    starProduct,
    /* KPIs (suivent la période filtrée) */
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
    /* Listes live (indépendantes du filtre) */
    recentOps,
    closing: {
      // Commandes APPELÉES = toutes sauf celles encore en statut `nouvelle`
      // (qui n'ont jamais reçu de coup de fil de la closeuse).
      totalCalled: MOCK_CLOSING_ASSIGNMENTS.filter(
        (a) => a.status !== "nouvelle",
      ).length,
      buckets: [
        { count: aAppeler, label: "À appeler", color: "#F97316" },
        { count: confirmes, label: "Confirmés", color: "#2563EB" },
        { count: annules, label: "Annulés", color: "#6B7280" },
      ],
      leads: leadsPreview,
    },
    liveDeliveries: livePool,
    liveDeliveriesActiveCount,
    liveDeliveriesChipLabel,
    topProducts,
  };
}

/* ─── ChartTab : tab compacte CA/Commandes du bento principal ─────── */

/**
 * Tab minimaliste : juste un label, pill compact, état actif = bg-white +
 * shadow subtile. Pas de valeur ni d'icône — la valeur est déjà visible
 * dans le chart correspondant via son header + son axe Y.
 */
function ChartTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-1.5 text-[12.5px] font-semibold transition-all duration-150 ease-out",
        active
          ? "bg-white text-ink-900 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
          : "text-ink-500 hover:text-ink-700",
      )}
    >
      {label}
    </button>
  );
}

/* ─── Stock alerts ─────────────────────────────────────────────── */

function computeStockAlerts(
  products: ReturnType<typeof useProductsState>["products"],
): StockAlertItem[] {
  const alerts: StockAlertItem[] = [];
  for (const p of products) {
    if (!p.isActive) continue;
    const level = getStockLevel(p);
    if (level === "rupture") {
      alerts.push({
        icon: AlertTriangle,
        title: p.name,
        sub: "Stock épuisé · à réapprovisionner",
        tone: "#DC2626",
        href: `/boutique/${p.id}`,
      });
    } else if (level === "bas") {
      alerts.push({
        icon: Clock,
        title: p.name,
        sub: `Stock bas · ${p.stock} unités restantes`,
        tone: "#D97706",
        href: `/boutique/${p.id}`,
      });
    }
  }
  // Add ETA reception info if any (next 1-2 expeditions arriving)
  alerts.push({
    icon: Sparkles,
    title: "Power Banks",
    sub: "ETA réception · J+4 (22 oct.)",
    tone: "#2563EB",
    href: "/expeditions",
  });
  return alerts.slice(0, 3);
}

