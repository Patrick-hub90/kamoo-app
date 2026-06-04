"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Megaphone,
  Search,
  TrendingUp,
  Unlink,
  Wallet,
} from "lucide-react";
import { StatCard } from "@/components/kamoo/stat-card";
import {
  DropdownItem,
  FilterDropdown,
} from "@/components/kamoo/filter-dropdown";
import {
  DateRangeFilter,
  type DateFilterValue,
} from "@/components/kamoo/date-range-filter";
import { Tooltip } from "@/components/ui/tooltip";
import { MOCK_AD_CAMPAIGNS } from "@/lib/data/mock-ad-campaigns";
import { MOCK_TODAY } from "@/lib/data/mock-finances";
import { getProduit } from "@/lib/data/mock-produits";
import { useSessionStorageState } from "@/lib/hooks/use-session-storage-state";
import {
  dateFilterRange,
  dateFilterSubtitle,
  normalizeDateFilter,
} from "@/lib/utils/date-filter";
import {
  STATUS_LABELS,
  type AdCampaign,
  type AdCampaignStatus,
} from "@/lib/types/ad-campaign";
import { formatXOF } from "@/lib/format";
import { cn } from "@/lib/utils";

type StatusFilter = AdCampaignStatus | "all";

const STATUS_OPTIONS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "Tous statuts" },
  { id: "active", label: "Actives" },
  { id: "inactive", label: "Inactives" },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
}

/**
 * Campagne avec ses chiffres prorata-temporis sur la période sélectionnée.
 * Pour V1 mock : on suppose un spend/résultats uniformément répartis sur la
 * durée de vie de la campagne, donc on applique le ratio (jours dans la
 * période / jours totaux). En V2, ces données viendront jour par jour de
 * Meta Marketing API.
 */
type ProRatedCampaign = {
  campaign: AdCampaign;
  spentXof: number;
  ordersReceived: number;
  ordersDelivered: number;
  /** True si la campagne a tourné au moins 1 jour dans la période */
  overlapsPeriod: boolean;
};

function prorateCampaign(
  c: AdCampaign,
  range: { fromMs: number; toMs: number } | null,
): ProRatedCampaign {
  if (!range) {
    return {
      campaign: c,
      spentXof: c.spentXof,
      ordersReceived: c.ordersReceived,
      ordersDelivered: c.ordersDelivered,
      overlapsPeriod: true,
    };
  }
  const startMs = new Date(c.startDate).getTime();
  const endMs = c.endDate
    ? new Date(c.endDate).getTime() + 86400000
    : MOCK_TODAY.getTime() + 86400000;
  const overlapStart = Math.max(startMs, range.fromMs);
  const overlapEnd = Math.min(endMs, range.toMs);
  if (overlapEnd <= overlapStart) {
    return {
      campaign: c,
      spentXof: 0,
      ordersReceived: 0,
      ordersDelivered: 0,
      overlapsPeriod: false,
    };
  }
  const totalDays = Math.max(1, Math.ceil((endMs - startMs) / 86400000));
  const overlapDays = Math.max(
    1,
    Math.ceil((overlapEnd - overlapStart) / 86400000),
  );
  const ratio = Math.min(1, overlapDays / totalDays);
  return {
    campaign: c,
    spentXof: Math.round(c.spentXof * ratio),
    ordersReceived: Math.round(c.ordersReceived * ratio),
    ordersDelivered: Math.round(c.ordersDelivered * ratio),
    overlapsPeriod: true,
  };
}

