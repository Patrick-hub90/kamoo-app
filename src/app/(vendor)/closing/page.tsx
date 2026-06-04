"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowUpDown,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Clock,
  ExternalLink,
  ListFilter,
  MessageCircle,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Star,
  X as XIcon,
} from "lucide-react";
import {
  DateRangeFilter,
  type DateFilterValue,
} from "@/components/kamoo/date-range-filter";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { MinimalKpi } from "@/components/kamoo/minimal-kpi";
import {
  MOCK_CLOSING_ASSIGNMENTS,
  MOCK_ACTIVE_CLOSEUSE,
  computeClosingStats,
} from "@/lib/data/mock-closing";
import { MOCK_PRODUITS } from "@/lib/data/mock-produits";
import { useSessionStorageState } from "@/lib/hooks/use-session-storage-state";
import {
  CLOSING_STATUS_LABELS,
  CANCELLATION_REASON_LABELS,
  type ClosingAssignment,
  type ClosingStatus,
} from "@/lib/types/closing";
import { formatXOF } from "@/lib/format";
import { MonoLabel } from "@/components/console/primitives";
import { MOCK_TODAY } from "@/lib/clock";
import { cn } from "@/lib/utils";

/* Produits présents dans les commandes (sélection multiple, par nom). */
const PRODUCT_OPTIONS: { name: string; emoji: string; bg: string }[] = (() => {
  const map = new Map<string, { name: string; emoji: string; bg: string }>();
  for (const a of MOCK_CLOSING_ASSIGNMENTS) {
    for (const i of a.items) {
      if (!map.has(i.productName)) {
        map.set(i.productName, {
          name: i.productName,
          emoji: i.productEmoji,
          bg: i.productBg,
        });
      }
    }
  }
  return [...map.values()].sort((x, y) => x.name.localeCompare(y.name));
})();

/* Onglets = filtres par statut au-dessus du tableau (Toutes + chaque statut). */
type TabId = "all" | ClosingStatus;
const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "Toutes" },
  { id: "nouvelle", label: "Nouvelle" },
  { id: "rappele", label: "Rappelé" },
  { id: "injoignable", label: "Injoignable" },
  { id: "livraison_en_cours", label: "En cours" },
  { id: "livre", label: "Livré" },
  { id: "annule", label: "Annulé" },
];

/** Une commande est « à appeler » tant que la closeuse doit la travailler :
 *  nouvelle (jamais appelée), rappele (rappel programmé), injoignable
 *  (à retenter). Sert au KPI « À traiter ». */
function needsCall(s: ClosingStatus): boolean {
  return s === "nouvelle" || s === "rappele" || s === "injoignable";
}

/* Options de tri */
type SortKey = "recent" | "amount-desc" | "amount-asc" | "status";
const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "recent", label: "Plus récent" },
  { id: "amount-desc", label: "Montant ↓" },
  { id: "amount-asc", label: "Montant ↑" },
  { id: "status", label: "Statut" },
];

/**
 * Couleurs des pastilles statut (mapping validé) :
 *  - Nouvelle              → bleu clair       (sky-100 / sky-800)
 *  - Livraison en cours    → cyan vif         (#00E2F7 / ink-900)
 *  - Livré                 → vert             (emerald-600 / white)
 *  - Reporté (V2)          → bleu profond     (#00007C / white)
 *  - Rappelé               → orange           (kamoo-orange-500 / white)
 *  - Injoignable           → marron           (amber-900 / white)
 *  - Annulé                → rouge            (red-600 / white)
 */
function statusClasses(s: ClosingStatus): {
  className: string;
  style?: React.CSSProperties;
} {
  switch (s) {
    case "nouvelle":
      return { className: "bg-sky-100 text-sky-800" };
    case "livraison_en_cours":
      return {
        className: "text-ink-900",
        style: { background: "#00E2F7" },
      };
    case "livre":
      return { className: "bg-emerald-600 text-white" };
    case "rappele":
      return { className: "bg-kamoo-orange-500 text-white" };
    case "injoignable":
      return { className: "bg-amber-900 text-white" };
    case "annule":
      return { className: "bg-red-600 text-white" };
  }
}

/** Format date relatif avec heure : « Aujourd'hui à 13:02 » /
 *  « Jeudi à 12:35 » / « le 01 mai à 14:06 » selon l'âge */
function formatDateRelative(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const time = d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (sameDay) return `Aujourd'hui à ${time}`;
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays > 0 && diffDays < 7) {
    const dayName = d.toLocaleDateString("fr-FR", { weekday: "long" });
    const capitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    return `${capitalized} à ${time}`;
  }
  const dayMonth = d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
  });
  return `le ${dayMonth} à ${time}`;
}

