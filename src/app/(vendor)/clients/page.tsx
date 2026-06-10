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
import { useRouter } from "next/navigation";
import { computeClientsStats } from "@/lib/data/mock-clients";
import { useClientsState } from "@/lib/hooks/use-clients-state";
import { MOCK_PRODUITS } from "@/lib/data/mock-produits";
import { PageHeader } from "@/components/kamoo/page-header";
import { useSessionStorageState } from "@/lib/hooks/use-session-storage-state";
import {
  CHANNEL_LABELS,
  deliveryRate,
  getClientSegment,
  getInitials,
  getWhatsappLink,
  SEGMENT_LABELS,
  SEGMENT_TONE,
  type Client,
  type ClientSegment,
} from "@/lib/types/client";
import { formatXOF } from "@/lib/format";
import { cn } from "@/lib/utils";

type ViewKey = "all" | "fidele" | "nouveau" | "prospect";
type SortKey = "recent_order" | "spent_desc" | "orders_desc" | "delivered_desc" | "name";

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
  { id: "delivered_desc", label: "Commandes livrées ↓" },
  { id: "name", label: "Nom A → Z" },
];

/* Pastille segment — dérivée du tone partagé SEGMENT_TONE (mêmes couleurs
 * que la page détail client : un segment = une couleur, partout). */
