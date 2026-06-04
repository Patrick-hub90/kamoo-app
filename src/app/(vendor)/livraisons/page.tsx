"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  MessageCircle,
  Package,
  Search,
  Truck,
  Wallet,
} from "lucide-react";
import { StatCard } from "@/components/kamoo/stat-card";
import {
  DateRangeFilter,
  type DateFilterValue,
} from "@/components/kamoo/date-range-filter";
import {
  DropdownItem,
  FilterDropdown,
} from "@/components/kamoo/filter-dropdown";
import {
  computeDeliveryStats,
  getDeliveryItems,
  getProductsFromAssignments,
} from "@/lib/data/mock-closing";
import {
  DELIVERY_PROGRESS_LABELS,
  orderTotalQty,
  orderTotalXof,
  type ClosingAssignment,
  type DeliveryProgress,
} from "@/lib/types/closing";
import { groupByDate } from "@/lib/date-groups";
import { formatXOF } from "@/lib/format";
import { useSessionStorageState } from "@/lib/hooks/use-session-storage-state";
import {
  dateFilterSubtitle,
  filterByDateWith,
  normalizeDateFilter,
} from "@/lib/utils/date-filter";
import { MOCK_TODAY } from "@/lib/clock";
import { cn } from "@/lib/utils";

type ProgressView = "all" | DeliveryProgress;

type ViewTab = {
  id: ProgressView;
  label: string;
};

/* Ordre : Tout · En attente · Effectué · Alerte */
const VIEW_TABS: ViewTab[] = [
  { id: "all", label: "Tout" },
  { id: "en_attente", label: DELIVERY_PROGRESS_LABELS.en_attente },
  { id: "effectue", label: DELIVERY_PROGRESS_LABELS.effectue },
  { id: "alerte", label: DELIVERY_PROGRESS_LABELS.alerte },
];

/** Date pertinente pour le filtre livraisons : ETA si dispo, sinon création */
function getRelevantDate(a: ClosingAssignment): string {
  return a.delivery?.scheduledAt ?? a.createdAt;
}

