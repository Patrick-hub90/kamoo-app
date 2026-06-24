"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { PageHeader } from "@/components/kamoo/page-header";
import { ConsolePageSkeleton } from "@/components/kamoo/loading";
import {
  KpiRow,
  CaChart,
  ProductPerformance,
  FunnelCard,
  type Bucket,
  type ProductPerfRow,
  type FunnelData,
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
import { useClosingState } from "@/lib/hooks/use-closing-state";
import { useProductsState } from "@/lib/hooks/use-products-state";
import type { Produit } from "@/lib/types/produit";
import { MOCK_VENDOR } from "@/lib/data/mock-vendor";
import { useCurrentMarket } from "@/lib/hooks/use-current-market";
import { useShopify } from "@/lib/hooks/use-shopify";
import { formatMoney } from "@/lib/format";
import { displayOrderNo, orderTotalXof, type ClosingAssignment } from "@/lib/types/closing";
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
  return (
    <Suspense fallback={<ConsolePageSkeleton />}>
      <DashboardPageInner />
    </Suspense>
  );
}

function DashboardPageInner() {
  const { currentMarket } = useCurrentMarket();
  const { currencyFor } = useShopify();
  const currency = currencyFor(currentMarket.id);
  /* Commandes LIVE : la machine d'etats closing (synchronisee app closeuse) */
  const liveOrders = useClosingState().all;
  /* Catalogue LIVE : pour le coût d'achat (COGS) → marge réelle. Le catalogue
   * se remplit des produits importés + des brouillons auto-créés depuis les
   * commandes ; lire MOCK_PRODUITS (vide) donnait une marge = CA. */
  const catalog = useProductsState().products;
  const productsById = useMemo(
    () => new Map<string, Produit>(catalog.map((p) => [p.id, p])),
    [catalog],
  );
  /* « Aujourd'hui » RÉEL : les commandes Shopify ont de vraies dates, la
   * période doit s'ancrer dessus (pas sur une date mock figée). On réancre au
   * retour d'onglet + toutes les heures pour qu'un dashboard laissé ouvert ne
   * fige pas la fenêtre « 30 derniers jours » sur l'heure d'ouverture. */
  const [today, setToday] = useState<Date>(() => new Date());
  useEffect(() => {
    const tick = () => setToday(new Date());
    const onVis = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVis);
    const id = setInterval(tick, 60 * 60 * 1000);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      clearInterval(id);
    };
  }, []);
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

  /* ─── Période — toujours « 30 derniers jours » à l'ouverture, jamais
   * « aujourd'hui ». Pas de persistance : le dashboard est une page d'accueil,
   * il doit s'ouvrir sur une période de référence stable plutôt que d'hériter
   * d'un choix transitoire collé en sessionStorage. ─── */
  const [dateFilter, setDateFilter] = useState<DateFilterValue>({ preset: "30j" });
  const normalizedFilter = useMemo(
    () => normalizeDateFilter(dateFilter),
    [dateFilter],
  );

  const bucketing = useMemo(
    () => bucketingForDateFilter(normalizedFilter),
    [normalizedFilter],
  );
  const chartEndDate = useMemo(() => {
    const base = chartEndDateForFilter(normalizedFilter, today);
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
    // Encaissements = commandes RÉELLEMENT livrées (cash COD), par date de livraison.
    for (const a of liveOrders) {
      if (a.status !== "livre") continue;
      const idx = findBucket(a.delivery?.deliveredAt ?? a.createdAt);
      if (idx >= 0) buckets[idx].in += orderTotalXof(a);
    }
    return buckets;
  }, [bucketing, chartEndDate, liveOrders]);

  /* ─── Compute principal ─── */
  const computed = useMemo(
    () => computeDashboardData({ normalizedFilter, assignments: liveOrders, currency, now: today, productsById }),
    [normalizedFilter, liveOrders, currency, today, productsById],
  );
  void currentMarket.country.code;

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

  /* Produits les plus rentables (CA, bénéfice, marge, taux de livraison) */
  const productPerfRows: ProductPerfRow[] = computed.topProducts.map((p) => ({
    emoji: p.emoji,
    bg: p.bg,
    name: p.name,
    ventes: p.sales,
    ca: p.caXof,
    benefice: p.beneficeXof,
    margePct: p.beneficePct,
    tauxLiv: p.tauxLivPct,
  }));

  /* Entonnoir COD de la période (reçues → appelés → confirmés → livrés) */
  const funnel: FunnelData = computed.funnel;

  const greeting = getGreeting();
  const todaySubtitle = formatTodayLabel(today);

  return (
    <div className="min-h-full bg-paper">
      {/* Header commun (PageHeader) : période + cloche, même ordre partout. */}
      <PageHeader kicker={todaySubtitle} title={`${greeting} ${MOCK_VENDOR.firstName}`} />

      <div className="mx-auto flex max-w-[1320px] flex-col gap-4 px-6 py-6">
        {/* Période — déplacée hors du header, au-dessus du contenu. */}
        <div className="flex items-center justify-end">
          <DateRangeFilter value={dateFilter} onChange={setDateFilter} />
        </div>
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

        {/* Bande KPI — 3 performance + 2 trésorerie (à encaisser / à payer) */}
        <KpiRow k={kpiData} />

        {/* Graphe héros — pleine largeur (évolution du CA encaissé) */}
        <CaChart
          series={chartSeries}
          labels={chartLabels}
          total={computed.kpis.caEncaisse}
          title="CA encaissé"
          periodLabel={dateFilterSubtitle(normalizedFilter)}
        />

        {/* Produits les plus rentables + entonnoir COD de la période */}
        <div className="grid grid-cols-[1.7fr_1fr] gap-4">
          <ProductPerformance rows={productPerfRows} />
          <FunnelCard data={funnel} />
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
  const now = Date.now();
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
  funnel: FunnelData;
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
    /** null quand le coût d'achat du produit est inconnu (marge non calculée). */
    beneficeXof: number | null;
    beneficePct: number | null;
  }[];
};