/** « Dernière connexion » relative, ancrée sur l'horloge mock (MOCK_TODAY). */
function formatLastSeen(iso: string): string {
  const diffMin = Math.round(
    (MOCK_TODAY.getTime() - new Date(iso).getTime()) / 60_000,
  );
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} j`;
}

function applyDateFilter(
  assignments: ClosingAssignment[],
  filter: DateFilterValue,
): ClosingAssignment[] {
  if (filter.preset === "all") return assignments;
  if (filter.preset === "custom") {
    return assignments.filter((a) => {
      const d = new Date(a.createdAt);
      if (filter.range?.from && d < filter.range.from) return false;
      if (filter.range?.to && d > filter.range.to) return false;
      return true;
    });
  }
  const days =
    filter.preset === "7j" ? 7 : filter.preset === "30j" ? 30 : 90;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return assignments.filter((a) => new Date(a.createdAt) >= cutoff);
}

export default function ClosingPage() {
  const closeuse = MOCK_ACTIVE_CLOSEUSE;

  // État persistant (sessionStorage) : survit aux changements d'écran /
  // navigation dans la session. Le statut est géré par les onglets, le filtre
  // ne porte donc que sur les PRODUITS.
  const [search, setSearch] = useSessionStorageState("closing.search", "");
  const [appliedProducts, setAppliedProducts] = useSessionStorageState<string[]>(
    "closing.products",
    [],
  );
  const [tab, setTab] = useSessionStorageState<TabId>("closing.tab", "all");
  const [sort, setSort] = useSessionStorageState<SortKey>(
    "closing.sort",
    "recent",
  );

  // Brouillon édité dans le popover (validé par « Appliquer »).
  const [draftProducts, setDraftProducts] = useState<string[]>([]);
  // États éphémères (pas besoin de persister).
  const [dateFilter, setDateFilter] = useState<DateFilterValue>({
    preset: "all",
  });
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [closeuseDrawerOpen, setCloseuseDrawerOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const filterCount = appliedProducts.length;

  // Ouvre le popover en initialisant le brouillon depuis l'état appliqué.
  function openFilter() {
    setDraftProducts([...appliedProducts]);
    setFilterOpen(true);
  }
  function toggleDraftProduct(p: string) {
    setDraftProducts((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  }
  function applyFilters() {
    setAppliedProducts(draftProducts);
    setFilterOpen(false);
  }
  // Réinitialise immédiatement le filtre produit (la période a son propre
  // bouton, l'onglet aussi).
  function resetDraftFilters() {
    setDraftProducts([]);
    setAppliedProducts([]);
  }

  // Filtrage par date (s'applique aux STATS + au TABLEAU)
  const dateFiltered = useMemo(
    () => applyDateFilter(MOCK_CLOSING_ASSIGNMENTS, dateFilter),
    [dateFilter],
  );

  const stats = useMemo(() => computeClosingStats(dateFiltered), [dateFiltered]);

  // Backlog « à traiter » pour le KPI. Indépendant des onglets/recherche :
  // reflète tout le périmètre (filtre date).
  const pulse = useMemo(() => {
    let toProcess = 0; // à appeler (nouvelle + rappele + injoignable)
    for (const a of dateFiltered) {
      if (needsCall(a.status)) toProcess++;
    }
    return { toProcess };
  }, [dateFiltered]);

  // Filtrage : onglet (statut) + produit(s) + recherche
  const filtered = useMemo(() => {
    return dateFiltered.filter((a) => {
      if (tab !== "all" && a.status !== tab) return false;
      if (
        appliedProducts.length > 0 &&
        !a.items.some((i) => appliedProducts.includes(i.productName))
      )
        return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !a.id.toLowerCase().includes(q) &&
          !a.items.some((i) => i.productName.toLowerCase().includes(q)) &&
          !a.client.name.toLowerCase().includes(q) &&
          !a.client.phone.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [dateFiltered, tab, appliedProducts, search]);

  // Tri appliqué après filtrage
  const sorted = useMemo(() => {
    const arr = [...filtered];
    const amountOf = (a: ClosingAssignment) =>
      a.items.reduce((s, i) => s + i.quantity * i.unitPriceXof, 0);
    if (sort === "amount-desc")
      arr.sort((x, y) => amountOf(y) - amountOf(x));
    else if (sort === "amount-asc")
      arr.sort((x, y) => amountOf(x) - amountOf(y));
    else if (sort === "status")
      arr.sort((x, y) => x.status.localeCompare(y.status));
    else
      arr.sort(
        (x, y) =>
          new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime(),
      );
    return arr;
  }, [filtered, sort]);

  // Compteurs des tabs
  const tabCounts = useMemo(() => {
    const c: Record<TabId, number> = {
      all: dateFiltered.length,
      nouvelle: 0,
      rappele: 0,
      injoignable: 0,
      livraison_en_cours: 0,
      livre: 0,
      annule: 0,
    };
    for (const a of dateFiltered) c[a.status]++;
    return c;
  }, [dateFiltered]);

  const currentSortLabel =
    SORT_OPTIONS.find((s) => s.id === sort)?.label ?? "Trier";

  const filtersActive =
    search.length > 0 || filterCount > 0 || dateFilter.preset !== "all";

  return (
    <div className="flex h-full flex-col">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-line bg-white px-3 py-3.5">
        <div>
          <h1
            className="font-display text-[22px] font-extrabold tracking-tight text-ink-900"
            style={{ letterSpacing: "-0.02em" }}
          >
            Closing
          </h1>
          <p className="mt-0.5 text-[12.5px] text-ink-500">
            Suivez les appels de votre closeuse pour valider les commandes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Bouton Nouvelle commande */}
          <button
            onClick={() => setNewOrderOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-kamoo-orange-500 px-3.5 text-[13px] font-bold text-white transition hover:bg-kamoo-orange-600"
          >
            <Plus className="h-3.5 w-3.5" />
            Nouvelle commande
          </button>

          {/* Bloc closeuse — déclencheur unique qui ouvre le drawer */}
          <button
            type="button"
            onClick={() => setCloseuseDrawerOpen(true)}
            className="group flex items-center gap-2.5 rounded-[18px] border border-line bg-white py-1.5 pl-1.5 pr-2.5 transition hover:bg-paper-2/60"
          >
            <div
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[11px] font-extrabold text-white"
              style={{ background: closeuse.avatarBg }}
            >
              {closeuse.name
                .split(" ")
                .map((n) => n.charAt(0))
                .join("")}
            </div>
            <div className="leading-tight text-left">
              <div className="text-[12.5px] font-bold text-ink-900">
                {closeuse.name}
              </div>
              <div className="mt-px text-[10.5px] text-ink-500">
                Closeuse active{" "}
                <span className="text-ink-300">·</span>{" "}
                <Star className="-mt-0.5 inline h-2.5 w-2.5 fill-amber-400 text-amber-400" />{" "}
                <span className="font-semibold text-ink-700">
                  {closeuse.rating}
                </span>
              </div>
            </div>
            <ChevronRight className="ml-0.5 h-3.5 w-3.5 text-ink-400 transition group-hover:translate-x-0.5 group-hover:text-ink-700" />
          </button>
        </div>
      </div>

      {/* STATS (filtrées par date) — le verdict de l'opération */}
      <div className="bg-white px-3 pb-4 pt-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MinimalKpi
            label="Taux de confirmation"
            value={`${stats.conversionRate}`}
            unit="%"
            bigUnit
            color="emerald"
            hint="Part des commandes que la closeuse a réussi à confirmer, parmi celles déjà tranchées (confirmées, annulées ou injoignables). Les nouvelles et les rappels en cours ne sont pas comptés."
            valueAccent={
              stats.closedCount > 0
                ? `${stats.confirmedCount}/${stats.closedCount} confirmées`
                : undefined
            }
          />
          <MinimalKpi
            label="À traiter"
            value={String(pulse.toProcess)}
            valueAccent="commandes"
            color="rose"
            hint="Commandes qui attendent encore un appel de la closeuse : les nouvelles, les rappels programmés et les injoignables à relancer."
          />
          <MinimalKpi
            label="Temps moyen"
            value="5min"
            hint="Temps moyen que met la closeuse pour traiter une commande, de sa réception jusqu'à une issue (confirmée, annulée ou injoignable)."
          />
          <MinimalKpi
            label="CA confirmé"
            value={formatXOF(stats.confirmedRevenue, false)}
            unit="F"
            color="emerald"
            hint="Montant total des commandes confirmées par la closeuse, qu'elles soient en cours de livraison ou déjà livrées."
          />
        </div>
      </div>

      {/* Barre tabs (gauche) · Search + Filter + Sort By (droite) — même fond
          blanc que les stats et le tableau, surface continue (sans trait) */}
      <div className="bg-white px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Tabs = filtres par statut */}
          <div className="flex rounded-lg bg-paper-2 p-1">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
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
                    {tabCounts[t.id]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex-1" />

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              placeholder="Recherche…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-line bg-white pl-9 pr-12 text-[13px] outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600"
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-line bg-paper-2 px-1.5 py-0.5 font-mono-kamoo text-[9.5px] font-bold text-ink-500">
              ⌘K
            </span>
          </div>

          {/* Période — bouton calendrier indépendant */}
          <DateRangeFilter value={dateFilter} onChange={setDateFilter} />

          {/* Produit — filtre par produit (le statut est géré par les onglets) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => (filterOpen ? setFilterOpen(false) : openFilter())}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-lg border bg-white px-3 text-[12.5px] font-semibold transition hover:bg-paper-2",
                filterCount > 0
                  ? "border-kamoo-blue-600 text-kamoo-blue-700"
                  : "border-line text-ink-700",
              )}
            >
              <ListFilter className="h-3.5 w-3.5" />
              Produit
              {filterCount > 0 && (
                <span className="font-mono-kamoo text-[11px] font-extrabold text-kamoo-blue-700">
                  · {filterCount}
                </span>
              )}
            </button>
            {filterOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setFilterOpen(false)}
                />
                <div className="absolute right-0 top-[calc(100%+6px)] z-20 w-[320px] rounded-2xl border border-line bg-white p-4 text-left shadow-[0_18px_40px_rgba(16,24,40,0.14)]">
                  {/* Produit — liste à cases à cocher (noms longs) */}
                  <div>
                    <div className="mb-2 font-mono-kamoo text-[12px] font-extrabold uppercase tracking-wider text-ink-500">
                      Produit
                    </div>
                    <div className="-mx-1 max-h-[240px] overflow-y-auto pr-0.5">
                      {PRODUCT_OPTIONS.map((p) => {
                        const active = draftProducts.includes(p.name);
                        return (
                          <button
                            key={p.name}
                            type="button"
                            onClick={() => toggleDraftProduct(p.name)}
                            className="flex w-full items-center gap-2.5 rounded-lg px-1.5 py-2 text-left transition hover:bg-paper-2"
                          >
                            <span
                              className={cn(
                                "grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] border transition",
                                active
                                  ? "border-kamoo-blue-900 bg-kamoo-blue-900 text-white"
                                  : "border-ink-300 bg-white",
                              )}
                            >
                              {active && (
                                <Check className="h-3 w-3" strokeWidth={3} />
                              )}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink-700">
                              {p.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Footer — Réinitialiser / Appliquer */}
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={resetDraftFilters}
                      className="text-[12.5px] font-semibold text-ink-500 transition hover:text-ink-700"
                    >
                      Réinitialiser
                    </button>
                    <button
                      type="button"
                      onClick={applyFilters}
                      className="inline-flex h-9 items-center rounded-lg bg-kamoo-blue-900 px-4 text-[12.5px] font-bold text-white transition hover:bg-kamoo-blue-800"
                    >
                      Appliquer
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sort By */}
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
                <div className="absolute right-0 top-[calc(100%+4px)] z-20 w-48 rounded-xl border border-line bg-white p-1 shadow-[var(--shadow-kamoo-lg)]">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSort(opt.id);
                        setSortOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[12.5px] transition hover:bg-paper-2",
                        opt.id === sort
                          ? "font-bold text-ink-900"
                          : "font-medium text-ink-700",
                      )}
                    >
                      {opt.label}
                      {opt.id === sort && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-kamoo-blue-700" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      {/* TABLEAU À PLAT (pas de groupage par date, plus de radius)
          Un seul conteneur scrollable (x + y) — pas de double overflow */}
      <div className="flex min-h-0 flex-1 flex-col bg-white">
        <div
          className="flex-1 overflow-auto"
          style={{
            scrollbarColor: "#D1D5DB #F5F5EE",
            scrollbarWidth: "thin",
          }}
        >
          {sorted.length === 0 ? (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center px-6 py-16 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-paper-2 text-3xl">
                📞
              </div>
              <p className="mt-4 text-[15px] font-bold text-ink-900">
                Aucune commande à afficher
              </p>
              <p className="mt-1 max-w-sm text-[13px] text-ink-500">
                {search
                  ? `Aucun résultat pour « ${search} ».`
                  : "Aucune commande ne correspond à vos filtres pour cette période."}
              </p>
              {filtersActive && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setTab("all");
                    setDateFilter({ preset: "all" });
                    setAppliedProducts([]);
                  }}
                  className="mt-4 inline-flex h-9 items-center rounded-lg border border-line bg-white px-4 text-[12.5px] font-semibold text-ink-700 transition hover:bg-paper-2"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          ) : (
            <ClosingTable rows={sorted} />
          )}
        </div>

        {/* Footer pagination — prev / next + range */}
        {sorted.length > 0 && (
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
              1–{Math.min(sorted.length, 50)}
              {sorted.length > 50 && (
                <span className="text-ink-400"> sur {sorted.length}</span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* MODALE NOUVELLE COMMANDE */}
      <NewOrderDialog open={newOrderOpen} onOpenChange={setNewOrderOpen} />

      {/* Drawer Closeuse (perfs GLOBALES, indép. du filtre période) */}
      <CloseuseDrawer
        open={closeuseDrawerOpen}
        onClose={() => setCloseuseDrawerOpen(false)}
        closeuse={closeuse}
      />
    </div>
  );
}

/* ─── Tableau à plat — pas de radius, pas de groupe date ─────────── */
function ClosingTable({ rows }: { rows: ClosingAssignment[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const allSelected = rows.length > 0 && selected.size === rows.length;
  const someSelected = selected.size > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected || someSelected) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  return (
    <table className="w-full min-w-[1290px] table-fixed text-[13px]">
        {/* Ordre : [☐] · N° · Date · [icons] · Client · Statut · Total ·
            Articles · Commentaire */}
        <colgroup><col style={{ width: "40px" }} /><col style={{ width: "120px" }} /><col style={{ width: "180px" }} /><col style={{ width: "62px" }} /><col style={{ width: "200px" }} /><col style={{ width: "220px" }} /><col style={{ width: "130px" }} /><col style={{ width: "110px" }} /><col style={{ width: "220px" }} /></colgroup>
        <thead>
          <tr className="border-b border-line text-left">
            <Th align="center" aria-label="Tout sélectionner">
              <RowCheckbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={toggleAll}
                onClick={(e) => e.stopPropagation()}
              />
            </Th>
            <Th>N°</Th>
            <Th sortable>Date</Th>
            <Th aria-label="Contact">&nbsp;</Th>
            <Th>Client</Th>
            <Th align="center">Statut</Th>
            <Th align="right">Total</Th>
            <Th align="right">
              <span className="pl-3">Articles</span>
            </Th>
            <Th>Commentaire</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => {
            const target =
              (a.status === "rappele" || a.status === "injoignable") &&
              a.callbackAt
                ? a.callbackAt
                : null;
            // Nb de commandes de ce client dans la liste courante
            const clientOrders = rows.filter(
              (r) => r.client.id === a.client.id,
            ).length;
            return (
              <tr
                key={a.id}
                onClick={() => router.push(`/closing/${a.id}`)}
                className={cn(
                  "cursor-pointer border-b border-paper-2 transition last:border-0 hover:bg-paper-2/30",
                  selected.has(a.id) && "bg-kamoo-blue-50/40",
                )}
              >
                <Td align="center">
                  <RowCheckbox
                    checked={selected.has(a.id)}
                    onChange={() => toggleOne(a.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Td>
                <Td>
                  <span className="font-mono-kamoo text-[12px] text-ink-500">
                    {a.id}
                  </span>
                </Td>
                <Td>
                  <span className="whitespace-nowrap text-[13px] text-ink-700">
                    {formatDateRelative(a.createdAt)}
                  </span>
                </Td>
                <Td>
                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <a
                      href={`tel:${a.client.phone}`}
                      className="grid h-6 w-6 place-items-center rounded-md text-ink-500 transition hover:bg-paper-2 hover:text-kamoo-blue-700"
                      title={`Appeler ${a.client.phone}`}
                    >
                      <Phone className="h-3 w-3" />
                    </a>
                    {a.client.whatsapp ? (
                      <a
                        href={`https://wa.me/${a.client.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="grid h-6 w-6 place-items-center rounded-md text-emerald-600 transition hover:bg-emerald-50 hover:text-emerald-700"
                        title="WhatsApp"
                      >
                        <MessageCircle className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="grid h-6 w-6 place-items-center text-ink-300">
                        <MessageCircle className="h-3 w-3 opacity-30" />
                      </span>
                    )}
                  </div>
                </Td>
                <Td>
                  <InfoPopover
                    align="left"
                    width={248}
                    popover={
                      <div
                        className="rounded-[14px] border border-line bg-white p-3.5 text-left"
                        style={{
                          boxShadow: "0 14px 32px rgba(16, 24, 40, 0.12)",
                        }}
                      >
                        <div className="text-[14px] font-bold leading-tight text-ink-900">
                          {a.client.name}
                        </div>
                        <div className="mt-0.5 text-[11.5px] text-ink-500">
                          {a.client.city}, Sénégal
                        </div>
                        <div className="text-[11.5px] text-ink-500">
                          {clientOrders} commande{clientOrders > 1 ? "s" : ""}
                        </div>
                        <div className="mt-2 space-y-0.5">
                          <div className="flex items-center gap-1.5 font-mono-kamoo text-[12px] text-ink-700">
                            <Phone className="h-2.5 w-2.5 shrink-0 text-ink-400" />
                            {a.client.phone}
                          </div>
                          {a.client.whatsapp && (
                            <div className="flex items-center gap-1.5 font-mono-kamoo text-[12px] text-ink-700">
                              <MessageCircle className="h-2.5 w-2.5 shrink-0 text-emerald-600" />
                              {a.client.whatsapp}
                            </div>
                          )}
                        </div>
                        <Link
                          href={`/clients/${a.client.id}`}
                          className="mt-2.5 block rounded-[8px] border border-line py-1.5 text-center text-[12px] font-semibold text-ink-900 transition hover:bg-paper-2"
                        >
                          Voir le client
                        </Link>
                      </div>
                    }
                  >
                    <div className="group/cell -mx-2 cursor-pointer rounded px-2 py-0.5 hover:bg-paper-2">
                      <div className="flex items-center gap-1">
                        <span className="block min-w-0 flex-1 truncate text-ink-900">
                          {a.client.name}
                        </span>
                        <ChevronDown className="h-3 w-3 shrink-0 text-ink-400 opacity-0 transition group-hover/cell:opacity-100" />
                      </div>
                      <div className="truncate text-[11.5px] text-ink-500">
                        {a.client.city}
                      </div>
                    </div>
                  </InfoPopover>
                </Td>
                <Td align="center">
                  <StatusCell assignment={a} callbackAt={target} />
                </Td>
                <Td align="right">
                  <span className="whitespace-nowrap tabular-nums text-ink-900">
                    {formatXOF(
                      a.items.reduce(
                        (s, i) => s + i.quantity * i.unitPriceXof,
                        0,
                      ),
                    )}
                  </span>
                </Td>
                <Td align="right">
                  <InfoPopover
                    align="right"
                    width={256}
                    popover={
                      <div className="overflow-hidden rounded-xl border border-line bg-white p-1.5 text-left shadow-[0_18px_40px_rgba(16,24,40,0.14)]">
                        {a.items.map((item, i) => (
                          <Link
                            key={i}
                            href={
                              item.productId
                                ? `/catalogue/${item.productId}`
                                : "/catalogue"
                            }
                            className="flex items-center gap-2.5 rounded-lg p-2 transition hover:bg-paper-2"
                          >
                            <div
                              className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-base"
                              style={{ background: item.productBg }}
                            >
                              {item.productEmoji}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[12px] font-semibold text-ink-900">
                                {item.productName}
                              </div>
                              <div className="mt-0.5 text-[10.5px] text-ink-500">
                                {formatXOF(item.unitPriceXof)} F · unité
                              </div>
                            </div>
                            <span className="shrink-0 font-mono-kamoo text-[11px] font-extrabold text-ink-700">
                              ×{item.quantity}
                            </span>
                          </Link>
                        ))}
                      </div>
                    }
                  >
                    <div className="group/cell -mx-2 inline-block cursor-pointer rounded px-2 py-0.5 hover:bg-paper-2">
                      <span className="inline-flex items-center gap-1 text-ink-700">
                        {a.items.length} article{a.items.length > 1 ? "s" : ""}
                        <ChevronDown className="h-3 w-3 shrink-0 text-ink-400 opacity-0 transition group-hover/cell:opacity-100" />
                      </span>
                    </div>
                  </InfoPopover>
                </Td>
                <Td>
                  {a.comment ? (
                    <span
                      className="block truncate text-[12px] italic text-ink-700"
                      title={a.comment}
                    >
                      {a.comment}
                    </span>
                  ) : a.status === "annule" && a.cancellationReason ? (
                    <span className="text-[12px] italic text-red-700">
                      {CANCELLATION_REASON_LABELS[a.cancellationReason]}
                    </span>
                  ) : (
                    <span className="text-[12px] text-ink-300">—</span>
                  )}
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>
  );
}

