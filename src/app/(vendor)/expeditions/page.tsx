"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Calendar,
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
  MOCK_EXPEDITIONS,
  computeListStats,
} from "@/lib/data/mock-expeditions";
import {
  STATUS_LABELS,
  type ExpeditionStatus,
} from "@/lib/types/expedition";
import { formatXOF } from "@/lib/format";
import { cn } from "@/lib/utils";

type DatePreset = "7j" | "30j" | "3m" | "all";
type StatusFilter = "all" | ExpeditionStatus;

const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: "7j", label: "7 jours" },
  { id: "30j", label: "30 jours" },
  { id: "3m", label: "3 mois" },
  { id: "all", label: "Tout" },
];

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "Tous les statuts" },
  { id: "received_china", label: STATUS_LABELS.received_china },
  { id: "awaiting_quote", label: STATUS_LABELS.awaiting_quote },
  { id: "arrived_destination", label: STATUS_LABELS.arrived_destination },
];

export default function ExpeditionsListPage() {
  const expeditions = MOCK_EXPEDITIONS;
  const stats = computeListStats(expeditions);

  const [tab, setTab] = useState<"en_cours" | "historique">("en_cours");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("30j");
  const [statusOpen, setStatusOpen] = useState(false);

  const currentStatusLabel =
    STATUS_FILTERS.find((s) => s.id === statusFilter)?.label ?? "Statut";

  const filtered = useMemo(() => {
    return expeditions.filter((e) => {
      // Onglet
      if (tab === "en_cours" && e.status === "arrived_destination")
        return false;
      if (tab === "historique" && e.status !== "arrived_destination")
        return false;
      // Statut
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
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
  }, [expeditions, tab, statusFilter, search]);

  const filtersActive =
    search.length > 0 || statusFilter !== "all" || datePreset !== "30j";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setDatePreset("30j");
  };

  const counts = {
    en_cours: expeditions.filter((e) => e.status !== "arrived_destination").length,
    historique: expeditions.filter((e) => e.status === "arrived_destination").length,
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

      {/* SÉPARATEUR : barre de filtres */}
      <div className="mt-8 border-y border-line bg-paper-2/60 px-10 py-3">
        <div className="flex items-center gap-3">
          {/* Onglets */}
          <div className="inline-flex gap-1 rounded-lg border border-line bg-white p-1">
            <TabButton
              active={tab === "en_cours"}
              onClick={() => setTab("en_cours")}
              label="En cours"
              count={counts.en_cours}
            />
            <TabButton
              active={tab === "historique"}
              onClick={() => setTab("historique")}
              label="Historique"
              count={counts.historique}
            />
          </div>

          {/* Recherche */}
          <div className="relative w-72">
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

          {/* Filtre date */}
          <div className="inline-flex items-center gap-1 rounded-lg border border-line bg-white p-1">
            <Calendar className="ml-1 h-3.5 w-3.5 text-ink-400" />
            {DATE_PRESETS.map((d) => (
              <button
                key={d.id}
                onClick={() => setDatePreset(d.id)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[12px] font-bold transition",
                  datePreset === d.id
                    ? "bg-kamoo-blue-700 text-white"
                    : "text-ink-500 hover:bg-paper-2",
                )}
              >
                {d.label}
              </button>
            ))}
          </div>

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
          <div className="text-[12px] font-semibold text-ink-500">
            {filtered.length} / {expeditions.length}
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

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-[13px] font-bold transition",
        active
          ? "bg-kamoo-blue-700 text-white"
          : "text-ink-500 hover:bg-paper-2",
      )}
    >
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
          active ? "bg-white/20" : "bg-paper-2 text-ink-500",
        )}
      >
        {count}
      </span>
    </button>
  );
}
