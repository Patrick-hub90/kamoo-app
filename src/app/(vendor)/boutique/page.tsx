"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Archive,
  PackageX,
  Trash2,
  Plus,
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
import { computeBoutiqueStats } from "@/lib/data/mock-produits";
import {
  computeProductStatsForPeriod,
  computeProductStatsLifetime,
  EMPTY_STATS,
  type ProductStats,
} from "@/lib/data/product-profitability";
import { useSessionStorageState } from "@/lib/hooks/use-session-storage-state";
import { useProductsState } from "@/lib/hooks/use-products-state";
import { useCurrentMarket } from "@/lib/hooks/use-current-market";
import { useShopify } from "@/lib/hooks/use-shopify";
import { useShopifyPublish } from "@/lib/hooks/use-shopify-publish";
import { ShopifyImportModal } from "@/components/kamoo/shopify-import-modal";
import { CatalogueReconBanner } from "@/components/kamoo/catalogue-recon-banner";
import { ConsolePageSkeleton } from "@/components/kamoo/loading";
import { getStockLevel, needsCompletion, type Produit } from "@/lib/types/produit";
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

type StatusView =
  | "all"
  | "active"
  | "inactive"
  | "low_stock"
  | "out_of_stock"
  | "incomplete"
  | "archived";
type SortKey = "best_seller" | "recent" | "stock_asc" | "name";

const VIEW_TABS: { id: StatusView; label: string }[] = [
  { id: "all", label: "Tout" },
  { id: "active", label: "En vente" },
  { id: "inactive", label: "Inactif" },
  { id: "low_stock", label: "Stock bas" },
  { id: "out_of_stock", label: "Rupture" },
  { id: "incomplete", label: "À compléter" },
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
  if (view === "incomplete") return needsCompletion(p);
  if (view === "active") return p.isActive;
  if (view === "inactive") return !p.isActive;
  if (!p.isActive) return false;
  const level = getStockLevel(p);
  if (view === "low_stock") return level === "bas";
  if (view === "out_of_stock") return level === "rupture";
  return true;
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
  return (
    <Suspense fallback={<ConsolePageSkeleton />}>
      <BoutiquePageInner />
    </Suspense>
  );
}

