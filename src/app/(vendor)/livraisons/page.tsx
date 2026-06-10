"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  History,
  Plus,
  Search,
  Truck,
  Wallet,
} from "lucide-react";
import { NotificationsBell } from "@/components/kamoo/notifications-bell";
import { computeDeliveryStats, getDeliveryItems } from "@/lib/data/mock-closing";
import {
  orderTotalXof,
  type ClosingAssignment,
  type DeliveryProgress,
} from "@/lib/types/closing";
import { formatXOF } from "@/lib/format";
import { cn } from "@/lib/utils";

/* L'état "en_attente" = livraison prise en charge & en route → libellé "En cours". */
type ViewKey = "all" | DeliveryProgress;
const STATUS: Record<DeliveryProgress, { label: string; group: string; pill: string; dot: string }> = {
  en_attente: { label: "En cours", group: "En cours", pill: "bg-kamoo-blue-50 text-kamoo-blue-700", dot: "bg-kamoo-blue-500" },
  effectue: { label: "Effectuée", group: "Effectuées", pill: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  alerte: { label: "Alerte", group: "Alertes", pill: "bg-red-50 text-red-600", dot: "bg-red-500" },
};
const VIEW_TABS: { id: ViewKey; label: string }[] = [
  { id: "all", label: "Toutes" },
  { id: "en_attente", label: "En cours" },
  { id: "effectue", label: "Effectuées" },
  { id: "alerte", label: "Alertes" },
];

type SortKey = "urgent" | "recent" | "amount_desc";
const SORT_LABELS: Record<SortKey, string> = {
  urgent: "Plus urgent",
  recent: "Plus récent",
  amount_desc: "Montant ↓",
};

const fmtDateTime = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} · ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
};
const relevantDate = (a: ClosingAssignment) => a.delivery?.scheduledAt ?? a.createdAt;

