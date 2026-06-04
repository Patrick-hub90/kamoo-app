"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Leaf,
  PackageX,
  Plus,
  Rows3,
  Search,
  ShoppingBag,
} from "lucide-react";
import { MinimalKpi } from "@/components/kamoo/minimal-kpi";
import { useSavedCovers } from "@/components/kamoo/product-image-manager";
import {
  DateRangeFilter,
  type DateFilterValue,
} from "@/components/kamoo/date-range-filter";
import {
  MOCK_FINANCE_MOVEMENTS,
  MOCK_TODAY,
} from "@/lib/data/mock-finances";
import { campaignsForProduct } from "@/lib/data/mock-ad-campaigns";
import {
  computeBoutiqueStats,
  getApprovisionnements,
} from "@/lib/data/mock-produits";
import {
  computeProductStatsForPeriod,
  computeProductStatsLifetime,
  EMPTY_STATS,
  type ProductStats,
} from "@/lib/data/product-profitability";
import { useSessionStorageState } from "@/lib/hooks/use-session-storage-state";
import { useLocalStorageState } from "@/lib/hooks/use-local-storage-state";
import { useProductsState } from "@/lib/hooks/use-products-state";
import {
  getStockLevel,
  type Produit,
  type StockLevel,
} from "@/lib/types/produit";
import { dateFilterFromSearchParams } from "@/lib/utils/date-filter-url";
import { formatXOF } from "@/lib/format";
import { cn } from "@/lib/utils";

type StatusView = "all" | "active" | "inactive" | "low_stock" | "out_of_stock";
type SortKey = "best_seller" | "recent" | "stock_asc" | "name";

const VIEW_TABS: { id: StatusView; label: string }[] = [
  { id: "all", label: "Tout" },
  { id: "active", label: "En vente" },
  { id: "inactive", label: "Inactif" },
  { id: "low_stock", label: "Stock bas" },
  { id: "out_of_stock", label: "Rupture" },
];

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "best_seller", label: "Best-sellers (total)" },
  { id: "recent", label: "Récemment ajoutés" },
  { id: "stock_asc", label: "Stock ↑ (à réapprovisionner)" },
  { id: "name", label: "Nom A → Z" },
];

function matchesView(p: Produit, view: StatusView): boolean {
  if (view === "all") return true;
  if (view === "active") return p.isActive;
  if (view === "inactive") return !p.isActive;
  // Stock bas / rupture ne s'applique qu'aux produits actifs
  // (un produit désactivé n'est plus vendu, son stock n'est pas pertinent)
  if (!p.isActive) return false;
  const level = getStockLevel(p);
  if (view === "low_stock") return level === "bas";
  if (view === "out_of_stock") return level === "rupture";
  return true;
}

function stockBadgeClasses(level: StockLevel): string {
  switch (level) {
    case "ok":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "bas":
      return "bg-amber-50 text-amber-800 ring-amber-300";
    case "rupture":
      return "bg-red-50 text-red-700 ring-red-200";
  }
}

/** Filtre les mouvements selon le DateRangeFilter (cohérent avec finances) */
function filterMovementsByPeriod(
  movements: typeof MOCK_FINANCE_MOVEMENTS,
  filter: DateFilterValue,
  today: Date,
): typeof MOCK_FINANCE_MOVEMENTS {
  if (filter.preset === "all") return movements;
  let fromMs: number;
  let toMs: number = today.getTime() + 86400000;
  if (filter.preset === "custom") {
    if (!filter.range?.from) return movements;
    const fromDate = filter.range.from;
    const toDate = filter.range.to ?? filter.range.from;
    fromMs = Date.UTC(
      fromDate.getFullYear(),
      fromDate.getMonth(),
      fromDate.getDate(),
    );
    toMs =
      Date.UTC(toDate.getFullYear(), toDate.getMonth(), toDate.getDate()) +
      86400000;
  } else {
    const days =
      filter.preset === "today"
        ? 1
        : filter.preset === "7j"
          ? 7
          : filter.preset === "30j"
            ? 30
            : 90;
    const from = new Date(today);
    from.setUTCHours(0, 0, 0, 0);
    from.setUTCDate(from.getUTCDate() - days + 1);
    fromMs = from.getTime();
  }
  return movements.filter((m) => {
    const t = new Date(m.date).getTime();
    return t >= fromMs && t < toMs;
  });
}

