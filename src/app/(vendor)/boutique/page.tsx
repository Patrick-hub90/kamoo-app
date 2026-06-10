"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Leaf,
  Archive,
  PackageX,
  Trash2,
  Plus,
  Rows3,
  Search,
  ShoppingBag,
} from "lucide-react";
import {
  DateRangeFilter,
  type DateFilterValue,
} from "@/components/kamoo/date-range-filter";
import { useSavedCovers } from "@/components/kamoo/product-image-manager";
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
import { useProductsState } from "@/lib/hooks/use-products-state";
import {
  getStockLevel,
  type Produit,
  type StockLevel,
} from "@/lib/types/produit";
import { dateFilterFromSearchParams } from "@/lib/utils/date-filter-url";
import { formatXOF } from "@/lib/format";
import { PageHeader } from "@/components/kamoo/page-header";
import { cn } from "@/lib/utils";

/**
 * Catalogue — identité Kamoo (refonte validée).
 *
 * Design : aperçu /apercu-catalogue (canvas gris, cartes blanches, filets fins,
 * Poppins, densité ordonnée, couleur = sens). DONNÉES + LOGIQUE inchangées :
 * stats rentabilité, période, tri, filtres, photos de couverture, campagnes.
 */

type StatusView = "all" | "active" | "inactive" | "low_stock" | "out_of_stock" | "archived";
type SortKey = "best_seller" | "recent" | "stock_asc" | "name";

const VIEW_TABS: { id: StatusView; label: string }[] = [
  { id: "all", label: "Tout" },
  { id: "active", label: "En vente" },
  { id: "inactive", label: "Inactif" },
  { id: "low_stock", label: "Stock bas" },
  { id: "out_of_stock", label: "Rupture" },
  { id: "archived", label: "Archivé" },
];

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "best_seller", label: "Best-sellers (total)" },
  { id: "recent", label: "Récemment ajoutés" },
  { id: "stock_asc", label: "Stock ↑ (à réapprovisionner)" },
  { id: "name", label: "Nom A → Z" },
];

function matchesView(p: Produit, view: StatusView): boolean {
  // Les archivés ne sortent QUE dans la vue Archivé.
  if (view === "archived") return !!p.archived;
  if (p.archived) return false;
  if (view === "all") return true;
  if (view === "active") return p.isActive;
  if (view === "inactive") return !p.isActive;
  if (!p.isActive) return false;
  const level = getStockLevel(p);
  if (view === "low_stock") return level === "bas";
  if (view === "out_of_stock") return level === "rupture";
  return true;
}

