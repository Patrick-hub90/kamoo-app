"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Package,
  Plane,
  Plus,
  Search,
  Ship,
  Wallet,
  X,
} from "lucide-react";
import {
  ExpeditionRow,
  ExpeditionRowHeader,
} from "@/components/console/expeditions/expedition-row";
import {
  DateRangeFilter,
  type DateFilterValue,
} from "@/components/kamoo/date-range-filter";
import { MOCK_EXPEDITIONS } from "@/lib/data/mock-expeditions";
import { formatXOF } from "@/lib/format";
import { filterByDateWith, normalizeDateFilter } from "@/lib/utils/date-filter";
import { MOCK_TODAY } from "@/lib/clock";
import { NotificationsBell } from "@/components/kamoo/notifications-bell";
import { useSessionStorageState } from "@/lib/hooks/use-session-storage-state";
import { cn } from "@/lib/utils";

type TabFilter = "action" | "transit" | "arrivees" | "all";

const TABS: { id: TabFilter; label: string }[] = [
  { id: "all", label: "Tous les statuts" },
  { id: "action", label: "À traiter" },
  { id: "transit", label: "En transit" },
  { id: "arrivees", label: "Arrivées" },
];

/**
 * Liste des expéditions — design validé (mockup user) : header + KPI cards +
 * barre de filtres + tableau + pagination. Couleur d'attention en ROUGE.
 */
