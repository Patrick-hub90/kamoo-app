"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Repeat,
  Search,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import { StatCard } from "@/components/kamoo/stat-card";
import {
  DropdownItem,
  FilterDropdown,
} from "@/components/kamoo/filter-dropdown";
import {
  clientIdsHavingOrdered,
  computeClientsStats,
  countBySegment,
  MOCK_CLIENTS,
} from "@/lib/data/mock-clients";
import { MOCK_PRODUITS } from "@/lib/data/mock-produits";
import { useSessionStorageState } from "@/lib/hooks/use-session-storage-state";
import {
  CHANNEL_LABELS,
  daysSinceLastOrder,
  getClientSegment,
  getInitials,
  SEGMENT_LABELS,
  SEGMENT_TONE,
  type Client,
} from "@/lib/types/client";
import { formatXOF } from "@/lib/format";
import { cn } from "@/lib/utils";

type ViewKey = "all" | "client" | "prospect";
type SortKey =
  | "spent_desc"
  | "recent_order"
  | "first_order_recent"
  | "name"
  | "orders_desc";

const VIEW_TABS: { id: ViewKey; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "client", label: "Clients" },
  { id: "prospect", label: "Prospects" },
];

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "recent_order", label: "Dernière commande la plus récente" },
  { id: "spent_desc", label: "Valeur client ↓" },
  { id: "first_order_recent", label: "Client récent" },
  { id: "orders_desc", label: "Nombre de commandes ↓" },
  { id: "name", label: "Nom A → Z" },
];

const COUNTRY_LABEL: Record<Client["country"], string> = {
  SN: "Sénégal",
  CI: "Côte d'Ivoire",
  CM: "Cameroun",
};

function matchesView(c: Client, view: ViewKey): boolean {
  if (view === "all") return true;
  const seg = getClientSegment(c);
  if (view === "prospect") return seg === "prospect";
  // "client" = a payé au moins 1 fois (nouveau OU fidele)
  return seg === "nouveau" || seg === "fidele";
}