/** Pastille stock — pastel, couleur = sens. */
function stockBadgeClasses(level: StockLevel): string {
  switch (level) {
    case "ok":
      return "bg-emerald-50 text-emerald-700";
    case "bas":
      return "bg-amber-50 text-amber-700";
    case "rupture":
      return "bg-red-50 text-red-600";
  }
}

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
    fromMs = Date.UTC(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
    toMs = Date.UTC(toDate.getFullYear(), toDate.getMonth(), toDate.getDate()) + 86400000;
  } else {
    const days =
      filter.preset === "today" ? 1 : filter.preset === "7j" ? 7 : filter.preset === "30j" ? 30 : 90;
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

/* ════════════════════════════════════════════════════════════════════ */
export default function BoutiquePage() {
  const { products: all, bulkSetActive, bulkSetArchived, removeProducts } = useProductsState();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [search, setSearch] = useSessionStorageState("boutique.search", "");
  const [view, setView] = useSessionStorageState<StatusView>("boutique.view", "all");
  const [sortBy, setSortBy] = useSessionStorageState<SortKey>("boutique.sortBy", "best_seller");
  const [dateFilter, setDateFilter] = useSessionStorageState<DateFilterValue>("boutique.dateFilter", {
    preset: "all",
  });
  const [sortOpen, setSortOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);

  const searchParams = useSearchParams();
  useEffect(() => {
    const fromUrl = dateFilterFromSearchParams(searchParams);
    if (fromUrl) setDateFilter(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const normalizedFilter = useMemo<DateFilterValue>(() => {
    if (dateFilter.preset !== "custom" || !dateFilter.range) return dateFilter;
    return {
      preset: "custom",
      range: {
        from: dateFilter.range.from ? new Date(dateFilter.range.from) : undefined,
        to: dateFilter.range.to ? new Date(dateFilter.range.to) : undefined,
      },
    };
  }, [dateFilter]);

  const productStats = useMemo(() => {
    if (normalizedFilter.preset === "all") return computeProductStatsLifetime();
    const filtered = filterMovementsByPeriod(MOCK_FINANCE_MOVEMENTS, normalizedFilter, MOCK_TODAY);
    return computeProductStatsForPeriod(filtered);
  }, [normalizedFilter]);

  const isPeriodMode = normalizedFilter.preset !== "all";
  const periodSales = isPeriodMode ? productStats : null;

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
      stockActif: all.filter((p) => p.isActive).reduce((s, p) => s + p.stock, 0),
      ventesTotal,
      caTotal,
    };
  }, [all, productStats, isPeriodMode]);

  const covers = useSavedCovers();
  const getCover = (p: Produit): string | null => covers[p.id] ?? null;

  const getStats = (p: Produit): ProductStats => productStats.get(p.id) ?? EMPTY_STATS;
  const getSoldQty = (p: Produit) => getStats(p).soldQty;

  const viewCounts: Record<StatusView, number> = useMemo(() => {
    const counts: Record<StatusView, number> = {
      all: 0,
      active: 0,
      inactive: 0,
      low_stock: 0,
      out_of_stock: 0,
      archived: 0,
    };
    for (const p of all) {
      if (p.archived) {
        counts.archived++;
        continue; // les archivés ne comptent pas dans les autres vues
      }
      counts.all++;
      if (p.isActive) counts.active++;
      else counts.inactive++;
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
        if (!p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
      }
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
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "stock_asc":
          return a.stock - b.stock;
        case "name":
          return a.name.localeCompare(b.name);
      }
    });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, view, search, sortBy, periodSales]);

  const filtersActive =
    search.length > 0 || view !== "all" || sortBy !== "best_seller" || dateFilter.preset !== "all";
  const currentSortLabel = SORT_OPTIONS.find((o) => o.id === sortBy)?.label ?? "Best-sellers";

  return (
    <div className="flex h-full flex-col bg-paper">
      {/* Header commun : période + CTA + cloche (même ordre partout) */}
      <PageHeader kicker="Mon activité" title="Catalogue">
        <DateRangeFilter value={dateFilter} onChange={setDateFilter} />
        <Link
          href="/boutique/nouveau"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-kamoo-blue-900 px-3.5 text-[13px] font-semibold text-white transition hover:bg-kamoo-blue-800"
        >
          <Plus className="h-4 w-4" />
          Ajouter un produit
        </Link>
      </PageHeader>

      <div className="mx-auto flex w-full min-h-0 max-w-[1320px] flex-1 flex-col gap-4 px-6 py-6">
        {/* KPI */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Produits actifs" value={String(stats.actifs)} suffix={`/ ${stats.total}`} />
          <Stat
            label="Stock actif"
            value={stats.stockActif.toLocaleString("fr-FR")}
            suffix={`/ ${stats.stockTotal.toLocaleString("fr-FR")} u`}
          />
          <Stat
            label={periodSales ? "Ventes période" : "Ventes total"}
            value={stats.ventesTotal.toLocaleString("fr-FR")}
            suffix="unités"
          />
          <Stat
            label={periodSales ? "CA période" : "CA total"}
            value={formatXOF(stats.caTotal, false)}
            suffix="F"
          />
        </div>

        {/* TOOLBAR — recherche · statut · tri (gauche), période (droite) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Recherche */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              placeholder="Nom ou SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-[12.5px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600"
            />
          </div>

          {/* Statut — menu déroulant */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setViewOpen(!viewOpen)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[12.5px] font-medium text-ink-700 transition hover:bg-paper-2"
            >
              <span className="text-ink-500">Statut</span>
              <span className="text-ink-300">·</span>
              <span className="font-semibold">{VIEW_TABS.find((t) => t.id === view)?.label ?? "Tout"}</span>
              <span className="rounded bg-paper-2 px-1 text-[11px] font-semibold tabular-nums text-ink-500">
                {viewCounts[view]}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-ink-400" />
            </button>
            {viewOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setViewOpen(false)} />
                <div className="absolute left-0 top-[calc(100%+4px)] z-20 w-56 rounded-xl border border-line bg-white p-1 shadow-[var(--shadow-kamoo-lg)]">
                  {VIEW_TABS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setView(t.id);
                        setViewOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-1.5 text-[12.5px] transition hover:bg-paper-2",
                        view === t.id ? "font-semibold text-ink-900" : "font-medium text-ink-700",
                      )}
                    >
                      <span>{t.label}</span>
                      <span className="flex items-center gap-2">
                        <span className="tabular-nums text-ink-400">{viewCounts[t.id]}</span>
                        {view === t.id && <CheckCircle2 className="h-3.5 w-3.5 text-kamoo-blue-700" />}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Trier — menu déroulant */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setSortOpen(!sortOpen)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[12.5px] font-medium text-ink-700 transition hover:bg-paper-2"
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-ink-400" />
              Trier
              <span className="text-ink-300">·</span>
              <span className="font-semibold">{currentSortLabel}</span>
            </button>
            {sortOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                <div className="absolute left-0 top-[calc(100%+4px)] z-20 w-64 rounded-xl border border-line bg-white p-1 shadow-[var(--shadow-kamoo-lg)]">
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
                        opt.id === sortBy ? "font-semibold text-ink-900" : "font-medium text-ink-700",
                      )}
                    >
                      {opt.label}
                      {opt.id === sortBy && <CheckCircle2 className="h-3.5 w-3.5 text-kamoo-blue-700" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Période : dans le header commun (convention globale) */}
        </div>

        {/* CONTENU */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-line bg-white px-6 py-16 text-center shadow-kamoo-sm">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-paper-2">
              <ShoppingBag className="h-6 w-6 text-ink-400" />
            </div>
            <p className="mt-4 text-[15px] font-semibold text-ink-900">
              {periodSales ? "Aucun produit vendu sur cette période" : "Aucun produit à afficher"}
            </p>
            <p className="mt-1 max-w-sm text-[13px] text-ink-500">
              {search ? `Aucun résultat pour « ${search} ».` : "Aucun produit ne correspond à vos filtres."}
            </p>
            {filtersActive ? (
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
            ) : (
              <Link
                href="/boutique/nouveau"
                className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-kamoo-blue-900 px-4 text-[12.5px] font-semibold text-white transition hover:bg-kamoo-blue-800"
              >
                <Plus className="h-4 w-4" />
                Ajouter votre premier produit
              </Link>
            )}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-line bg-white shadow-kamoo-sm">
            {/* Barre d'actions groupées (sélection multiple) */}
            {selectedIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 border-b border-kamoo-blue-100 bg-kamoo-blue-50/60 px-4 py-2.5">
                <span className="text-[12.5px] font-bold text-kamoo-blue-900">
                  {selectedIds.length} sélectionné{selectedIds.length > 1 ? "s" : ""}
                </span>
                <span className="mx-1 h-4 w-px bg-kamoo-blue-200" />
                <BulkBtn
                  icon={CheckCircle2}
                  label="Mettre en vente"
                  onClick={() => {
                    bulkSetArchived(selectedIds, false);
                    bulkSetActive(selectedIds, true);
                    setSelectedIds([]);
                  }}
                />
                <BulkBtn
                  icon={PackageX}
                  label="Désactiver"
                  onClick={() => {
                    bulkSetActive(selectedIds, false);
                    setSelectedIds([]);
                  }}
                />
                {view === "archived" ? (
                  <BulkBtn
                    icon={Archive}
                    label="Désarchiver"
                    onClick={() => {
                      bulkSetArchived(selectedIds, false);
                      setSelectedIds([]);
                    }}
                  />
                ) : (
                  <BulkBtn
                    icon={Archive}
                    label="Archiver"
                    onClick={() => {
                      bulkSetArchived(selectedIds, true);
                      setSelectedIds([]);
                    }}
                  />
                )}
                <BulkBtn
                  icon={Trash2}
                  label="Supprimer"
                  danger
                  onClick={() => {
                    if (
                      window.confirm(
                        `Supprimer définitivement ${selectedIds.length} produit${selectedIds.length > 1 ? "s" : ""} ? Cette action est irréversible.`,
                      )
                    ) {
                      removeProducts(selectedIds);
                      setSelectedIds([]);
                    }
                  }}
                />
                <button
                  onClick={() => setSelectedIds([])}
                  className="ml-auto text-[12px] font-semibold text-ink-400 hover:text-ink-700"
                >
                  Annuler la sélection
                </button>
              </div>
            )}
            <div className="always-show-scrollbar min-h-0 flex-1 overflow-auto">
              <ProduitsTable
                produits={filtered}
                getStats={getStats}
                getCover={getCover}
                isPeriodFiltered={isPeriodMode}
                selectedIds={selectedIds}
                onToggleSelect={(id) =>
                  setSelectedIds((prev) =>
                    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
                  )
                }
                onToggleAll={() =>
                  setSelectedIds((prev) =>
                    filtered.every((p) => prev.includes(p.id)) ? [] : filtered.map((p) => p.id),
                  )
                }
              />
            </div>
          </div>
        )}

        {/* PAGINATION */}
        {filtered.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled
              className="grid h-7 w-7 place-items-center rounded-lg border border-line bg-white text-ink-400 transition disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Page précédente"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled
              className="grid h-7 w-7 place-items-center rounded-lg border border-line bg-white text-ink-400 transition disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Page suivante"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <span className="ml-1 text-[11.5px] font-semibold tabular-nums text-ink-700">
              1–{Math.min(filtered.length, 50)}
              {filtered.length > 50 && <span className="text-ink-400"> sur {filtered.length}</span>}
            </span>
            <div className="flex-1" />
            <span className="text-[12px] font-medium text-ink-500">
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

/* ─── Stat (KPI) ────────────────────────────────────────────────── */
function Stat({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-line bg-white px-4 py-2.5 shadow-kamoo-sm">
      <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-ink-500">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-[20px] font-bold leading-none tracking-tight tabular-nums text-ink-900">{value}</span>
        {suffix && <span className="text-[12px] font-medium text-ink-400">{suffix}</span>}
      </div>
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-md transition",
        active ? "bg-kamoo-blue-900 text-white" : "text-ink-400 hover:bg-paper-2 hover:text-ink-700",
      )}
    >
      {children}
    </button>
  );
}