/* ─── StatusCell — pill enrichi + sub-line + popover hover ──────────── */

function StatusCell({
  assignment: a,
  callbackAt,
}: {
  assignment: ClosingAssignment;
  callbackAt: string | null;
}) {
  const s = statusClasses(a.status);
  const statusLabel = CLOSING_STATUS_LABELS[a.status];
  const isLivreurAlert = a.delivery?.progress === "alerte";
  const hasCallback = callbackAt !== null;
  const hasComment = !!a.comment;

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <span
        className={cn(
          "inline-flex w-[180px] cursor-default items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold",
          s.className,
        )}
        style={s.style}
      >
        <span className="tracking-wide">{statusLabel}</span>
        {(hasCallback || hasComment || isLivreurAlert) && (
          <>
            <span
              aria-hidden
              className="inline-block h-2.5 w-px bg-current opacity-30"
            />
            <span className="inline-flex items-center gap-1 opacity-90">
              {hasCallback && <Clock className="h-3 w-3" />}
              {isLivreurAlert && <AlertTriangle className="h-3 w-3" />}
              {hasComment && <MessageSquare className="h-3 w-3" />}
            </span>
          </>
        )}
      </span>

      {/* Sub-line : décompte live jusqu'au rappel (rouge si dépassé) */}
      {hasCallback && <RappelCountdown targetIso={callbackAt!} />}
    </div>
  );
}