export default function ExpeditionsListPage() {
  const expeditions = MOCK_EXPEDITIONS;

  const [tab, setTab] = useSessionStorageState<TabFilter>("expeditions.tab", "all");
  const [search, setSearch] = useSessionStorageState<string>("expeditions.search", "");
  const [dateFilter, setDateFilter] = useSessionStorageState<DateFilterValue>(
    "expeditions.dateFilter",
    { preset: "all" },
  );
  const [viewOpen, setViewOpen] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);

  const [justCreatedFlag, setJustCreatedFlag] = useState<{ colis: number } | null>(null);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("expedition.justCreated");
      if (raw) {
        const parsed = JSON.parse(raw) as { colis?: number };
        setJustCreatedFlag({ colis: parsed.colis ?? 1 });
        sessionStorage.removeItem("expedition.justCreated");
        const t = setTimeout(() => setJustCreatedFlag(null), 6000);
        return () => clearTimeout(t);
      }
    } catch {
      // ignore
    }
  }, []);

  const filtered = useMemo(() => {
    const normalizedDate = normalizeDateFilter(dateFilter);
    const byDate = filterByDateWith(expeditions, normalizedDate, MOCK_TODAY, (e) => e.createdAt);
    return byDate.filter((e) => {
      const isActionRequired = e.paymentStatus === "unpaid" && e.amountXof !== null;
      if (tab === "action" && !isActionRequired) return false;
      if (tab === "transit") {
        if (e.status === "arrived_destination") return false;
        if (isActionRequired) return false;
      }
      if (tab === "arrivees" && e.status !== "arrived_destination") return false;
      if (search) {
        const q = search.toLowerCase();
        if (!e.publicCode.toLowerCase().includes(q) && !e.productName.toLowerCase().includes(q))
          return false;
      }
      return true;
    });
  }, [expeditions, tab, dateFilter, search]);

  const sorted = useMemo(() => sortByPriority(filtered), [filtered]);
  const filtersActive = search.length > 0 || dateFilter.preset !== "all" || tab !== "all";
  const clearFilters = () => {
    setSearch("");
    setDateFilter({ preset: "all" });
    setTab("all");
  };

  const tabCounts = useMemo(
    () => ({
      all: expeditions.length,
      action: expeditions.filter((e) => e.paymentStatus === "unpaid" && e.amountXof !== null).length,
      transit: expeditions.filter(
        (e) =>
          e.status !== "arrived_destination" &&
          !(e.paymentStatus === "unpaid" && e.amountXof !== null),
      ).length,
      arrivees: expeditions.filter((e) => e.status === "arrived_destination").length,
    }),
    [expeditions],
  );

  const montantEnAttente = useMemo(
    () =>
      expeditions
        .filter((e) => e.paymentStatus === "unpaid" && e.amountXof !== null)
        .reduce((s, e) => s + (e.amountXof ?? 0), 0),
    [expeditions],
  );

  return (
    <div className="min-h-full bg-paper">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-5 px-6 py-6">
        {/* HEADER */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-bold tracking-tight text-ink-900">Expéditions</h1>
            <p className="mt-1 text-[13px] text-ink-500">
              Suivez et gérez toutes vos expéditions en temps réel.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <NotificationsBell />
            <Link
              href="/expeditions/nouvelle"
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-kamoo-blue-900 px-4 text-[13px] font-semibold text-white transition hover:bg-kamoo-blue-800"
            >
              <Plus className="h-4 w-4" />
              Nouvelle expédition
            </Link>
          </div>
        </div>

        {/* Bannière succès */}
        {justCreatedFlag && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <Check className="h-4 w-4 shrink-0 text-emerald-700" />
            <div className="flex-1 text-[13px] text-emerald-900">
              <b>Expédition envoyée au transitaire.</b> Tu recevras une notification dès qu&apos;elle
              sera réceptionnée en Chine ({justCreatedFlag.colis} colis).
            </div>
            <button type="button" onClick={() => setJustCreatedFlag(null)} className="text-emerald-700 hover:text-emerald-900" aria-label="Fermer">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* KPI */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <KpiCard icon={Package} tone="blue" label="Total expéditions" value={String(tabCounts.all)} sub="Toutes périodes" />
          <KpiCard icon={AlertTriangle} tone="red" label="Actions requises" value={String(tabCounts.action)} sub="À traiter" />
          <KpiCard icon={Ship} tone="blue" label="En transit" value={String(tabCounts.transit)} sub="Expéditions" />
          <KpiCard icon={Plane} tone="green" label="Arrivées" value={String(tabCounts.arrivees)} sub="Réceptionnées" />
          <KpiCard icon={Wallet} tone="purple" label="Montant en attente" value={`${formatXOF(montantEnAttente, false)} F`} sub="À régler" />
        </div>

        {/* Barre de filtres (en carte) */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-white p-3 shadow-kamoo-sm">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              placeholder="Rechercher par code ou produit…"
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
              <span className="font-semibold">{TABS.find((t) => t.id === tab)?.label ?? "Tous les statuts"}</span>
              {tab === "action" && tabCounts.action > 0 && (
                <span className="rounded bg-red-50 px-1 text-[11px] font-semibold tabular-nums text-red-600">
                  {tabCounts.action}
                </span>
              )}
              <ChevronDown className="h-3.5 w-3.5 text-ink-400" />
            </button>
            {viewOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setViewOpen(false)} />
                <div className="absolute left-0 top-[calc(100%+4px)] z-20 w-56 rounded-xl border border-line bg-white p-1 shadow-[var(--shadow-kamoo-lg)]">
                  {TABS.map((t) => {
                    const isAction = t.id === "action";
                    const hasItems = tabCounts[t.id] > 0;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setTab(t.id);
                          setViewOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-1.5 text-[12.5px] transition hover:bg-paper-2",
                          tab === t.id ? "font-semibold text-ink-900" : "font-medium text-ink-700",
                        )}
                      >
                        <span>{t.label}</span>
                        <span className="flex items-center gap-2">
                          <span className={cn("tabular-nums", isAction && hasItems ? "font-bold text-red-600" : "text-ink-400")}>
                            {tabCounts[t.id]}
                          </span>
                          {tab === t.id && <Check className="h-3.5 w-3.5 text-kamoo-blue-700" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <DateRangeFilter value={dateFilter} onChange={setDateFilter} />
            {filtersActive && (
              <button
                onClick={clearFilters}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-semibold text-ink-500 transition hover:bg-paper-2 hover:text-ink-900"
              >
                <X className="h-3.5 w-3.5" />
                Effacer
              </button>
            )}
          </div>
        </div>

        {/* Tableau (en carte) */}
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-line bg-white px-6 py-16 text-center shadow-kamoo-sm">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-paper-2">
              <Search className="h-6 w-6 text-ink-400" />
            </div>
            <p className="mt-4 text-[15px] font-semibold text-ink-900">
              Aucune expédition ne correspond à tes filtres
            </p>
            <button
              onClick={clearFilters}
              className="mt-4 inline-flex h-9 items-center rounded-lg border border-line bg-white px-4 text-[12.5px] font-semibold text-ink-700 transition hover:bg-paper-2"
            >
              Effacer les filtres
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-line bg-white shadow-kamoo-sm">
            <div className="overflow-x-auto">
              <div className="min-w-[1040px]">
                <ExpeditionRowHeader />
                {sorted.slice(0, pageSize).map((e, i) => (
                  <ExpeditionRow key={e.id} expedition={e} isFirst={i === 0} />
                ))}
              </div>
            </div>

            {/* Pagination */}
            <div className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-3 text-[12px] text-ink-500">
              <span>Affichage</span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setPageSizeOpen(!pageSizeOpen)}
                  className="inline-flex h-7 items-center gap-1 rounded-md border border-line bg-white px-2 font-semibold text-ink-700 transition hover:bg-paper-2"
                >
                  {pageSize}
                  <ChevronDown className="h-3 w-3 text-ink-400" />
                </button>
                {pageSizeOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setPageSizeOpen(false)} />
                    <div className="absolute bottom-[calc(100%+4px)] left-0 z-20 w-24 rounded-lg border border-line bg-white p-1 shadow-[var(--shadow-kamoo-lg)]">
                      {[10, 50, 100].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => {
                            setPageSize(n);
                            setPageSizeOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center justify-between rounded-md px-2 py-1 text-[12px] transition hover:bg-paper-2",
                            pageSize === n ? "font-semibold text-ink-900" : "text-ink-700",
                          )}
                        >
                          {n}
                          {pageSize === n && <Check className="h-3 w-3 text-kamoo-blue-700" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <span>
                sur {sorted.length} expédition{sorted.length > 1 ? "s" : ""}
              </span>
              <div className="ml-auto flex items-center gap-1.5">
                <PageBtn disabled>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </PageBtn>
                <span className="grid h-7 min-w-7 place-items-center rounded-md bg-kamoo-blue-900 px-2 text-[12px] font-semibold text-white">
                  1
                </span>
                <span className="px-1 text-[12px] text-ink-400">
                  de {Math.max(1, Math.ceil(sorted.length / pageSize))}
                </span>
                <PageBtn disabled>
                  <ChevronRight className="h-3.5 w-3.5" />
                </PageBtn>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── KPI card ──────────────────────────────────────────────────── */
function KpiCard({
  icon: Icon,
  tone,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: "blue" | "red" | "green" | "purple";
  label: string;
  value: string;
  sub: string;
}) {
  const tones: Record<string, string> = {
    blue: "bg-kamoo-blue-50 text-kamoo-blue-700",
    red: "bg-red-50 text-red-600",
    green: "bg-emerald-50 text-emerald-700",
    purple: "bg-purple-50 text-purple-700",
  };
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3.5 shadow-kamoo-sm">
      <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl", tones[tone])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-[11px] font-medium text-ink-500">{label}</div>
        <div className="text-[19px] font-bold leading-tight tracking-tight tabular-nums text-ink-900">{value}</div>
        <div className="truncate text-[10.5px] text-ink-400">{sub}</div>
      </div>
    </div>
  );
}

function PageBtn({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className="grid h-7 w-7 place-items-center rounded-md border border-line bg-white text-ink-500 transition hover:bg-paper-2 hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

/* ─── Tri par priorité ──────────────────────────────────────────── */
function sortByPriority(
  expeditions: import("@/lib/types/expedition").Expedition[],
): import("@/lib/types/expedition").Expedition[] {
  const priorityOf = (e: import("@/lib/types/expedition").Expedition) => {
    if (e.paymentStatus === "unpaid" && e.amountXof !== null) return 0;
    if (e.status === "arrived_destination") return 1;
    if (e.status === "awaiting_quote") return 2;
    return 3;
  };
  return [...expeditions].sort((a, b) => priorityOf(a) - priorityOf(b));
}