function formatRelativeDate(iso: string, today: Date = new Date()): string {
  const d = new Date(iso);
  const days = Math.floor(
    (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days} j`;
  if (days < 30) return `Il y a ${Math.floor(days / 7)} sem.`;
  if (days < 365) return `Il y a ${Math.floor(days / 30)} mois`;
  return `Il y a ${Math.floor(days / 365)} an${Math.floor(days / 365) > 1 ? "s" : ""}`;
}

export default function ClientsPage() {
  const all = MOCK_CLIENTS;
  const stats = useMemo(() => computeClientsStats(all), [all]);
  const segCounts = useMemo(() => countBySegment(all), [all]);

  const [search, setSearch] = useSessionStorageState("clients.search", "");
  const [view, setView] = useSessionStorageState<ViewKey>(
    "clients.view",
    "all",
  );
  const [sortBy, setSortBy] = useSessionStorageState<SortKey>(
    "clients.sortBy",
    "recent_order",
  );
  const [productFilter, setProductFilter] = useSessionStorageState<string>(
    "clients.productFilter",
    "all",
  );
  const [sortOpen, setSortOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);

  const viewCounts: Record<ViewKey, number> = useMemo(
    () => ({
      all: segCounts.all,
      client: segCounts.client,
      prospect: segCounts.prospect,
    }),
    [segCounts],
  );

  // Set des IDs clients qui ont commandé le produit filtré
  const productClientIds = useMemo(
    () =>
      productFilter === "all"
        ? null
        : clientIdsHavingOrdered(productFilter),
    [productFilter],
  );

  const filtered = useMemo(() => {
    let list = all.filter((c) => {
      if (!matchesView(c, view)) return false;
      if (productClientIds && !productClientIds.has(c.id)) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const cleanedPhone = c.phone.replace(/\s/g, "").toLowerCase();
        if (
          !c.name.toLowerCase().includes(q) &&
          !cleanedPhone.includes(q.replace(/\s/g, "")) &&
          !c.city.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "spent_desc":
          return b.totalSpentXof - a.totalSpentXof;
        case "recent_order":
          return (
            new Date(b.lastOrderDate).getTime() -
            new Date(a.lastOrderDate).getTime()
          );
        case "first_order_recent":
          return (
            new Date(b.firstOrderDate).getTime() -
            new Date(a.firstOrderDate).getTime()
          );
        case "orders_desc":
          return b.totalOrders - a.totalOrders;
        case "name":
          return a.name.localeCompare(b.name);
      }
    });
    return list;
  }, [all, view, search, sortBy, productClientIds]);

  const filtersActive =
    search.length > 0 ||
    view !== "all" ||
    sortBy !== "recent_order" ||
    productFilter !== "all";
  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.id === sortBy)?.label ?? "Plus récent";
  const currentProductLabel =
    productFilter === "all"
      ? "Tous les produits"
      : (MOCK_PRODUITS.find((p) => p.id === productFilter)?.name ??
        "Produit inconnu");

  return (
    <div className="flex h-full flex-col">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-line bg-white px-10 py-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink-900">
            Clients
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Tous les consommateurs qui ont commandé chez vous, leur historique
            et leur fidélité.
          </p>
        </div>
      </div>

      {/* STATS */}
      <div className="px-10 pt-5">
        <div className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-ink-500">
          Aperçu de votre clientèle
        </div>
        <div className="grid grid-cols-4 gap-3">
          <StatCard
            label="Mes clients"
            value={stats.total.toLocaleString("fr-FR")}
            icon={<Users className="h-4 w-4" />}
            tone="blue"
          />
          <StatCard
            label="Clients qui reviennent"
            value={`${stats.fidelesPct}%`}
            icon={<TrendingUp className="h-4 w-4" />}
            tone="green"
            highlight={stats.fidelesPct >= 60}
          />
          <StatCard
            label="Valeur moyenne d'un client (LTV)"
            value={formatXOF(stats.ltv, false)}
            unit="F CFA"
            icon={<ShoppingBag className="h-4 w-4" />}
            tone="orange"
            highlight={stats.ltv > 0}
          />
          <StatCard
            label="Nbr de commande moyen / client"
            value={stats.cmdMoyenne > 0 ? `× ${stats.cmdMoyenne}` : "—"}
            icon={<Repeat className="h-4 w-4" />}
            tone="green"
            highlight={stats.cmdMoyenne >= 2}
          />
        </div>
      </div>

      {/* ONGLETS SEGMENTS */}
      <div className="mt-5 border-b border-line bg-white px-10">
        <div className="flex items-center gap-1">
          {VIEW_TABS.map((tab) => {
            const count = viewCounts[tab.id];
            const isActive = view === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setView(tab.id)}
                className={cn(
                  "relative inline-flex shrink-0 items-center gap-2 px-4 py-3 text-[13px] font-semibold transition",
                  isActive
                    ? "text-ink-900"
                    : "text-ink-500 hover:text-ink-700",
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold",
                    isActive
                      ? "bg-kamoo-blue-50 text-kamoo-blue-700"
                      : "bg-paper-2 text-ink-700",
                  )}
                >
                  {count}
                </span>
                {isActive && (
                  <span className="absolute inset-x-0 bottom-[-1px] h-[3px] rounded-t bg-kamoo-orange-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* RECHERCHE + FILTRES */}
      <div className="border-b border-line bg-paper-2/60 px-10 py-3">
        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              placeholder="Nom, téléphone ou ville…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-[13px] outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600"
            />
          </div>

          {/* Filtre PRODUIT */}
          <FilterDropdown
            label="Produit"
            value={currentProductLabel}
            isActive={productFilter !== "all"}
            isOpen={productOpen}
            onToggle={() => setProductOpen(!productOpen)}
            onClose={() => setProductOpen(false)}
            width="w-72"
          >
            <DropdownItem
              active={productFilter === "all"}
              onClick={() => {
                setProductFilter("all");
                setProductOpen(false);
              }}
            >
              Tous les produits
            </DropdownItem>
            <div className="my-1 h-px bg-line" />
            {MOCK_PRODUITS.map((p) => (
              <DropdownItem
                key={p.id}
                active={productFilter === p.id}
                onClick={() => {
                  setProductFilter(p.id);
                  setProductOpen(false);
                }}
              >
                <span className="truncate">{p.name}</span>
              </DropdownItem>
            ))}
          </FilterDropdown>

          {/* Filtre TRI */}
          <FilterDropdown
            label="Tri"
            value={currentSortLabel}
            isActive={sortBy !== "spent_desc"}
            isOpen={sortOpen}
            onToggle={() => setSortOpen(!sortOpen)}
            onClose={() => setSortOpen(false)}
            width="w-80"
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
              onClick={() => {
                setSearch("");
                setView("all");
                setSortBy("recent_order");
                setProductFilter("all");
              }}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-bold text-kamoo-orange-600 hover:bg-kamoo-orange-50"
            >
              Effacer
            </button>
          )}

          <div className="flex-1" />
          <div className="whitespace-nowrap text-[12px] font-semibold text-ink-500">
            {filtered.length} sur {all.length} client
            {all.length > 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* TABLEAU */}
      <div className="flex min-h-0 flex-1 items-start px-10 py-4">
        {filtered.length === 0 ? (
          <div className="grid w-full place-items-center rounded-2xl border border-dashed border-line bg-white py-20 text-center">
            <Users className="h-8 w-8 text-ink-400" />
            <p className="mt-3 text-sm font-semibold text-ink-700">
              Aucun client ne correspond à vos filtres
            </p>
          </div>
        ) : (
          <ClientsTable clients={filtered} />
        )}
      </div>
    </div>
  );
}

/* ─── Tableau ──────────────────────────────────────────── */

function ClientsTable({ clients }: { clients: Client[] }) {
  const router = useRouter();
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
            <col style={{ width: "360px" }} />
            <col style={{ width: "240px" }} />
            <col style={{ width: "110px" }} />
            <col style={{ width: "150px" }} />
            <col style={{ width: "150px" }} />
            <col style={{ width: "140px" }} />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-paper-2/95 backdrop-blur-sm">
            <tr className="border-b border-line text-left">
              <Th>Client</Th>
              <Th>Adresse</Th>
              <Th align="center">Cmd.</Th>
              <Th align="right">Valeur client</Th>
              <Th align="right">Dernière cmd.</Th>
              <Th align="left">Source</Th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <ClientRow
                key={c.id}
                client={c}
                onClick={() => router.push(`/clients/${c.id}`)}
              />
            ))}
          </tbody>
        </table>
    </div>
  );
}

function ClientRow({
  client: c,
  onClick,
}: {
  client: Client;
  onClick: () => void;
}) {
  const segment = getClientSegment(c);
  const tone = SEGMENT_TONE[segment];

  return (
    <tr
      onClick={onClick}
      className="cursor-pointer border-b border-line last:border-0 transition hover:bg-paper-2/30"
    >
      {/* Avatar + Nom + Badge segment inline */}
      <Td>
        <div className="flex items-center gap-3">
          <div
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[13px] font-bold text-white shadow-sm"
            style={{ background: c.avatarBg }}
          >
            {getInitials(c.name)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-ink-900">{c.name}</span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ring-1 ring-inset",
                  tone.bg,
                  tone.fg,
                  tone.ring,
                )}
              >
                {SEGMENT_LABELS[segment]}
              </span>
            </div>
            <div className="font-mono-kamoo mt-0.5 text-[11px] text-ink-500">
              {c.phone}
            </div>
          </div>
        </div>
      </Td>

      {/* Adresse */}
      <Td>
        <div className="text-[12.5px] text-ink-700">
          <div className="font-semibold">
            {c.zone ? `${c.zone}, ${c.city}` : c.city}
          </div>
          <div className="text-[11px] text-ink-500">
            {COUNTRY_LABEL[c.country]}
          </div>
        </div>
      </Td>

      {/* Commandes */}
      <Td align="center">
        <div>
          <span className="font-bold text-ink-900">{c.totalOrders}</span>
          {c.totalCancelledOrders > 0 && (
            <span className="ml-1 text-[10.5px] font-semibold text-red-600">
              ({c.totalCancelledOrders} ann.)
            </span>
          )}
        </div>
      </Td>

      {/* Valeur client */}
      <Td align="right">
        {c.totalSpentXof > 0 ? (
          <span className="font-bold text-emerald-700">
            {formatXOF(c.totalSpentXof)}
          </span>
        ) : (
          <span className="text-ink-400">—</span>
        )}
      </Td>

      {/* Dernière commande */}
      <Td align="right">
        <div>
          <div
            className={cn(
              "font-semibold",
              daysSinceLastOrder(c) > 60 ? "text-amber-700" : "text-ink-900",
            )}
          >
            {formatRelativeDate(c.lastOrderDate)}
          </div>
          <div className="text-[10.5px] text-ink-500">
            {new Date(c.lastOrderDate).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
            })}
          </div>
        </div>
      </Td>

      {/* Source */}
      <Td>
        <span className="inline-flex items-center rounded-full bg-paper-2 px-2.5 py-0.5 text-[11px] font-semibold text-ink-700">
          {CHANNEL_LABELS[c.acquisitionChannel]}
        </span>
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
