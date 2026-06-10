"use client";

import { useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  ListChecks,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  RotateCcw,
  Search,
  Star,
  TrendingUp,
  Truck,
  User,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import {
  buildClosingHistory,
  computeClosingStats,
  MOCK_ACTIVE_CLOSEUSE,
  MOCK_CLOSING_ASSIGNMENTS,
  formatDuration,
} from "@/lib/data/mock-closing";
import { MOCK_PRODUITS } from "@/lib/data/mock-produits";
import { NotificationsBell } from "@/components/kamoo/notifications-bell";
import { useSessionStorageState } from "@/lib/hooks/use-session-storage-state";
import {
  CANCELLATION_REASON_LABELS,
  CLOSING_STATUS_LABELS,
  orderTotalXof,
  type ClosingAssignment,
  type ClosingStatus,
} from "@/lib/types/closing";
import { formatXOF } from "@/lib/format";
import { cn } from "@/lib/utils";

type ViewKey = "all" | ClosingStatus;
type SortKey = "recent" | "amount_desc" | "oldest";

const VIEW_TABS: { id: ViewKey; label: string }[] = [
  { id: "all", label: "Toutes" },
  { id: "nouvelle", label: "Nouvelle" },
  { id: "rappele", label: "Rappelé" },
  { id: "injoignable", label: "Injoignable" },
  { id: "livraison_en_cours", label: "En cours" },
  { id: "livre", label: "Livré" },
  { id: "annule", label: "Annulé" },
];

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "recent", label: "Plus récent" },
  { id: "amount_desc", label: "Montant ↓" },
  { id: "oldest", label: "Plus ancien" },
];

/* Pastilles de statut — couleur = sens. */
const STATUS_STYLE: Record<ClosingStatus, { pill: string; icon: React.ComponentType<{ className?: string }> }> = {
  nouvelle: { pill: "bg-kamoo-blue-50 text-kamoo-blue-700", icon: Phone },
  rappele: { pill: "bg-amber-50 text-amber-700", icon: Clock },
  injoignable: { pill: "bg-amber-50 text-amber-700", icon: Phone },
  livraison_en_cours: { pill: "bg-kamoo-blue-50 text-kamoo-blue-700", icon: Truck },
  livre: { pill: "bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  annule: { pill: "bg-red-50 text-red-600", icon: XCircle },
};

const TO_PROCESS: ClosingStatus[] = ["nouvelle", "rappele", "injoignable"];

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} à ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
}

