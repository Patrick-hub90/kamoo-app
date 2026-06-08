"use client";

import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Check,
  ChevronDown,
  Headphones,
  MapPin,
  Scale,
  Search,
  ShieldCheck,
  Ship,
  Star,
  Tag,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { TransitaireCard } from "@/components/kamoo/transitaire-card";
import { MOCK_TRANSITAIRES } from "@/lib/data/mock-transitaires";
import { TRANSPORT_MODE_LABELS, type TransportMode } from "@/lib/types/expedition";
import type { Transitaire } from "@/lib/types/transitaire";
import { cn } from "@/lib/utils";

type SortKey = "rating" | "reviews" | "ontime" | "price" | "fastest";

const SORT_LABELS: Record<SortKey, string> = {
  rating: "Meilleure note",
  reviews: "Plus d'avis",
  ontime: "Plus fiable",
  price: "Tarif le plus bas",
  fastest: "Plus rapide",
};

const MODES: TransportMode[] = ["air_express", "air_standard", "sea"];

function minPrice(t: Transitaire): number {
  return Math.min(...t.modes.map((m) => m.fromXof));
}
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

  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState<string>("all");
  const [mode, setMode] = useState<"all" | TransportMode>("all");
  const [city, setCity] = useState<string>("all");
  const [payment, setPayment] = useState<"all" | "upfront" | "on_arrival">("all");
  const [minRating, setMinRating] = useState(0);
  const [certifiedOnly, setCertifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("rating");
  const [open, setOpen] = useState<string | null>(null);

  const specialties = useMemo(
    () => Array.from(new Set(all.flatMap((t) => t.specialties))).sort((a, b) => a.localeCompare(b)),
    [all],
  );
  const cities = useMemo(
    () => Array.from(new Set(all.map((t) => t.city))).sort((a, b) => a.localeCompare(b)),
    [all],
  );

  const filtered = useMemo(() => {
    const list = all.filter((t) => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        if (
          !t.name.toLowerCase().includes(q) &&
          !t.city.toLowerCase().includes(q) &&
          !t.about.toLowerCase().includes(q) &&
          !t.specialties.some((s) => s.toLowerCase().includes(q))
        )
          return false;
      }
      if (specialty !== "all" && !t.specialties.includes(specialty)) return false;
      if (mode !== "all" && !t.modes.some((m) => m.mode === mode)) return false;
      if (city !== "all" && t.city !== city) return false;
      if (payment !== "all" && t.paymentPolicy !== payment) return false;
      if (certifiedOnly && t.status !== "certified") return false;
      if (t.rating < minRating) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "reviews":
          return b.reviewsCount - a.reviewsCount;
        case "ontime":
          return (b.onTimePct ?? 0) - (a.onTimePct ?? 0);
        case "price":
          return minPrice(a) - minPrice(b);
        case "fastest":
          return minDelayDays(a) - minDelayDays(b);
        case "rating":
        default:
          return b.rating - a.rating;
      }
    });
  }, [all, search, specialty, mode, city, payment, certifiedOnly, minRating, sortBy]);

  const filtersActive =
    search.trim() !== "" ||
    specialty !== "all" ||
    mode !== "all" ||
    city !== "all" ||
    payment !== "all" ||
    certifiedOnly ||
    minRating > 0;

  function reset() {
    setSearch("");
    setSpecialty("all");
    setMode("all");
    setCity("all");
    setPayment("all");
    setMinRating(0);
    setCertifiedOnly(false);
  }

  const ratingOptions = [
    { v: 0, label: "Toutes les notes" },
    { v: 4.0, label: "4,0 et +" },
    { v: 4.5, label: "4,5 et +" },
    { v: 4.8, label: "4,8 et +" },
  ];

  return (
    <div className="min-h-full bg-paper">
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
              <Users className="h-4 w-4 text-kamoo-orange-400" /> +1 250 transitaires référencés
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
          <div className="relative min-w-[180px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              placeholder="Rechercher un transitaire, une ville, une spécialité…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-line bg-paper-2/40 pl-9 pr-3 text-[12.5px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600 focus:bg-white"
            />
          </div>

          <Select id="spec" icon={Tag} label="Spécialité" value={specialty === "all" ? null : specialty} open={open} setOpen={setOpen}>
            <Opt active={specialty === "all"} onClick={() => { setSpecialty("all"); setOpen(null); }}>Toutes les spécialités</Opt>
            <div className="my-1 h-px bg-line" />
            {specialties.map((s) => (
              <Opt key={s} active={specialty === s} onClick={() => { setSpecialty(s); setOpen(null); }}>{s}</Opt>
            ))}
          </Select>

          <Select id="mode" icon={Ship} label="Mode" value={mode === "all" ? null : TRANSPORT_MODE_LABELS[mode]} open={open} setOpen={setOpen}>
            <Opt active={mode === "all"} onClick={() => { setMode("all"); setOpen(null); }}>Tous les modes</Opt>
            <div className="my-1 h-px bg-line" />
            {MODES.map((m) => (
              <Opt key={m} active={mode === m} onClick={() => { setMode(m); setOpen(null); }}>{TRANSPORT_MODE_LABELS[m]}</Opt>
            ))}
          </Select>

          <Select id="city" icon={MapPin} label="Hub Chine" value={city === "all" ? null : city} open={open} setOpen={setOpen}>
            <Opt active={city === "all"} onClick={() => { setCity("all"); setOpen(null); }}>Tous les hubs</Opt>
            <div className="my-1 h-px bg-line" />
            {cities.map((c) => (
              <Opt key={c} active={city === c} onClick={() => { setCity(c); setOpen(null); }}>{c}</Opt>
            ))}
          </Select>

          <Select id="pay" icon={Wallet} label="Paiement" value={payment === "all" ? null : payment === "upfront" ? "À l'avance" : "À l'arrivée"} open={open} setOpen={setOpen}>
            <Opt active={payment === "all"} onClick={() => { setPayment("all"); setOpen(null); }}>Toutes modalités</Opt>
            <div className="my-1 h-px bg-line" />
            <Opt active={payment === "on_arrival"} onClick={() => { setPayment("on_arrival"); setOpen(null); }}>Paiement à l&apos;arrivée</Opt>
            <Opt active={payment === "upfront"} onClick={() => { setPayment("upfront"); setOpen(null); }}>Paiement à l&apos;avance</Opt>
          </Select>

          <Select id="note" icon={Star} label="Note" value={minRating === 0 ? null : `${minRating.toString().replace(".", ",")}+`} open={open} setOpen={setOpen}>
            {ratingOptions.map((o) => (
              <Opt key={o.v} active={minRating === o.v} onClick={() => { setMinRating(o.v); setOpen(null); }}>{o.label}</Opt>
            ))}
          </Select>

          <button
            onClick={() => setCertifiedOnly((v) => !v)}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-[12.5px] font-medium transition",
              certifiedOnly
                ? "border-kamoo-orange-300 bg-kamoo-orange-50 text-kamoo-orange-700"
                : "border-line bg-white text-ink-700 hover:bg-paper-2",
            )}
          >
            <BadgeCheck className="h-3.5 w-3.5" />
            Certifié
            {certifiedOnly && <Check className="h-3 w-3" />}
          </button>

          {filtersActive && (
            <button
              onClick={reset}
              className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg px-2.5 text-[12.5px] font-semibold text-kamoo-orange-600 transition hover:bg-kamoo-orange-50"
            >
              <X className="h-3.5 w-3.5" />
              Effacer
            </button>
          )}
        </div>

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
              <TransitaireCard key={t.id} transitaire={t} />
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

        {/* BANDEAU DE CONFIANCE */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 rounded-xl border border-line bg-white px-6 py-4 text-[12.5px] font-medium text-ink-600">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" /> Paiements sécurisés via Kamoo
          </span>
          <span className="inline-flex items-center gap-2">
            <Scale className="h-4 w-4 text-kamoo-blue-700" /> Litiges traités par notre équipe
          </span>
          <span className="inline-flex items-center gap-2">
            <Headphones className="h-4 w-4 text-kamoo-orange-500" /> Service client dédié 7j/7
          </span>
        </div>
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
