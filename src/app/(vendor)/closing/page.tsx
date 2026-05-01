"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  MessageCircle,
  Phone,
  Plus,
  Search,
  Star,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { StatCard } from "@/components/kamoo/stat-card";
import { Countdown, isCountdownExpired } from "@/components/kamoo/countdown";
import {
  DateRangeFilter,
  type DateFilterValue,
} from "@/components/kamoo/date-range-filter";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MOCK_CLOSING_ASSIGNMENTS,
  MOCK_ACTIVE_CLOSEUSE,
  computeClosingStats,
  formatDuration,
} from "@/lib/data/mock-closing";
import {
  CLOSING_STATUS_LABELS,
  CANCELLATION_REASON_LABELS,
  type ClosingAssignment,
  type ClosingStatus,
} from "@/lib/types/closing";
import { groupByDate } from "@/lib/date-groups";
import { formatXOF } from "@/lib/format";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | ClosingStatus;

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "Tous les statuts" },
  { id: "nouvelle", label: CLOSING_STATUS_LABELS.nouvelle },
  { id: "rappele", label: CLOSING_STATUS_LABELS.rappele },
  { id: "livraison_en_cours", label: CLOSING_STATUS_LABELS.livraison_en_cours },
  { id: "annule", label: CLOSING_STATUS_LABELS.annule },
  { id: "injoignable", label: CLOSING_STATUS_LABELS.injoignable },
];

function statusClasses(s: ClosingStatus) {
  switch (s) {
    case "nouvelle":
      return "bg-kamoo-orange-500 text-white";
    case "rappele":
      return "bg-kamoo-blue-700 text-white";
    case "livraison_en_cours":
      return "bg-emerald-600 text-white";
    case "annule":
      return "bg-red-600 text-white";
    case "injoignable":
      return "bg-ink-500 text-white";
  }
}

/** Couleur du taux de conversion */
function conversionTone(rate: number) {
  if (rate >= 70) return "green" as const;
  if (rate >= 50) return "orange" as const;
  return "gray" as const;
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

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilterValue>({
    preset: "all",
  });
  const [statusOpen, setStatusOpen] = useState(false);
  const [newOrderOpen, setNewOrderOpen] = useState(false);

  const currentStatusLabel =
    STATUS_FILTERS.find((s) => s.id === statusFilter)?.label ?? "Statut";

  // Filtrage par date (s'applique aux STATS + au TABLEAU)
  const dateFiltered = useMemo(
    () => applyDateFilter(MOCK_CLOSING_ASSIGNMENTS, dateFilter),
    [dateFilter],
  );

  const stats = useMemo(() => computeClosingStats(dateFiltered), [dateFiltered]);

  // Filtrage supplémentaire par recherche + statut (uniquement sur le tableau)
  const filtered = useMemo(() => {
    return dateFiltered.filter((a) => {
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
      return true;
    });
  }, [dateFiltered, statusFilter, search]);

  // Groupement par date
  const grouped = useMemo(
    () => groupByDate(filtered, (a) => a.createdAt),
    [filtered],
  );

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
            Suivez les appels de votre closeuse pour valider les commandes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Bouton Nouvelle commande */}
          <button
            onClick={() => setNewOrderOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-kamoo-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-kamoo-orange-600"
          >
            <Plus className="h-4 w-4" />
            Nouvelle commande
          </button>

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
      </div>

      {/* STATS (filtrées par date) */}
      <div className="px-10 pt-8">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
            Performance closing —{" "}
            {dateFilter.preset === "all"
              ? "tout l'historique"
              : dateFilter.preset === "custom"
                ? "période personnalisée"
                : `${dateFilter.preset === "7j" ? "7 jours" : dateFilter.preset === "30j" ? "30 jours" : "3 mois"}`}
          </div>
          <DateRangeFilter value={dateFilter} onChange={setDateFilter} />
        </div>
        <div className="grid grid-cols-4 gap-3">
          <StatCard
            label="Total commandes"
            value={stats.total}
            icon={<Phone className="h-4 w-4" />}
            tone="blue"
          />
          <StatCard
            label="Taux de confirmation"
            value={`${stats.conversionRate}%`}
            unit={
              stats.closedCount > 0
                ? `${stats.confirmedCount}/${stats.closedCount}`
                : "—"
            }
            icon={<TrendingUp className="h-4 w-4" />}
            tone={conversionTone(stats.conversionRate)}
            highlight={stats.conversionRate >= 70}
          />
          <StatCard
            label="Temps moyen traitement"
            value={
              stats.avgProcessingMinutes > 0
                ? formatDuration(stats.avgProcessingMinutes)
                : "—"
            }
            icon={<Clock className="h-4 w-4" />}
            tone="gray"
          />
          <StatCard
            label="CA confirmé"
            value={formatXOF(stats.confirmedRevenue, false)}
            unit="F CFA"
            icon={<Wallet className="h-4 w-4" />}
            tone="green"
          />
        </div>
      </div>

      {/* SÉPARATEUR : filtres tableau */}
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
            {filtered.length} / {dateFiltered.length} commandes
          </div>
        </div>
      </div>

      {/* TABLEAU GROUPÉ PAR DATE */}
      <div className="flex-1 overflow-auto px-10 py-6">
        {filtered.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-line bg-white py-20 text-center">
            <div className="text-3xl">📞</div>
            <p className="mt-3 text-sm font-semibold text-ink-700">
              Aucune commande ne correspond à vos filtres
            </p>
          </div>
        ) : (
          <ClosingTable groups={grouped} />
        )}
      </div>

      {/* MODALE NOUVELLE COMMANDE */}
      <NewOrderDialog open={newOrderOpen} onOpenChange={setNewOrderOpen} />
    </div>
  );
}