export default function LivraisonsPage() {
  const all = useMemo(() => getDeliveryItems(), []);

  // Filtres persistés dans sessionStorage — survit aux navigations
  const [search, setSearch] = useSessionStorageState("livraisons.search", "");
  const [view, setView] = useSessionStorageState<ProgressView>(
    "livraisons.view",
    "all",
  );
  // Défaut "Aujourd'hui" — les KPIs reflètent l'activité du jour
  const [dateFilter, setDateFilter] = useSessionStorageState<DateFilterValue>(
    "livraisons.dateFilter",
    { preset: "today" },
  );
  const [productFilter, setProductFilter] = useSessionStorageState(
    "livraisons.productFilter",
    "all",
  );
  const [productOpen, setProductOpen] = useState(false);

  // Liste produits uniques pour le dropdown
  const allProducts = useMemo(() => getProductsFromAssignments(all), [all]);

  // Filtre date appliqué (impacte le tableau ET les stats Effectuées / CA)
  const dateFiltered = useMemo(
    () => filterByDateWith(all, dateFilter, MOCK_TODAY, getRelevantDate),
    [all, dateFilter],
  );

  // Stats : les LIVE (en cours / alertes) viennent du backlog complet,
  // les HISTORIQUES (effectue / CA encaissé / CA en attente) viennent du
  // dateFiltered. Voilà pourquoi on calcule les deux séparément.
  const liveStats = useMemo(() => computeDeliveryStats(all), [all]);
  const periodStats = useMemo(
    () => computeDeliveryStats(dateFiltered),
    [dateFiltered],
  );

  // Compteurs des onglets : reflètent la période courante
  const viewCounts: Record<ProgressView, number> = {
    all: periodStats.total,
    en_attente: periodStats.counts.en_attente,
    effectue: periodStats.counts.effectue,
    alerte: periodStats.counts.alerte,
  };

  const filtered = useMemo(() => {
    return dateFiltered.filter((a) => {
      if (view !== "all" && a.delivery?.progress !== view) return false;
      if (productFilter !== "all") {
        if (!a.items.some((i) => i.productName === productFilter)) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        if (
          !a.id.toLowerCase().includes(q) &&
          !a.items.some((i) => i.productName.toLowerCase().includes(q)) &&
          !a.client.name.toLowerCase().includes(q) &&
          !a.client.phone.toLowerCase().includes(q) &&
          !a.client.zone.toLowerCase().includes(q) &&
          !(a.delivery?.name.toLowerCase().includes(q) ?? false)
        )
          return false;
      }
      return true;
    });
  }, [dateFiltered, view, productFilter, search]);

  const grouped = useMemo(
    () =>
      groupByDate(
        filtered,
        (a) => a.delivery?.scheduledAt ?? a.createdAt,
      ),
    [filtered],
  );

  const filtersActive =
    search.length > 0 ||
    dateFilter.preset !== "all" ||
    productFilter !== "all";

  const currentProductLabel =
    productFilter === "all" ? "Tous" : productFilter;

  return (
    <div className="flex h-full flex-col">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-line bg-white px-10 py-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink-900">
            Livraisons
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Suivez l&apos;acheminement de vos commandes confirmées jusqu&apos;au
            client.
          </p>
        </div>
      </div>

      {/* STATS */}
      <div className="px-10 pt-5">
        <div className="mb-2.5 flex items-center justify-between">
          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
            Performance livraison —{" "}
            {dateFilter.preset === "all"
              ? "tout l'historique"
              : dateFilter.preset === "today"
                ? "aujourd'hui"
                : dateFilter.preset === "custom"
                  ? "période personnalisée"
                  : `${dateFilter.preset === "7j" ? "7 jours" : dateFilter.preset === "30j" ? "30 jours" : "3 mois"}`}
          </div>
          <DateRangeFilter value={dateFilter} onChange={setDateFilter} />
        </div>
        <div className="grid grid-cols-4 gap-3">
          {/* LIVE — état actuel du pipeline (indépendant de la période) */}
          <StatCard
            label="En cours"
            value={liveStats.counts.en_attente + liveStats.counts.alerte}
            icon={<Truck className="h-4 w-4" />}
            tone="blue"
            badge={liveStats.counts.alerte > 0}
          />
          <StatCard
            label="CA en attente"
            value={formatXOF(liveStats.revenueExpected, false)}
            unit="F CFA"
            icon={<Package className="h-4 w-4" />}
            tone="orange"
          />
          {/* HISTORIQUE — suit la période sélectionnée */}
          <StatCard
            label="Effectuées"
            value={periodStats.counts.effectue}
            icon={<CheckCircle2 className="h-4 w-4" />}
            tone="green"
            highlight={periodStats.counts.effectue > 0}
          />
          <StatCard
            label="CA encaissé"
            value={formatXOF(periodStats.revenueCollected, false)}
            unit="F CFA"
            icon={<Wallet className="h-4 w-4" />}
            tone="green"
          />
        </div>
      </div>

      {/* ONGLETS */}
      <div className="mt-5 border-b border-line bg-white px-10">
        <div className="flex items-center gap-1">
          {VIEW_TABS.map((tab) => {
            const count = viewCounts[tab.id];
            const isActive = view === tab.id;
            const isAlerteTab = tab.id === "alerte" && count > 0;
            return (
              <button
                key={tab.id}
                onClick={() => setView(tab.id)}
                className={cn(
                  "relative inline-flex items-center gap-2 px-4 py-3 text-[13px] font-semibold transition",
                  isActive
                    ? "text-ink-900"
                    : "text-ink-500 hover:text-ink-700",
                )}
              >
                <span>{tab.label}</span>
                <span className="relative inline-flex items-center justify-center">
                  {isAlerteTab && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  )}
                  <span
                    className={cn(
                      "relative inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold",
                      isAlerteTab
                        ? "bg-red-500 text-white"
                        : isActive
                          ? "bg-kamoo-blue-50 text-kamoo-blue-700"
                          : "bg-paper-2 text-ink-700",
                    )}
                  >
                    {count}
                  </span>
                </span>
                {isActive && (
                  <span
                    className={cn(
                      "absolute inset-x-0 bottom-[-1px] h-[3px] rounded-t",
                      isAlerteTab ? "bg-red-500" : "bg-kamoo-orange-500",
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* RECHERCHE + FILTRES */}
      <div className="border-b border-line bg-paper-2/60 px-10 py-3">
        <div className="flex items-center gap-3">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              placeholder="Code, produit, client, zone ou livreur…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-[13px] outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600"
            />
          </div>

          {/* Filtre Produit */}
          <FilterDropdown
            label="Produit"
            value={currentProductLabel}
            isActive={productFilter !== "all"}
            isOpen={productOpen}
            onToggle={() => setProductOpen(!productOpen)}
            onClose={() => setProductOpen(false)}
            width="w-72"
          >
            <DropdownItem
              active={productFilter === "all"}
              onClick={() => {
                setProductFilter("all");
                setProductOpen(false);
              }}
            >
              Tous les produits
            </DropdownItem>
            {allProducts.map((p) => (
              <DropdownItem
                key={p.name}
                active={productFilter === p.name}
                onClick={() => {
                  setProductFilter(p.name);
                  setProductOpen(false);
                }}
              >
                <span className="flex items-center gap-2">
                  <span>{p.emoji}</span>
                  <span className="truncate">{p.name}</span>
                </span>
              </DropdownItem>
            ))}
          </FilterDropdown>

          {/* Pill « Période active » — visible quand un filtre période est posé */}
          {dateFilter.preset !== "all" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-kamoo-orange-50 px-3 py-1 text-[12px] font-bold text-kamoo-orange-700 ring-1 ring-kamoo-orange-200">
              <span className="text-[10px] uppercase tracking-wider opacity-70">
                Période ·
              </span>
              {dateFilterSubtitle(normalizeDateFilter(dateFilter))}
              <button
                type="button"
                onClick={() => setDateFilter({ preset: "all" })}
                title="Retirer le filtre période"
                className="ml-0.5 grid h-4 w-4 place-items-center rounded-full text-kamoo-orange-700 hover:bg-kamoo-orange-200"
              >
                ✕
              </button>
            </span>
          )}

          {filtersActive && (
            <button
              onClick={() => {
                setSearch("");
                setDateFilter({ preset: "all" });
                setProductFilter("all");
              }}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-bold text-kamoo-orange-600 hover:bg-kamoo-orange-50"
            >
              Effacer
            </button>
          )}

          <div className="flex-1" />
          <div className="whitespace-nowrap text-[12px] font-semibold text-ink-500">
            {filtered.length} sur {all.length} livraison
            {all.length > 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* TABLEAU */}
      <div className="flex min-h-0 flex-1 items-start px-10 py-4">
        {filtered.length === 0 ? (
          <div className="grid w-full place-items-center rounded-2xl border border-dashed border-line bg-white py-20 text-center">
            <div className="text-3xl">🚚</div>
            <p className="mt-3 text-sm font-semibold text-ink-700">
              Aucune livraison ne correspond à vos filtres
            </p>
          </div>
        ) : (
          <DeliveriesTable groups={grouped} />
        )}
      </div>
    </div>
  );
}

/* ─── Tableau ──────────────────────────────────────────── */

function DeliveriesTable({
  groups,
}: {
  groups: { label: string; items: ClosingAssignment[] }[];
}) {
  const router = useRouter();
  return (
    <div
      className="always-show-scrollbar w-full rounded-2xl border border-line bg-white"
      style={{
        maxHeight: "100%",
        overflowX: "scroll",
        overflowY: "auto",
        scrollbarColor: "#D1D5DB #F5F5EE",
        scrollbarWidth: "thin",
      }}
    >
        <table className="w-full min-w-[1280px] table-fixed text-[13px]">
          <colgroup>
            <col style={{ width: "150px" }} />
            <col style={{ width: "230px" }} />
            <col style={{ width: "60px" }} />
            <col style={{ width: "115px" }} />
            <col style={{ width: "180px" }} />
            <col style={{ width: "145px" }} />
            <col style={{ width: "85px" }} />
            <col style={{ width: "150px" }} />
            <col style={{ width: "180px" }} />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-paper-2/95 backdrop-blur-sm">
            <tr className="border-b border-line text-left">
              <Th>N°</Th>
              <Th>Produit</Th>
              <Th align="center">Qté</Th>
              <Th align="right">Total</Th>
              <Th>Client</Th>
              <Th>Téléphone</Th>
              <Th align="center">WhatsApp</Th>
              <Th align="center">Statut</Th>
              <Th>Commentaire livreur</Th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <FragmentGroup
                key={group.label}
                label={group.label}
                items={group.items}
                onClickRow={(id) => router.push(`/livraisons/${id}`)}
              />
            ))}
          </tbody>
        </table>
    </div>
  );
}

function FragmentGroup({
  label,
  items,
  onClickRow,
}: {
  label: string;
  items: ClosingAssignment[];
  onClickRow: (id: string) => void;
}) {
  return (
    <>
      <tr className="bg-paper-2/60">
        <td
          colSpan={9}
          className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-ink-500"
        >
          {label}{" "}
          <span className="font-medium normal-case text-ink-400">
            · {items.length} livraison{items.length > 1 ? "s" : ""}
          </span>
        </td>
      </tr>
      {items.map((a) => {
        const d = a.delivery!;
        const isAlerte = d.progress === "alerte";
        return (
          <tr
            key={a.id}
            onClick={() => onClickRow(a.id)}
            className={cn(
              "cursor-pointer border-b border-line last:border-0 transition",
              isAlerte ? "bg-red-50/40 hover:bg-red-50" : "hover:bg-paper-2/30",
            )}
          >
            <Td>
              <span className="font-mono-kamoo text-[11.5px] text-ink-500">
                {a.id}
              </span>
            </Td>
            <Td>
              <div className="flex items-center gap-1.5">
                <span
                  className="block truncate font-semibold text-ink-900"
                  title={a.items.map((i) => i.productName).join(" · ")}
                >
                  {a.items[0].productName}
                </span>
                {a.items.length > 1 && (
                  <span className="shrink-0 rounded-full bg-kamoo-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-kamoo-blue-700">
                    +{a.items.length - 1}
                  </span>
                )}
              </div>
            </Td>
            <Td align="center">
              <span className="font-bold text-ink-900">
                ×{orderTotalQty(a)}
              </span>
            </Td>
            <Td align="right">
              <span className="font-bold text-ink-900">
                {formatXOF(orderTotalXof(a))}
              </span>
            </Td>
            <Td>
              <div>
                <span className="font-semibold text-ink-900">
                  {a.client.name}
                </span>
                <div className="text-[11px] text-ink-500">
                  {a.client.zone} · {a.client.city}
                </div>
              </div>
            </Td>
            <Td>
              <a
                href={`tel:${a.client.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="font-mono-kamoo text-[12px] text-ink-700 hover:text-kamoo-blue-700"
              >
                {a.client.phone}
              </a>
            </Td>
            <Td align="center">
              {a.client.whatsapp ? (
                <a
                  href={`https://wa.me/${a.client.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center justify-center text-emerald-600 hover:text-emerald-700"
                  title="WhatsApp"
                >
                  <MessageCircle className="h-4 w-4" />
                </a>
              ) : (
                <span className="text-[11px] text-ink-300">—</span>
              )}
            </Td>
            <Td align="center">
              <ProgressBadge progress={d.progress} />
            </Td>
            <Td>
              {d.livreurNote ? (
                <span
                  className={cn(
                    "block truncate text-[12px] italic",
                    isAlerte ? "text-red-700" : "text-ink-700",
                  )}
                  title={d.livreurNote}
                >
                  {d.livreurNote}
                </span>
              ) : (
                <span className="text-[11px] text-ink-300">—</span>
              )}
            </Td>
          </tr>
        );
      })}
    </>
  );
}

/**
 * Badge progress livreur (3 styles distincts) :
 *  - En attente : hollow ambré (bordure + bg léger, texte amber-800)
 *  - Effectué   : plein vert
 *  - Alerte     : hollow rouge avec icône AlertTriangle
 */
function ProgressBadge({ progress }: { progress: DeliveryProgress }) {
  if (progress === "effectue") {
    return (
      <span className="inline-flex w-[125px] items-center justify-center rounded-full bg-emerald-600 px-2 py-1 text-[11.5px] font-bold text-white whitespace-nowrap">
        {DELIVERY_PROGRESS_LABELS.effectue}
      </span>
    );
  }
  if (progress === "alerte") {
    return (
      <span className="inline-flex w-[125px] items-center justify-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[11.5px] font-bold text-red-700 ring-1 ring-inset ring-red-300 whitespace-nowrap">
        <AlertTriangle className="h-3 w-3" />
        {DELIVERY_PROGRESS_LABELS.alerte}
      </span>
    );
  }
  // en_attente — hollow jaune-marron
  return (
    <span className="inline-flex w-[125px] items-center justify-center rounded-full bg-amber-50 px-2 py-1 text-[11.5px] font-bold text-amber-800 ring-1 ring-inset ring-amber-300 whitespace-nowrap">
      {DELIVERY_PROGRESS_LABELS.en_attente}
    </span>
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