/* ─── RappelCountdown — décompte live jusqu'au rappel ──────────────────
 *  Les fixtures sont datées autour de MOCK_TODAY (2026-05-04). On fait donc
 *  avancer une horloge synthétique partant de MOCK_TODAY en temps réel : le
 *  décompte « tic » chaque seconde tout en restant cohérent avec les dates
 *  mock (rappel futur → temps positif, rappel passé → rouge « en retard »).
 *  En V2 (Supabase), remplacer la base MOCK_TODAY par Date.now(). */
function useRappelRemaining(targetIso: string) {
  // mockNow démarre figé sur MOCK_TODAY (identique SSR/CSR → pas de mismatch
  // d'hydratation) puis avance en temps réel une fois monté côté client.
  const [mockNow, setMockNow] = useState(() => MOCK_TODAY.getTime());
  useEffect(() => {
    const base = MOCK_TODAY.getTime();
    const start = Date.now();
    const id = setInterval(() => setMockNow(base + (Date.now() - start)), 1000);
    return () => clearInterval(id);
  }, []);

  const diffMs = new Date(targetIso).getTime() - mockNow;
  const past = diffMs < 0;
  const ms = Math.abs(diffMs);
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const clock = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  const label = days > 0 ? `${days}j ${clock}` : clock;
  return { past, label };
}

