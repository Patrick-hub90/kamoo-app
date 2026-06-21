"use client";

import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Check,
  ChevronDown,
  Clock,
  Search,
  ShieldCheck,
  Ship,
  Star,
  Users,
  X,
} from "lucide-react";
import { TransitaireCard } from "@/components/kamoo/transitaire-card";
import { MOCK_TRANSITAIRES } from "@/lib/data/mock-transitaires";
import { usePartners } from "@/lib/hooks/use-partners";
import { useSessionStorageState } from "@/lib/hooks/use-session-storage-state";
import { TRANSPORT_MODE_LABELS, type TransportMode } from "@/lib/types/expedition";
import type { Transitaire } from "@/lib/types/transitaire";
import { PageHeader } from "@/components/kamoo/page-header";
import { cn } from "@/lib/utils";

type SortKey = "rating" | "reviews" | "price" | "orders";

const SORT_LABELS: Record<SortKey, string> = {
  rating: "Meilleure note",
  reviews: "Plus d'avis",
  price: "Tarif le plus bas",
  orders: "Commandes traitées",
};

const MODES: TransportMode[] = ["air_express", "air_standard", "sea"];

const DELAY_OPTIONS = [
  { v: 0, label: "Tous les délais" },
  { v: 5, label: "≤ 5 jours" },
  { v: 10, label: "≤ 10 jours" },
  { v: 30, label: "≤ 30 jours" },
];

function minPrice(t: Transitaire): number {
  return Math.min(...t.modes.map((m) => m.fromXof));
}

/** Délai minimum (en jours) parmi les modes du transitaire. */
function minDelayDays(t: Transitaire): number {
  return Math.min(
    ...t.modes.map((m) => {
      const n = m.delay.match(/\d+/);
      return n ? parseInt(n[0], 10) : 999;
    }),
  );
}

