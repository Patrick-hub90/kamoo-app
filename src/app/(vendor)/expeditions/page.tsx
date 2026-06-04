"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Plus, Search, X } from "lucide-react";
import {
  ExpeditionRow,
  ExpeditionRowHeader,
} from "@/components/console/expeditions/expedition-row";
import {
  DateRangeFilter,
  type DateFilterValue,
} from "@/components/kamoo/date-range-filter";
import {
  MOCK_EXPEDITIONS,
  computeListStats,
} from "@/lib/data/mock-expeditions";
import { formatXOF } from "@/lib/format";
import {
  filterByDateWith,
  normalizeDateFilter,
} from "@/lib/utils/date-filter";
import { MOCK_TODAY } from "@/lib/clock";
import { useSessionStorageState } from "@/lib/hooks/use-session-storage-state";
import { cn } from "@/lib/utils";

/* Tabs : action requise en premier (priorité), puis en transit, arrivées, tout.
   Le filtre statut détaillé a été retiré — la tab suffit. */
type TabFilter = "action" | "transit" | "arrivees" | "all";

/**
 * Page liste des expéditions — flight schedule board.
 *
 * Layout aligné sur le design ref `console-expeditions.jsx` :
 *  - Page header (titre + CTA orange "Nouvelle expédition")
 *  - Bannière succès post-création (auto-dismiss 6s)
 *  - 4 stats cards (En cours / Action requise / Arrivées mois / À payer)
 *    avec icon coloré + tone + LiveDot orange si urgent
 *  - Tabs (En cours / Arrivées / Tout) + filtres droite (Statut/Transitaire/Période)
 *  - Flight board : table 8 colonnes alignées avec progression Chine→Dakar
 *    pour chaque ligne. Highlight orange si urgent.
 */
