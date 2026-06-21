"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  ListChecks,
  MessageCircle,
  Phone,
  Plus,
  Search,
  Star,
  TrendingUp,
  Truck,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import {
  computeClosingStats,
  MOCK_ACTIVE_CLOSEUSE,
  MOCK_CLOSING_ASSIGNMENTS,
  formatDuration,
} from "@/lib/data/mock-closing";
import { MOCK_PRODUITS } from "@/lib/data/mock-produits";
import { PageHeader } from "@/components/kamoo/page-header";
import { useClosingState } from "@/lib/hooks/use-closing-state";
import { useCurrentMarket } from "@/lib/hooks/use-current-market";
import { useShopify } from "@/lib/hooks/use-shopify";
import { usePartners } from "@/lib/hooks/use-partners";
import { useSessionStorageState } from "@/lib/hooks/use-session-storage-state";
import {
  CANCELLATION_REASON_LABELS,
  CLOSING_STATUS_LABELS,
  displayOrderNo,
  orderTotalXof,
  type AssignedDelivery,
  type ClosingAssignment,
  type ClosingStatus,
} from "@/lib/types/closing";
import { formatMoney, formatXOF } from "@/lib/format";
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
  annule: { pill: "bg-ink-100 text-ink-500", icon: XCircle },
};

const TO_PROCESS: ClosingStatus[] = ["nouvelle", "rappele", "injoignable"];

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} à ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
}