export default function BoutiquePage() {
  // Lecture via le hook → reflète les toggles Activer/Désactiver effectués
  // depuis la fiche produit (sessionStorage)
  const { products: all } = useProductsState();

  const [search, setSearch] = useSessionStorageState("boutique.search", "");
  const [view, setView] = useSessionStorageState<StatusView>(
    "boutique.view",
    "all",
  );
  const [sortBy, setSortBy] = useSessionStorageState<SortKey>(
    "boutique.sortBy",
    "best_seller",
  );
  const [viewMode, setViewMode] = useLocalStorageState<"table" | "cards">(
    "boutique.viewMode",
    "cards",
  );
  const [dateFilter, setDateFilter] = useSessionStorageState<DateFilterValue>(
    "boutique.dateFilter",
    { preset: "all" },
  );
  const [sortOpen, setSortOpen] = useState(false);

  // Si on arrive avec une période en URL (ex: depuis Finances Recettes),
  // on l'applique au montage. URL prioritaire sur sessionStorage.
  const searchParams = useSearchParams();
  useEffect(() => {
    const fromUrl = dateFilterFromSearchParams(searchParams);
    if (fromUrl) setDateFilter(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Normalisation : les dates sont des strings après reload sessionStorage
  const normalizedFilter = useMemo<DateFilterValue>(() => {
    if (dateFilter.preset !== "custom" || !dateFilter.range) return dateFilter;
    return {
      preset: "custom",
      range: {
        from: dateFilter.range.from
          ? new Date(dateFilter.range.from)
          : undefined,
        to: dateFilter.range.to ? new Date(dateFilter.range.to) : undefined,
      },
    };
  }, [dateFilter]);

  // Stats produit (vente + rentabilité) — soit période soit lifetime
  const productStats = useMemo(() => {
    if (normalizedFilter.preset === "all") {
      return computeProductStatsLifetime();
    }
    const filtered = filterMovementsByPeriod(
      MOCK_FINANCE_MOVEMENTS,
      normalizedFilter,
      MOCK_TODAY,
    );
    return computeProductStatsForPeriod(filtered);
  }, [normalizedFilter]);

  // Indique si on est en mode "période filtrée" (vs lifetime)
  const isPeriodMode = normalizedFilter.preset !== "all";

  // Carte des ventes (utilisée pour filtrer les produits sans vente sur la période)
  const periodSales = isPeriodMode ? productStats : null;

  // Stats du header : si filtre période actif, on les recalcule sur la période
  const stats = useMemo(() => {
    if (!isPeriodMode) return computeBoutiqueStats(all);
    let ventesTotal = 0;
    let caTotal = 0;
    for (const p of all) {
      const ps = productStats.get(p.id);
      if (ps) {
        ventesTotal += ps.soldQty;
        caTotal += ps.revenueXof;
      }
    }
    return {
      total: all.length,
      actifs: all.filter((p) => p.isActive).length,
      stockTotal: all.reduce((s, p) => s + p.stock, 0),
      stockActif: all
        .filter((p) => p.isActive)
        .reduce((s, p) => s + p.stock, 0),
      ventesTotal,
      caTotal,
    };
  }, [all, productStats, isPeriodMode]);

  // Photos de couverture enregistrées (localStorage) → affichées à la place
  // de l'emoji dans les cartes et le tableau.
  const covers = useSavedCovers();
  const getCover = (p: Produit): string | null => covers[p.id] ?? null;

  // Helper unique pour récupérer les stats d'un produit (toujours non-null)
  const getStats = (p: Produit): ProductStats =>
    productStats.get(p.id) ?? EMPTY_STATS;
  const getSoldQty = (p: Produit) => getStats(p).soldQty;
  const getRevenue = (p: Produit) => getStats(p).revenueXof;

  // Compteurs des onglets — calculés sur le backlog complet
  const viewCounts: Record<StatusView, number> = useMemo(() => {
    const counts: Record<StatusView, number> = {
      all: all.length,
      active: 0,
      inactive: 0,
      low_stock: 0,
      out_of_stock: 0,
    };
    for (const p of all) {
      if (p.isActive) counts.active++;
      else counts.inactive++;
      // Stock bas / rupture comptabilisés seulement pour les produits actifs
      if (p.isActive) {
        const lvl = getStockLevel(p);
        if (lvl === "bas") counts.low_stock++;
        if (lvl === "rupture") counts.out_of_stock++;
      }
    }
    return counts;
  }, [all]);

  const filtered = useMemo(() => {
    let list = all.filter((p) => {
      if (!matchesView(p, view)) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        if (
          !p.name.toLowerCase().includes(q) &&
          !p.sku.toLowerCase().includes(q)
        )
          return false;
      }
      // En mode période : exclure les produits sans vente sur la période
      if (periodSales) {
        const ps = periodSales.get(p.id);
        if (!ps || ps.soldQty === 0) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "best_seller":
          return getSoldQty(b) - getSoldQty(a);
        case "recent":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "stock_asc":
          return a.stock - b.stock;
        case "name":
          return a.name.localeCompare(b.name);
      }
    });
    return list;
  }, [all, view, search, sortBy, periodSales]);

  const filtersActive =
    search.length > 0 ||
    view !== "all" ||
    sortBy !== "best_seller" ||
    dateFilter.preset !== "all";
  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.id === sortBy)?.label ?? "Best-sellers";

  return (
    <div className="flex h-full flex-col">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-line bg-white px-3 py-3.5">
        <div>
          <h1
            className="font-display text-[22px] font-extrabold tracking-tight text-ink-900"
            style={{ letterSpacing: "-0.02em" }}
          >
            Catalogue
          </h1>
          <p className="mt-0.5 text-[12.5px] text-ink-500">
            {periodSales
              ? "Vos produits vendus pendant la période sélectionnée."
              : "Votre catalogue produits, votre stock et vos performances de vente."}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/boutique/nouveau"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-kamoo-orange-500 px-3.5 text-[13px] font-bold text-white transition hover:bg-kamoo-orange-600"
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter un produit
          </Link>
        </div>
      </div>

      {/* STATS */}
      <div className="bg-white px-3 pb-4 pt-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MinimalKpi
            label="Produits actifs"
            value={String(stats.actifs)}
            valueAccent={`/ ${stats.total}`}
            color="emerald"
            hint="Nombre de produits actuellement en vente, sur le total de votre catalogue."
          />
          <MinimalKpi
            label="Stock actif"
            value={stats.stockActif.toLocaleString("fr-FR")}
            valueAccent={`/ ${stats.stockTotal.toLocaleString("fr-FR")} unités`}
            hint={`Unités en stock sur vos produits actifs (vendables). ${(
              stats.stockTotal - stats.stockActif
            ).toLocaleString("fr-FR")} unités sont bloquées dans des produits inactifs — ${stats.stockTotal.toLocaleString("fr-FR")} au total.`}
          />
          <MinimalKpi
            label={periodSales ? "Ventes période" : "Ventes total"}
            value={stats.ventesTotal.toLocaleString("fr-FR")}
            unit="unités"
            color="emerald"
            hint="Nombre total d'unités vendues sur la période sélectionnée (ou depuis le lancement)."
          />
          <MinimalKpi
            label={periodSales ? "CA période" : "CA total"}
            value={formatXOF(stats.caTotal, false)}
            unit="F"
            color="emerald"
            hint="Chiffre d'affaires généré par vos ventes."
          />
        </div>
      </div>

      {/* TOOLBAR — onglets (gauche) · recherche / période / tri (droite) */}
      <div className="bg-white px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Onglets = filtres par statut */}
          <div className="flex rounded-lg bg-paper-2 p-1">
            {VIEW_TABS.map((t) => {
              const active = view === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setView(t.id)}
                  className={cn(
                    "inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[12.5px] font-semibold transition",
                    active
                      ? "bg-white text-ink-900 shadow-[0_1px_2px_rgba(16,24,40,0.08)]"
                      : "text-ink-500 hover:text-ink-700",
                  )}
                >
                  {t.label}
                  <span
                    className={cn(
                      "font-mono-kamoo text-[10px] font-extrabold",
                      active ? "text-ink-700" : "text-ink-400",
                    )}
                  >
                    {viewCounts[t.id]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex-1" />

          {/* Recherche */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              placeholder="Nom du produit ou SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-[13px] outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600"
            />
          </div>

          {/* Période */}
          <DateRangeFilter value={dateFilter} onChange={setDateFilter} />

          {/* Trier */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setSortOpen(!sortOpen)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[12.5px] font-semibold text-ink-700 transition hover:bg-paper-2"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              Trier
              <span className="text-ink-400">·</span>
              <span>{currentSortLabel}</span>
            </button>
            {sortOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setSortOpen(false)}
                />
                <div className="absolute right-0 top-[calc(100%+4px)] z-20 w-64 rounded-xl border border-line bg-white p-1 shadow-[var(--shadow-kamoo-lg)]">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSortBy(opt.id);
                        setSortOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[12.5px] transition hover:bg-paper-2",
                        opt.id === sortBy
                          ? "font-bold text-ink-900"
                          : "font-medium text-ink-700",
                      )}
                    >
                      {opt.label}
                      {opt.id === sortBy && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-kamoo-blue-700" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Switch Tableau / Cartes */}
          <div className="flex items-center gap-0.5 rounded-lg border border-line bg-white p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              aria-label="Vue tableau"
              title="Vue tableau"
              className={cn(
                "grid h-8 w-8 place-items-center rounded-md transition",
                viewMode === "table"
                  ? "bg-paper-2 text-ink-900"
                  : "text-ink-400 hover:text-ink-700",
              )}
            >
              <Rows3 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              aria-label="Vue cartes"
              title="Vue cartes"
              className={cn(
                "grid h-8 w-8 place-items-center rounded-md transition",
                viewMode === "cards"
                  ? "bg-paper-2 text-ink-900"
                  : "text-ink-400 hover:text-ink-700",
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* CONTENU — tableau à plat OU grille de cartes + footer pagination */}
      <div className="flex min-h-0 flex-1 flex-col bg-white">
        <div
          className="flex-1 overflow-auto"
          style={{ scrollbarColor: "#D1D5DB #F5F5EE", scrollbarWidth: "thin" }}
        >
          {filtered.length === 0 ? (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center px-6 py-16 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-paper-2">
                <ShoppingBag className="h-7 w-7 text-ink-400" />
              </div>
              <p className="mt-4 text-[15px] font-bold text-ink-900">
                {periodSales
                  ? "Aucun produit vendu pendant cette période"
                  : "Aucun produit à afficher"}
              </p>
              <p className="mt-1 max-w-sm text-[13px] text-ink-500">
                {search
                  ? `Aucun résultat pour « ${search} ».`
                  : "Aucun produit ne correspond à vos filtres."}
              </p>
              {filtersActive && (
                <button
                  onClick={() => {
                    setSearch("");
                    setView("all");
                    setSortBy("best_seller");
                    setDateFilter({ preset: "all" });
                  }}
                  className="mt-4 inline-flex h-9 items-center rounded-lg border border-line bg-white px-4 text-[12.5px] font-semibold text-ink-700 transition hover:bg-paper-2"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          ) : viewMode === "cards" ? (
            <div className="p-3">
              <ProduitsGrid
                produits={filtered}
                getStats={getStats}
                getCover={getCover}
              />
            </div>
          ) : (
            <ProduitsTable
              produits={filtered}
              getStats={getStats}
              getCover={getCover}
              isPeriodFiltered={isPeriodMode}
            />
          )}
        </div>

        {/* Footer pagination — prev / next + range + total */}
        {filtered.length > 0 && (
          <div className="flex items-center gap-2 border-t border-line bg-paper-2/40 px-3 py-2.5">
            <button
              type="button"
              disabled
              className="grid h-7 w-7 place-items-center rounded-lg border border-line bg-white text-ink-500 transition hover:bg-paper-2 hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Page précédente"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled
              className="grid h-7 w-7 place-items-center rounded-lg border border-line bg-white text-ink-500 transition hover:bg-paper-2 hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Page suivante"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <span className="ml-1 font-mono-kamoo text-[11.5px] font-semibold text-ink-700">
              1–{Math.min(filtered.length, 50)}
              {filtered.length > 50 && (
                <span className="text-ink-400"> sur {filtered.length}</span>
              )}
            </span>
            <div className="flex-1" />
            <span className="text-[12px] font-semibold text-ink-500">
              {periodSales
                ? `${filtered.length} produit${filtered.length > 1 ? "s" : ""} vendu${filtered.length > 1 ? "s" : ""}`
                : `${filtered.length} sur ${all.length} produit${all.length > 1 ? "s" : ""}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Grille de cartes produit ──────────────────────────── */

function ProduitsGrid({
  produits,
  getStats,
  getCover,
}: {
  produits: Produit[];
  getStats: (p: Produit) => ProductStats;
  getCover: (p: Produit) => string | null;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {produits.map((p) => (
        <ProduitCard
          key={p.id}
          p={p}
          stats={getStats(p)}
          cover={getCover(p)}
        />
      ))}
    </div>
  );
}

function CardRow({
  label,
  value,
  tone = "default",
  title,
}: {
  label: string;
  value: string;
  tone?: "default" | "green" | "amber" | "red" | "muted";
  /** Info-bulle native au survol (ex. formule de calcul) */
  title?: string;
}) {
  const color =
    tone === "green"
      ? "text-emerald-700"
      : tone === "amber"
        ? "text-amber-700"
        : tone === "red"
          ? "text-red-700"
          : tone === "muted"
            ? "text-ink-400"
            : "text-ink-900";
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span
        title={title}
        className={cn(
          "shrink-0 text-[11px] font-semibold text-ink-500",
          title ? "cursor-help" : undefined,
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "truncate font-mono-kamoo text-[12.5px] font-extrabold tabular-nums",
          color,
        )}
      >
        {value}
      </span>
    </div>
  );
}

function ProduitCard({
  p,
  stats,
  cover,
}: {
  p: Produit;
  stats: ProductStats;
  cover: string | null;
}) {
  const router = useRouter();
  const level = getStockLevel(p);
  // Bénéfice NET TOTAL = CA réel − coût marchandise − dépense pub.
  // (Le bénéfice unitaire varie selon le coût pub et les remises de
  // déstockage ; le total réalisé, lui, est un chiffre stable et fiable.)
  const beneficeNet = stats.netProfitXof;
  const hasEconomics = stats.revenueXof > 0 || stats.adSpendXof > 0;
  const campaigns = campaignsForProduct(p.id);
  const activeCampaign =
    campaigns.find((c) => c.status === "active") ?? campaigns[0];
  const hasAds = stats.adSpendXof > 0;
  // Total reçu via approvisionnements → dénominateur « restant / total »
  const received = getApprovisionnements(p.id).reduce(
    (s, a) => s + a.quantity,
    0,
  );
  const stockTotal = received > 0 ? received : p.stock;
  const stockPct =
    stockTotal > 0 ? Math.min(100, Math.round((p.stock / stockTotal) * 100)) : 0;

  return (
    <button
      type="button"
      onClick={() => router.push(`/boutique/${p.id}`)}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white text-left transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(16,24,40,0.09)]"
    >
      {/* Visuel produit — photo de couverture si dispo, sinon emoji */}
      <div
        className="relative aspect-[16/10] overflow-hidden"
        style={{ background: p.bg }}
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={p.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl drop-shadow-sm">
            {p.emoji}
          </div>
        )}
        <span
          className={cn(
            "absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold ring-1 ring-inset whitespace-nowrap",
            stockBadgeClasses(level),
          )}
        >
          {level === "rupture" ? (
            <PackageX className="h-3 w-3" />
          ) : level === "bas" ? (
            <AlertTriangle className="h-3 w-3" />
          ) : (
            <CheckCircle2 className="h-3 w-3" />
          )}
          {level === "rupture"
            ? "Rupture"
            : level === "bas"
              ? "Stock bas"
              : "En stock"}
        </span>
        <span
          className={cn(
            "absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold whitespace-nowrap",
            p.isActive
              ? "bg-emerald-600 text-white"
              : "bg-white/85 text-ink-500 ring-1 ring-inset ring-line backdrop-blur-sm",
          )}
        >
          {p.isActive ? "● En vente" : "○ Inactif"}
        </span>
      </div>

      {/* Corps */}
      <div className="flex flex-1 flex-col p-3.5">
        <div className="font-mono-kamoo text-[10.5px] text-ink-400">
          {p.sku}
        </div>
        <div className="mt-0.5 line-clamp-1 text-[14px] font-bold text-ink-900">
          {p.name}
        </div>

        {/* Prix vente · Bénéfice net · CA — montants complets */}
        <div className="mt-3 flex flex-col gap-1.5 rounded-xl bg-paper-2/50 px-3 py-2.5">
          <CardRow
            label="Prix vente"
            value={`${formatXOF(p.priceXof, false)} F`}
          />
          <CardRow
            label="Bénéfice net"
            value={
              hasEconomics
                ? `${beneficeNet < 0 ? "−" : ""}${formatXOF(Math.abs(beneficeNet), false)} F`
                : "—"
            }
            tone={
              !hasEconomics ? "muted" : beneficeNet >= 0 ? "green" : "red"
            }
            title={
              hasEconomics
                ? "Bénéfice net = CA réel − coût marchandise − dépense pub"
                : undefined
            }
          />
          <CardRow
            label="CA"
            value={
              stats.revenueXof > 0
                ? `${formatXOF(stats.revenueXof, false)} F`
                : "—"
            }
            tone={stats.revenueXof > 0 ? "default" : "muted"}
          />
        </div>

        {/* Stock restant + barre */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-ink-500">Stock restant</span>
            <span className="font-mono-kamoo font-bold text-ink-900">
              {p.stock}
              <span className="font-normal text-ink-400"> / {stockTotal}</span>
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-paper-2">
            <div
              className={cn(
                "h-full rounded-full",
                level === "rupture"
                  ? "bg-red-500"
                  : level === "bas"
                    ? "bg-amber-500"
                    : "bg-emerald-500",
              )}
              style={{ width: `${stockPct}%` }}
            />
          </div>
        </div>

        {/* Campagne / Organique */}
        <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-line px-2.5 py-2">
          {hasAds ? (
            <>
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#1877F2] text-[15px] font-black leading-none text-white">
                f
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11.5px] font-bold text-ink-900">
                    Meta
                  </span>
                  {activeCampaign?.status === "active" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-px text-[8.5px] font-extrabold uppercase tracking-wide text-emerald-700">
                      <span className="h-1 w-1 rounded-full bg-emerald-500" />
                      En cours
                    </span>
                  )}
                </div>
                <div className="mt-px flex items-center gap-1 text-[10.5px] text-ink-500">
                  <span className="truncate">
                    {activeCampaign?.name ?? "Campagne publicitaire"}
                  </span>
                  {campaigns.length > 1 && (
                    <span className="shrink-0 rounded bg-paper-2 px-1 text-[9px] font-extrabold text-ink-700">
                      +{campaigns.length - 1}
                    </span>
                  )}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[12px] font-extrabold tabular-nums text-rose-700">
                  −{formatXOF(stats.adSpendXof, false)} F
                </div>
                <div className="text-[10px] font-bold text-ink-500">dépensé</div>
              </div>
            </>
          ) : (
            <>
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                <Leaf className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11.5px] font-bold text-ink-900">
                  100% organique
                </div>
                <div className="mt-px text-[10.5px] text-ink-500">
                  Aucune campagne publicitaire
                </div>
              </div>
            </>
          )}
        </div>

        {/* Lien vers la fiche produit */}
        <div className="mt-3 flex items-center justify-end border-t border-line pt-2.5">
          <ArrowRight className="h-4 w-4 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-kamoo-blue-700" />
        </div>
      </div>
    </button>
  );
}

/* ─── Tableau Shopify-style ──────────────────────────── */

function ProduitsTable({
  produits,
  getStats,
  getCover,
  isPeriodFiltered,
}: {
  produits: Produit[];
  getStats: (p: Produit) => ProductStats;
  getCover: (p: Produit) => string | null;
  isPeriodFiltered: boolean;
}) {
  const router = useRouter();
  return (
    <table className="w-full min-w-[1500px] table-fixed text-[13px]">
          <colgroup>
            <col style={{ width: "60px" }} />
            <col style={{ width: "260px" }} />
            <col style={{ width: "110px" }} />
            <col style={{ width: "100px" }} />
            <col style={{ width: "140px" }} />
            <col style={{ width: "140px" }} />
            <col style={{ width: "130px" }} />
            <col style={{ width: "150px" }} />
            <col style={{ width: "90px" }} />
            <col style={{ width: "110px" }} />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="border-b border-line text-left">
              <Th> </Th>
              <Th>Produit</Th>
              <Th align="center">Stock</Th>
              <Th align="right">
                {isPeriodFiltered ? "Vendus" : "Vendus total"}
              </Th>
              <Th align="right">{isPeriodFiltered ? "CA" : "CA total"}</Th>
              <Th align="right">Achat produit</Th>
              <Th align="right">Dépense pub</Th>
              <Th align="right">Bénéfice net</Th>
              <Th align="center">Marge</Th>
              <Th align="center">État</Th>
            </tr>
          </thead>
          <tbody>
            {produits.map((p) => {
              const level = getStockLevel(p);
              const s = getStats(p);
              const cover = getCover(p);
              return (
                <tr
                  key={p.id}
                  onClick={() => router.push(`/boutique/${p.id}`)}
                  className="cursor-pointer border-b border-line last:border-0 transition hover:bg-paper-2/30"
                >
                  <Td>
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover}
                        alt={p.name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div
                        className="grid h-12 w-12 place-items-center rounded-lg text-2xl"
                        style={{ background: p.bg }}
                      >
                        {p.emoji}
                      </div>
                    )}
                  </Td>
                  <Td>
                    <div>
                      <div className="font-semibold text-ink-900">{p.name}</div>
                      <div className="font-mono-kamoo mt-0.5 text-[11px] text-ink-500">
                        {p.sku}
                      </div>
                    </div>
                  </Td>
                  <Td align="center">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-bold ring-1 ring-inset",
                        level === "rupture"
                          ? "bg-red-50 text-red-600 ring-red-200"
                          : level === "bas"
                            ? "bg-amber-50 text-amber-700 ring-amber-200"
                            : "bg-paper-2 text-ink-900 ring-line",
                      )}
                    >
                      {level === "rupture" ? (
                        <PackageX className="h-3 w-3" />
                      ) : level === "bas" ? (
                        <AlertTriangle className="h-3 w-3" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3 text-ink-400" />
                      )}
                      {p.stock} unité{p.stock > 1 ? "s" : ""}
                    </span>
                  </Td>
                  <Td align="right">
                    <span
                      className={cn(
                        "font-bold tabular-nums",
                        s.soldQty > 0 ? "text-ink-900" : "text-ink-400",
                      )}
                    >
                      {s.soldQty > 0
                        ? `× ${s.soldQty.toLocaleString("fr-FR")}`
                        : "—"}
                    </span>
                  </Td>
                  <Td align="right">
                    {/* CA = argent qui rentre → accent vert (comme les KPI) */}
                    <span
                      className={cn(
                        "font-bold tabular-nums",
                        s.revenueXof > 0 ? "text-emerald-700" : "text-ink-400",
                      )}
                    >
                      {s.revenueXof > 0 ? formatXOF(s.revenueXof) : "—"}
                    </span>
                  </Td>
                  <Td align="right">
                    {/* Coûts → sobres (noir), pas d'accent décoratif */}
                    <span
                      className={cn(
                        "font-bold tabular-nums",
                        s.cogsXof > 0 ? "text-ink-900" : "text-ink-400",
                      )}
                    >
                      {s.cogsXof > 0 ? formatXOF(s.cogsXof) : "—"}
                    </span>
                  </Td>
                  <Td align="right">
                    <span
                      className={cn(
                        "font-bold tabular-nums",
                        s.adSpendXof > 0 ? "text-ink-900" : "text-ink-400",
                      )}
                    >
                      {s.adSpendXof > 0 ? formatXOF(s.adSpendXof) : "—"}
                    </span>
                  </Td>
                  <Td align="right">
                    {/* Bénéfice = la ligne qui compte → vert si positif, rouge si perte */}
                    {s.revenueXof > 0 ? (
                      <span
                        className={cn(
                          "font-display font-extrabold tabular-nums",
                          s.netProfitXof < 0
                            ? "text-red-600"
                            : "text-emerald-700",
                        )}
                      >
                        {s.netProfitXof < 0 ? "−" : "+"}
                        {formatXOF(Math.abs(s.netProfitXof))}
                      </span>
                    ) : (
                      <span className="text-ink-400">—</span>
                    )}
                  </Td>
                  <Td align="center">
                    {/* Marge : pastille verte douce si saine, sinon neutre */}
                    {s.revenueXof > 0 ? (
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold",
                          s.marginPct >= 50
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-paper-2 text-ink-700",
                        )}
                      >
                        {s.marginPct}%
                      </span>
                    ) : (
                      <span className="text-ink-400">—</span>
                    )}
                  </Td>
                  <Td align="center">
                    {/* État : pastille neutre + point vert discret si actif */}
                    <span className="inline-flex w-[90px] items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-paper-2 px-2 py-1 text-[11.5px] font-bold ring-1 ring-inset ring-line">
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          p.isActive ? "bg-emerald-500" : "bg-ink-300",
                        )}
                      />
                      <span className={p.isActive ? "text-ink-900" : "text-ink-400"}>
                        {p.isActive ? "En vente" : "Inactif"}
                      </span>
                    </span>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
}) {
  return (
    <th
      className={cn(
        "px-3 py-2.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-500",
        align === "right" && "text-right",
        align === "center" && "text-center",
      )}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
}) {
  return (
    <td
      className={cn(
        "px-3 py-3 align-middle text-[13px]",
        align === "right" && "text-right",
        align === "center" && "text-center",
      )}
    >
      {children}
    </td>
  );
}
