"use client";

import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Bike,
  Building2,
  Check,
  ChevronDown,
  Clock,
  Headphones,
  MapPin,
  Search,
  ShieldCheck,
  Star,
  Users,
  X,
} from "lucide-react";
import { LivreurCard } from "@/components/kamoo/livreur-card";
import { MOCK_LIVREURS } from "@/lib/data/mock-livreurs";
import { useCurrentMarket } from "@/lib/hooks/use-current-market";
import { LIVREUR_SERVICE_SHORT, type Livreur, type LivreurService, type LivreurType } from "@/lib/types/livreur";
import { cn } from "@/lib/utils";

const COUNTRY: Record<string, string> = { SN: "Sénégal", CI: "Côte d'Ivoire", CM: "Cameroun" };
const fmt = (n: number) => n.toLocaleString("fr-FR");

type SortKey = "rating" | "success" | "price_asc" | "deliveries";
const SORT_LABELS: Record<SortKey, string> = {
  rating: "Meilleure note",
  success: "Meilleur taux de réussite",
  price_asc: "Tarif le plus bas",
  deliveries: "Plus expérimentés",
};

type TypeKey = "all" | LivreurType;
const TYPE_LABELS: Record<TypeKey, string> = {
  all: "Tous",
  particulier: "Indépendant",
  agence: "Agence",
};

type StatusKey = "all" | "certified" | "new";
const STATUS_LABELS: Record<StatusKey, string> = {
  all: "Tous",
  certified: "Certifié",
  new: "Nouveau",
};

const minPrice = (l: Livreur) => Math.min(...l.zones.map((z) => z.priceXof));

export default function MarketplaceLivreursPage() {
  /* Un marché = un pays : seuls les livreurs du marché courant sont listés. */
  const { currentMarket } = useCurrentMarket();
  const all = useMemo(
    () => MOCK_LIVREURS.filter((l) => l.countryCode === currentMarket.country.code),
    [currentMarket.country.code],
  );

  const [search, setSearch] = useState("");
  const [type, setType] = useState<TypeKey>("all");
  const [status, setStatus] = useState<StatusKey>("all");
  const [service, setService] = useState<"all" | LivreurService>("all");
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState<SortKey>("rating");
  const [open, setOpen] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const list = all.filter((l) => {
      if (type !== "all" && l.type !== type) return false;
      if (status !== "all" && l.status !== status) return false;
      if (service !== "all" && !(l.services ?? []).includes(service)) return false;
      if (minRating > 0 && l.rating < minRating) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        if (
          !l.name.toLowerCase().includes(q) &&
          !l.city.toLowerCase().includes(q) &&
          !l.zones.some((z) => z.name.toLowerCase().includes(q))
        )
          return false;
      }
      return true;
    });
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "success":
          return b.kpi.deliverySuccessRate - a.kpi.deliverySuccessRate;
        case "price_asc":
          return minPrice(a) - minPrice(b);
        case "deliveries":
          return b.kpi.deliveriesHandled - a.kpi.deliveriesHandled;
        case "rating":
        default:
          return b.rating - a.rating || b.reviewsCount - a.reviewsCount;
      }
    });
  }, [all, type, status, service, minRating, search, sortBy]);

  const filtersActive = !!search || type !== "all" || status !== "all" || service !== "all" || minRating > 0;
  function reset() { setSearch(""); setType("all"); setStatus("all"); setService("all"); setMinRating(0); }

  /* Chips des filtres actifs (affichés sous la barre) */
  const chips: { label: string; clear: () => void }[] = [];
  if (type !== "all") chips.push({ label: TYPE_LABELS[type], clear: () => setType("all") });
  if (status !== "all") chips.push({ label: STATUS_LABELS[status], clear: () => setStatus("all") });
  if (service !== "all") chips.push({ label: LIVREUR_SERVICE_SHORT[service], clear: () => setService("all") });
  if (minRating > 0) chips.push({ label: `Au moins ${minRating}★`, clear: () => setMinRating(0) });


  return (
    <div className="min-h-full bg-paper">
      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/livreurs/hero-livreurs.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-kamoo-blue-900/95 via-kamoo-blue-900/85 to-kamoo-blue-900/45" />
        <div className="relative mx-auto max-w-[1320px] px-6 py-10">
          <div className="text-[12px] font-semibold uppercase tracking-wider text-white/60">Marketplace · Livreurs</div>
          <h1 className="mt-2 max-w-2xl text-[32px] font-extrabold leading-tight tracking-tight text-white">
            Trouvez le livreur idéal pour vos commandes
          </h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-white/80">
            Livreurs indépendants et agences vérifiés par Kamoo. Comparez les zones, tarifs, délais et fiabilité avant de confier vos livraisons.
          </p>
          <div className="mt-5 flex flex-wrap gap-x-7 gap-y-2.5 text-[12.5px] font-medium text-white/90">
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-kamoo-orange-400" /> Profils vérifiés par Kamoo</span>
            <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-kamoo-orange-400" /> Zones &amp; tarifs transparents</span>
            <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-kamoo-orange-400" /> Livraison rapide</span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1320px] px-6 py-6">
        {/* FILTRES */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-white p-2 shadow-kamoo-sm">
          <div className="relative min-w-[180px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              placeholder="Rechercher un livreur, une ville, une zone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-line bg-paper-2/40 pl-9 pr-3 text-[12.5px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600 focus:bg-white"
            />
          </div>

          <Select id="type" icon={Bike} label="Type" value={type === "all" ? null : TYPE_LABELS[type]} open={open} setOpen={setOpen}>
            {(Object.keys(TYPE_LABELS) as TypeKey[]).map((t) => (
              <Opt key={t} active={type === t} onClick={() => { setType(t); setOpen(null); }}>
                <span className="inline-flex items-center gap-1.5">{t === "agence" ? <Building2 className="h-3.5 w-3.5" /> : t === "particulier" ? <Bike className="h-3.5 w-3.5" /> : null}{TYPE_LABELS[t]}</span>
              </Opt>
            ))}
          </Select>

          <Select id="status" icon={BadgeCheck} label="Statut" value={status === "all" ? null : STATUS_LABELS[status]} open={open} setOpen={setOpen}>
            {(Object.keys(STATUS_LABELS) as StatusKey[]).map((s) => <Opt key={s} active={status === s} onClick={() => { setStatus(s); setOpen(null); }}>{STATUS_LABELS[s]}</Opt>)}
          </Select>

          <Select id="service" icon={Headphones} label="Service" value={service === "all" ? null : LIVREUR_SERVICE_SHORT[service]} open={open} setOpen={setOpen}>
            <Opt active={service === "all"} onClick={() => { setService("all"); setOpen(null); }}>Tous les services</Opt>
            <div className="my-1 h-px bg-line" />
            {(Object.keys(LIVREUR_SERVICE_SHORT) as LivreurService[]).map((s) => (
              <Opt key={s} active={service === s} onClick={() => { setService(s); setOpen(null); }}>{LIVREUR_SERVICE_SHORT[s]}</Opt>
            ))}
          </Select>

          <Select id="note" icon={Star} label="Note" value={minRating === 0 ? null : `Au moins ${minRating}`} open={open} setOpen={setOpen}>
            <Opt active={minRating === 0} onClick={() => { setMinRating(0); setOpen(null); }}>Toutes les notes</Opt>
            <div className="my-1 h-px bg-line" />
            {[1, 2, 3, 4, 5].map((n) => (
              <Opt key={n} active={minRating === n} onClick={() => { setMinRating(n); setOpen(null); }}>
                <span className="inline-flex items-center gap-1.5"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> Au moins {n}</span>
              </Opt>
            ))}
          </Select>

        </div>

        {/* FILTRES ACTIFS — chips visibles sous la barre */}
        {chips.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-semibold text-ink-500">Filtres actifs :</span>
            {chips.map((ch, i) => (
              <button
                key={i}
                onClick={ch.clear}
                className="inline-flex items-center gap-1.5 rounded-full border border-kamoo-blue-200 bg-kamoo-blue-50 px-2.5 py-1 text-[11.5px] font-semibold text-kamoo-blue-800 transition hover:bg-kamoo-blue-100"
              >
                {ch.label}
                <X className="h-3 w-3" />
              </button>
            ))}
            <button onClick={reset} className="text-[12px] font-semibold text-kamoo-blue-700 hover:underline">
              Tout effacer
            </button>
          </div>
        )}

        {/* COMPTEUR + TRI */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[13px] text-ink-600">
            <b className="text-ink-900">{filtered.length}</b> livreur{filtered.length > 1 ? "s" : ""}{filtersActive ? " trouvé" + (filtered.length > 1 ? "s" : "") : " vérifiés"}
          </div>
          <div className="flex items-center gap-2 text-[12.5px] text-ink-500">
            Trier par
            <Select id="sort" label={SORT_LABELS[sortBy]} value={null} align="end" strong open={open} setOpen={setOpen}>
              {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => <Opt key={k} active={sortBy === k} onClick={() => { setSortBy(k); setOpen(null); }}>{SORT_LABELS[k]}</Opt>)}
            </Select>
          </div>
        </div>

        {/* GRILLE */}
        {filtered.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((l) => <LivreurCard key={l.slug} livreur={l} />)}
          </div>
        ) : (
          <div className="mt-4 grid place-items-center rounded-xl border border-dashed border-line bg-white py-16 text-center">
            <Search className="h-8 w-8 text-ink-300" />
            <p className="mt-3 text-[14px] font-semibold text-ink-700">Aucun livreur ne correspond</p>
            <button onClick={reset} className="mt-4 rounded-lg bg-kamoo-blue-900 px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-kamoo-blue-800">Réinitialiser les filtres</button>
          </div>
        )}

      </div>
    </div>
  );
}