export default function ClosingPage() {
  /* Machine d'états closing (extraOrders + overrides, sessionStorage).
   * UNE SEULE instance du hook par page : les actions sont passées en props
   * (les instances de useSessionStorageState ne se synchronisent pas). */
  const router = useRouter();
  const closing = useClosingState();
  const { currentMarket } = useCurrentMarket();
  const { currencyFor, getConnection } = useShopify();
  const { partners } = usePartners();
  const hasCloseuse = partners.closeuse?.status === "active";
  const shopifyConnected = getConnection(currentMarket.id)?.isConnected === true;
  const currency = currencyFor(currentMarket.id);
  const all = closing.all;
  const isEmpty = all.length === 0;
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
          !displayOrderNo(a).toLowerCase().includes(q) &&
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

  return (
    <div className="min-h-full bg-paper">
      {/* Header commun : chip closeuse (si partenariat actif) + CTA + cloche */}
      <PageHeader kicker="Mon activité" title="Closing" />

      <div className="mx-auto flex max-w-[1320px] flex-col gap-5 px-6 py-6">
        {isEmpty ? (
          <EmptyClosing
            shopifyConnected={shopifyConnected}
            hasCloseuse={hasCloseuse}
            closeuseName={closeuse.name}
            onCreate={() => setCreateOpen(true)}
          />
        ) : (
        <>

        {/* Actions de page */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {hasCloseuse ? (
            <div className="flex items-center gap-2.5 rounded-xl border border-line bg-white px-3 py-1.5">
              <span
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white"
                style={{ background: closeuse.avatarBg }}
              >
                {closeuse.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </span>
              <div className="leading-tight">
                <div className="text-[12px] font-semibold text-ink-900">{closeuse.name}</div>
                <div className="flex items-center gap-1 text-[10px] text-ink-500">
                  Closeuse active
                  <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                  {closeuse.rating}
                </div>
              </div>
            </div>
          ) : (
            <span />
          )}
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-kamoo-blue-900 px-3.5 text-[13px] font-semibold text-white transition hover:bg-kamoo-blue-800"
          >
            <Plus className="h-4 w-4" />
            Nouvelle commande
          </button>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Kpi icon={TrendingUp} tone="blue" label="Taux de confirmation" value={`${stats.conversionRate}%`} sub={`${stats.confirmedCount}/${stats.closedCount} confirmées`} />
          <Kpi icon={ListChecks} tone="amber" label="À traiter" value={String(toProcessCount)} sub="commandes" />
          <Kpi icon={Clock} tone="purple" label="Temps moyen" value={formatDuration(stats.avgProcessingMinutes)} sub="par commande" />
          <Kpi icon={Wallet} tone="green" label="CA confirmé" value={formatMoney(stats.confirmedRevenue, currency)} sub="en cours + livré" />
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
                    {shown.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-[13px] text-ink-400">
                          Aucune commande ne correspond à votre recherche.
                        </td>
                      </tr>
                    ) : (
                    shown.map((a) => {
                      const st = STATUS_STYLE[a.status];
                      const StIcon = st.icon;
                      return (
                        <tr
                          key={a.id}
                          onClick={() => router.push(`/closing/${a.id}`)}
                          className="cursor-pointer transition hover:bg-paper-2/50"
                        >
                          {/* N° — celui de Shopify si la commande en vient */}
                          <td className="whitespace-nowrap px-4 py-2.5 text-[12px] font-semibold tabular-nums text-ink-900">{displayOrderNo(a)}</td>
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
                          {/* Total — dans la devise d'affichage du marché */}
                          <td className="whitespace-nowrap px-3 py-2.5 text-right text-[12.5px] font-semibold tabular-nums text-ink-900">
                            {formatMoney(orderTotalXof(a), currency)}
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
                    })
                    )}
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

          {/* Plus de panneau lateral : cliquer une commande ouvre sa page de detail (/closing/[id]) ou vivent toutes les actions. */}
        </div>
        </>
        )}
      </div>

      {/* Modale Nouvelle commande */}
      {createOpen && (
        <CreateOrderModal
          existingIds={all.map((a) => a.id)}
          countryCode={currentMarket.country.code}
          defaultCity={currentMarket.country.warehouseCity?.split(",")[0] ?? "Dakar"}
          onClose={() => setCreateOpen(false)}
          onCreate={(order) => {
            closing.addOrder(order);
            setCreateOpen(false);
            router.push(`/closing/${order.id}`);
          }}
        />
      )}
    </div>
  );
}

/* ─── Modale « Nouvelle commande » ──────────────────────────────── */
function CreateOrderModal({
  existingIds,
  countryCode,
  defaultCity,
  onClose,
  onCreate,
}: {
  existingIds: string[];
  countryCode: string;
  defaultCity: string;
  onClose: () => void;
  onCreate: (order: ClosingAssignment) => void;
}) {
  const [productId, setProductId] = useState(MOCK_PRODUITS[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState(defaultCity);
  const [zone, setZone] = useState("");
  const [source, setSource] = useState("WhatsApp");

  const product = MOCK_PRODUITS.find((p) => p.id === productId);
  const total = product ? product.priceXof * qty : 0;
  const valid = !!product && qty > 0 && clientName.trim() !== "" && phone.trim() !== "";

  function submit() {
    if (!valid || !product) return;
    // Prochain numéro ORD-{pays}-00xxx (un marché = un pays)
    const maxNum = existingIds.reduce((max, id) => {
      const m = id.match(/(\d+)$/);
      return m ? Math.max(max, parseInt(m[1], 10)) : max;
    }, 0);
    const id = `ORD-${countryCode}-${String(maxNum + 1).padStart(5, "0")}`;
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
        city: city.trim() || defaultCity,
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

/* ─── État vide (aucune commande) ──────────────────────────────── */
function EmptyClosing({
  shopifyConnected,
  hasCloseuse,
  closeuseName,
  onCreate,
}: {
  shopifyConnected: boolean;
  hasCloseuse: boolean;
  closeuseName: string;
  onCreate: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-line bg-white px-6 py-16 text-center shadow-kamoo-sm">
      <div className="grid h-14 w-14 place-items-center rounded-xl bg-paper-2">
        <Phone className="h-6 w-6 text-ink-400" />
      </div>
      <p className="mt-4 text-[15px] font-medium text-ink-900">Aucune commande à traiter</p>
      <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-ink-500">
        {shopifyConnected
          ? "Les commandes de votre boutique arrivent ici automatiquement après la synchronisation. Vous pouvez aussi en créer une manuellement."
          : "Connectez votre boutique Shopify pour importer vos commandes automatiquement, ou créez-en une à la main."}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {shopifyConnected ? (
          <button
            onClick={onCreate}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-kamoo-blue-900 px-3.5 text-[13px] font-medium text-white transition hover:bg-kamoo-blue-800"
          >
            <Plus className="h-4 w-4" /> Nouvelle commande
          </button>
        ) : (
          <>
            <Link
              href="/parametres/connexions"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-kamoo-blue-900 px-3.5 text-[13px] font-medium text-white transition hover:bg-kamoo-blue-800"
            >
              Connecter Shopify
            </Link>
            <button
              onClick={onCreate}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 text-[13px] font-medium text-ink-900 transition hover:bg-paper-2"
            >
              <Plus className="h-4 w-4" /> Nouvelle commande
            </button>
          </>
        )}
      </div>
      {hasCloseuse && (
        <p className="mt-4 text-[12px] text-ink-400">
          {closeuseName} appellera chaque commande dès qu&apos;elle arrive.
        </p>
      )}
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