function RappelCountdown({ targetIso }: { targetIso: string }) {
  const { past, label } = useRappelRemaining(targetIso);
  // Décompte en bleu jusqu'à zéro, puis rouge « Retard · −… » une fois dépassé.
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono-kamoo text-[11px] font-semibold tabular-nums",
        past ? "text-red-600" : "text-kamoo-blue-700",
      )}
    >
      <Clock className="h-2.5 w-2.5" />
      {past ? "Retard · −" : "Rappel · "}
      {label}
    </span>
  );
}

/* ─── CallbackPill : badge compact « ⏰ HH:MM » pour le rappel ──────── */

function CallbackPill({ iso }: { iso: string }) {
  const d = new Date(iso);
  const now = new Date();
  const expired = d.getTime() < now.getTime();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const tomorrow = (() => {
    const t = new Date(now);
    t.setDate(t.getDate() + 1);
    return (
      d.getFullYear() === t.getFullYear() &&
      d.getMonth() === t.getMonth() &&
      d.getDate() === t.getDate()
    );
  })();
  const time = d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const label = sameDay
    ? time
    : tomorrow
      ? `demain ${time}`
      : `${d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} ${time}`;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono-kamoo text-[12px] font-bold",
        expired
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-line bg-paper-2 text-ink-900",
      )}
    >
      <Clock className="h-3 w-3 opacity-70" />
      {label}
    </span>
  );
}

/* ─── InfoPopover — info-bulle au CLIC (via portail + position fixed) ────
 *  S'ouvre au clic sur le trigger et se ferme au clic en dehors ou sur Échap.
 *  Le portail permet d'échapper aux conteneurs en overflow clip/hidden (la
 *  table…). Recalcule la position au scroll/resize et flip vers le haut si on
 *  est trop près du bord bas du viewport. */
function InfoPopover({
  children,
  popover,
  align = "left",
  width = 280,
}: {
  /** Élément déclencheur (cellule, pill, etc.) */
  children: React.ReactNode;
  /** Contenu du popover */
  popover: React.ReactNode;
  /** Alignement horizontal par rapport au trigger */
  align?: "left" | "right" | "center";
  /** Largeur estimée du popover (px) — utilisée pour aligner à droite */
  width?: number;
}) {
  // Espace visuel entre le trigger et la carte (padding transparent).
  const GAP = 6;

  const triggerRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    flipUp: boolean;
  } | null>(null);

  function compute() {
    const el = triggerRef.current;
    if (!el) return;
    // Le wrapper est en `display:contents` (pas de box propre) → son
    // getBoundingClientRect() renvoie 0×0 à (0,0), ce qui collait le popover
    // dans le coin. On mesure donc l'élément enfant réel (pill / cellule).
    let r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0 && el.firstElementChild) {
      r = el.firstElementChild.getBoundingClientRect();
    }
    const POPOVER_H = 240; // estimation max
    const flipUp = r.bottom + POPOVER_H + GAP > window.innerHeight;
    const left =
      align === "right"
        ? r.right - width
        : align === "center"
          ? (r.left + r.right) / 2 - width / 2
          : r.left;
    // Le portail démarre au ras du trigger ; le GAP est matérialisé par un
    // padding transparent sur le conteneur.
    const top = flipUp ? r.top : r.bottom;
    // Clamp horizontal dans le viewport
    const clampedLeft = Math.max(8, Math.min(left, window.innerWidth - width - 8));
    setPos({ top, left: clampedLeft, flipUp });
  }

  // Ouverture au clic (toggle). On stoppe la propagation pour ne pas
  // déclencher la navigation de la ligne du tableau.
  function handleTriggerClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (open) {
      setOpen(false);
    } else {
      compute();
      setOpen(true);
    }
  }

  // Tant que c'est ouvert : ferme au clic en dehors / Échap, recalcule la
  // position au scroll / resize.
  useEffect(() => {
    if (!open) return;
    const onDocPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (popoverRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onScroll = () => compute();
    document.addEventListener("mousedown", onDocPointer, true);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onDocPointer, true);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      <div ref={triggerRef} onClick={handleTriggerClick} className="contents">
        {children}
      </div>
      {open &&
        pos &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width,
              paddingTop: pos.flipUp ? 0 : GAP,
              paddingBottom: pos.flipUp ? GAP : 0,
              transform: pos.flipUp ? "translateY(-100%)" : undefined,
              zIndex: 1000,
            }}
          >
            {popover}
          </div>,
          document.body,
        )}
    </>
  );
}

function RowCheckbox({
  checked,
  indeterminate = false,
  onChange,
  onClick,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      onClick={onClick}
      className="h-3.5 w-3.5 cursor-pointer rounded border-ink-300 text-kamoo-blue-700 transition focus:ring-1 focus:ring-kamoo-blue-600 focus:ring-offset-0"
    />
  );
}

function Th({
  children,
  align = "left",
  sortable = false,
  ...rest
}: {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
  /** Affiche un caret de tri à côté du label (défaut : false) */
  sortable?: boolean;
  "aria-label"?: string;
}) {
  return (
    <th
      aria-label={rest["aria-label"]}
      className={cn(
        "px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-ink-500",
        align === "right" && "text-right",
        align === "center" && "text-center",
      )}
    >
      {sortable ? (
        <span className="inline-flex items-center gap-1.5">
          <span>{children}</span>
          <ChevronsUpDown className="h-3 w-3 text-ink-300" aria-hidden />
        </span>
      ) : (
        children
      )}
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
        "px-3 py-2 align-middle text-[13.5px]",
        align === "right" && "text-right",
        align === "center" && "text-center",
      )}
    >
      {children}
    </td>
  );
}

