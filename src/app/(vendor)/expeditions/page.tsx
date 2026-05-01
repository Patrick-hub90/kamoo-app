"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Plus,
  Search,
  Ship,
  Wallet,
  X,
} from "lucide-react";
import { ShipmentCard } from "@/components/kamoo/shipment-card";
import { StatCard } from "@/components/kamoo/stat-card";
import {
  DateRangeFilter,
  type DateFilterValue,
} from "@/components/kamoo/date-range-filter";
import {
  MOCK_EXPEDITIONS,
  computeListStats,
} from "@/lib/data/mock-expeditions";
import {
  STATUS_LABELS,
  type ExpeditionStatus,
} from "@/lib/types/expedition";
import { formatXOF } from "@/lib/format";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | ExpeditionStatus;

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "Tous les statuts" },
  { id: "received_china", label: STATUS_LABELS.received_china },
  { id: "awaiting_quote", label: STATUS_LABELS.awaiting_quote },
  { id: "arrived_destination", label: STATUS_LABELS.arrived_destination },
];

function presetToCutoff(value: DateFilterValue): Date | null {
  if (value.preset === "all" || value.preset === "custom") return null;
  const days =
    value.preset === "7j" ? 7 : value.preset === "30j" ? 30 : 90;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export default function ExpeditionsListPage() {
  const expeditions = MOCK_EXPEDITIONS;
  const stats = computeListStats(expeditions);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilterValue>({
    preset: "all",
  });
  const [statusOpen, setStatusOpen] = useState(false);

  const currentStatusLabel =
    STATUS_FILTERS.find((s) => s.id === statusFilter)?.label ?? "Statut";

  const filtered = useMemo(() => {
    const cutoff = presetToCutoff(dateFilter);
    return expeditions.filter((e) => {
      // Statut
      if (statusFilter !== "all" && e.status !== statusFilter) return false;

      // Date
      const created = new Date(e.createdAt);
      if (dateFilter.preset === "custom") {
        if (dateFilter.range?.from && created < dateFilter.range.from)
          return false;
        if (dateFilter.range?.to && created > dateFilter.range.to)
          return false;
      } else if (cutoff && created < cutoff) {
        return false;
      }

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
  }, [expeditions, statusFilter, dateFilter, search]);

  const filtersActive =
    search.length > 0 ||
    statusFilter !== "all" ||
    dateFilter.preset !== "all";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setDateFilter({ preset: "all" });
  };

  return (
    <div className="flex h-full flex-col">
      {/* HEADER DE PAGE */}
      <div className="flex items-center justify-between border-b border-line bg-white px-10 py-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink-900">
            Mes expéditions
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Suis tes colis Chine → Sénégal en temps réel.
          </p>
        </div>
        <Link
          href="/expeditions/nouvelle"
          className="inline-flex items-center gap-2 rounded-xl bg-kamoo-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-kamoo-orange-600"
        >
          <Plus className="h-4 w-4" />
          Nouvelle expédition
        </Link>
      </div>

      {/* SECTION RÉSUMÉ */}
      <div className="px-10 pt-8">
        <div className="grid grid-cols-4 gap-3">
          <StatCard
            label="En cours"
            value={stats.enCours}
            icon={<Ship className="h-4 w-4" />}
            tone="blue"
          />
          <StatCard
            label="En attente d'action"
            value={stats.enAttenteAction}
            icon={<AlertTriangle className="h-4 w-4" />}
            tone="orange"
            badge
          />
          <StatCard
            label="Arrivées ce mois"
            value={stats.arriveesCeMois}
            icon={<Check className="h-4 w-4" />}
            tone="green"
          />
          <StatCard
            label="Total à payer"
            value={formatXOF(stats.totalAPayer, false)}
            unit="F CFA"
            icon={<Wallet className="h-4 w-4" />}
            tone="orange"
            highlight={stats.totalAPayer > 0}
          />
        </div>
      </div>

      {/* SÉPARATEUR : barre de filtres (1 ligne, pas de wrap) */}
      <div className="mt-8 border-y border-line bg-paper-2/60 px-10 py-3">
        <div className="flex items-center gap-3">
          {/* Recherche — en premier */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              placeholder="Code ou nom du produit…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-[13px] outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600"
            />
          </div>

          {/* Filtre statut */}
          <div className="relative">
            <button
              onClick={() => setStatusOpen(!statusOpen)}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-lg border bg-white px-3 text-[13px] font-semibold text-ink-900 hover:border-ink-300",
                statusFilter !== "all"
                  ? "border-kamoo-blue-600"
                  : "border-line",
              )}
            >
              <span className="text-ink-500">Statut :</span>
              <span>{currentStatusLabel}</span>
              <ChevronDown className="h-3 w-3 text-ink-400" />
            </button>
            {statusOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setStatusOpen(false)}
                />
                <div className="absolute left-0 top-[calc(100%+4px)] z-20 w-56 rounded-xl border border-line bg-white p-1 shadow-[var(--shadow-kamoo-lg)]">
                  {STATUS_FILTERS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setStatusFilter(s.id);
                        setStatusOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[13px] hover:bg-paper-2",
                        s.id === statusFilter
                          ? "font-bold text-ink-900"
                          : "font-medium text-ink-700",
                      )}
                    >
                      {s.label}
                      {s.id === statusFilter && (
                        <Check className="h-3.5 w-3.5 text-kamoo-blue-700" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Filtre date — dropdown unique avec calendrier intégré */}
          <DateRangeFilter value={dateFilter} onChange={setDateFilter} />

          {/* Effacer */}
          {filtersActive && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-bold text-kamoo-orange-600 hover:bg-kamoo-orange-50"
            >
              <X className="h-3 w-3" />
              Effacer
            </button>
          )}

          <div className="flex-1" />

          {/* Compteur */}
          <div className="whitespace-nowrap text-[12px] font-semibold text-ink-500">
            {filtered.length} / {expeditions.length} expéditions
          </div>
        </div>
      </div>

      {/* LISTE */}
      <div className="flex-1 overflow-y-auto px-10 py-6">
        {filtered.length === 0 ? (
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
          <div className="flex flex-col gap-3">
            {filtered.map((e) => (
              <ShipmentCard key={e.id} expedition={e} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