/* ─── Grille de cartes ──────────────────────────────────────────── */
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {produits.map((p) => (
        <ProduitCard key={p.id} p={p} stats={getStats(p)} cover={getCover(p)} />
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
  tone?: "default" | "green" | "red" | "muted";
  title?: string;
}) {
  const color =
    tone === "green"
      ? "text-emerald-600"
      : tone === "red"
        ? "text-red-600"
        : tone === "muted"
          ? "text-ink-400"
          : "text-ink-900";
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span
        title={title}
        className={cn("shrink-0 text-[11px] font-medium text-ink-500", title && "cursor-help")}
      >
        {label}
      </span>
      <span className={cn("truncate text-[12.5px] font-semibold tabular-nums", color)}>{value}</span>
    </div>
  );
}

function ProduitCard({ p, stats, cover }: { p: Produit; stats: ProductStats; cover: string | null }) {
  const router = useRouter();
  const level = getStockLevel(p);
  const beneficeNet = stats.netProfitXof;
  const hasEconomics = stats.revenueXof > 0 || stats.adSpendXof > 0;
  const campaigns = campaignsForProduct(p.id);
  const activeCampaign = campaigns.find((c) => c.status === "active") ?? campaigns[0];
  const hasAds = stats.adSpendXof > 0;
  const received = getApprovisionnements(p.id).reduce((s, a) => s + a.quantity, 0);
  const stockTotal = received > 0 ? received : p.stock;
  const stockPct = stockTotal > 0 ? Math.min(100, Math.round((p.stock / stockTotal) * 100)) : 0;

  return (
    <button
      type="button"
      onClick={() => router.push(`/boutique/${p.id}`)}
      className="group flex flex-col overflow-hidden rounded-xl border border-line bg-white text-left shadow-kamoo-sm transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(16,24,40,0.10)]"
    >
      {/* Visuel — photo de couverture ou emoji */}
      <div className="relative aspect-[16/10] overflow-hidden" style={{ background: p.bg }}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={p.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl">{p.emoji}</div>
        )}
        <span
          className={cn(
            "absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
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
          {level === "rupture" ? "Rupture" : level === "bas" ? "Stock bas" : "En stock"}
        </span>
        <span
          className={cn(
            "absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
            p.isActive ? "bg-white/90 text-emerald-700" : "bg-white/90 text-ink-500",
          )}
        >
          {p.isActive ? "● En vente" : "○ Inactif"}
        </span>
      </div>

      {/* Corps */}
      <div className="flex flex-1 flex-col p-3.5">
        <div className="text-[10.5px] tabular-nums text-ink-400">{p.sku}</div>
        <div className="mt-0.5 line-clamp-1 text-[14px] font-semibold text-ink-900">{p.name}</div>

        <div className="mt-3 flex flex-col gap-1.5 rounded-lg bg-paper-2/60 px-3 py-2.5">
          <CardRow label="Prix vente" value={`${formatXOF(p.priceXof, false)} F`} />
          <CardRow
            label="Bénéfice net"
            value={
              hasEconomics
                ? `${beneficeNet < 0 ? "−" : ""}${formatXOF(Math.abs(beneficeNet), false)} F`
                : "—"
            }
            tone={!hasEconomics ? "muted" : beneficeNet >= 0 ? "green" : "red"}
            title={hasEconomics ? "Bénéfice net = CA réel − coût marchandise − dépense pub" : undefined}
          />
          <CardRow
            label="CA"
            value={stats.revenueXof > 0 ? `${formatXOF(stats.revenueXof, false)} F` : "—"}
            tone={stats.revenueXof > 0 ? "default" : "muted"}
          />
        </div>

        {/* Stock restant + barre */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-medium text-ink-500">Stock restant</span>
            <span className="font-semibold tabular-nums text-ink-900">
              {p.stock}
              <span className="font-normal text-ink-400"> / {stockTotal}</span>
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-paper-2">
            <div
              className={cn(
                "h-full rounded-full",
                level === "rupture" ? "bg-red-500" : level === "bas" ? "bg-amber-500" : "bg-emerald-500",
              )}
              style={{ width: `${stockPct}%` }}
            />
          </div>
        </div>

        {/* Campagne / Organique */}
        <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-line px-2.5 py-2">
          {hasAds ? (
            <>
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#1877F2] text-[15px] font-black leading-none text-white">
                f
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11.5px] font-semibold text-ink-900">Meta</span>
                  {activeCampaign?.status === "active" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-px text-[8.5px] font-bold uppercase tracking-wide text-emerald-700">
                      <span className="h-1 w-1 rounded-full bg-emerald-500" />
                      En cours
                    </span>
                  )}
                </div>
                <div className="mt-px flex items-center gap-1 text-[10.5px] text-ink-500">
                  <span className="truncate">{activeCampaign?.name ?? "Campagne publicitaire"}</span>
                  {campaigns.length > 1 && (
                    <span className="shrink-0 rounded bg-paper-2 px-1 text-[9px] font-bold text-ink-700">
                      +{campaigns.length - 1}
                    </span>
                  )}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[12px] font-semibold tabular-nums text-red-600">
                  −{formatXOF(stats.adSpendXof, false)} F
                </div>
                <div className="text-[10px] font-medium text-ink-500">dépensé</div>
              </div>
            </>
          ) : (
            <>
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                <Leaf className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11.5px] font-semibold text-ink-900">100% organique</div>
                <div className="mt-px text-[10.5px] text-ink-500">Aucune campagne publicitaire</div>
              </div>
            </>
          )}
        </div>

        <div className="mt-3 flex items-center justify-end border-t border-line pt-2.5">
          <ArrowRight className="h-4 w-4 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-kamoo-blue-700" />
        </div>
      </div>
    </button>
  );
}