function BoutiquePageInner() {
  const { products: all, bulkSetActive, bulkSetArchived, removeProducts } = useProductsState();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [publishOpen, setPublishOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  /* Publication Shopify (façon DSers) — sur la boutique du marché courant. */
  const { currentMarket } = useCurrentMarket();
  const { getConnection, liveMode } = useShopify();
  const shopifyConn = getConnection(currentMarket.id);
  const shopifyConnected = shopifyConn?.isConnected === true;
  const { getStatus: getPublishStatus, publish: publishProduct } = useShopifyPublish();

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
      incomplete: 0,
      archived: 0,
    };
    for (const p of all) {
      if (p.archived) {
        counts.archived++;
        continue; // les archivés ne comptent pas dans les autres vues
      }
      counts.all++;
      if (needsCompletion(p)) counts.incomplete++;
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
      // Le filtre période s'applique aux vues basées sur les VENTES, pas aux
      // vues d'état catalogue (« À compléter », « Archivé ») — sinon le bandeau
      // « N à compléter » mènerait à une liste vide dès qu'une période est active.
      if (periodSales && view !== "incomplete" && view !== "archived") {
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
      <PageHeader kicker="Mon activité" title="Catalogue" />

      <div className="mx-auto flex w-full min-h-0 max-w-[1320px] flex-1 flex-col gap-4 px-6 py-6">
        {/* Actions de page */}
        <div className="flex flex-wrap items-center justify-end gap-2.5">
          {shopifyConnected && (
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 text-[13px] font-medium text-ink-700 transition hover:bg-paper-2"
            >
              <ShoppingBag className="h-4 w-4 text-ink-400" />
              Importer depuis Shopify
            </button>
          )}
          <Link
            href="/boutique/nouveau"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-kamoo-blue-900 px-3.5 text-[13px] font-medium text-white transition hover:bg-kamoo-blue-800"
          >
            <Plus className="h-4 w-4" />
            Ajouter un produit
          </Link>
        </div>

        {/* Réconciliation produits ↔ Shopify (à compléter / à importer) */}
        <CatalogueReconBanner
          marketId={currentMarket.id}
          onImport={() => setImportOpen(true)}
          onShowIncomplete={() => setView("incomplete")}
        />

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
              <span className="font-medium">{VIEW_TABS.find((t) => t.id === view)?.label ?? "Tout"}</span>
              <span className="rounded bg-paper-2 px-1 text-[11px] font-medium tabular-nums text-ink-500">
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
                        view === t.id ? "font-medium text-ink-900" : "font-medium text-ink-700",
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
              <span className="font-medium">{currentSortLabel}</span>
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
                        opt.id === sortBy ? "font-medium text-ink-900" : "font-medium text-ink-700",
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

          {/* Période — à droite de la barre de filtres. */}
          <div className="ml-auto">
            <DateRangeFilter value={dateFilter} onChange={setDateFilter} />
          </div>
        </div>

        {/* CONTENU */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-line bg-white px-6 py-16 text-center shadow-kamoo-sm">
            <div className="grid h-14 w-14 place-items-center rounded-xl bg-paper-2">
              <ShoppingBag className="h-6 w-6 text-ink-400" />
            </div>
            <p className="mt-4 text-[14px] font-medium text-ink-900">
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
                className="mt-4 inline-flex h-9 items-center rounded-lg border border-line bg-white px-4 text-[12.5px] font-medium text-ink-700 transition hover:bg-paper-2"
              >
                Réinitialiser les filtres
              </button>
            ) : (
              <Link
                href="/boutique/nouveau"
                className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-kamoo-blue-900 px-4 text-[12.5px] font-medium text-white transition hover:bg-kamoo-blue-800"
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
                <span className="text-[12.5px] font-medium text-kamoo-blue-900">
                  {selectedIds.length} sélectionné{selectedIds.length > 1 ? "s" : ""}
                </span>
                <span className="mx-1 h-4 w-px bg-kamoo-blue-200" />
                {/* Publication Shopify — workflow explicite façon DSers */}
                {shopifyConnected && (
                  <BulkBtn
                    icon={ShoppingBag}
                    label="Publier sur Shopify"
                    onClick={() => setPublishOpen(true)}
                  />
                )}
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
                  className="ml-auto text-[12px] font-medium text-ink-400 hover:text-ink-700"
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
                publishStatus={getPublishStatus}
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
            <span className="ml-1 text-[11.5px] font-medium tabular-nums text-ink-700">
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

      {importOpen && (
        <ShopifyImportModal
          marketId={currentMarket.id}
          shopDomain={shopifyConn?.domain ?? ""}
          onClose={() => setImportOpen(false)}
          onImported={() => setImportOpen(false)}
        />
      )}

      {publishOpen && (
        <PublishModal
          products={all.filter((p) => selectedIds.includes(p.id))}
          shopDomain={shopifyConn?.domain ?? ""}
          alreadyPublished={(id) => getPublishStatus(id) === "publie"}
          onClose={() => setPublishOpen(false)}
          onConfirm={async () => {
            const targets = all.filter(
              (p) => selectedIds.includes(p.id) && getPublishStatus(p.id) !== "publie",
            );
            for (const p of targets) {
              await publishProduct(
                p.id,
                { name: p.name, description: p.description, priceXof: p.priceXof },
                { live: liveMode === true, shop: shopifyConn?.domain },
              );
            }
            setPublishOpen(false);
            setSelectedIds([]);
          }}
        />
      )}
    </div>
  );
}

/* ─── Modale « Publier sur Shopify » (workflow façon DSers) ─────────── */
function PublishModal({
  products,
  shopDomain,
  alreadyPublished,
  onClose,
  onConfirm,
}: {
  products: Produit[];
  shopDomain: string;
  alreadyPublished: (id: string) => boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const toPublish = products.filter((p) => !alreadyPublished(p.id));
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-kamoo-blue-900/30 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-line bg-white shadow-[var(--shadow-kamoo-lg)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h3 className="inline-flex items-center gap-2 text-[15px] font-medium text-ink-900">
            <ShoppingBag className="h-4 w-4 text-ink-400" />
            Publier sur Shopify
          </h3>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-lg text-ink-400 transition hover:bg-paper-2 hover:text-ink-900" aria-label="Fermer">
            ✕
          </button>
        </div>
        <div className="px-5 py-4">
          <p className="text-[12.5px] leading-relaxed text-ink-500">
            {toPublish.length > 0 ? (
              <>
                Ces produits seront <span className="font-medium text-ink-700">publiés sur ta boutique</span>{" "}
                <span className="font-mono-kamoo text-ink-700">{shopDomain}</span> (statut « actif »).
                Rien n&apos;est publié sans cette confirmation.
              </>
            ) : (
              <>Tous les produits sélectionnés sont déjà publiés sur Shopify.</>
            )}
          </p>
          {toPublish.length > 0 && (
            <ul className="mt-3 flex max-h-48 flex-col gap-1.5 overflow-y-auto">
              {toPublish.map((p) => (
                <li key={p.id} className="flex items-center gap-2.5 rounded-lg border border-line bg-paper-2/40 px-3 py-2">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-[14px]" style={{ background: p.bg }}>{p.emoji}</span>
                  <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-ink-900">{p.name}</span>
                  <span className="shrink-0 text-[11.5px] font-medium tabular-nums text-ink-700">{formatXOF(p.priceXof, false)} F</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="flex-1 rounded-lg border border-line bg-white py-2.5 text-[13px] font-medium text-ink-700 transition hover:bg-paper-2">
            Annuler
          </button>
          <button
            disabled={toPublish.length === 0 || busy}
            onClick={async () => {
              setBusy(true);
              await onConfirm();
            }}
            className="flex-1 rounded-lg bg-kamoo-blue-900 py-2.5 text-[13px] font-medium text-white transition hover:bg-kamoo-blue-800 disabled:opacity-40"
          >
            {busy ? "Publication…" : `Publier ${toPublish.length} produit${toPublish.length > 1 ? "s" : ""}`}
          </button>
        </div>
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
        <span className="text-[20px] font-medium leading-none tracking-tight tabular-nums text-ink-900">{value}</span>
        {suffix && <span className="text-[12px] font-medium text-ink-400">{suffix}</span>}
      </div>
    </div>
  );
}

/* ─── Tableau ───────────────────────────────────────────────────── */
function ProduitsTable({
  produits,
  getStats,
  getCover,
  isPeriodFiltered,
  publishStatus,
  selectedIds,
  onToggleSelect,
  onToggleAll,
}: {
  produits: Produit[];
  getStats: (p: Produit) => ProductStats;
  getCover: (p: Produit) => string | null;
  isPeriodFiltered: boolean;
  publishStatus: (id: string) => "non_publie" | "publie";
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
                  <div className="text-[12.5px] font-medium text-ink-900">{p.name}</div>
                  <div className="mt-0.5 font-mono-kamoo text-[11px] tabular-nums text-ink-400">{p.sku}</div>
                </div>
              </Td>
              <Td align="center">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 whitespace-nowrap tabular-nums",
                    level === "rupture"
                      ? "text-red-600"
                      : level === "bas"
                        ? "text-amber-700"
                        : "text-ink-700",
                  )}
                >
                  {level === "rupture" && <PackageX className="h-3 w-3" />}
                  {level === "bas" && <AlertTriangle className="h-3 w-3" />}
                  {p.stock} u
                </span>
              </Td>
              <Td align="right">
                <span className={cn("font-medium tabular-nums", s.soldQty > 0 ? "text-ink-900" : "text-ink-400")}>
                  {s.soldQty > 0 ? `× ${s.soldQty.toLocaleString("fr-FR")}` : "—"}
                </span>
              </Td>
              <Td align="right">
                <span className={cn("font-medium tabular-nums", s.revenueXof > 0 ? "text-ink-900" : "text-ink-400")}>
                  {s.revenueXof > 0 ? formatXOF(s.revenueXof) : "—"}
                </span>
              </Td>
              <Td align="right">
                <span className={cn("font-medium tabular-nums", s.cogsXof > 0 ? "text-ink-900" : "text-ink-400")}>
                  {s.cogsXof > 0 ? formatXOF(s.cogsXof) : "—"}
                </span>
              </Td>
              <Td align="right">
                <span className={cn("font-medium tabular-nums", s.adSpendXof > 0 ? "text-ink-900" : "text-ink-400")}>
                  {s.adSpendXof > 0 ? formatXOF(s.adSpendXof) : "—"}
                </span>
              </Td>
              <Td align="right">
                {s.revenueXof > 0 ? (
                  <span
                    className={cn(
                      "font-medium tabular-nums",
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
                      "tabular-nums",
                      s.marginPct >= 50 ? "text-emerald-700" : "text-ink-900",
                    )}
                  >
                    {s.marginPct}%
                  </span>
                ) : (
                  <span className="text-ink-400">—</span>
                )}
              </Td>
              <Td align="center">
                <div className="flex flex-col items-center gap-1">
                  {p.archived ? (
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-paper-2 px-2 py-0.5 text-[11px] font-medium text-ink-500">
                      <Archive className="h-3 w-3" />
                      Archivé
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium",
                        p.isActive ? "bg-emerald-50 text-emerald-700" : "bg-paper-2 text-ink-500",
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", p.isActive ? "bg-emerald-500" : "bg-ink-400")} />
                      {p.isActive ? "En vente" : "Inactif"}
                    </span>
                  )}
                  {publishStatus(p.id) === "publie" && (
                    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-paper-2 px-1.5 py-0.5 text-[10px] font-medium text-ink-500" title="Lié à Shopify">
                      <ShoppingBag className="h-2.5 w-2.5" /> Shopify
                    </span>
                  )}
                </div>
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
        "px-3 py-3 text-[11px] font-medium uppercase tracking-[0.06em] text-ink-400",
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
        "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[12px] font-medium transition",
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
