"use client";

import { useMemo, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import {
  DropdownItem,
  FilterDropdown,
} from "@/components/kamoo/filter-dropdown";
import { LivreurCard } from "@/components/kamoo/livreur-card";
import { MOCK_LIVREURS } from "@/lib/data/mock-livreurs";
import { useSessionStorageState } from "@/lib/hooks/use-session-storage-state";
import {
  LIVREUR_STATUS_LABELS,
  type LivreurStatus,
  type LivreurType,
} from "@/lib/types/livreur";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | LivreurStatus;
type TypeFilter = "all" | LivreurType;
type SortKey = "rating" | "recent";

const STATUS_OPTIONS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "certified", label: LIVREUR_STATUS_LABELS.certified },
  { id: "new", label: LIVREUR_STATUS_LABELS.new },
];

const TYPE_OPTIONS: { id: TypeFilter; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "particulier", label: "Indépendants" },
  { id: "agence", label: "Agences" },
];

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "rating", label: "★ Note" },
  { id: "recent", label: "Inscription récente" },
];

export default function MarketplaceLivreursPage() {
  const all = MOCK_LIVREURS;

  const [search, setSearch] = useSessionStorageState(
    "marketplace.livreurs.search",
    "",
  );
  const [statusFilter, setStatusFilter] =
    useSessionStorageState<StatusFilter>(
      "marketplace.livreurs.statusFilter",
      "all",
    );
  const [typeFilter, setTypeFilter] = useSessionStorageState<TypeFilter>(
    "marketplace.livreurs.typeFilter",
    "all",
  );
  const [sortBy, setSortBy] = useSessionStorageState<SortKey>(
    "marketplace.livreurs.sortBy",
    "rating",
  );

  const [statusOpen, setStatusOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const closeAllExcept = (which: "status" | "type" | "sort") => {
    if (which !== "status") setStatusOpen(false);
    if (which !== "type") setTypeOpen(false);
    if (which !== "sort") setSortOpen(false);
  };

  const filtered = useMemo(() => {
    let list = all.filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (typeFilter !== "all" && l.type !== typeFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const hit =
          l.name.toLowerCase().includes(q) ||
          l.city.toLowerCase().includes(q) ||
          l.zones.some((z) => z.name.toLowerCase().includes(q));
        if (!hit) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating || b.reviewsCount - a.reviewsCount;
        case "recent":
          return (
            new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
          );
      }
    });
    return list;
  }, [all, statusFilter, typeFilter, search, sortBy]);

  const filtersActive =
    search.length > 0 ||
    statusFilter !== "all" ||
    typeFilter !== "all" ||
    sortBy !== "rating";

  const currentStatusLabel =
    STATUS_OPTIONS.find((o) => o.id === statusFilter)?.label ?? "Tous";
  const currentTypeLabel =
    TYPE_OPTIONS.find((o) => o.id === typeFilter)?.label ?? "Tous";
  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.id === sortBy)?.label ?? "★ Note";

  const reset = () => {
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
    setSortBy("rating");
  };

  return (
    <div className="flex h-full flex-col">
      {/* HEADER */}
      <div className="border-b border-line bg-white px-10 py-6">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-ink-500">
          <Sparkles className="h-3.5 w-3.5 text-kamoo-orange-500" />
          Marketplace
          <span className="text-ink-300">/</span>
          <span className="text-ink-900">Livreurs</span>
        </div>
        <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-ink-900">
          Choisissez votre livreur
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Particuliers ou agences professionnelles, tous vérifiés par Kamoo
          (KYC + entretien). Tarifs au quartier, paiement à la livraison.
        </p>
      </div>

      {/* FILTRES */}
      <div className="border-b border-line bg-paper-2/60 px-10 py-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="relative min-w-[180px] flex-1 sm:flex-none sm:w-72">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              placeholder="Nom, ville ou zone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-[13px] outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600"
            />
          </div>

          <FilterDropdown
            label="Statut"
            value={currentStatusLabel}
            isActive={statusFilter !== "all"}
            isOpen={statusOpen}
            onToggle={() => {
              setStatusOpen(!statusOpen);
              closeAllExcept("status");
            }}
            onClose={() => setStatusOpen(false)}
          >
            {STATUS_OPTIONS.map((o) => (
              <DropdownItem
                key={o.id}
                active={statusFilter === o.id}
                onClick={() => {
                  setStatusFilter(o.id);
                  setStatusOpen(false);
                }}
              >
                {o.label}
              </DropdownItem>
            ))}
          </FilterDropdown>

          <FilterDropdown
            label="Type"
            value={currentTypeLabel}
            isActive={typeFilter !== "all"}
            isOpen={typeOpen}
            onToggle={() => {
              setTypeOpen(!typeOpen);
              closeAllExcept("type");
            }}
            onClose={() => setTypeOpen(false)}
          >
            {TYPE_OPTIONS.map((o) => (
              <DropdownItem
                key={o.id}
                active={typeFilter === o.id}
                onClick={() => {
                  setTypeFilter(o.id);
                  setTypeOpen(false);
                }}
              >
                {o.label}
              </DropdownItem>
            ))}
          </FilterDropdown>

          <FilterDropdown
            label="Tri"
            value={currentSortLabel}
            isActive={sortBy !== "rating"}
            isOpen={sortOpen}
            onToggle={() => {
              setSortOpen(!sortOpen);
              closeAllExcept("sort");
            }}
            onClose={() => setSortOpen(false)}
            width="w-64"
          >
            {SORT_OPTIONS.map((o) => (
              <DropdownItem
                key={o.id}
                active={sortBy === o.id}
                onClick={() => {
                  setSortBy(o.id);
                  setSortOpen(false);
                }}
              >
                {o.label}
              </DropdownItem>
            ))}
          </FilterDropdown>

          {filtersActive && (
            <button
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-bold text-kamoo-orange-600 hover:bg-kamoo-orange-50"
            >
              Effacer
            </button>
          )}

          <div className="hidden flex-1 lg:block" />
          <div className="ml-auto whitespace-nowrap text-[12px] font-semibold text-ink-500 lg:ml-0">
            {filtered.length} sur {all.length} livreur
            {all.length > 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* GRILLE */}
      <div className="flex-1 overflow-y-auto px-10 py-6">
        {filtered.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-line bg-white py-20 text-center">
            <div className="text-3xl">🔍</div>
            <p className="mt-3 text-sm font-semibold text-ink-700">
              Aucun livreur ne correspond à vos filtres
            </p>
            <button
              onClick={reset}
              className={cn(
                "mt-4 inline-flex items-center gap-1.5 rounded-lg bg-kamoo-orange-500 px-4 py-2 text-[13px] font-bold text-white hover:bg-kamoo-orange-600",
              )}
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
            {filtered.map((l) => (
              <LivreurCard key={l.slug} livreur={l} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