export default function ClosingPage() {
  /* Commandes créées à la main (démo) — persistées en sessionStorage et
   * affichées en tête de liste avec les fixtures. */
  const [extraOrders, setExtraOrders] = useSessionStorageState<ClosingAssignment[]>(
    "closing.extraOrders",
    [],
  );
  const all = useMemo(
    () => [...extraOrders, ...MOCK_CLOSING_ASSIGNMENTS],
    [extraOrders],
  );
  const stats = useMemo(() => computeClosingStats(all), [all]);
  const closeuse = MOCK_ACTIVE_CLOSEUSE;

  const [search, setSearch] = useSessionStorageState("closing.search", "");
  const [view, setView] = useSessionStorageState<ViewKey>("closing.view", "all");
  const [sortBy, setSortBy] = useSessionStorageState<SortKey>("closing.sortBy", "recent");
  const [viewOpen, setViewOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(all[0]?.id ?? null);

  const counts = useMemo<Record<ViewKey, number>>(() => {
    const c: Record<string, number> = { all: all.length };
    for (const t of VIEW_TABS) if (t.id !== "all") c[t.id] = all.filter((a) => a.status === t.id).length;
    return c as Record<ViewKey, number>;
  }, [all]);

  const toProcessCount = useMemo(() => all.filter((a) => TO_PROCESS.includes(a.status)).length, [all]);

  const filtered = useMemo(() => {
    let list = all.filter((a) => {
      if (view !== "all" && a.status !== view) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        if (
          !a.id.toLowerCase().includes(q) &&
          !a.client.name.toLowerCase().includes(q) &&
          !a.client.phone.replace(/\s/g, "").includes(q.replace(/\s/g, ""))
        )
          return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "amount_desc":
          return orderTotalXof(b) - orderTotalXof(a);
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "recent":
        default:
          return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
      }
    });
    return list;
  }, [all, view, search, sortBy]);

  const shown = filtered.slice(0, pageSize);
  const selected = filtered.find((a) => a.id === selectedId) ?? null;

  return (
    <div className="min-h-full bg-paper">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-5 px-6 py-6">
        {/* HEADER */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-bold tracking-tight text-ink-900">Closing</h1>
            <p className="mt-1 text-[13px] text-ink-500">Suivez les appels de votre closeuse pour valider les commandes.</p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationsBell />
            <div className="hidden items-center gap-2.5 rounded-xl border border-line bg-white px-3 py-1.5 shadow-kamoo-sm sm:flex">
              <span
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white"
                style={{ background: closeuse.avatarBg }}
              >
                {closeuse.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </span>
              <div className="leading-tight">
                <div className="text-[12.5px] font-semibold text-ink-900">{closeuse.name}</div>
                <div className="flex items-center gap-1 text-[10.5px] text-ink-500">
                  Closeuse active
                  <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                  {closeuse.rating}
                </div>
              </div>
            </div>
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-kamoo-blue-900 px-4 text-[13px] font-semibold text-white transition hover:bg-kamoo-blue-800"
            >
              <Plus className="h-4 w-4" />
              Nouvelle commande
            </button>
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Kpi icon={TrendingUp} tone="blue" label="Taux de confirmation" value={`${stats.conversionRate}%`} sub={`${stats.confirmedCount}/${stats.closedCount} confirmées`} />
          <Kpi icon={ListChecks} tone="amber" label="À traiter" value={String(toProcessCount)} sub="commandes" />
          <Kpi icon={Clock} tone="purple" label="Temps moyen" value={formatDuration(stats.avgProcessingMinutes)} sub="par commande" />
          <Kpi icon={Wallet} tone="green" label="CA confirmé" value={`${formatXOF(stats.confirmedRevenue, false)} F`} sub="en cours + livré" />
        </div>

        {/* CONTENU : liste + fiche */}
        <div className="flex items-start gap-5">
          <div className="min-w-0 flex-1">
            {/* Toolbar — façon catalogue (statut en menu déroulant) */}
            <div className="mb-4 flex flex-wrap items-center gap-2.5">
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
                <input
                  type="search"
                  placeholder="Commande, client, téléphone…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-[12.5px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600"
                />
              </div>
              <Dropdown label="Statut" value={VIEW_TABS.find((t) => t.id === view)?.label ?? "Toutes"} open={viewOpen} setOpen={setViewOpen}>
                {VIEW_TABS.map((t) => (
                  <DropdownItem key={t.id} active={view === t.id} onClick={() => { setView(t.id); setViewOpen(false); }}>
                    <span>{t.label}</span>
                    <span className="tabular-nums text-ink-400">{counts[t.id]}</span>
                  </DropdownItem>
                ))}
              </Dropdown>
              <Dropdown label="Trier" value={SORT_OPTIONS.find((o) => o.id === sortBy)?.label ?? "Plus récent"} open={sortOpen} setOpen={setSortOpen}>
                {SORT_OPTIONS.map((o) => (
                  <DropdownItem key={o.id} active={sortBy === o.id} onClick={() => { setSortBy(o.id); setSortOpen(false); }}>
                    {o.label}
                  </DropdownItem>
                ))}
              </Dropdown>
              <div className="ml-auto text-[12px] font-medium text-ink-500">{filtered.length} commande{filtered.length > 1 ? "s" : ""}</div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-line bg-white shadow-kamoo-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1040px] table-fixed">
                  <colgroup>
                    <col className="w-[134px]" />
                    <col className="w-[132px]" />
                    <col className="w-[76px]" />
                    <col />
                    <col className="w-[160px]" />
                    <col className="w-[118px]" />
                    <col className="w-[84px]" />
                    <col className="w-[210px]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-line text-[10.5px] uppercase tracking-[0.05em] text-ink-400">
                      <th className="px-4 py-3 text-left font-semibold">N°</th>
                      <th className="px-3 py-3 text-left font-semibold">Date</th>
                      <th className="px-3 py-3 text-center font-semibold">Contact</th>
                      <th className="px-3 py-3 text-left font-semibold">Client</th>
                      <th className="px-3 py-3 text-left font-semibold">Statut</th>
                      <th className="px-3 py-3 text-right font-semibold">Total</th>
                      <th className="px-3 py-3 text-right font-semibold">Articles</th>
                      <th className="px-4 py-3 text-left font-semibold">Dernière note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F4F5F6]">
                    {shown.map((a) => {
                      const st = STATUS_STYLE[a.status];
                      const StIcon = st.icon;
                      const isSel = a.id === selectedId;
                      return (
                        <tr
                          key={a.id}
                          onClick={() => setSelectedId(a.id)}
                          className={cn("cursor-pointer transition", isSel ? "bg-kamoo-blue-50/60" : "hover:bg-paper-2/50")}
                        >
                          {/* N° */}
                          <td className="whitespace-nowrap px-4 py-2.5 text-[12px] font-semibold tabular-nums text-ink-900">{a.id}</td>
                          {/* Date */}
                          <td className="whitespace-nowrap px-3 py-2.5 text-[11.5px] tabular-nums text-ink-600">{fmtDateTime(a.createdAt)}</td>
                          {/* Contact (canaux) */}
                          <td className="px-3 py-2.5">
                            <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <a
                                href={`tel:${a.client.phone.replace(/\s/g, "")}`}
                                title={`Appeler ${a.client.phone}`}
                                className="grid h-6 w-6 place-items-center rounded-md text-ink-500 transition hover:bg-paper-2 hover:text-kamoo-blue-700"
                              >
                                <Phone className="h-3 w-3" />
                              </a>
                              {a.client.whatsapp ? (
                                <a
                                  href={`https://wa.me/${a.client.whatsapp.replace(/\D/g, "")}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="WhatsApp"
                                  className="grid h-6 w-6 place-items-center rounded-md text-emerald-600 transition hover:bg-emerald-50 hover:text-emerald-700"
                                >
                                  <MessageCircle className="h-3 w-3" />
                                </a>
                              ) : (
                                <span className="grid h-6 w-6 place-items-center text-ink-300">
                                  <MessageCircle className="h-3 w-3 opacity-30" />
                                </span>
                              )}
                            </div>
                          </td>
                          {/* Client */}
                          <td className="px-3 py-2.5">
                            <div className="truncate text-[12.5px] font-medium text-ink-900">{a.client.name}</div>
                            <div className="truncate text-[11px] text-ink-500">{a.client.city}</div>
                          </td>
                          {/* Statut */}
                          <td className="px-3 py-2.5">
                            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", st.pill)}>
                              <StIcon className="h-3 w-3" />
                              {CLOSING_STATUS_LABELS[a.status]}
                            </span>
                          </td>
                          {/* Total */}
                          <td className="whitespace-nowrap px-3 py-2.5 text-right text-[12.5px] font-semibold tabular-nums text-ink-900">
                            {formatXOF(orderTotalXof(a), false)} <span className="text-[10px] text-ink-400">F</span>
                          </td>
                          {/* Articles */}
                          <td className="px-3 py-2.5 text-right text-[12px] tabular-nums text-ink-600">
                            {a.items.length} <span className="text-ink-400">art.</span>
                          </td>
                          {/* Dernière note */}
                          <td className="px-4 py-2.5 text-[11.5px]">
                            {a.comment ? (
                              <span className="line-clamp-1 italic text-ink-600" title={a.comment}>{a.comment}</span>
                            ) : a.status === "annule" && a.cancellationReason ? (
                              <span className="italic text-red-600">{CANCELLATION_REASON_LABELS[a.cancellationReason]}</span>
                            ) : (
                              <span className="text-ink-300">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3 text-[12px] text-ink-500">
                <span>Affichage</span>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setPageSizeOpen(!pageSizeOpen)}
                    className="inline-flex h-7 items-center gap-1 rounded-md border border-line bg-white px-2 font-semibold text-ink-700 transition hover:bg-paper-2"
                  >
                    {pageSize}
                    <ChevronDown className="h-3 w-3 text-ink-400" />
                  </button>
                  {pageSizeOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setPageSizeOpen(false)} />
                      <div className="absolute bottom-[calc(100%+4px)] left-0 z-20 w-24 rounded-lg border border-line bg-white p-1 shadow-[var(--shadow-kamoo-lg)]">
                        {[10, 50, 100].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => { setPageSize(n); setPageSizeOpen(false); }}
                            className={cn("flex w-full items-center justify-between rounded-md px-2 py-1 text-[12px] transition hover:bg-paper-2", pageSize === n ? "font-semibold text-ink-900" : "text-ink-700")}
                          >
                            {n}
                            {pageSize === n && <Check className="h-3 w-3 text-kamoo-blue-700" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <span>sur {filtered.length} commande{filtered.length > 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>

          {/* Fiche commande — affichée uniquement si une commande est sélectionnée.
              Sinon le tableau occupe toute la largeur. */}
          {selected && (
            <aside className="sticky top-6 hidden w-[380px] shrink-0 self-start lg:block">
              <ClosingDetail assignment={selected} closeuseName={closeuse.name} onClose={() => setSelectedId(null)} />
            </aside>
          )}
        </div>
      </div>

      {/* Modale Nouvelle commande */}
      {createOpen && (
        <CreateOrderModal
          existingIds={all.map((a) => a.id)}
          onClose={() => setCreateOpen(false)}
          onCreate={(order) => {
            setExtraOrders([order, ...extraOrders]);
            setCreateOpen(false);
            setSelectedId(order.id);
          }}
        />
      )}
    </div>
  );
}

/* ─── Modale « Nouvelle commande » ──────────────────────────────── */
function CreateOrderModal({
  existingIds,
  onClose,
  onCreate,
}: {
  existingIds: string[];
  onClose: () => void;
  onCreate: (order: ClosingAssignment) => void;
}) {
  const [productId, setProductId] = useState(MOCK_PRODUITS[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Dakar");
  const [zone, setZone] = useState("");
  const [source, setSource] = useState("WhatsApp");

  const product = MOCK_PRODUITS.find((p) => p.id === productId);
  const total = product ? product.priceXof * qty : 0;
  const valid = !!product && qty > 0 && clientName.trim() !== "" && phone.trim() !== "";

  function submit() {
    if (!valid || !product) return;
    // Prochain numéro ORD-SN-00xxx (au-dessus du max existant)
    const maxNum = existingIds.reduce((max, id) => {
      const m = id.match(/(\d+)$/);
      return m ? Math.max(max, parseInt(m[1], 10)) : max;
    }, 0);
    const id = `ORD-SN-${String(maxNum + 1).padStart(5, "0")}`;
    const nowIso = new Date().toISOString();
    onCreate({
      id,
      items: [
        {
          productId: product.id,
          productName: product.name,
          productEmoji: product.emoji,
          productBg: product.bg,
          quantity: qty,
          unitPriceXof: product.priceXof,
        },
      ],
      client: {
        id: `cli_new_${maxNum + 1}`,
        name: clientName.trim(),
        phone: phone.trim(),
        city: city.trim() || "Dakar",
        zone: zone.trim() || city.trim() || "—",
        isReturning: false,
      },
      status: "nouvelle",
      lastActivityAt: nowIso,
      createdAt: nowIso,
      callAttempts: 0,
      source,
    });
  }

  const inputCls =
    "h-10 w-full rounded-lg border border-line bg-white px-3 text-[13px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600";
  const labelCls = "mb-1 block text-[11.5px] font-semibold text-ink-600";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-kamoo-blue-900/30 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 className="text-[15px] font-bold text-ink-900">Nouvelle commande</h2>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-lg text-ink-400 transition hover:bg-paper-2 hover:text-ink-900" aria-label="Fermer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3.5 px-5 py-4">
          {/* Produit + quantité */}
          <div className="grid grid-cols-[1fr_88px] gap-2.5">
            <div>
              <label className={labelCls}>Produit</label>
              <select value={productId} onChange={(e) => setProductId(e.target.value)} className={inputCls}>
                {MOCK_PRODUITS.filter((p) => p.isActive).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.priceXof.toLocaleString("fr-FR")} F
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Quantité</label>
              <input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} className={inputCls} />
            </div>
          </div>

          {/* Client */}
          <div>
            <label className={labelCls}>Nom du client</label>
            <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Ex : Awa Ndiaye" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className={labelCls}>Téléphone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+221 77 …" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Source</label>
              <select value={source} onChange={(e) => setSource(e.target.value)} className={inputCls}>
                {["WhatsApp", "Instagram", "TikTok", "Facebook", "Appel direct"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className={labelCls}>Ville</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Quartier / zone</label>
              <input value={zone} onChange={(e) => setZone(e.target.value)} placeholder="Ex : Médina" className={inputCls} />
            </div>
          </div>

          {/* Récap */}
          <div className="flex items-center justify-between rounded-xl bg-paper-2/60 px-3.5 py-2.5">
            <span className="text-[12.5px] text-ink-500">Total à encaisser (COD)</span>
            <span className="text-[16px] font-bold tabular-nums text-ink-900">
              {total.toLocaleString("fr-FR")} <span className="text-[11px] font-semibold text-ink-500">F CFA</span>
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-ink-400">
            La commande sera créée au statut <b className="text-ink-600">Nouvelle</b> et apparaîtra
            dans la file d&apos;appels de votre closeuse.
          </p>
        </div>

        <div className="flex gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="flex-1 rounded-lg border border-line bg-white py-2.5 text-[13px] font-semibold text-ink-700 transition hover:bg-paper-2">
            Annuler
          </button>
          <button
            onClick={submit}
            disabled={!valid}
            className="flex-1 rounded-lg bg-kamoo-blue-900 py-2.5 text-[13px] font-semibold text-white transition hover:bg-kamoo-blue-800 disabled:opacity-40"
          >
            Créer la commande
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Fiche commande ────────────────────────────────────────────── */
function ClosingDetail({
  assignment: a,
  closeuseName,
  onClose,
}: {
  assignment: ClosingAssignment;
  closeuseName: string;
  onClose: () => void;
}) {
  const st = STATUS_STYLE[a.status];
  const StIcon = st.icon;
  const total = orderTotalXof(a);
  const history = buildClosingHistory(a, closeuseName);
  const nextAction = nextActionLabel(a.status);

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white shadow-kamoo-sm">
      {/* En-tête */}
      <div className="flex items-center justify-between gap-2 border-b border-line p-4">
        <div className="min-w-0">
          <div className="text-[15px] font-bold tabular-nums text-ink-900">{a.id}</div>
          <span className={cn("mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", st.pill)}>
            <StIcon className="h-3 w-3" />
            {CLOSING_STATUS_LABELS[a.status]}
          </span>
        </div>
        <button onClick={onClose} className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-ink-400 transition hover:bg-paper-2 hover:text-ink-900" aria-label="Fermer">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-[calc(100vh-160px)] overflow-y-auto">
        {/* Infos client */}
        <div className="flex gap-3 border-b border-line p-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.05em] text-ink-400">Client</div>
            <div className="flex flex-col gap-1.5 text-[12.5px]">
              <div className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-ink-400" /><span className="font-semibold text-ink-900">{a.client.name}</span></div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-ink-400" />
                <span className="tabular-nums text-ink-700">{a.client.phone}</span>
                {a.client.whatsapp && <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-[8px] font-bold text-white">W</span>}
              </div>
              <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-ink-400" /><span className="text-ink-700">{a.client.zone ? `${a.client.zone}, ${a.client.city}` : a.client.city}</span></div>
            </div>
          </div>
          <div className="shrink-0 rounded-lg bg-paper-2/70 px-3 py-2 text-right">
            <div className="text-[10px] font-medium uppercase text-ink-400">Montant</div>
            <div className="text-[14px] font-bold tabular-nums text-ink-900">{formatXOF(total, false)} F</div>
            <div className="mt-1 text-[10px] font-medium uppercase text-ink-400">Articles</div>
            <div className="text-[12px] font-semibold text-ink-900">{a.items.length} article{a.items.length > 1 ? "s" : ""}</div>
          </div>
        </div>

        {/* Produits */}
        <div className="border-b border-line p-4">
          <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.05em] text-ink-400">Produit{a.items.length > 1 ? "s" : ""}</div>
          <div className="flex flex-col gap-2">
            {a.items.map((it, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[15px]" style={{ background: it.productBg }}>{it.productEmoji}</span>
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink-900">{it.productName}</span>
                <span className="shrink-0 text-[12px] font-semibold tabular-nums text-ink-700">{it.quantity} × {formatXOF(it.unitPriceXof, false)} F</span>
              </div>
            ))}
          </div>
        </div>

        {/* Historique des appels */}
        <div className="border-b border-line p-4">
          <div className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.05em] text-ink-400">Historique des appels</div>
          <ol className="flex flex-col gap-3">
            {history.map((e, i) => (
              <li key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                    <Check className="h-3 w-3" />
                  </span>
                  {i < history.length - 1 && <span className="mt-1 w-px flex-1 bg-line" />}
                </div>
                <div className="min-w-0 pb-1">
                  <div className="text-[12px] font-semibold text-ink-900">{e.label}</div>
                  <div className="text-[10.5px] tabular-nums text-ink-400">{fmtDateTime(e.at)}</div>
                  {e.detail && <div className="mt-0.5 text-[11px] text-ink-500">{e.detail}</div>}
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Notes */}
        {a.comment && (
          <div className="border-b border-line p-4">
            <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.05em] text-ink-400">Notes</div>
            <p className="rounded-lg bg-paper-2/70 px-3 py-2 text-[12px] text-ink-700">{a.comment}</p>
          </div>
        )}

        {/* Prochaine action */}
        {nextAction && (
          <div className="border-b border-line p-4">
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12.5px] font-semibold text-amber-800">
              <Clock className="h-4 w-4 shrink-0 text-amber-600" />
              {nextAction}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-3">
          <div className="grid grid-cols-2 gap-2">
            <ActionBtn icon={Phone} label="Appeler" className="bg-kamoo-blue-900 text-white hover:bg-kamoo-blue-800" />
            <ActionBtn icon={MessageCircle} label="WhatsApp" className="bg-emerald-600 text-white hover:bg-emerald-700" />
          </div>
          <div className="mt-2 flex flex-col gap-2">
            <ActionBtn icon={Check} label="Confirmer" className="border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50" />
            <ActionBtn icon={RotateCcw} label="Reporter / Rappeler" className="border border-amber-200 bg-white text-amber-700 hover:bg-amber-50" />
            <ActionBtn icon={Phone} label="Marquer injoignable" className="border border-line bg-white text-ink-600 hover:bg-paper-2" />
            <ActionBtn icon={XCircle} label="Annuler la commande" className="border border-red-200 bg-white text-red-600 hover:bg-red-50" />
          </div>
        </div>
      </div>
    </div>
  );
}

function nextActionLabel(status: ClosingStatus): string | null {
  switch (status) {
    case "nouvelle":
      return "Premier appel à passer";
    case "rappele":
      return "Rappeler le client";
    case "injoignable":
      return "Nouvelle tentative d'appel";
    case "livraison_en_cours":
      return "Confirmer le créneau de livraison";
    default:
      return null;
  }
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
  tone: "blue" | "amber" | "green" | "purple";
  label: string;
  value: string;
  sub: string;
}) {
  const tones: Record<string, string> = {
    blue: "bg-kamoo-blue-50 text-kamoo-blue-700",
    amber: "bg-amber-50 text-amber-600",
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
          <div className="absolute left-0 top-[calc(100%+4px)] z-20 w-56 rounded-xl border border-line bg-white p-1 shadow-[var(--shadow-kamoo-lg)]">
            {children}
          </div>
        </>
      )}
    </div>
  );
}

function DropdownItem({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
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

function ActionBtn({
  icon: Icon,
  label,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  className?: string;
}) {
  return (
    <button className={cn("flex h-10 items-center justify-center gap-2 rounded-lg text-[13px] font-semibold transition", className)}>
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