/* ─── Dropdown générique ─────────────────────────────────────────── */
function Select({
  id, icon: Icon, label, value, open, setOpen, children, align = "start", strong = false,
}: {
  id: string;
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null;
  open: string | null;
  setOpen: (v: string | null) => void;
  children: React.ReactNode;
  align?: "start" | "end";
  strong?: boolean;
}) {
  const isOpen = open === id;
  const active = value !== null;
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(isOpen ? null : id)}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-[12.5px] transition",
          active || strong ? "border-kamoo-blue-200 bg-kamoo-blue-50 font-semibold text-kamoo-blue-800" : "border-line bg-white font-medium text-ink-700 hover:bg-paper-2",
        )}
      >
        {Icon && <Icon className="h-3.5 w-3.5 text-ink-400" />}
        <span>{label}</span>
        {value && <span className="max-w-[120px] truncate font-semibold text-kamoo-blue-800">· {value}</span>}
        <ChevronDown className="h-3 w-3 text-ink-400" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(null)} />
          <div className={cn("absolute top-[calc(100%+4px)] z-20 max-h-72 w-52 overflow-auto rounded-xl border border-line bg-white p-1 shadow-[var(--shadow-kamoo-lg)]", align === "end" ? "right-0" : "left-0")}>
            {children}
          </div>
        </>
      )}
    </div>
  );
}

function Opt({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-[12.5px] transition hover:bg-paper-2", active ? "font-semibold text-ink-900" : "text-ink-700")}
    >
      <span className="truncate">{children}</span>
      {active && <Check className="h-3.5 w-3.5 shrink-0 text-kamoo-blue-700" />}
    </button>
  );
}
