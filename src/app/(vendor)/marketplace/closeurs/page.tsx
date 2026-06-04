"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search, Sparkles } from "lucide-react";
import { CloseuseCard } from "@/components/kamoo/closeuse-card";
import { MOCK_CLOSEUSES } from "@/lib/data/mock-closeuses";
import { useSessionStorageState } from "@/lib/hooks/use-session-storage-state";
import {
  STATUS_LABELS,
  type Closeuse,
  type CloseuseStatus,
} from "@/lib/types/closeuse";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | CloseuseStatus;
type SortKey = "rating" | "commission_asc" | "commission_desc" | "recent";

const STATUS_OPTIONS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "Toutes" },
  { id: "certified", label: STATUS_LABELS.certified },
  { id: "new", label: STATUS_LABELS.new },
];

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "rating", label: "★ Note" },
  { id: "commission_asc", label: "Commission ↑ (moins cher)" },
  { id: "commission_desc", label: "Commission ↓ (plus cher)" },
  { id: "recent", label: "Inscription récente" },
];

/* Extrait toutes les langues uniques des closeuses */
function getAllLanguages(closeuses: Closeuse[]) {
  const map = new Map<string, string>();
  for (const c of closeuses) {
    for (const l of c.languages) {
      map.set(l.code, l.name);
    }
  }
  return Array.from(map, ([code, name]) => ({ code, name })).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

export default function MarketplaceCloseursPage() {
  const all = MOCK_CLOSEUSES;
  const allLanguages = useMemo(() => getAllLanguages(all), [all]);

  // Filtres persistés
  const [search, setSearch] = useSessionStorageState(
    "marketplace.closeurs.search",
    "",
  );
  const [statusFilter, setStatusFilter] =
    useSessionStorageState<StatusFilter>(
      "marketplace.closeurs.statusFilter",
      "all",
    );
  const [languageFilter, setLanguageFilter] = useSessionStorageState(
    "marketplace.closeurs.languageFilter",
    "all",
  );
  const [sortBy, setSortBy] = useSessionStorageState<SortKey>(
    "marketplace.closeurs.sortBy",
    "rating",
  );

  // États UI éphémères
  const [statusOpen, setStatusOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = all.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (
        languageFilter !== "all" &&
        !c.languages.some((l) => l.code === languageFilter)
      )
        return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const hit =
          c.name.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          c.languages.some((l) => l.name.toLowerCase().includes(q));
        if (!hit) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating || b.reviewsCount - a.reviewsCount;
        case "commission_asc":
          return a.commissionXof - b.commissionXof;
        case "commission_desc":
          return b.commissionXof - a.commissionXof;
        case "recent":
          return (
            new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
          );
      }
    });
    return list;
  }, [all, statusFilter, languageFilter, search, sortBy]);

  const filtersActive =
    search.length > 0 ||
    statusFilter !== "all" ||
    languageFilter !== "all" ||
    sortBy !== "rating";

  const currentStatusLabel =
    STATUS_OPTIONS.find((o) => o.id === statusFilter)?.label ?? "Toutes";
  const currentLangLabel =
    languageFilter === "all"
      ? "Toutes"
      : allLanguages.find((l) => l.code === languageFilter)?.name ?? "Toutes";
  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.id === sortBy)?.label ?? "★ Note";

  return (
    <div className="flex h-full flex-col">
      {/* HEADER */}
      <div className="border-b border-line bg-white px-10 py-6">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-ink-500">
          <Sparkles className="h-3.5 w-3.5 text-kamoo-orange-500" />
          Marketplace
          <span className="text-ink-300">/</span>
          <span className="text-ink-900">Closeuses</span>
        </div>
        <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-ink-900">
          Choisissez votre closeuse
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Comparez les profils, performances et tarifs. Toutes nos closeuses sont
          vérifiées par Kamoo (KYC + entretien).
        </p>
      </div>

      {/* BARRE DE FILTRES */}
      <div className="border-b border-line bg-paper-2/60 px-10 py-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {/* Recherche — prend toute la largeur sur mobile, plafond 320px desktop */}
          <div className="relative min-w-[180px] flex-1 sm:flex-none sm:w-80">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              placeholder="Nom, ville ou langue…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-[13px] outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600"
            />
          </div>

          {/* Filtre Statut */}
          <FilterDropdown
            label="Statut"
            value={currentStatusLabel}
            isActive={statusFilter !== "all"}
            isOpen={statusOpen}
            onToggle={() => {
              setStatusOpen(!statusOpen);
              setLangOpen(false);
              setSortOpen(false);
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

          {/* Filtre Langue */}
          <FilterDropdown
            label="Langue"
            value={currentLangLabel}
            isActive={languageFilter !== "all"}
            isOpen={langOpen}
            onToggle={() => {
              setLangOpen(!langOpen);
              setStatusOpen(false);
              setSortOpen(false);
            }}
            onClose={() => setLangOpen(false)}
          >
            <DropdownItem
              active={languageFilter === "all"}
              onClick={() => {
                setLanguageFilter("all");
                setLangOpen(false);
              }}
            >
              Toutes
            </DropdownItem>
            {allLanguages.map((l) => (
              <DropdownItem
                key={l.code}
                active={languageFilter === l.code}
                onClick={() => {
                  setLanguageFilter(l.code);
                  setLangOpen(false);
                }}
              >
                {l.name}
              </DropdownItem>
            ))}
          </FilterDropdown>

          {/* Filtre Tri */}
          <FilterDropdown
            label="Tri"
            value={currentSortLabel}
            isActive={sortBy !== "rating"}
            isOpen={sortOpen}
            onToggle={() => {
              setSortOpen(!sortOpen);
              setStatusOpen(false);
              setLangOpen(false);
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

          {/* Effacer */}
          {filtersActive && (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setLanguageFilter("all");
                setSortBy("rating");
              }}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-bold text-kamoo-orange-600 hover:bg-kamoo-orange-50"
            >
              Effacer
            </button>
          )}

          {/* Spacer flexible : pousse le compteur à droite quand il y a de
              la place, mais se replie quand la barre wrap. */}
          <div className="hidden flex-1 lg:block" />

          <div className="ml-auto whitespace-nowrap text-[12px] font-semibold text-ink-500 lg:ml-0">
            {filtered.length} sur {all.length} closeuse
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
              Aucune closeuse ne correspond à vos filtres
            </p>
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setLanguageFilter("all");
                setSortBy("rating");
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-kamoo-orange-500 px-4 py-2 text-[13px] font-bold text-white hover:bg-kamoo-orange-600"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
            {filtered.map((c) => (
              <CloseuseCard key={c.slug} closeuse={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Sous-composants ─────────────────────────────────── */

function FilterDropdown({
  label,
  value,
  isActive,
  isOpen,
  onToggle,
  onClose,
  width = "w-56",
  children,
}: {
  label: string;
  value: string;
  isActive: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  width?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={cn(
          "inline-flex h-9 max-w-[220px] items-center gap-2 whitespace-nowrap rounded-lg border bg-white px-3 text-[13px] font-semibold text-ink-900 hover:border-ink-300",
          isActive ? "border-kamoo-blue-600" : "border-line",
        )}
      >
        <span className="text-ink-500">{label} :</span>
        <span className="truncate">{value}</span>
        <ChevronDown className="h-3 w-3 shrink-0 text-ink-400" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={onClose} />
          <div
            className={cn(
              "absolute left-0 top-[calc(100%+4px)] z-20 rounded-xl border border-line bg-white p-1 shadow-[var(--shadow-kamoo-lg)]",
              width,
            )}
          >
            {children}
          </div>
        </>
      )}
    </div>
  );
}

function DropdownItem({
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
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-[13px] hover:bg-paper-2",
        active ? "font-bold text-ink-900" : "font-medium text-ink-700",
      )}
    >
      {children}
    </button>
  );
}
