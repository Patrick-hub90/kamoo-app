"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Heart,
  MessageCircle,
  Phone,
  Plus,
  Repeat,
  RotateCcw,
  Search,
  StickyNote,
  User,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { computeClientsStats, MOCK_CLIENTS } from "@/lib/data/mock-clients";
import { MOCK_PRODUITS } from "@/lib/data/mock-produits";
import { NotificationsBell } from "@/components/kamoo/notifications-bell";
import { useSessionStorageState } from "@/lib/hooks/use-session-storage-state";
import {
  CHANNEL_LABELS,
  deliveryRate,
  getClientSegment,
  getInitials,
  getWhatsappLink,
  SEGMENT_LABELS,
  type Client,
  type ClientSegment,
} from "@/lib/types/client";
import { formatXOF } from "@/lib/format";
import { cn } from "@/lib/utils";

type ViewKey = "all" | "fidele" | "nouveau" | "prospect";
type SortKey = "recent_order" | "spent_desc" | "orders_desc" | "name";

const VIEW_TABS: { id: ViewKey; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "fidele", label: "Fidèles" },
  { id: "nouveau", label: "Nouveaux" },
  { id: "prospect", label: "Prospects" },
];

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "recent_order", label: "Dernière commande" },
  { id: "spent_desc", label: "Valeur client ↓" },
  { id: "orders_desc", label: "Nombre de commandes ↓" },
  { id: "name", label: "Nom A → Z" },
];

/* Pastille segment — sobre, pastel. */
const SEG_PILL: Record<ClientSegment, string> = {
  fidele: "bg-emerald-50 text-emerald-700",
  nouveau: "bg-kamoo-blue-50 text-kamoo-blue-700",
  prospect: "bg-ink-100 text-ink-500",
};

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 30) return `Il y a ${Math.floor(days / 7) || 1} sem.`;
  if (days < 365) return `Il y a ${Math.floor(days / 30)} mois`;
  return `Il y a ${Math.floor(days / 365)} an${Math.floor(days / 365) > 1 ? "s" : ""}`;
}