/* ─── Modale Nouvelle Commande ────────────────────────────── */
function NewOrderDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  // Produit relié au vrai catalogue : sélection → prix auto-rempli (× quantité),
  // mais le total reste modifiable (prix négocié, manuel…).
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("1");
  const [total, setTotal] = useState("");

  const selectedProduct = MOCK_PRODUITS.find((p) => p.id === productId);

  function pickProduct(id: string) {
    setProductId(id);
    const p = MOCK_PRODUITS.find((x) => x.id === id);
    setTotal(p ? String(p.priceXof * (Number(qty) || 1)) : "");
  }
  function changeQty(v: string) {
    setQty(v);
    if (selectedProduct) {
      setTotal(String(selectedProduct.priceXof * (Number(v) || 1)));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogTitle className="font-display text-xl font-extrabold text-ink-900">
          Nouvelle commande
        </DialogTitle>
        <p className="mt-1 text-[12.5px] text-ink-500">
          Créez une commande manuellement (clients qui commandent par WhatsApp,
          Instagram, en direct, etc.).
        </p>

        <div className="mt-5 flex flex-col gap-4">
          {/* Client */}
          <Field label="Nom du client" required>
            <input
              type="text"
              placeholder="Ex: Marième Sow"
              className="w-full rounded-xl border border-line bg-white px-3 py-2 text-[13px] outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Téléphone" required>
              <input
                type="tel"
                placeholder="+221 77 …"
                className="w-full rounded-xl border border-line bg-white px-3 py-2 text-[13px] outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600"
              />
            </Field>
            <Field label="WhatsApp">
              <input
                type="tel"
                placeholder="(si différent)"
                className="w-full rounded-xl border border-line bg-white px-3 py-2 text-[13px] outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600"
              />
            </Field>
          </div>
          <Field label="Ville / quartier" required>
            <input
              type="text"
              placeholder="Ex: Dakar · Mermoz"
              className="w-full rounded-xl border border-line bg-white px-3 py-2 text-[13px] outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600"
            />
          </Field>

          {/* Produit — relié au catalogue */}
          <div className="border-t border-line pt-4">
            <Field label="Produit" required>
              <select
                value={productId}
                onChange={(e) => pickProduct(e.target.value)}
                className="w-full rounded-xl border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-kamoo-blue-600"
              >
                <option value="">Sélectionner un produit du catalogue…</option>
                {MOCK_PRODUITS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {formatXOF(p.priceXof)}
                  </option>
                ))}
              </select>
            </Field>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Quantité" required>
                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => changeQty(e.target.value)}
                  className="w-full rounded-xl border border-line bg-white px-3 py-2 text-[13px] outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600"
                />
              </Field>
              <Field label="Total (F CFA)" required>
                <input
                  type="number"
                  placeholder="18000"
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                  className="w-full rounded-xl border border-line bg-white px-3 py-2 text-[13px] outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600"
                />
              </Field>
            </div>
            {selectedProduct && (
              <p className="mt-2 text-[11.5px] text-ink-500">
                Prix catalogue : {formatXOF(selectedProduct.priceXof)} × {qty || 1}
                {" = "}
                <span className="font-semibold text-ink-700">
                  {formatXOF(selectedProduct.priceXof * (Number(qty) || 1))}
                </span>{" "}
                — modifiable si prix négocié.
              </p>
            )}
          </div>

          {/* Commentaire */}
          <Field label="Commentaire (optionnel)">
            <textarea
              rows={2}
              placeholder="Ex: Commandé via WhatsApp, à rappeler après 14h"
              className="w-full rounded-xl border border-line bg-white px-3 py-2 text-[13px] outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600"
            />
          </Field>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2 border-t border-line pt-4">
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-xl border border-line bg-white px-4 py-2 text-[13px] font-semibold text-ink-900 hover:bg-paper-2"
          >
            Annuler
          </button>
          <button
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center gap-2 rounded-xl bg-kamoo-orange-500 px-5 py-2 text-[13px] font-bold text-white hover:bg-kamoo-orange-600"
          >
            <Plus className="h-3.5 w-3.5" />
            Créer la commande
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider text-ink-700">
        {label}
        {required && <span className="text-kamoo-orange-600">*</span>}
      </label>
      {children}
    </div>
  );
}

void CheckCircle2;

/* ─── CloseuseDrawer · panneau latéral droit ────────────────────────── */

