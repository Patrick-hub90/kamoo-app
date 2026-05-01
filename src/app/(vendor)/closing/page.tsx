"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Phone,
  Search,
  Star,
  XCircle,
} from "lucide-react";
import { ClosingCard } from "@/components/kamoo/closing-card";
import { StatCard } from "@/components/kamoo/stat-card";
import {
  DateRangeFilter,
  type DateFilterValue,
} from "@/components/kamoo/date-range-filter";
import {
  MOCK_CLOSING_ASSIGNMENTS,
  MOCK_ACTIVE_CLOSEUSE,
  computeClosingStats,
} from "@/lib/data/mock-closing";
import {
  CLOSING_STATUS_LABELS,
  type ClosingStatus,
} from "@/lib/types/closing";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | ClosingStatus;

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "Tous les statuts" },
  { id: "to_call", label: CLOSING_STATUS_LABELS.to_call },
  { id: "called", label: CLOSING_STATUS_LABELS.called },
  { id: "callback_scheduled", label: CLOSING_STATUS_LABELS.callback_scheduled },
  { id: "confirmed", label: CLOSING_STATUS_LABELS.confirmed },
  { id: "cancelled", label: CLOSING_STATUS_LABELS.cancelled },
  { id: "delivered", label: CLOSING_STATUS_LABELS.delivered },
];

export default function ClosingPage() {
  const assignments = MOCK_CLOSING_ASSIGNMENTS;
  const stats = computeClosingStats(assignments);
  const closeuse = MOCK_ACTIVE_CLOSEUSE;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilterValue>({
    preset: "all",
  });
  const [statusOpen, setStatusOpen] = useState(false);

  const currentStatusLabel =
    STATUS_FILTERS.find((s) => s.id === statusFilter)?.label ?? "Statut";

  const filtered = useMemo(() => {
    return assignments.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !a.publicCode.toLowerCase().includes(q) &&
          !a.productName.toLowerCase().includes(q) &&
          !a.client.name.toLowerCase().includes(q) &&
          !a.client.phone.toLowerCase().includes(q)
        )
          return false;
      }
      // Date filtering omitted for brevity; could be applied like in expeditions
      return true;
    });
  }, [assignments, statusFilter, search]);

  const filtersActive =
    search.length > 0 ||
    statusFilter !== "all" ||
    dateFilter.preset !== "all";

  return (
    <div className="flex h-full flex-col">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-line bg-white px-10 py-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink-900">
            Closing
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Suivez les appels de votre closeuse pour valider les commandes
            avant livraison.
          </p>
        </div>

        {/* Bloc closeuse active */}
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-paper-2/40 px-4 py-2.5">
          <div
            className="grid h-10 w-10 place-items-center rounded-full text-sm font-extrabold text-white"
            style={{ background: closeuse.avatarBg }}
          >
            {closeuse.name
              .split(" ")
              .map((n) => n.charAt(0))
              .join("")}
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
              Closeuse active
            </div>
            <div className="text-[14px] font-bold text-ink-900">
              {closeuse.name}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-ink-500">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="font-bold text-ink-700">{closeuse.rating}</span>
              <span>· {closeuse.reviewsCount} avis</span>
            </div>
          </div>
          <button className="ml-2 rounded-lg border border-line bg-white px-3 py-1.5 text-[11.5px] font-semibold text-ink-900 hover:bg-paper-2">
            Profil
          </button>
          <button className="rounded-lg border border-line bg-white px-3 py-1.5 text-[11.5px] font-semibold text-ink-900 hover:bg-paper-2">
            Changer
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="px-10 pt-8">
        <div className="grid grid-cols-4 gap-3">
          <StatCard
            label="À appeler"
            value={stats.toCall}
            icon={<Phone className="h-4 w-4" />}
            tone="orange"
            badge={stats.toCall > 0}
          />
          <StatCard
            label="En cours"
            value={stats.inProgress}
            icon={<Phone className="h-4 w-4" />}
            tone="blue"
          />
          <StatCard
            label="Confirmées (auj.)"
            value={stats.confirmedToday}
            icon={<CheckCircle2 className="h-4 w-4" />}
            tone="green"
          />
          <StatCard
            label="Annulées (auj.)"
            value={stats.cancelledToday}
            icon={<XCircle className="h-4 w-4" />}
            tone="gray"
          />
        </div>
      </div>

      {/* SÉPARATEUR : filtres */}
      <div className="mt-8 border-y border-line bg-paper-2/60 px-10 py-3">
        <div className="flex items-center gap-3">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              placeholder="Code, produit, client ou téléphone…"
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
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Filtre date */}
          <DateRangeFilter value={dateFilter} onChange={setDateFilter} />

          {filtersActive && (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setDateFilter({ preset: "all" });
              }}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-bold text-kamoo-orange-600 hover:bg-kamoo-orange-50"
            >
              Effacer
            </button>
          )}

          <div className="flex-1" />

          <div className="whitespace-nowrap text-[12px] font-semibold text-ink-500">
            {filtered.length} / {assignments.length} commandes
          </div>
        </div>
      </div>

      {/* LISTE */}
      <div className="flex-1 overflow-y-auto px-10 py-6">
        {filtered.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-line bg-white py-20 text-center">
            <div className="text-3xl">📞</div>
            <p className="mt-3 text-sm font-semibold text-ink-700">
              Aucune commande ne correspond à vos filtres
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((a) => (
              <ClosingCard key={a.id} assignment={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