function computeDashboardData(args: {
  normalizedFilter: DateFilterValue;
  /** Commandes LIVE (machine d etats closing) — pas les fixtures brutes */
  assignments: ClosingAssignment[];
  /** Devise d affichage du marche */
  currency: string;
  /** Date réelle (ancre de période). */
  now: Date;
  /** Catalogue live indexé par id — pour le coût d'achat (COGS). */
  productsById: Map<string, Produit>;
}): DashboardData {
  const { normalizedFilter, assignments, currency, now, productsById } = args;

  const range = dateFilterRange(normalizedFilter, now);
  const inRange = (iso: string | undefined): boolean => {
    if (!iso) return false;
    if (!range) return true;
    const t = new Date(iso).getTime();
    return t >= range.fromMs && t < range.toMs;
  };

  /* CA encaissé + marge = commandes RÉELLEMENT livrées dans la période (cash
     COD). La marge n'additionne QUE les lignes au coût d'achat CONNU : un
     produit non chiffré (brouillon auto à compléter) n'est pas compté à 100 %
     de marge, ce qui gonflerait artificiellement la marge nette. */
  const marginOf = (a: ClosingAssignment): number =>
    a.items.reduce((s, it) => {
      const cost = productsById.get(it.productId ?? "")?.costPriceXof;
      return cost == null ? s : s + (it.unitPriceXof - cost) * it.quantity;
    }, 0);
  const livreDate = (a: ClosingAssignment): string => a.delivery?.deliveredAt ?? a.createdAt;
  const livreInPeriod = assignments.filter(
    (a) => a.status === "livre" && inRange(livreDate(a)),
  );
  const caPeriod = livreInPeriod.reduce((s, a) => s + orderTotalXof(a), 0);
  const nbLivre = livreInPeriod.length;
  const margeNette = livreInPeriod.reduce((s, a) => s + marginOf(a), 0);

  /* À encaisser / à régler (versements partenaires) — restent issus du module
     finance (démo) tant que le règlement partenaires réel n'est pas branché. */
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

  /* Période précédente → deltas (sur les vraies commandes livrées) */
  let caEncaissePrev = 0;
  let margeNettePrev = 0;
  let nbLivrePrev = 0;
  if (range) {
    const periodLength = range.toMs - range.fromMs;
    const prevFromMs = range.fromMs - periodLength;
    const prevToMs = range.fromMs;
    const livrePrev = assignments.filter((a) => {
      if (a.status !== "livre") return false;
      const t = new Date(livreDate(a)).getTime();
      return t >= prevFromMs && t < prevToMs;
    });
    caEncaissePrev = livrePrev.reduce((s, a) => s + orderTotalXof(a), 0);
    margeNettePrev = livrePrev.reduce((s, a) => s + marginOf(a), 0);
    nbLivrePrev = livrePrev.length;
  }

  const computePct = (cur: number, prev: number): number | null => {
    if (!range) return null;
    if (prev === 0) return null;
    return Math.round(((cur - prev) / Math.abs(prev)) * 100);
  };
  const caEncaisseDeltaPct = computePct(caPeriod, caEncaissePrev);
  const margeNetteDeltaPct = computePct(margeNette, margeNettePrev);
  const nbLivreDeltaPct = computePct(nbLivre, nbLivrePrev);

  /* Top produits (période) — sur les commandes RÉELLEMENT livrées. On mémorise
     aussi le visuel de la ligne pour rester lisible même si le produit n'est
     pas (encore) au catalogue. */
  const salesByProductPeriod = new Map<
    string,
    { sales: number; ca: number; name: string; emoji: string; bg: string }
  >();
  for (const a of livreInPeriod) {
    for (const item of a.items) {
      if (!item.productId) continue;
      const cur = salesByProductPeriod.get(item.productId) ?? {
        sales: 0,
        ca: 0,
        name: item.productName,
        emoji: item.productEmoji,
        bg: item.productBg,
      };
      cur.sales += item.quantity;
      cur.ca += item.quantity * item.unitPriceXof;
      salesByProductPeriod.set(item.productId, cur);
    }
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
  const calledCount = assignments.filter((a) => a.status !== "nouvelle").length;

  /* Entonnoir COD — sur les commandes REÇUES pendant la période (createdAt) */
  const periodOrders = assignments.filter((a) => inRange(a.createdAt));
  const funnel: FunnelData = {
    recues: periodOrders.length,
    appeles: periodOrders.filter((a) => a.status !== "nouvelle").length,
    confirmes: periodOrders.filter(
      (a) => a.status === "livraison_en_cours" || a.status === "livre",
    ).length,
    livres: periodOrders.filter(
      (a) => a.status === "livre" || a.delivery?.progress === "effectue",
    ).length,
  };

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
    .map(([productId, v]) => {
      const product = productsById.get(productId);
      const hasProduct = (a: ClosingAssignment) =>
        a.items.some((it) => it.productId === productId);
      // Taux de livraison homogène : commandes LIVRÉES / commandes APPELÉES du
      // produit, même base (createdAt) → toujours ≤ 100 %.
      const called = assignments.filter(
        (a) => a.status !== "nouvelle" && inRange(a.createdAt) && hasProduct(a),
      ).length;
      const deliveredOrders = assignments.filter(
        (a) => a.status === "livre" && inRange(a.createdAt) && hasProduct(a),
      ).length;
      const tauxLivPct = called > 0 ? Math.round((deliveredOrders / called) * 100) : 0;
      // Bénéfice null si le coût d'achat est inconnu (produit à compléter) :
      // afficher « — » plutôt qu'une fausse marge de 100 %.
      const costKnown = product?.costPriceXof != null;
      const beneficeXof = costKnown ? v.ca - product!.costPriceXof! * v.sales : null;
      const beneficePct =
        beneficeXof != null && v.ca > 0 ? Math.round((beneficeXof / v.ca) * 100) : null;
      return {
        emoji: product?.emoji ?? v.emoji,
        bg: product?.bg ?? v.bg,
        name: product?.name ?? v.name,
        sales: v.sales,
        called,
        tauxLivPct,
        caXof: v.ca,
        beneficeXof,
        beneficePct,
      };
    })
    .sort((a, b) => (b.beneficeXof ?? -Infinity) - (a.beneficeXof ?? -Infinity))
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
      totalCalled: calledCount,
      buckets,
      leads: leadsPreview,
    },
    funnel,
    liveDeliveries: livePool,
    liveDeliveriesActiveCount,
    liveDeliveriesChipLabel,
    topProducts,
  };
}