function CloseuseDrawer({
  open,
  onClose,
  closeuse,
}: {
  open: boolean;
  onClose: () => void;
  /** Type minimal repris du mock */
  closeuse: {
    name: string;
    rating: number;
    reviewsCount: number;
    avatarBg: string;
    lastSeenAt: string;
  };
}) {
  // Tab actif : performances vs activité
  const [tab, setTab] = useState<"performance" | "activity">("performance");
  // Période du tableau de performance
  const [period, setPeriod] = useState<"Jour" | "Semaine" | "Mois">("Jour");

  // ESC pour fermer
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  // Stats globales — calculées sur TOUT le backlog (pas sur la période)
  const global = useMemo(() => {
    const all = MOCK_CLOSING_ASSIGNMENTS;
    const total = all.length;
    const confirmed = all.filter(
      (a) => a.status === "livre" || a.status === "livraison_en_cours",
    );
    const cancelled = all.filter((a) => a.status === "annule").length;
    const unreachable = all.filter((a) => a.status === "injoignable").length;
    const callback = all.filter((a) => a.status === "rappele").length;
    const closed = confirmed.length + cancelled + unreachable;
    const confirmRate = closed > 0
      ? Math.round((confirmed.length / closed) * 100)
      : 0;
    // Performance RÉELLE : commandes effectivement livrées (cash encaissé)
    // rapportées aux commandes traitées. Non détournable.
    const delivered = all.filter((a) => a.status === "livre").length;
    const deliveryRate = closed > 0
      ? Math.round((delivered / closed) * 100)
      : 0;
    const cancelRate = total > 0
      ? Math.round(((cancelled + unreachable) / total) * 100)
      : 0;
    const revenue = confirmed.reduce(
      (s, a) =>
        s + a.items.reduce((x, i) => x + i.quantity * i.unitPriceXof, 0),
      0,
    );
    const avgMin = "5min"; // mock — cohérent avec le KPI de la page
    return {
      total,
      closed,
      confirmed: confirmed.length,
      delivered,
      cancelled,
      unreachable,
      callback,
      confirmRate,
      deliveryRate,
      cancelRate,
      revenue,
      avgMin,
    };
  }, []);

  // Animation déclenchée à l'ouverture
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    if (open) {
      // 2 frames pour garantir un repaint avant la transition
      const id = requestAnimationFrame(() =>
        requestAnimationFrame(() => setEntered(true)),
      );
      return () => cancelAnimationFrame(id);
    }
    setEntered(false);
  }, [open]);

  if (!open) return null;

  // Snapshot de performance « du jour » (démo — à brancher sur les vraies
  // données quotidiennes le moment venu).
  const perf = {
    rate: 75,
    delivered: 18,
    processed: 24,
    avgCall: "5 min",
    abandonRate: global.cancelRate,
    waiting: 1,
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40"
        style={{
          background: "rgba(16,24,40,0.18)",
          backdropFilter: "blur(2px)",
          opacity: entered ? 1 : 0,
          transition: "opacity 220ms ease",
        }}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className="fixed right-0 top-0 z-50 flex h-dvh w-[460px] max-w-[100vw] flex-col border-l border-line bg-white"
        style={{
          boxShadow: "-24px 0 60px rgba(16,24,40,0.16)",
          transform: entered ? "translateX(0)" : "translateX(100%)",
          transition: "transform 240ms cubic-bezier(.2,.8,.2,1)",
        }}
        role="dialog"
        aria-label="Détail closeuse"
      >
        {/* Header du panneau */}
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <MonoLabel>Closeuse active</MonoLabel>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 transition hover:bg-paper-2 hover:text-ink-900"
            aria-label="Fermer"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Body scrollable */}
        <div
          className="flex-1 overflow-y-auto px-5 py-5"
          style={{
            opacity: entered ? 1 : 0,
            transform: entered ? "translateY(0)" : "translateY(6px)",
            transition:
              "opacity 320ms ease 80ms, transform 320ms ease 80ms",
          }}
        >
          {/* Identité */}
          <div className="flex items-start gap-3.5">
            <div
              className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-[18px] font-extrabold text-white"
              style={{ background: closeuse.avatarBg }}
            >
              {closeuse.name
                .split(" ")
                .map((n) => n.charAt(0))
                .join("")}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div
                  className="font-display text-[20px] font-extrabold text-ink-900"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  {closeuse.name}
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-kamoo-orange-50 px-2.5 py-1 text-[11px] font-extrabold text-kamoo-orange-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-kamoo-orange-500" />
                  En ligne
                </span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[12px] text-ink-500">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="font-bold text-ink-700">
                  {closeuse.rating.toLocaleString("fr-FR")}
                </span>
                <span>
                  · {closeuse.reviewsCount} avis · Confirmation des commandes
                </span>
              </div>
              <div className="mt-1 text-[11px] text-ink-400">
                Dernière connexion · {formatLastSeen(closeuse.lastSeenAt)}
              </div>
            </div>
          </div>

          {/* Tab switcher Performance / Activité — segment control */}
          <div className="mt-5 flex rounded-xl bg-paper-2 p-1">
            <SegmentTab
              active={tab === "performance"}
              onClick={() => setTab("performance")}
            >
              Performance
            </SegmentTab>
            <SegmentTab
              active={tab === "activity"}
              onClick={() => setTab("activity")}
            >
              Activité
            </SegmentTab>
          </div>

          {tab === "performance" ? (
            <>
              {/* Période */}
              <div className="mt-5 flex items-center gap-3">
                <span className="text-[12px] font-semibold text-ink-500">
                  Période
                </span>
                <div className="flex rounded-xl bg-paper-2 p-1">
                  {(["Jour", "Semaine", "Mois"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPeriod(p)}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-[12.5px] font-bold transition",
                        period === p
                          ? "bg-white text-ink-900 shadow-[0_1px_2px_rgba(16,24,40,0.08)]"
                          : "text-ink-500 hover:text-ink-700",
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Livraison globale — donut + résumé épuré */}
              <section className="mt-6 grid gap-[18px] rounded-[18px] border border-line bg-white p-[22px]">
                <h3 className="text-[16px] font-black text-ink-900">
                  Livraison globale
                </h3>
                <div className="grid grid-cols-[140px_1fr] items-center gap-5">
                  <DeliveryDonut pct={perf.rate} />
                  <div>
                    <strong className="block font-display text-[20px] font-black leading-snug text-ink-900">
                      {perf.delivered} livrées sur {perf.processed} traitées
                    </strong>
                    <span className="mt-3 inline-flex rounded-full bg-[#EEF3FF] px-3 py-1.5 text-[12.5px] font-extrabold text-kamoo-blue-900">
                      Objectif 80% · encore {Math.max(0, 80 - perf.rate)} pts
                    </span>
                  </div>
                </div>
              </section>

              {/* Détails */}
              <div className="mt-7">
                <h3 className="text-[13px] font-extrabold text-ink-900">
                  Détails
                </h3>
                <div className="mt-2 flex flex-col border-t border-line">
                  <PerfRow label="Livrées" value={String(perf.delivered)} />
                  <PerfRow label="Traitées" value={String(perf.processed)} />
                  <PerfRow label="Temps moyen / appel" value={perf.avgCall} />
                  <PerfRow
                    label="Taux d'abandon"
                    value={`${perf.abandonRate} %`}
                  />
                  <PerfRow label="En attente" value={String(perf.waiting)} />
                </div>
              </div>

              {/* Graphe — taux de livraison par jour */}
              <div className="mt-7">
                <DeliveryByDayChart />
              </div>
            </>
          ) : (
            <ActivityFeed />
          )}
        </div>

        {/* Footer sticky : actions */}
        <div className="sticky bottom-0 flex items-center gap-3 border-t border-line bg-white px-5 py-3.5">
          <button
            type="button"
            className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-bold text-ink-700 transition hover:text-ink-900"
          >
            <ExternalLink className="h-4 w-4" />
            Profil complet
          </button>
          <button
            type="button"
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-kamoo-blue-900 px-4 text-[13px] font-extrabold text-white transition hover:-translate-y-px hover:bg-kamoo-blue-800"
          >
            Changer de closeuse
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </aside>
    </>
  );
}

function SegmentTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-lg px-3 py-2 text-[13px] font-bold transition",
        active
          ? "bg-white text-ink-900 shadow-[0_1px_2px_rgba(16,24,40,0.08)]"
          : "bg-transparent text-ink-500 hover:text-ink-700",
      )}
    >
      {children}
    </button>
  );
}

function PerfRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-[15px]">
      <span className="text-[15px] font-semibold text-ink-700">{label}</span>
      <span className="font-mono-kamoo text-[16px] font-black tabular-nums text-ink-900">
        {value}
      </span>
    </div>
  );
}