export default function ExpeditionsListPage() {
  const expeditions = MOCK_EXPEDITIONS;
  const stats = computeListStats(expeditions);

  /* État persisté en sessionStorage → survit à la navigation. */
  const [tab, setTab] = useSessionStorageState<TabFilter>(
    "expeditions.tab",
    "action",
  );
  const [search, setSearch] = useSessionStorageState<string>(
    "expeditions.search",
    "",
  );
  const [dateFilter, setDateFilter] = useSessionStorageState<DateFilterValue>(
    "expeditions.dateFilter",
    { preset: "all" },
  );

  /* Bannière de succès post-création (flag posé par /expeditions/nouvelle) */
  const [justCreatedFlag, setJustCreatedFlag] = useState<{
    colis: number;
  } | null>(null);
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
      // sessionStorage indispo (mode privé) — ignore
    }
  }, []);

  /* Filtrage : tab + recherche + période */
  const filtered = useMemo(() => {
    const normalizedDate = normalizeDateFilter(dateFilter);
    const byDate = filterByDateWith(
      expeditions,
      normalizedDate,
      MOCK_TODAY,
      (e) => e.createdAt,
    );
    return byDate.filter((e) => {
      // Tab principal — filtrage prioritaire
      const isActionRequired =
        e.paymentStatus === "unpaid" && e.amountXof !== null;
      if (tab === "action" && !isActionRequired) return false;
      if (tab === "transit") {
        // En transit = en route, payée (ou pas d'action urgente) et pas
        // encore arrivée
        if (e.status === "arrived_destination") return false;
        if (isActionRequired) return false;
      }
      if (tab === "arrivees" && e.status !== "arrived_destination") return false;
      // Recherche
      if (search) {
        const q = search.toLowerCase();
        if (
          !e.publicCode.toLowerCase().includes(q) &&
          !e.productName.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [expeditions, tab, dateFilter, search]);

  /* Tri par priorité : urgent > arrivé > attente devis > en route */
  const sorted = useMemo(() => sortByPriority(filtered), [filtered]);

  const filtersActive = search.length > 0 || dateFilter.preset !== "all";

  const clearFilters = () => {
    setSearch("");
    setDateFilter({ preset: "all" });
  };

  /* Counts par tab pour les badges — action requise en premier */
  const tabCounts = useMemo(
    () => ({
      action: expeditions.filter(
        (e) => e.paymentStatus === "unpaid" && e.amountXof !== null,
      ).length,
      transit: expeditions.filter(
        (e) =>
          e.status !== "arrived_destination" &&
          !(e.paymentStatus === "unpaid" && e.amountXof !== null),
      ).length,
      arrivees: expeditions.filter(
        (e) => e.status === "arrived_destination",
      ).length,
      all: expeditions.length,
    }),
    [expeditions],
  );

  return (
    <div className="flex h-full flex-col">
      {/* PAGE HEADER — slim, juste titre + CTA. Le contexte (À traiter,
          En transit…) est porté par les tabs et le titre contextuel
          au-dessus de la liste. */}
      <div className="flex items-center justify-between gap-4 border-b border-line bg-white px-4 py-3.5 sm:px-6 lg:px-7">
        <h1
          className="font-display text-[22px] font-extrabold tracking-tight text-ink-900"
          style={{ letterSpacing: "-0.02em" }}
        >
          Mes expéditions
        </h1>
        <Link
          href="/expeditions/nouvelle"
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-kamoo-orange-500 px-3.5 text-[13px] font-bold text-white transition hover:bg-kamoo-orange-600"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="whitespace-nowrap">Nouvelle expédition</span>
        </Link>
      </div>

      {/* BODY scroll */}
      <div className="flex-1 overflow-y-auto bg-paper">
        <div className="flex flex-col gap-4 px-4 py-6 sm:px-6 lg:px-7">
          {/* BANNIÈRE SUCCÈS — post-création */}
          {justCreatedFlag && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <Check className="h-4 w-4 shrink-0 text-emerald-700" />
              <div className="flex-1 text-[13px] text-emerald-900">
                <b>Expédition envoyée au transitaire.</b> Tu recevras une
                notification dès qu&apos;elle sera réceptionnée en Chine
                ({justCreatedFlag.colis} colis).
              </div>
              <button
                type="button"
                onClick={() => setJustCreatedFlag(null)}
                className="text-emerald-700 hover:text-emerald-900"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}


          {/* TABS + FILTRES — sur mobile : tabs sur une ligne (scroll
              horizontal si besoin), puis filtres sur la ligne suivante en
              pleine largeur. Sur desktop : tout sur la même ligne. */}
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
            {/* Tabs scrollables horizontalement sur mobile */}
            <div className="scrollbar-hide -mx-1 overflow-x-auto px-1">
              <div className="inline-flex items-stretch gap-1 rounded-lg border border-line bg-white p-1">
                {(
                  [
                    { id: "action", label: "À traiter" },
                    { id: "transit", label: "En transit" },
                    { id: "arrivees", label: "Arrivées" },
                    { id: "all", label: "Toutes" },
                  ] as const
                ).map((t) => {
                  const isActive = tab === t.id;
                  const isActionTab = t.id === "action";
                  const hasItems = tabCounts[t.id] > 0;
                  /* Tab « Action requise » : style spécial orange quand il y
                     a vraiment des actions à faire (sinon ton normal) */
                  const actionHighlight = isActionTab && hasItems && !isActive;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className={cn(
                        "inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-[13px] font-semibold transition",
                        isActive
                          ? isActionTab
                            ? "bg-kamoo-orange-500 text-white"
                            : "bg-kamoo-blue-900 text-white"
                          : actionHighlight
                            ? "text-kamoo-orange-700 hover:bg-kamoo-orange-50"
                            : "text-ink-700 hover:bg-paper-2",
                      )}
                    >
                      {t.label}
                      <span
                        className={cn(
                          "rounded px-1.5 py-px font-mono-kamoo text-[10px] font-bold",
                          isActive
                            ? "bg-white/20 text-white"
                            : actionHighlight
                              ? "bg-kamoo-orange-100 text-kamoo-orange-700"
                              : "bg-paper-2 text-ink-500",
                        )}
                      >
                        {tabCounts[t.id]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="hidden flex-1 lg:block" />

            {/* Bloc filtres — pleine largeur sur mobile, à droite sur desktop */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Recherche — full width sur mobile, fixe sur sm+ */}
              <div className="relative w-full min-w-[180px] sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
                <input
                  type="search"
                  placeholder="Code ou produit…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-[13px] outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600"
                />
              </div>

              {/* Filtre période */}
              <DateRangeFilter value={dateFilter} onChange={setDateFilter} />

              {/* Effacer */}
              {filtersActive && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-bold text-kamoo-orange-600 transition hover:bg-kamoo-orange-50"
                >
                  <X className="h-3 w-3" />
                  Effacer
                </button>
              )}
            </div>
          </div>

          {/* Titre contextuel — change selon la tab active. Donne en 1 ligne
              ce qu'il y a dans la vue + un sous-titre orienté action. */}
          <ContextualHeading
            tab={tab}
            counts={tabCounts}
            totalAPayer={stats.totalAPayer}
          />

          {/* LISTE — table compacte (colonnes rétrécies pour tenir sans
              déborder), scroll horizontal seulement si < min-w */}
          {sorted.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-line bg-white py-20 text-center">
              <div className="text-3xl">🔍</div>
              <p className="mt-3 text-sm font-semibold text-ink-700">
                Aucune expédition ne correspond à tes filtres
              </p>
              <button
                onClick={clearFilters}
                className="mt-3 text-[13px] font-bold text-kamoo-orange-600 hover:underline"
              >
                Effacer les filtres
              </button>
            </div>
          ) : (
            <div
              className="always-show-scrollbar w-full rounded-2xl border border-line bg-white"
              style={{
                overflowX: "auto",
                overflowY: "hidden",
                scrollbarColor: "#D1D5DB #F5F5EE",
                scrollbarWidth: "thin",
              }}
            >
              <div className="w-full min-w-[1020px]">
                <ExpeditionRowHeader />
                {sorted.map((e, i) => (
                  <ExpeditionRow key={e.id} expedition={e} isFirst={i === 0} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Titre contextuel selon la tab active ────────────────────────── */

/**
 * Affiche un mini-titre + sous-titre orienté action selon la tab active.
 */
function ContextualHeading({
  tab,
  counts,
  totalAPayer,
}: {
  tab: TabFilter;
  counts: { action: number; transit: number; arrivees: number; all: number };
  totalAPayer: number;
}) {
  let title: string;
  let sub: string;

  if (tab === "action") {
    title = "À traiter";
    sub =
      counts.action === 0
        ? "Aucune expédition bloquée — tout est sous contrôle"
        : `${formatXOF(totalAPayer, false)} F à régler · ${counts.action} expédition${counts.action > 1 ? "s" : ""} bloquée${counts.action > 1 ? "s" : ""}`;
  } else if (tab === "transit") {
    title = "En transit";
    sub = `${counts.transit} colis en route Chine → Dakar`;
  } else if (tab === "arrivees") {
    title = "Arrivées";
    sub = `${counts.arrivees} colis livré${counts.arrivees > 1 ? "s" : ""} à Dakar`;
  } else {
    title = "Toutes les expéditions";
    sub = `${counts.all} au total`;
  }

  return (
    <div>
      <h2
        className="font-display text-[17px] font-extrabold tracking-tight text-ink-900"
        style={{ letterSpacing: "-0.02em" }}
      >
        {title}
      </h2>
      <p className="mt-0.5 text-[12.5px] text-ink-500">{sub}</p>
    </div>
  );
}

/* ─── Tri par priorité ─────────────────────────────────────────────── */

/**
 * Trie les expéditions par ordre d'attention requise :
 *  0. À payer urgent (unpaid + amount défini)
 *  1. Arrivées — colis à récupérer
 *  2. En attente de devis — surveillance passive
 *  3. En route (payées + en transit) — pas d'action immédiate
 */
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