export default function FinancesPubsPage() {
  const all = MOCK_AD_CAMPAIGNS;

  const [search, setSearch] = useSessionStorageState("fin.pubs.search", "");
  const [status, setStatus] = useSessionStorageState<StatusFilter>(
    "fin.pubs.status",
    "all",
  );
  const [dateFilter, setDateFilter] = useSessionStorageState<DateFilterValue>(
    "fin.pubs.dateFilter",
    { preset: "today" },
  );
  const [statusOpen, setStatusOpen] = useState(false);

  const normalizedDateFilter = useMemo(
    () => normalizeDateFilter(dateFilter),
    [dateFilter],
  );

  const range = useMemo(
    () => dateFilterRange(normalizedDateFilter, MOCK_TODAY),
    [normalizedDateFilter],
  );

  /**
   * Liste prorata-temporis filtrée par statut + recherche.
   * Les campagnes hors période sont retirées.
   */
  const proRated = useMemo(() => {
    return all
      .map((c) => prorateCampaign(c, range))
      .filter((p) => p.overlapsPeriod)
      .filter((p) => {
        if (status !== "all" && p.campaign.status !== status) return false;
        if (search.trim()) {
          const q = search.toLowerCase().trim();
          const productName =
            getProduit(p.campaign.productId)?.name.toLowerCase() ?? "";
          if (
            !p.campaign.name.toLowerCase().includes(q) &&
            !productName.includes(q)
          ) {
            return false;
          }
        }
        return true;
      });
  }, [all, range, status, search]);

  /** Stats du panneau — performance prorata sur la période, MAIS « À payer
   *  Meta » est lifetime : c'est le solde dû à Meta indépendamment de la
   *  période, donc on lit les montants bruts des campagnes pending.
   */
  const stats = useMemo(() => {
    const totalSpent = proRated.reduce((s, p) => s + p.spentXof, 0);
    const totalDelivered = proRated.reduce(
      (s, p) => s + p.ordersDelivered,
      0,
    );
    const actives = proRated.filter(
      (p) => p.campaign.status === "active",
    ).length;
    const total = proRated.length;
    const avgCostPerDelivered =
      totalDelivered > 0 ? Math.round(totalSpent / totalDelivered) : 0;
    // « À payer Meta » : NE dépend PAS de la période. C'est la dette globale
    // que Meta facturera au prochain billing, peu importe le filtre vendeur.
    const totalPendingAmount = all
      .filter((c) => c.paymentStatus === "pending")
      .reduce((s, c) => s + c.spentXof, 0);
    const pendingPayment = all.filter(
      (c) => c.paymentStatus === "pending",
    ).length;
    return {
      total,
      actives,
      totalSpent,
      totalDelivered,
      avgCostPerDelivered,
      totalPendingAmount,
      pendingPayment,
    };
  }, [proRated, all]);

  const filtersActive =
    search.length > 0 || status !== "all" || dateFilter.preset !== "today";

  return (
    <div className="flex h-full flex-col">
      {/* HEADER */}
      <div className="flex items-center gap-4 border-b border-line bg-white px-10 py-4">
        <Link
          href="/finances"
          className="grid h-9 w-9 place-items-center rounded-lg bg-paper-2 text-ink-500 hover:text-ink-700"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
            Finances · Campagnes pubs
          </div>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-ink-900">
            Vos campagnes Facebook Ads
          </h1>
        </div>
        <DateRangeFilter value={dateFilter} onChange={setDateFilter} />
      </div>

      {/* STATS */}
      <div className="px-10 pt-5">
        <div className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-ink-500">
          Performance · {dateFilterSubtitle(normalizedDateFilter)}
        </div>
        <div className="grid grid-cols-4 gap-3">
          <StatCard
            label="Campagnes actives"
            value={`${stats.actives}/${stats.total}`}
            icon={<Megaphone className="h-4 w-4" />}
            tone="blue"
          />
          <StatCard
            label="Total dépensé"
            value={formatXOF(stats.totalSpent, false)}
            unit="F CFA"
            icon={<Wallet className="h-4 w-4" />}
            tone="orange"
          />
          <StatCard
            label="À payer Meta"
            value={formatXOF(stats.totalPendingAmount, false)}
            unit={
              stats.pendingPayment > 0
                ? `${stats.pendingPayment} campagne${stats.pendingPayment > 1 ? "s" : ""}`
                : "à jour"
            }
            icon={<AlertTriangle className="h-4 w-4" />}
            tone="orange"
            highlight={stats.totalPendingAmount > 0}
            badge={stats.totalPendingAmount > 0}
          />
          <StatCard
            label="Coût / livraison"
            value={formatXOF(stats.avgCostPerDelivered, false)}
            unit="F CFA en moyenne"
            icon={<TrendingUp className="h-4 w-4" />}
            tone="green"
          />
        </div>
      </div>

      {/* FILTRES */}
      <div className="mt-5 border-y border-line bg-paper-2/60 px-10 py-3">
        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              placeholder="Nom de campagne ou produit…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-[13px] outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600"
            />
          </div>
          <FilterDropdown
            label="Statut"
            value={
              STATUS_OPTIONS.find((o) => o.id === status)?.label ?? "Tous"
            }
            isActive={status !== "all"}
            isOpen={statusOpen}
            onToggle={() => setStatusOpen(!statusOpen)}
            onClose={() => setStatusOpen(false)}
            width="w-48"
          >
            {STATUS_OPTIONS.map((o) => (
              <DropdownItem
                key={o.id}
                active={status === o.id}
                onClick={() => {
                  setStatus(o.id);
                  setStatusOpen(false);
                }}
              >
                {o.label}
              </DropdownItem>
            ))}
          </FilterDropdown>
          {filtersActive && (
            <button
              onClick={() => {
                setSearch("");
                setStatus("all");
                setDateFilter({ preset: "today" });
              }}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-bold text-kamoo-orange-600 hover:bg-kamoo-orange-50"
            >
              Effacer
            </button>
          )}
          <div className="flex-1" />
          <div className="whitespace-nowrap text-[12px] font-semibold text-ink-500">
            {proRated.length} sur {all.length} campagne
            {all.length > 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* TABLEAU — items-start empêche la carte de stretcher verticalement */}
      <div className="flex min-h-0 flex-1 items-start px-10 py-4">
        {proRated.length === 0 ? (
          <div className="grid w-full place-items-center rounded-2xl border border-dashed border-line bg-white py-20 text-center">
            <Megaphone className="h-8 w-8 text-ink-400" />
            <p className="mt-3 text-sm font-semibold text-ink-700">
              Aucune campagne ne correspond à vos filtres
            </p>
          </div>
        ) : (
          <CampaignsTable rows={proRated} />
        )}
      </div>
    </div>
  );
}