export default function MarketplaceTransitairesPage() {
  const all = MOCK_TRANSITAIRES;
  const { partners } = usePartners();

  const [search, setSearch] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [certifiedOnly, setCertifiedOnly] = useState(false);
  const [mode, setMode] = useState<"all" | TransportMode>("all");
  const [maxDelay, setMaxDelay] = useState(0);
  const [sortBy, setSortBy] = useState<SortKey>("rating");
  const [open, setOpen] = useState<string | null>(null);
  const [saved, setSaved] = useSessionStorageState<string[]>(
    "marketplace.transitaires.saved",
    [],
  );

  const toggleSaved = (slug: string) =>
    setSaved(saved.includes(slug) ? saved.filter((s) => s !== slug) : [...saved, slug]);

  const filtered = useMemo(() => {
    const list = all.filter((t) => {
      if (certifiedOnly && t.status !== "certified") return false;
      if (t.rating < minRating) return false;
      if (mode !== "all" && !t.modes.some((m) => m.mode === mode)) return false;
      if (maxDelay > 0 && minDelayDays(t) > maxDelay) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        if (
          !t.name.toLowerCase().includes(q) &&
          !t.city.toLowerCase().includes(q) &&
          !(t.localWarehouse ?? "").toLowerCase().includes(q) &&
          !t.about.toLowerCase().includes(q) &&
          !t.specialties.some((s) => s.toLowerCase().includes(q))
        )
          return false;
      }
      return true;
    });
    const sorted = [...list].sort((a, b) => {
      switch (sortBy) {
        case "reviews":
          return b.reviewsCount - a.reviewsCount;
        case "price":
          return minPrice(a) - minPrice(b);
        case "orders":
          return (b.ordersHandled ?? 0) - (a.ordersHandled ?? 0);
        case "rating":
        default:
          return b.rating - a.rating;
      }
    });
    // Priorité d'affichage : mes partenaires actifs > demandes envoyées >
    // enregistrés > le reste (chaque groupe garde le tri choisi).
    const rank = (t: (typeof sorted)[number]): number => {
      const p = partners.transitaires.find((x) => x.slug === t.slug);
      if (p?.status === "active") return 0;
      if (p?.status === "pending") return 1;
      if (saved.includes(t.slug)) return 2;
      return 3;
    };
    return [...sorted].sort((a, b) => rank(a) - rank(b));
  }, [all, search, certifiedOnly, minRating, mode, maxDelay, sortBy, saved, partners.transitaires]);

  const filtersActive =
    search.trim() !== "" || certifiedOnly || minRating > 0 || mode !== "all" || maxDelay > 0;

  function reset() {
    setSearch("");
    setMinRating(0);
    setCertifiedOnly(false);
    setMode("all");
    setMaxDelay(0);
  }

  /* Chips des filtres actifs (affichés sous la barre) */
  const chips: { label: string; clear: () => void }[] = [];
  if (mode !== "all") chips.push({ label: TRANSPORT_MODE_LABELS[mode], clear: () => setMode("all") });
  if (maxDelay > 0) chips.push({ label: `Délai ≤ ${maxDelay} j`, clear: () => setMaxDelay(0) });
  if (minRating > 0) chips.push({ label: `Au moins ${minRating}★`, clear: () => setMinRating(0) });
  if (certifiedOnly) chips.push({ label: "Certifié Kamoo", clear: () => setCertifiedOnly(false) });

  return (
    <div className="min-h-full bg-paper">
      <PageHeader kicker="Découvrir" title="Marketplace · Transitaires" />
      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/transitaires/hero-transitaires.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-kamoo-blue-900/95 via-kamoo-blue-900/85 to-kamoo-blue-900/45" />
        <div className="relative mx-auto max-w-[1320px] px-6 py-10">
          <div className="text-[12px] font-semibold uppercase tracking-wider text-white/60">
            Marketplace · Transitaires
          </div>
          <h1 className="mt-2 text-[32px] font-extrabold leading-tight tracking-tight text-white">
            Choisissez votre transitaire
          </h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-white/80">
            Comparez les tarifs, délais, fiabilité et spécialités des transitaires.
            Tous les profils sont vérifiés par Kamoo pour des échanges en toute confiance.
          </p>
          <div className="mt-5 flex flex-wrap gap-x-7 gap-y-2.5 text-[12.5px] font-medium text-white/90">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-kamoo-orange-400" /> Profils vérifiés par Kamoo
            </span>
            <span className="inline-flex items-center gap-2">
              <Users className="h-4 w-4 text-kamoo-orange-400" /> {all.length} transitaire{all.length > 1 ? "s" : ""} référencé{all.length > 1 ? "s" : ""}
            </span>
            <span className="inline-flex items-center gap-2">
              <Star className="h-4 w-4 text-kamoo-orange-400" /> Avis authentiques
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1320px] px-6 py-6">
        {/* BARRE DE FILTRES */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-white p-2 shadow-kamoo-sm">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              placeholder="Rechercher un transitaire, une ville, une spécialité…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-line bg-paper-2/40 pl-9 pr-3 text-[12.5px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600 focus:bg-white"
            />
          </div>

          <Select id="mode" icon={Ship} label="Mode" value={mode === "all" ? null : TRANSPORT_MODE_LABELS[mode]} open={open} setOpen={setOpen}>
            <Opt active={mode === "all"} onClick={() => { setMode("all"); setOpen(null); }}>Tous les modes</Opt>
            <div className="my-1 h-px bg-line" />
            {MODES.map((m) => (
              <Opt key={m} active={mode === m} onClick={() => { setMode(m); setOpen(null); }}>{TRANSPORT_MODE_LABELS[m]}</Opt>
            ))}
          </Select>

          <Select id="delai" icon={Clock} label="Délai" value={maxDelay === 0 ? null : `≤ ${maxDelay} j`} open={open} setOpen={setOpen}>
            {DELAY_OPTIONS.map((o) => (
              <Opt key={o.v} active={maxDelay === o.v} onClick={() => { setMaxDelay(o.v); setOpen(null); }}>{o.label}</Opt>
            ))}
          </Select>

          <Select
            id="note"
            icon={Star}
            label="Note"
            value={minRating === 0 ? null : `Au moins ${minRating}`}
            open={open}
            setOpen={setOpen}
          >
            <Opt active={minRating === 0} onClick={() => { setMinRating(0); setOpen(null); }}>Toutes les notes</Opt>
            <div className="my-1 h-px bg-line" />
            {[1, 2, 3, 4, 5].map((n) => (
              <Opt key={n} active={minRating === n} onClick={() => { setMinRating(n); setOpen(null); }}>
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> Au moins {n}
                </span>
              </Opt>
            ))}
          </Select>

          <button
            onClick={() => setCertifiedOnly((v) => !v)}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-[12.5px] font-medium transition",
              certifiedOnly
                ? "border-kamoo-blue-200 bg-kamoo-blue-50 text-kamoo-blue-700"
                : "border-line bg-white text-ink-700 hover:bg-paper-2",
            )}
          >
            <BadgeCheck className="h-3.5 w-3.5" />
            Certifié
            {certifiedOnly && <Check className="h-3 w-3" />}
          </button>
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
            <b className="text-ink-900">{filtered.length}</b> transitaire{filtered.length > 1 ? "s" : ""}
            {filtersActive ? " correspondant" + (filtered.length > 1 ? "s" : "") : " référencés"}
          </div>
          <div className="flex items-center gap-2 text-[12.5px] text-ink-500">
            Trier par
            <Select id="sort" label={SORT_LABELS[sortBy]} value={null} align="end" open={open} setOpen={setOpen} strong>
              {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                <Opt key={k} active={sortBy === k} onClick={() => { setSortBy(k); setOpen(null); }}>{SORT_LABELS[k]}</Opt>
              ))}
            </Select>
          </div>
        </div>

        {/* GRILLE */}
        {filtered.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((t) => (
              <TransitaireCard
                key={t.id}
                transitaire={t}
                saved={saved.includes(t.slug)}
                onToggleSave={() => toggleSaved(t.slug)}
              />
            ))}
          </div>
        ) : (
          <div className="mt-4 grid place-items-center rounded-xl border border-dashed border-line bg-white py-16 text-center">
            <Search className="h-8 w-8 text-ink-300" />
            <p className="mt-3 text-[14px] font-semibold text-ink-700">Aucun transitaire ne correspond</p>
            <p className="mt-1 text-[12.5px] text-ink-400">Essayez d&apos;élargir vos critères.</p>
            <button onClick={reset} className="mt-4 rounded-lg bg-kamoo-blue-900 px-4 py-2 text-[12.5px] font-semibold text-white transition hover:bg-kamoo-blue-800">
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Dropdown générique ─────────────────────────────────────────── */
function Select({
  id,
  icon: Icon,
  label,
  value,
  open,
  setOpen,
  children,
  align = "start",
  strong = false,
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
          active || strong
            ? "border-kamoo-blue-200 bg-kamoo-blue-50 font-semibold text-kamoo-blue-800"
            : "border-line bg-white font-medium text-ink-700 hover:bg-paper-2",
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
          <div
            className={cn(
              "absolute top-[calc(100%+4px)] z-20 max-h-72 w-56 overflow-auto rounded-xl border border-line bg-white p-1 shadow-[var(--shadow-kamoo-lg)]",
              align === "end" ? "right-0" : "left-0",
            )}
          >
            {children}
          </div>
        </>
      )}
    </div>
  );
}

function Opt({
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
        "flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-[12.5px] transition hover:bg-paper-2",
        active ? "font-semibold text-ink-900" : "text-ink-700",
      )}
    >
      <span className="truncate">{children}</span>
      {active && <Check className="h-3.5 w-3.5 shrink-0 text-kamoo-blue-700" />}
    </button>
  );
}