/* ─── Tableau ───────────────────────────────────────────────────── */
function ProduitsTable({
  produits,
  getStats,
  getCover,
  isPeriodFiltered,
  selectedIds,
  onToggleSelect,
  onToggleAll,
}: {
  produits: Produit[];
  getStats: (p: Produit) => ProductStats;
  getCover: (p: Produit) => string | null;
  isPeriodFiltered: boolean;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleAll: () => void;
}) {
  const router = useRouter();
  const allSelected = produits.length > 0 && produits.every((p) => selectedIds.includes(p.id));
  return (
    <table className="w-full min-w-[1540px] table-fixed text-[13px]">
      <colgroup>
        <col style={{ width: "44px" }} />
        <col style={{ width: "60px" }} />
        <col style={{ width: "260px" }} />
        <col style={{ width: "120px" }} />
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
          <Th>
            <input
              type="checkbox"
              checked={allSelected}
              onChange={onToggleAll}
              className="h-4 w-4 cursor-pointer rounded border-line accent-kamoo-blue-700"
              aria-label="Tout sélectionner"
            />
          </Th>
          <Th> </Th>
          <Th>Produit</Th>
          <Th align="center">Stock</Th>
          <Th align="right">{isPeriodFiltered ? "Vendus" : "Vendus total"}</Th>
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
              className={cn(
                "cursor-pointer border-b border-line last:border-0 transition hover:bg-paper-2/50",
                selectedIds.includes(p.id) && "bg-kamoo-blue-50/40",
              )}
            >
              <Td>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(p.id)}
                  onChange={() => onToggleSelect(p.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 cursor-pointer rounded border-line accent-kamoo-blue-700"
                  aria-label={`Sélectionner ${p.name}`}
                />
              </Td>
              <Td>
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cover} alt={p.name} className="h-11 w-11 rounded-lg object-cover" />
                ) : (
                  <div
                    className="grid h-11 w-11 place-items-center rounded-lg text-2xl"
                    style={{ background: p.bg }}
                  >
                    {p.emoji}
                  </div>
                )}
              </Td>
              <Td>
                <div>
                  <div className="text-[12.5px] font-semibold text-ink-900">{p.name}</div>
                  <div className="mt-0.5 text-[11px] tabular-nums text-ink-400">{p.sku}</div>
                </div>
              </Td>
              <Td align="center">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    level === "rupture"
                      ? "bg-red-50 text-red-600"
                      : level === "bas"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-paper-2 text-ink-700",
                  )}
                >
                  {level === "rupture" ? (
                    <PackageX className="h-3 w-3" />
                  ) : level === "bas" ? (
                    <AlertTriangle className="h-3 w-3" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3 text-ink-400" />
                  )}
                  {p.stock} u
                </span>
              </Td>
              <Td align="right">
                <span className={cn("font-semibold tabular-nums", s.soldQty > 0 ? "text-ink-900" : "text-ink-400")}>
                  {s.soldQty > 0 ? `× ${s.soldQty.toLocaleString("fr-FR")}` : "—"}
                </span>
              </Td>
              <Td align="right">
                <span className={cn("font-semibold tabular-nums", s.revenueXof > 0 ? "text-emerald-600" : "text-ink-400")}>
                  {s.revenueXof > 0 ? formatXOF(s.revenueXof) : "—"}
                </span>
              </Td>
              <Td align="right">
                <span className={cn("font-semibold tabular-nums", s.cogsXof > 0 ? "text-ink-900" : "text-ink-400")}>
                  {s.cogsXof > 0 ? formatXOF(s.cogsXof) : "—"}
                </span>
              </Td>
              <Td align="right">
                <span className={cn("font-semibold tabular-nums", s.adSpendXof > 0 ? "text-ink-900" : "text-ink-400")}>
                  {s.adSpendXof > 0 ? formatXOF(s.adSpendXof) : "—"}
                </span>
              </Td>
              <Td align="right">
                {s.revenueXof > 0 ? (
                  <span
                    className={cn(
                      "font-bold tabular-nums",
                      s.netProfitXof < 0 ? "text-red-600" : "text-emerald-600",
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
                {s.revenueXof > 0 ? (
                  <span
                    className={cn(
                      "inline-block rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                      s.marginPct >= 50 ? "bg-emerald-50 text-emerald-700" : "bg-paper-2 text-ink-700",
                    )}
                  >
                    {s.marginPct}%
                  </span>
                ) : (
                  <span className="text-ink-400">—</span>
                )}
              </Td>
              <Td align="center">
                {p.archived ? (
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-semibold text-ink-500">
                    <Archive className="h-3 w-3" />
                    Archivé
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-paper-2 px-2 py-0.5 text-[11px] font-semibold">
                    <span className={cn("h-1.5 w-1.5 rounded-full", p.isActive ? "bg-emerald-500" : "bg-ink-300")} />
                    <span className={p.isActive ? "text-ink-900" : "text-ink-400"}>
                      {p.isActive ? "En vente" : "Inactif"}
                    </span>
                  </span>
                )}
              </Td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "center" | "right" }) {
  return (
    <th
      className={cn(
        "px-3 py-3 text-[10.5px] font-semibold uppercase tracking-[0.05em] text-ink-400",
        align === "right" && "text-right",
        align === "center" && "text-center",
      )}
    >
      {children}
    </th>
  );
}

function Td({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "center" | "right" }) {
  return (
    <td
      className={cn(
        "px-3 py-2.5 align-middle text-[13px]",
        align === "right" && "text-right",
        align === "center" && "text-center",
      )}
    >
      {children}
    </td>
  );
}

function BulkBtn({
  icon: Icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[12px] font-semibold transition",
        danger
          ? "border-red-200 bg-white text-red-600 hover:bg-red-50"
          : "border-line bg-white text-ink-700 hover:bg-paper-2",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