export default function LivraisonsPage() {
  const all = useMemo(() => getDeliveryItems(), []);
  const stats = useMemo(() => computeDeliveryStats(all), [all]);

  const router = useRouter();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewKey>("all");
  const [viewOpen, setViewOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("urgent");
  const [sortOpen, setSortOpen] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  const [page, setPage] = useState(1);

  const counts: Record<ViewKey, number> = {
    all: stats.total,
    en_attente: stats.counts.en_attente,
    effectue: stats.counts.effectue,
    alerte: stats.counts.alerte,
  };

  const filtered = useMemo(() => {
    const list = all.filter((a) => {
      if (view !== "all" && a.delivery?.progress !== view) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        if (
          !a.id.toLowerCase().includes(q) &&
          !a.items.some((i) => i.productName.toLowerCase().includes(q)) &&
          !a.client.name.toLowerCase().includes(q) &&
          !a.client.zone.toLowerCase().includes(q) &&
          !(a.delivery?.name.toLowerCase().includes(q) ?? false)
        )
          return false;
      }
      return true;
    });
    const rank: Record<DeliveryProgress, number> = { alerte: 0, en_attente: 1, effectue: 2 };
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "amount_desc":
          return orderTotalXof(b) - orderTotalXof(a);
        case "recent":
          return new Date(relevantDate(b)).getTime() - new Date(relevantDate(a)).getTime();
        case "urgent":
        default:
          return (rank[a.delivery!.progress] - rank[b.delivery!.progress]) || (new Date(relevantDate(a)).getTime() - new Date(relevantDate(b)).getTime());
      }
    });
  }, [all, view, search, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const shown = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="min-h-full bg-paper">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-5 px-6 py-6">
        {/* HEADER */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-bold tracking-tight text-ink-900">Livraisons</h1>
            <p className="mt-1 text-[13px] text-ink-500">Suivez l&apos;acheminement de vos commandes confirmées jusqu&apos;au client.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <NotificationsBell />
            <button className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[13px] font-semibold text-ink-700 transition hover:bg-paper-2"><History className="h-4 w-4 text-ink-400" /> Tout l&apos;historique</button>
            <button className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[13px] font-semibold text-ink-700 transition hover:bg-paper-2"><Download className="h-4 w-4 text-ink-400" /> Exporter</button>
            <button className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-kamoo-blue-900 px-4 text-[13px] font-semibold text-white transition hover:bg-kamoo-blue-800"><Plus className="h-4 w-4" /> Nouvelle livraison</button>
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Kpi icon={Truck} tone="blue" label="En cours" value={String(stats.counts.en_attente)} sub="livreur en route" />
          <Kpi icon={AlertTriangle} tone="red" label="Alertes" value={String(stats.counts.alerte)} sub="à traiter" />
          <Kpi icon={CheckCircle2} tone="green" label="Effectuées" value={String(stats.counts.effectue)} sub="livrées & encaissées" />
          <Kpi icon={Wallet} tone="amber" label="CA encaissé" value={`${formatXOF(stats.revenueCollected, false)} F`} sub="sur livraisons effectuées" />
        </div>

        {/* TOOLBAR — façon Closing (menu déroulant Statut, pas d'onglets) */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              placeholder="N°, produit, client, zone, livreur…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="h-9 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-[12.5px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600"
            />
          </div>
          <Dropdown label="Statut" value={VIEW_TABS.find((t) => t.id === view)?.label ?? "Toutes"} open={viewOpen} setOpen={setViewOpen}>
            {VIEW_TABS.map((t) => (
              <DropdownItem key={t.id} active={view === t.id} onClick={() => { setView(t.id); setViewOpen(false); setPage(1); }}>
                <span className="flex-1">{t.label}</span>
                <span className="tabular-nums text-ink-400">{counts[t.id]}</span>
              </DropdownItem>
            ))}
          </Dropdown>
          <Dropdown label="Trier" value={SORT_LABELS[sortBy]} open={sortOpen} setOpen={setSortOpen}>
            {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
              <DropdownItem key={k} active={sortBy === k} onClick={() => { setSortBy(k); setSortOpen(false); }}>{SORT_LABELS[k]}</DropdownItem>
            ))}
          </Dropdown>
          <div className="ml-auto text-[12px] font-medium text-ink-500">{filtered.length} livraison{filtered.length > 1 ? "s" : ""}</div>
        </div>

        {/* TABLE (pleine largeur, groupée par statut) */}
        <div className="overflow-hidden rounded-xl border border-line bg-white shadow-kamoo-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] table-fixed">
              <colgroup>
                <col className="w-[120px]" />
                <col />
                <col className="w-[190px]" />
                <col className="w-[120px]" />
                <col className="w-[120px]" />
                <col className="w-[130px]" />
                <col className="w-[220px]" />
                <col className="w-[44px]" />
              </colgroup>
              <thead>
                <tr className="border-b border-line text-[10.5px] uppercase tracking-[0.05em] text-ink-400">
                  <th className="px-4 py-3 text-left font-semibold">N°</th>
                  <th className="px-3 py-3 text-left font-semibold">Produit</th>
                  <th className="px-3 py-3 text-left font-semibold">Client</th>
                  <th className="px-3 py-3 text-left font-semibold">Zone</th>
                  <th className="px-3 py-3 text-right font-semibold">Montant</th>
                  <th className="px-3 py-3 text-left font-semibold">Statut</th>
                  <th className="px-4 py-3 text-left font-semibold">Dernière note</th>
                  <th className="px-2 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F5F6]">
                {shown.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-[13px] text-ink-400">Aucune livraison ne correspond.</td>
                  </tr>
                ) : (
                  shown.map((a) => <Row key={a.id} a={a} onClick={() => router.push(`/livraisons/${a.id}`)} />)
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-[12px] text-ink-500">
            <div className="flex items-center gap-2">
              <span>Afficher</span>
              <div className="relative">
                <button type="button" onClick={() => setPageSizeOpen(!pageSizeOpen)} className="inline-flex h-7 items-center gap-1 rounded-md border border-line bg-white px-2 font-semibold text-ink-700 transition hover:bg-paper-2">
                  {pageSize}<ChevronDown className="h-3 w-3 text-ink-400" />
                </button>
                {pageSizeOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setPageSizeOpen(false)} />
                    <div className="absolute bottom-[calc(100%+4px)] left-0 z-20 w-20 rounded-lg border border-line bg-white p-1 shadow-[var(--shadow-kamoo-lg)]">
                      {[10, 25, 50].map((n) => (
                        <button key={n} type="button" onClick={() => { setPageSize(n); setPageSizeOpen(false); setPage(1); }} className={cn("flex w-full items-center justify-between rounded-md px-2 py-1 text-[12px] transition hover:bg-paper-2", pageSize === n ? "font-semibold text-ink-900" : "text-ink-700")}>{n}{pageSize === n && <Check className="h-3 w-3 text-kamoo-blue-700" />}</button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <span>{filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1} – {Math.min(safePage * pageSize, filtered.length)} sur {filtered.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <button disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} className="grid h-8 w-8 place-items-center rounded-md border border-line bg-white text-ink-500 transition hover:bg-paper-2 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)} className={cn("grid h-8 min-w-8 place-items-center rounded-md px-2 text-[12px] font-semibold transition", safePage === i + 1 ? "bg-kamoo-blue-900 text-white" : "border border-line bg-white text-ink-600 hover:bg-paper-2")}>{i + 1}</button>
              ))}
              <button disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} className="grid h-8 w-8 place-items-center rounded-md border border-line bg-white text-ink-500 transition hover:bg-paper-2 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Ligne de livraison ───────────────────────────────── */
function Row({ a, onClick }: { a: ClosingAssignment; onClick: () => void }) {
  const progress = a.delivery!.progress;
  const st = STATUS[progress];
  const d = a.delivery!;
  const isAlerte = progress === "alerte";
  const note = d.livreurNote ?? a.comment ?? null;
  return (
    <tr
      onClick={onClick}
      className={cn("cursor-pointer transition", isAlerte ? "bg-red-50/30 hover:bg-red-50/60" : "hover:bg-paper-2/40")}
    >
      <td className="px-4 py-2.5 text-[12px] font-semibold tabular-nums text-ink-900">{a.id}</td>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[15px]" style={{ background: a.items[0].productBg }}>{a.items[0].productEmoji}</span>
          <span className="min-w-0">
            <span className="block truncate text-[12.5px] font-medium text-ink-900">{a.items[0].productName}</span>
            {a.items.length > 1 && <span className="text-[10.5px] text-ink-400">+{a.items.length - 1} autre{a.items.length > 2 ? "s" : ""}</span>}
          </span>
        </div>
      </td>
      <td className="px-3 py-2.5">
        <div className="truncate text-[12.5px] font-medium text-ink-900">{a.client.name}</div>
        <div className="truncate text-[11px] tabular-nums text-ink-500">{a.client.phone}</div>
      </td>
      <td className="px-3 py-2.5 text-[12px] text-ink-700">{a.client.zone}</td>
      <td className="px-3 py-2.5 text-right text-[12.5px] font-semibold tabular-nums text-ink-900">{formatXOF(orderTotalXof(a), false)} <span className="text-[10px] text-ink-400">F</span></td>
      <td className="px-3 py-2.5">
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", st.pill)}>
          {isAlerte && <AlertTriangle className="h-3 w-3" />}
          {st.label}
        </span>
      </td>
      <td className="px-4 py-2.5 text-[11.5px]">
        {note ? <span className={cn("line-clamp-1 italic", isAlerte ? "text-red-600" : "text-ink-500")} title={note}>{note}</span> : <span className="text-ink-300">—</span>}
      </td>
      <td className="px-2 py-2.5 text-right"><ChevronRight className="ml-auto h-4 w-4 text-ink-300" /></td>
    </tr>
  );
}

/* ─── Sous-composants ─────────────────────────────────────────── */
function Kpi({ icon: Icon, tone, label, value, sub }: { icon: React.ComponentType<{ className?: string }>; tone: "blue" | "red" | "green" | "amber"; label: string; value: string; sub: string }) {
  const tones: Record<string, string> = {
    blue: "bg-kamoo-blue-50 text-kamoo-blue-700",
    red: "bg-red-50 text-red-600",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3.5 shadow-kamoo-sm">
      <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl", tones[tone])}><Icon className="h-5 w-5" /></div>
      <div className="min-w-0">
        <div className="truncate text-[11px] font-medium text-ink-500">{label}</div>
        <div className="text-[19px] font-bold leading-tight tracking-tight tabular-nums text-ink-900">{value}</div>
        <div className="truncate text-[10.5px] text-ink-400">{sub}</div>
      </div>
    </div>
  );
}

function Dropdown({ label, value, open, setOpen, children }: { label: string; value: string; open: boolean; setOpen: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[12.5px] font-medium text-ink-700 transition hover:bg-paper-2">
        <span className="text-ink-500">{label}</span><span className="text-ink-300">·</span><span className="font-semibold">{value}</span><ChevronDown className="h-3.5 w-3.5 text-ink-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-[calc(100%+4px)] z-20 w-52 rounded-xl border border-line bg-white p-1 shadow-[var(--shadow-kamoo-lg)]">{children}</div>
        </>
      )}
    </div>
  );
}

function DropdownItem({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={cn("flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-1.5 text-[12.5px] transition hover:bg-paper-2", active ? "font-semibold text-ink-900" : "font-medium text-ink-700")}>
      {children}{active && <Check className="h-3.5 w-3.5 shrink-0 text-kamoo-blue-700" />}
    </button>
  );
}