/* ─── Tableau groupé ──────────────────────────────────────────── */
function ClosingTable({
  groups,
}: {
  groups: { label: string; items: ClosingAssignment[] }[];
}) {
  const router = useRouter();
  return (
    <div className="rounded-2xl border border-line bg-white">
      <div
        className="overflow-x-auto rounded-2xl"
        style={{
          scrollbarColor: "#D1D5DB #F5F5EE",
          scrollbarWidth: "thin",
        }}
      >
        <table className="w-full min-w-[1430px] table-fixed text-[13px]">
          <colgroup>
            <col style={{ width: "150px" }} />
            <col style={{ width: "230px" }} />
            <col style={{ width: "60px" }} />
            <col style={{ width: "115px" }} />
            <col style={{ width: "180px" }} />
            <col style={{ width: "145px" }} />
            <col style={{ width: "85px" }} />
            <col style={{ width: "165px" }} />
            <col style={{ width: "180px" }} />
            <col style={{ width: "150px" }} />
          </colgroup>
          <thead>
            <tr className="border-b border-line bg-paper-2/40 text-left">
              <Th>N°</Th>
              <Th>Produit</Th>
              <Th align="center">Qté</Th>
              <Th align="right">Total</Th>
              <Th>Client</Th>
              <Th>Téléphone</Th>
              <Th align="center">WhatsApp</Th>
              <Th align="center">Statut</Th>
              <Th>Commentaire</Th>
              <Th align="center">Compte à rebours</Th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <FragmentGroup
                key={group.label}
                label={group.label}
                items={group.items}
                onClickRow={(id) => router.push(`/closing/${id}`)}
              />
            ))}
          </tbody>
        </table>
      </div>
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
          colSpan={10}
          className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-ink-500"
        >
          {label}{" "}
          <span className="font-medium normal-case text-ink-400">
            · {items.length} commande{items.length > 1 ? "s" : ""}
          </span>
        </td>
      </tr>
      {items.map((a) => {
        const target =
          (a.status === "rappele" || a.status === "injoignable") &&
          a.callbackAt
            ? a.callbackAt
            : null;
        const expired = target ? isCountdownExpired(target) : false;
        return (
          <tr
            key={a.id}
            onClick={() => onClickRow(a.id)}
            className={cn(
              "cursor-pointer border-b border-line last:border-0 transition",
              expired
                ? "bg-red-50 hover:bg-red-100"
                : "hover:bg-paper-2/30",
            )}
          >
            <Td>
              <span className="font-mono-kamoo text-[11.5px] text-ink-500">
                {a.publicCode}
              </span>
            </Td>
            <Td>
              <span
                className="block truncate font-semibold text-ink-900"
                title={a.productName}
              >
                {a.productName}
              </span>
            </Td>
            <Td align="center">
              <span className="font-bold text-ink-900">×{a.quantity}</span>
            </Td>
            <Td align="right">
              <span className="font-bold text-ink-900">
                {formatXOF(a.amountXof)}
              </span>
            </Td>
            <Td>
              <div>
                <span className="font-semibold text-ink-900">
                  {a.client.name}
                </span>
                <div className="text-[11px] text-ink-500">{a.client.city}</div>
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
            <Td>
              <span
                className={cn(
                  "inline-flex w-[140px] items-center justify-center rounded-full px-2 py-1 text-[11.5px] font-bold whitespace-nowrap",
                  statusClasses(a.status),
                )}
              >
                {CLOSING_STATUS_LABELS[a.status]}
              </span>
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
                <span className="text-[11px] italic text-red-700">
                  {CANCELLATION_REASON_LABELS[a.cancellationReason]}
                </span>
              ) : (
                <span className="text-[11px] text-ink-300">—</span>
              )}
            </Td>
            <Td align="center">
              {target ? (
                <Countdown targetIso={target} />
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

/* ─── Modale Nouvelle Commande ────────────────────────────── */
function NewOrderDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
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

          {/* Produit */}
          <div className="border-t border-line pt-4">
            <Field label="Produit" required>
              <select className="w-full rounded-xl border border-line bg-white px-3 py-2 text-[13px] outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600">
                <option>Sélectionner un produit du catalogue…</option>
                <option>Crème éclaircissante naturelle</option>
                <option>Power Bank 10 000mAh</option>
              </select>
            </Field>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Quantité" required>
                <input
                  type="number"
                  min="1"
                  defaultValue="1"
                  className="w-full rounded-xl border border-line bg-white px-3 py-2 text-[13px] outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600"
                />
              </Field>
              <Field label="Total (F CFA)" required>
                <input
                  type="number"
                  placeholder="18000"
                  className="w-full rounded-xl border border-line bg-white px-3 py-2 text-[13px] outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600"
                />
              </Field>
            </div>
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