/* Donut taux de livraison — anneau navy unique, centre épuré. */
function DeliveryDonut({ pct, size = 140 }: { pct: number; size?: number }) {
  const R = 62;
  const C = 2 * Math.PI * R;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 150 150" className="h-full w-full -rotate-90">
        <circle
          cx="75"
          cy="75"
          r={R}
          fill="none"
          stroke="#E8E4DA"
          strokeWidth={13}
        />
        <circle
          cx="75"
          cy="75"
          r={R}
          fill="none"
          stroke="#102A52"
          strokeWidth={13}
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * C} ${C}`}
        />
      </svg>
      <div className="absolute inset-0 flex items-start justify-center">
        <div className="flex h-full items-center">
          <span className="font-display text-[34px] font-black leading-none text-kamoo-blue-900">
            {pct}
          </span>
          <span className="mt-1 font-display text-[16px] font-black text-kamoo-blue-900">
            %
          </span>
        </div>
      </div>
    </div>
  );
}

/* Graphe barres SVG — axes X/Y, grille, moyenne, aujourd'hui en navy. */
function DeliveryByDayChart() {
  const data = [
    { d: "Lun", v: 72, today: false },
    { d: "Mar", v: 78, today: false },
    { d: "Mer", v: 69, today: false },
    { d: "Jeu", v: 86, today: false },
    { d: "Ven", v: 83, today: false },
    { d: "Sam", v: 91, today: false },
    { d: "Dim", v: 84, today: true },
  ];
  const W = 324;
  const H = 196;
  const m = { top: 16, right: 10, bottom: 26, left: 28 };
  const innerW = W - m.left - m.right;
  const innerH = H - m.top - m.bottom;
  const yMin = 55;
  const yMax = 95;
  const yTicks = [60, 70, 80, 90];
  const AVG = 80;
  const y = (v: number) => m.top + innerH * (1 - (v - yMin) / (yMax - yMin));
  const band = innerW / data.length;
  const barW = band * 0.44;
  const baseY = y(yMin);

  return (
    <section>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-[13px] font-extrabold text-ink-900">
            Taux de livraison par jour
          </h4>
          <p className="mt-0.5 text-[11px] text-ink-500">
            % de commandes livrées sur traitées
          </p>
        </div>
        <span className="shrink-0 text-[12px] font-extrabold text-kamoo-orange-600">
          +7 pts
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-3 w-full"
        role="img"
        aria-label="Taux de livraison quotidien"
      >
        {/* Grille + graduations Y */}
        {yTicks.map((t) => (
          <g key={t}>
            <line
              x1={m.left}
              x2={m.left + innerW}
              y1={y(t)}
              y2={y(t)}
              stroke="#EFEDE6"
              strokeWidth={1}
            />
            <text
              x={m.left - 7}
              y={y(t)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="9"
              fill="#98A2B3"
            >
              {t}
            </text>
          </g>
        ))}

        {/* Moyenne (pointillés) */}
        <line
          x1={m.left}
          x2={m.left + innerW}
          y1={y(AVG)}
          y2={y(AVG)}
          stroke="#98A2B3"
          strokeWidth={1}
          strokeDasharray="4 3"
        />

        {/* Axes */}
        <line
          x1={m.left}
          x2={m.left}
          y1={m.top}
          y2={baseY}
          stroke="#D8D3C7"
          strokeWidth={1}
        />
        <line
          x1={m.left}
          x2={m.left + innerW}
          y1={baseY}
          y2={baseY}
          stroke="#D8D3C7"
          strokeWidth={1}
        />

        {/* Barres + valeurs + jours */}
        {data.map((b, i) => {
          const bx = m.left + band * i + (band - barW) / 2;
          const by = y(b.v);
          const hh = baseY - by;
          const color = b.today ? "#102A52" : "#FF6B1A";
          return (
            <g key={b.d}>
              <rect
                x={bx}
                y={by}
                width={barW}
                height={hh}
                rx={2}
                fill={color}
              />
              <text
                x={bx + barW / 2}
                y={by - 5}
                textAnchor="middle"
                fontSize="9"
                fontWeight="700"
                fill={b.today ? "#102A52" : "#C2410C"}
              >
                {b.v}
              </text>
              <text
                x={bx + barW / 2}
                y={baseY + 14}
                textAnchor="middle"
                fontSize="9.5"
                fill="#667085"
              >
                {b.d}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Légende */}
      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line pt-3 text-[10.5px] text-ink-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[2px] bg-kamoo-orange-500" />
          Taux quotidien
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[2px] bg-kamoo-blue-900" />
          Aujourd&apos;hui (Dim)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0 w-4 border-t border-dashed border-ink-400" />
          Moyenne 80%
        </span>
      </div>
    </section>
  );
}

type ActivityEvent = {
  when: string;
  type:
    | "confirmed"
    | "callback"
    | "unreachable"
    | "cancelled"
    | "comment"
    | "started";
  label: string;
  detail: string;
};

const MOCK_ACTIVITY: ActivityEvent[] = [
  {
    when: "il y a 5 min",
    type: "confirmed",
    label: "Commande confirmée",
    detail: "ORD-SN-00121 · Awa Diop · 12 000 F",
  },
  {
    when: "il y a 12 min",
    type: "callback",
    label: "Rappel planifié",
    detail: "ORD-SN-00130 · Fatou Sarr · 16:00",
  },
  {
    when: "il y a 25 min",
    type: "comment",
    label: "Commentaire ajouté",
    detail: "ORD-SN-00129 · « Hésite sur la couleur »",
  },
  {
    when: "il y a 1h",
    type: "confirmed",
    label: "Commande confirmée",
    detail: "ORD-SN-00128 · Aminata Ba · 18 000 F",
  },
  {
    when: "il y a 1h 20min",
    type: "unreachable",
    label: "Marqué injoignable",
    detail: "ORD-SN-00127 · 3e tentative · Omar Touré",
  },
  {
    when: "il y a 2h",
    type: "cancelled",
    label: "Commande annulée",
    detail: "ORD-SN-00124 · Modou Kane · Pas de budget",
  },
  {
    when: "il y a 2h 30min",
    type: "confirmed",
    label: "Commande confirmée",
    detail: "ORD-SN-00126 · Khady Sow · 25 000 F",
  },
  {
    when: "aujourd'hui · 09:12",
    type: "started",
    label: "Début de session",
    detail: "Connexion à la console closeuse",
  },
];

function ActivityFeed() {
  const dotClass: Record<ActivityEvent["type"], string> = {
    confirmed: "bg-emerald-500",
    callback: "bg-kamoo-orange-500",
    unreachable: "bg-ink-400",
    cancelled: "bg-red-500",
    comment: "bg-kamoo-blue-600",
    started: "bg-amber-500",
  };
  return (
    <div className="mt-6">
      <MonoLabel>Activité récente</MonoLabel>
      <div className="relative mt-4 flex flex-col gap-4">
        {/* Ligne verticale qui relie les events */}
        <div className="absolute bottom-3 left-[5px] top-3 w-px bg-paper-2" />
        {MOCK_ACTIVITY.map((e, i) => (
          <div key={i} className="relative flex gap-3">
            <span
              className={cn(
                "z-[1] mt-1 h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white",
                dotClass[e.type],
              )}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[13px] font-bold text-ink-900">
                  {e.label}
                </span>
                <span className="shrink-0 whitespace-nowrap font-mono-kamoo text-[10px] text-ink-400">
                  {e.when}
                </span>
              </div>
              <div className="mt-0.5 text-[11.5px] text-ink-500">
                {e.detail}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DrawerKv({
  label,
  value,
  strong,
  tone = "default",
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: "default" | "warn";
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-[12.5px] text-ink-600">{label}</span>
      <span
        className={cn(
          "font-display font-extrabold tabular-nums",
          strong ? "text-[15px]" : "text-[13.5px]",
          tone === "warn" ? "text-rose-700" : "text-ink-900",
        )}
        style={{ letterSpacing: "-0.01em" }}
      >
        {value}
      </span>
    </div>
  );
}