export default function ClientsPage() {
  const all = MOCK_CLIENTS;
  const stats = useMemo(() => computeClientsStats(all), [all]);
  const fidelesCount = useMemo(() => all.filter((c) => getClientSegment(c) === "fidele").length, [all]);

  const [search, setSearch] = useSessionStorageState("clients.search", "");
  const [view, setView] = useSessionStorageState<ViewKey>("clients.view", "all");
  const [sortBy, setSortBy] = useSessionStorageState<SortKey>("clients.sortBy", "recent_order");
  const [viewOpen, setViewOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(all[0]?.id ?? null);

  const counts = useMemo<Record<ViewKey, number>>(
    () => ({
      all: all.length,
      fidele: all.filter((c) => getClientSegment(c) === "fidele").length,
      nouveau: all.filter((c) => getClientSegment(c) === "nouveau").length,
      prospect: all.filter((c) => getClientSegment(c) === "prospect").length,
    }),
    [all],
  );

  const filtered = useMemo(() => {
    let list = all.filter((c) => {
      if (view !== "all" && getClientSegment(c) !== view) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        if (
          !c.name.toLowerCase().includes(q) &&
          !c.phone.replace(/\s/g, "").includes(q.replace(/\s/g, "")) &&
          !c.city.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "spent_desc":
          return b.totalSpentXof - a.totalSpentXof;
        case "orders_desc":
          return b.totalOrders - a.totalOrders;
        case "name":
          return a.name.localeCompare(b.name);
        case "recent_order":
        default:
          return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime();
      }
    });
    return list;
  }, [all, view, search, sortBy]);

  const selected = filtered.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="min-h-full bg-paper">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-5 px-6 py-6">
        {/* HEADER */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-bold tracking-tight text-ink-900">Clients</h1>
            <p className="mt-1 text-[13px] text-ink-500">Suivez votre base client, leur fidélité et leur valeur.</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <NotificationsBell />
            <button className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-kamoo-blue-900 px-4 text-[13px] font-semibold text-white transition hover:bg-kamoo-blue-800">
              <Plus className="h-4 w-4" />
              Ajouter un client
            </button>
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Kpi icon={Users} tone="blue" label="Clients actifs" value={String(stats.total)} sub="Base totale" />
          <Kpi icon={Heart} tone="red" label="Clients fidèles" value={String(fidelesCount)} sub="Achat ≥ 2" />
          <Kpi icon={Wallet} tone="green" label="Valeur vie client" value={`${formatXOF(stats.ltv, false)} F`} sub="Moyenne / client" />
          <Kpi icon={Repeat} tone="purple" label="Taux de réachat" value={`${stats.fidelesPct}%`} sub="Clients fidèles" />
        </div>

        {/* CONTENU : liste (gauche) + fiche (droite) */}
        <div className="flex items-start gap-5">
          <div className="min-w-0 flex-1">
            {/* Toolbar */}
            <div className="mb-4 flex flex-wrap items-center gap-2.5">
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
                <input
                  type="search"
                  placeholder="Nom, téléphone ou ville…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-[12.5px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600"
                />
              </div>

              <Dropdown
                label="Segment"
                value={VIEW_TABS.find((t) => t.id === view)?.label ?? "Tous"}
                open={viewOpen}
                setOpen={setViewOpen}
              >
                {VIEW_TABS.map((t) => (
                  <DropdownItem key={t.id} active={view === t.id} onClick={() => { setView(t.id); setViewOpen(false); }}>
                    <span>{t.label}</span>
                    <span className="tabular-nums text-ink-400">{counts[t.id]}</span>
                  </DropdownItem>
                ))}
              </Dropdown>

              <Dropdown
                label="Trier"
                value={SORT_OPTIONS.find((o) => o.id === sortBy)?.label ?? "Dernière commande"}
                open={sortOpen}
                setOpen={setSortOpen}
              >
                {SORT_OPTIONS.map((o) => (
                  <DropdownItem key={o.id} active={sortBy === o.id} onClick={() => { setSortBy(o.id); setSortOpen(false); }}>
                    {o.label}
                  </DropdownItem>
                ))}
              </Dropdown>

              <div className="ml-auto text-[12px] font-medium text-ink-500">
                {filtered.length} client{filtered.length > 1 ? "s" : ""}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-line bg-white shadow-kamoo-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr className="border-b border-line text-[10.5px] uppercase tracking-[0.05em] text-ink-400">
                      <th className="px-4 py-3 text-left font-semibold">Client</th>
                      <th className="px-3 py-3 text-left font-semibold">Ville</th>
                      <th className="px-3 py-3 text-right font-semibold">Cmd.</th>
                      <th className="px-3 py-3 text-right font-semibold">Valeur</th>
                      <th className="px-3 py-3 text-right font-semibold">Dernière</th>
                      <th className="px-4 py-3 text-left font-semibold">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F4F5F6]">
                    {filtered.map((c) => {
                      const seg = getClientSegment(c);
                      const isSel = c.id === selectedId;
                      return (
                        <tr
                          key={c.id}
                          onClick={() => setSelectedId(c.id)}
                          className={cn(
                            "cursor-pointer transition",
                            isSel ? "bg-kamoo-blue-50/60" : "hover:bg-paper-2/50",
                          )}
                        >
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <span
                                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white"
                                style={{ background: c.avatarBg }}
                              >
                                {getInitials(c.name)}
                              </span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="truncate text-[12.5px] font-semibold text-ink-900">{c.name}</span>
                                  <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold", SEG_PILL[seg])}>
                                    {SEGMENT_LABELS[seg]}
                                  </span>
                                </div>
                                <div className="truncate text-[11px] tabular-nums text-ink-500">{c.phone}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-[12px] text-ink-700">{c.city}</td>
                          <td className="px-3 py-2.5 text-right text-[12.5px] font-semibold tabular-nums text-ink-900">{c.totalOrders}</td>
                          <td className="px-3 py-2.5 text-right text-[12.5px] font-semibold tabular-nums text-emerald-600">
                            {c.totalSpentXof > 0 ? formatXOF(c.totalSpentXof, false) : <span className="text-ink-300">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-right text-[11.5px] text-ink-500">{formatRelative(c.lastOrderDate)}</td>
                          <td className="px-4 py-2.5 text-[11.5px] text-ink-600">{CHANNEL_LABELS[c.acquisitionChannel]}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filtered.length === 0 && (
                <div className="px-5 py-12 text-center text-[13px] text-ink-400">Aucun client ne correspond.</div>
              )}
            </div>
          </div>

          {/* Fiche client — affichée uniquement si un client est sélectionné.
              Sinon le tableau occupe toute la largeur. */}
          {selected && (
            <aside className="sticky top-6 hidden w-[360px] shrink-0 self-start lg:block">
              <ClientDetail client={selected} onClose={() => setSelectedId(null)} />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Fiche détail ──────────────────────────────────────────────── */
function ClientDetail({ client: c, onClose }: { client: Client; onClose: () => void }) {
  const seg = getClientSegment(c);
  const preferred = c.preferredProductIds
    .map((id) => MOCK_PRODUITS.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .slice(0, 3);

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white shadow-kamoo-sm">
      {/* En-tête */}
      <div className="relative border-b border-line p-4">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-lg text-ink-400 transition hover:bg-paper-2 hover:text-ink-900"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3">
          <span
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-[15px] font-bold text-white"
            style={{ background: c.avatarBg }}
          >
            {getInitials(c.name)}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[15px] font-bold text-ink-900">{c.name}</span>
              <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold", SEG_PILL[seg])}>
                {SEGMENT_LABELS[seg]}
              </span>
            </div>
            <div className="mt-0.5 text-[12px] tabular-nums text-ink-500">{c.phone}</div>
            <div className="text-[11.5px] text-ink-400">{c.zone ? `${c.zone}, ${c.city}` : c.city}</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-px border-b border-line bg-[#F1F2F4]">
        <MiniStat value={String(c.totalOrders)} label="Commandes" />
        <MiniStat value={`${formatXOF(c.totalSpentXof, false)} F`} label="Dépensé" />
        <MiniStat value={formatRelative(c.lastOrderDate)} label="Dernière" />
      </div>

      {/* Détails */}
      <div className="flex flex-col gap-2.5 border-b border-line p-4 text-[12.5px]">
        <DetailRow label="Client depuis" value={new Date(c.firstOrderDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })} />
        <DetailRow label="Source" value={CHANNEL_LABELS[c.acquisitionChannel]} />
        <DetailRow label="Taux de réachat" value={`${deliveryRate(c)}%`} />
      </div>

      {/* Produits préférés */}
      {preferred.length > 0 && (
        <div className="border-b border-line p-4">
          <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.05em] text-ink-400">Produits préférés</div>
          <div className="flex flex-col gap-1.5">
            {preferred.map((p) => (
              <div key={p.id} className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[15px]" style={{ background: p.bg }}>
                  {p.emoji}
                </span>
                <span className="truncate text-[12.5px] font-medium text-ink-900">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-1.5 p-3">
        <Link
          href={`/clients/${c.id}`}
          className="flex h-10 items-center justify-center gap-2 rounded-lg bg-kamoo-blue-900 text-[13px] font-semibold text-white transition hover:bg-kamoo-blue-800"
        >
          <User className="h-4 w-4" />
          Voir le profil complet
        </Link>
        <Action href={`/clients/${c.id}`} icon={ArrowRight} label={`Voir les commandes (${c.totalOrders})`} />
        <Action
          href={getWhatsappLink(c.whatsapp ?? c.phone)}
          external
          icon={MessageCircle}
          label="Envoyer un WhatsApp"
        />
        <Action href={`tel:${c.phone.replace(/\s/g, "")}`} external icon={Phone} label="Appeler le client" />
        <Action icon={StickyNote} label="Ajouter une note" />
        <button className="flex h-10 items-center justify-center gap-2 rounded-lg text-[13px] font-semibold text-red-600 transition hover:bg-red-50">
          <RotateCcw className="h-4 w-4" />
          Marquer à relancer
        </button>
      </div>
    </div>
  );
}

/* ─── Sous-composants ──────────────────────────────────────────── */
function Kpi({
  icon: Icon,
  tone,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: "blue" | "red" | "green" | "purple";
  label: string;
  value: string;
  sub: string;
}) {
  const tones: Record<string, string> = {
    blue: "bg-kamoo-blue-50 text-kamoo-blue-700",
    red: "bg-red-50 text-red-600",
    green: "bg-emerald-50 text-emerald-700",
    purple: "bg-purple-50 text-purple-700",
  };
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3.5 shadow-kamoo-sm">
      <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl", tones[tone])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-[11px] font-medium text-ink-500">{label}</div>
        <div className="text-[19px] font-bold leading-tight tracking-tight tabular-nums text-ink-900">{value}</div>
        <div className="truncate text-[10.5px] text-ink-400">{sub}</div>
      </div>
    </div>
  );
}

function Dropdown({
  label,
  value,
  open,
  setOpen,
  children,
}: {
  label: string;
  value: string;
  open: boolean;
  setOpen: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[12.5px] font-medium text-ink-700 transition hover:bg-paper-2"
      >
        <span className="text-ink-500">{label}</span>
        <span className="text-ink-300">·</span>
        <span className="font-semibold">{value}</span>
        <ChevronDown className="h-3.5 w-3.5 text-ink-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-[calc(100%+4px)] z-20 w-60 rounded-xl border border-line bg-white p-1 shadow-[var(--shadow-kamoo-lg)]">
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
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-1.5 text-[12.5px] transition hover:bg-paper-2",
        active ? "font-semibold text-ink-900" : "font-medium text-ink-700",
      )}
    >
      {children}
      {active && <Check className="h-3.5 w-3.5 shrink-0 text-kamoo-blue-700" />}
    </button>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 bg-white py-3 text-center">
      <span className="text-[14px] font-bold tabular-nums text-ink-900">{value}</span>
      <span className="text-[10.5px] text-ink-400">{label}</span>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-ink-500">{label}</span>
      <span className="font-semibold text-ink-900">{value}</span>
    </div>
  );
}

function Action({
  icon: Icon,
  label,
  href,
  external,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  external?: boolean;
}) {
  const cls =
    "flex h-10 items-center gap-2.5 rounded-lg border border-line bg-white px-3 text-[12.5px] font-medium text-ink-700 transition hover:bg-paper-2";
  const inner = (
    <>
      <Icon className="h-4 w-4 text-ink-400" />
      <span className="flex-1 text-left">{label}</span>
    </>
  );
  if (href && external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls}>
        {inner}
      </a>
    );
  }
  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }
  return <button className={cls}>{inner}</button>;
}