/* ─── Tableau ──────────────────────────────────────────── */

function CampaignsTable({ rows }: { rows: ProRatedCampaign[] }) {
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
        <table className="w-full min-w-[1100px] table-fixed text-[13px]">
          <colgroup>
            <col style={{ width: "auto" }} />
            <col style={{ width: "200px" }} />
            <col style={{ width: "100px" }} />
            <col style={{ width: "120px" }} />
            <col style={{ width: "100px" }} />
            <col style={{ width: "100px" }} />
            <col style={{ width: "110px" }} />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-paper-2/95 backdrop-blur-sm">
            <tr className="border-b border-line text-left">
              <Th>Campagne</Th>
              <Th>Produit</Th>
              <Th align="center">Statut</Th>
              <Th align="right">
                <Tooltip content="Montant dépensé à cette période">
                  Dépense
                </Tooltip>
              </Th>
              <Th align="right">
                <Tooltip content="Nombre de commandes reçues sur la boutique">
                  Achat
                </Tooltip>
              </Th>
              <Th align="right">
                <Tooltip content="Nombre de commandes livrées">
                  Livré
                </Tooltip>
              </Th>
              <Th align="right">
                <Tooltip content="CPL — Coût par commande livrée (Dépense ÷ Livrés)">
                  CPL
                </Tooltip>
              </Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <CampaignRow key={p.campaign.id} row={p} />
            ))}
          </tbody>
        </table>
    </div>
  );
}

function CampaignRow({ row: p }: { row: ProRatedCampaign }) {
  const c = p.campaign;
  const product = getProduit(c.productId);
  const cpl =
    p.ordersDelivered > 0
      ? Math.round(p.spentXof / p.ordersDelivered)
      : null;

  return (
    <tr className="border-b border-line last:border-0 transition hover:bg-paper-2/30">
      <Td>
        <div className="font-bold text-ink-900">{c.name}</div>
        <div className="mt-0.5 text-[11px] text-ink-500">
          Lancée {formatDate(c.startDate)}
        </div>
      </Td>
      <Td>
        {product ? (
          <Link
            href={`/boutique/${product.id}`}
            className="truncate text-[12.5px] font-semibold text-ink-700 hover:text-kamoo-blue-700 hover:underline"
          >
            {product.name}
          </Link>
        ) : (
          <Tooltip content="Cette campagne n'est reliée à aucun produit de votre catalogue. Reliez-la pour suivre ses ventes et sa rentabilité.">
            <span className="inline-flex cursor-help items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 ring-1 ring-inset ring-amber-200">
              <Unlink className="h-3 w-3" />
              Non reliée
            </span>
          </Tooltip>
        )}
      </Td>
      <Td align="center">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold",
            c.status === "active"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-paper-2 text-ink-500 ring-1 ring-inset ring-line",
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              c.status === "active" ? "bg-emerald-500" : "bg-ink-400",
            )}
          />
          {STATUS_LABELS[c.status]}
        </span>
        {c.status === "inactive" && c.endDate && (
          <div className="mt-1 whitespace-nowrap text-[10px] text-ink-400">
            depuis le {formatDate(c.endDate)}
          </div>
        )}
      </Td>
      <Td align="right">
        <span className="font-display font-extrabold text-ink-900 tabular-nums">
          {formatXOF(p.spentXof, false)}
          <span className="ml-0.5 text-[10px] font-bold text-ink-500">F</span>
        </span>
      </Td>
      <Td align="right">
        <span className="font-bold text-ink-900 tabular-nums">
          {p.ordersReceived.toLocaleString("fr-FR")}
        </span>
      </Td>
      <Td align="right">
        <span className="font-bold text-emerald-700 tabular-nums">
          {p.ordersDelivered.toLocaleString("fr-FR")}
        </span>
      </Td>
      <Td align="right">
        {cpl !== null ? (
          <span className="font-bold text-ink-900 tabular-nums">
            {formatXOF(cpl, false)}
            <span className="ml-0.5 text-[10px] font-bold text-ink-500">F</span>
          </span>
        ) : (
          <span className="text-ink-400">—</span>
        )}
      </Td>
    </tr>
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