const SEG_PILL: Record<ClientSegment, string> = Object.fromEntries(
  (Object.keys(SEGMENT_TONE) as ClientSegment[]).map((k) => [
    k,
    `${SEGMENT_TONE[k].bg} ${SEGMENT_TONE[k].fg}`,
  ]),
) as Record<ClientSegment, string>;

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days} j`;
  if (days < 30) return `Il y a ${Math.floor(days / 7)} sem.`;
  if (days < 365) return `Il y a ${Math.floor(days / 30)} mois`;
  return `Il y a ${Math.floor(days / 365)} an${Math.floor(days / 365) > 1 ? "s" : ""}`;
}

export default function ClientsPage() {
  const router = useRouter();
  /* Fixtures + clients ajoutés via la modale (sessionStorage) */
  const { all, addClient } = useClientsState();
  const stats = useMemo(() => computeClientsStats(all), [all]);
  const fidelesCount = useMemo(() => all.filter((c) => getClientSegment(c) === "fidele").length, [all]);

  const [search, setSearch] = useSessionStorageState("clients.search", "");
  const [view, setView] = useSessionStorageState<ViewKey>("clients.view", "all");
  const [sortBy, setSortBy] = useSessionStorageState<SortKey>("clients.sortBy", "recent_order");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [viewOpen, setViewOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  /* Options de filtres dérivées des données */
  const cityOptions = useMemo(
    () => [...new Set(all.map((c) => c.city))].sort((a, b) => a.localeCompare(b)),
    [all],
  );
  const sourceOptions = useMemo(
    () => [...new Set(all.map((c) => c.acquisitionChannel))],
    [all],
  );

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
      if (cityFilter !== "all" && c.city !== cityFilter) return false;
      if (sourceFilter !== "all" && c.acquisitionChannel !== sourceFilter) return false;
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
        case "delivered_desc":
          return b.totalDeliveredOrders - a.totalDeliveredOrders;
        case "name":
          return a.name.localeCompare(b.name);
        case "recent_order":
        default:
          return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime();
      }
    });
    return list;
  }, [all, view, search, sortBy, cityFilter, sourceFilter]);

  return (
    <div className="min-h-full bg-paper">
      {/* Header commun : CTA + cloche (même ordre partout) */}
      <PageHeader kicker="Mon activité" title="Clients">
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-kamoo-blue-900 px-3.5 text-[13px] font-semibold text-white transition hover:bg-kamoo-blue-800"
        >
          <Plus className="h-4 w-4" />
          Ajouter un client
        </button>
      </PageHeader>

      <div className="mx-auto flex max-w-[1320px] flex-col gap-5 px-6 py-6">

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
                label="Ville"
                value={cityFilter === "all" ? "Toutes" : cityFilter}
                open={cityOpen}
                setOpen={setCityOpen}
              >
                <DropdownItem active={cityFilter === "all"} onClick={() => { setCityFilter("all"); setCityOpen(false); }}>
                  Toutes les villes
                </DropdownItem>
                {cityOptions.map((v) => (
                  <DropdownItem key={v} active={cityFilter === v} onClick={() => { setCityFilter(v); setCityOpen(false); }}>
                    {v}
                  </DropdownItem>
                ))}
              </Dropdown>

              <Dropdown
                label="Source"
                value={sourceFilter === "all" ? "Toutes" : CHANNEL_LABELS[sourceFilter as keyof typeof CHANNEL_LABELS]}
                open={sourceOpen}
                setOpen={setSourceOpen}
              >
                <DropdownItem active={sourceFilter === "all"} onClick={() => { setSourceFilter("all"); setSourceOpen(false); }}>
                  Toutes les sources
                </DropdownItem>
                {sourceOptions.map((s) => (
                  <DropdownItem key={s} active={sourceFilter === s} onClick={() => { setSourceFilter(s); setSourceOpen(false); }}>
                    {CHANNEL_LABELS[s]}
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
                      return (
                        <tr
                          key={c.id}
                          onClick={() => router.push(`/clients/${c.id}`)}
                          className="cursor-pointer transition hover:bg-paper-2/50"
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

          {/* Plus de panneau latéral : cliquer un client ouvre sa page de
              détail (/clients/[id]) et le tableau garde toute la largeur. */}
        </div>
      </div>

      {addOpen && (
        <AddClientModal
          onClose={() => setAddOpen(false)}
          onCreate={(c) => {
            addClient(c);
            setAddOpen(false);
          }}
        />
      )}
    </div>
  );
}

/* ─── Fiche détail ──────────────────────────────────────────────── */
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

/* ─── Modale « Ajouter un client » ──────────────────────────────────
 * Workflow volontairement léger : seuls le NOM et le NUMÉRO sont
 * obligatoires — tout le reste est optionnel (esprit Kamoo : rapidité). */
function AddClientModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (c: Client) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [city, setCity] = useState("");
  const [zone, setZone] = useState("");
  const [channel, setChannel] = useState<Client["acquisitionChannel"]>("whatsapp");
  const [notes, setNotes] = useState("");

  const valid = name.trim().length > 0 && phone.trim().length > 0;

  const AVATARS = [
    "linear-gradient(135deg,#0EA5E9,#0284C7)",
    "linear-gradient(135deg,#22C55E,#16A34A)",
    "linear-gradient(135deg,#A855F7,#7E22CE)",
    "linear-gradient(135deg,#F59E0B,#B45309)",
    "linear-gradient(135deg,#EC4899,#DB2777)",
  ];

  function submit() {
    if (!valid) return;
    const today = new Date().toISOString().slice(0, 10);
    onCreate({
      id: `cu_new_${Date.now().toString(36)}`,
      name: name.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || undefined,
      city: city.trim() || "—",
      zone: zone.trim() || city.trim() || "—",
      country: "SN",
      status: "actif",
      acquisitionChannel: channel,
      firstOrderDate: today,
      lastOrderDate: today,
      totalOrders: 0,
      totalDeliveredOrders: 0,
      totalCancelledOrders: 0,
      totalSpentXof: 0,
      avgBasketXof: 0,
      preferredProductIds: [],
      notes: notes.trim() || undefined,
      avatarBg: AVATARS[name.length % AVATARS.length],
    });
  }

  const inputCls =
    "h-10 w-full rounded-lg border border-line bg-white px-3 text-[13px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600";
  const labelCls = "mb-1 block text-[11.5px] font-semibold text-ink-600";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-kamoo-blue-900/30 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 className="text-[15px] font-bold text-ink-900">Ajouter un client</h2>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-lg text-ink-400 transition hover:bg-paper-2 hover:text-ink-900" aria-label="Fermer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex max-h-[65vh] flex-col gap-3.5 overflow-y-auto px-5 py-4">
          <div>
            <label className={labelCls}>
              Nom du client <span className="text-red-500">*</span>
            </label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Awa Ndiaye" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className={labelCls}>
                Téléphone <span className="text-red-500">*</span>
              </label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+221 77 …" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>WhatsApp (optionnel)</label>
              <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Si différent" className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className={labelCls}>Ville (optionnel)</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex : Dakar" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Quartier / zone (optionnel)</label>
              <input value={zone} onChange={(e) => setZone(e.target.value)} placeholder="Ex : Médina" className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Source (optionnel)</label>
            <select value={channel} onChange={(e) => setChannel(e.target.value as Client["acquisitionChannel"])} className={inputCls}>
              {(Object.keys(CHANNEL_LABELS) as Client["acquisitionChannel"][]).map((k) => (
                <option key={k} value={k}>{CHANNEL_LABELS[k]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Note (optionnel)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Préférences, contexte…" className="w-full resize-none rounded-lg border border-line bg-white px-3 py-2 text-[13px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600" />
          </div>
        </div>

        <div className="flex gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="flex-1 rounded-lg border border-line bg-white py-2.5 text-[13px] font-semibold text-ink-700 transition hover:bg-paper-2">
            Annuler
          </button>
          <button
            disabled={!valid}
            onClick={submit}
            className="flex-1 rounded-lg bg-kamoo-blue-900 py-2.5 text-[13px] font-bold text-white transition hover:bg-kamoo-blue-800 disabled:opacity-40"
          >
            Ajouter le client
          </button>
        </div>
      </div>
    </div>
  );
}
