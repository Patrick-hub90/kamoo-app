"use client";

import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Check,
  ChevronDown,
  Clock,
  Crown,
  Globe,
  Headphones,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
} from "lucide-react";
import { CloseuseCard } from "@/components/kamoo/closeuse-card";
import { MOCK_CLOSEUSES, isTopPerformer } from "@/lib/data/mock-closeuses";
import { CLOSEUSE_SKILLS, type Closeuse } from "@/lib/types/closeuse";
import { cn } from "@/lib/utils";

const COUNTRY: Record<string, string> = { SN: "Sénégal", CI: "Côte d'Ivoire", CM: "Cameroun" };
const fmt = (n: number) => n.toLocaleString("fr-FR");

type SortKey = "rating" | "conversion" | "commission_asc" | "orders";
const SORT_LABELS: Record<SortKey, string> = {
  rating: "Meilleure note",
  conversion: "Meilleure conversion",
  commission_asc: "Commission la plus basse",
  orders: "Plus expérimentées",
};

type StatusKey = "all" | "verified" | "top" | "new";
const STATUS_LABELS: Record<StatusKey, string> = {
  all: "Tous",
  verified: "Vérifié",
  top: "Top performer",
  new: "Nouveau",
};

export default function MarketplaceCloseursPage() {
  const all = MOCK_CLOSEUSES;

  const languages = useMemo(() => {
    const m = new Map<string, string>();
    all.forEach((c) => c.languages.forEach((l) => m.set(l.code, l.name)));
    return Array.from(m, ([code, name]) => ({ code, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [all]);
  const countries = useMemo(() => Array.from(new Set(all.map((c) => c.countryCode))), [all]);

  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("all");
  const [lang, setLang] = useState("all");
  const [status, setStatus] = useState<StatusKey>("all");
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState<SortKey>("rating");
  const [open, setOpen] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const list = all.filter((c) => {
      if (country !== "all" && c.countryCode !== country) return false;
      if (lang !== "all" && !c.languages.some((l) => l.code === lang)) return false;
      if (minRating > 0 && c.rating < minRating) return false;
      if (status !== "all") {
        if (status === "verified" && c.status !== "certified") return false;
        if (status === "new" && c.status !== "new") return false;
        if (status === "top" && !isTopPerformer(c)) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        if (
          !c.name.toLowerCase().includes(q) &&
          !c.city.toLowerCase().includes(q) &&
          !c.languages.some((l) => l.name.toLowerCase().includes(q)) &&
          !(c.skills ?? []).some((s) => s.toLowerCase().includes(q))
        )
          return false;
      }
      return true;
    });
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "conversion":
          return b.kpi.confirmationRate - a.kpi.confirmationRate;
        case "commission_asc":
          return a.commissionXof - b.commissionXof;
        case "orders":
          return b.kpi.ordersHandled - a.kpi.ordersHandled;
        case "rating":
        default:
          return b.rating - a.rating || b.reviewsCount - a.reviewsCount;
      }
    });
  }, [all, country, lang, status, minRating, search, sortBy]);

  const filtersActive = !!search || country !== "all" || lang !== "all" || status !== "all" || minRating > 0;
  function reset() {
    setSearch(""); setCountry("all"); setLang("all"); setStatus("all"); setMinRating(0);
  }

  return (
    <div className="min-h-full bg-paper">
      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/closeuses/hero-closeuses.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-kamoo-blue-900/95 via-kamoo-blue-900/85 to-kamoo-blue-900/45" />
        <div className="relative mx-auto max-w-[1320px] px-6 py-10">
          <div className="text-[12px] font-semibold uppercase tracking-wider text-white/60">Marketplace · Closeuses</div>
          <h1 className="mt-2 max-w-2xl text-[32px] font-extrabold leading-tight tracking-tight text-white">
            Trouvez la closeuse idéale pour vos ventes
          </h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-white/80">
            Comparez des closeuses vérifiées par Kamoo selon la langue, l&apos;expérience, la performance, la disponibilité et le tarif.
          </p>
          <div className="mt-5 flex flex-wrap gap-x-7 gap-y-2.5 text-[12.5px] font-medium text-white/90">
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-kamoo-orange-400" /> Profils vérifiés par Kamoo</span>
            <span className="inline-flex items-center gap-2"><Star className="h-4 w-4 text-kamoo-orange-400" /> Avis clients authentiques</span>
            <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-kamoo-orange-400" /> Réponse rapide</span>
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
              placeholder="Rechercher une closeuse, une ville, une compétence…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-line bg-paper-2/40 pl-9 pr-3 text-[12.5px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600 focus:bg-white"
            />
          </div>

          <Select id="pays" icon={MapPin} label="Pays" value={country === "all" ? null : COUNTRY[country] ?? country} open={open} setOpen={setOpen}>
            <Opt active={country === "all"} onClick={() => { setCountry("all"); setOpen(null); }}>Tous les pays</Opt>
            <div className="my-1 h-px bg-line" />
            {countries.map((c) => <Opt key={c} active={country === c} onClick={() => { setCountry(c); setOpen(null); }}>{COUNTRY[c] ?? c}</Opt>)}
          </Select>

          <Select id="lang" icon={Globe} label="Langue" value={lang === "all" ? null : languages.find((l) => l.code === lang)?.name ?? null} open={open} setOpen={setOpen}>
            <Opt active={lang === "all"} onClick={() => { setLang("all"); setOpen(null); }}>Toutes les langues</Opt>
            <div className="my-1 h-px bg-line" />
            {languages.map((l) => <Opt key={l.code} active={lang === l.code} onClick={() => { setLang(l.code); setOpen(null); }}>{l.name}</Opt>)}
          </Select>

          <Select id="status" icon={BadgeCheck} label="Statut" value={status === "all" ? null : STATUS_LABELS[status]} open={open} setOpen={setOpen}>
            {(Object.keys(STATUS_LABELS) as StatusKey[]).map((s) => <Opt key={s} active={status === s} onClick={() => { setStatus(s); setOpen(null); }}>{STATUS_LABELS[s]}</Opt>)}
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

          {filtersActive && (
            <button onClick={reset} className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg px-2.5 text-[12.5px] font-semibold text-kamoo-orange-600 transition hover:bg-kamoo-orange-50">
              Effacer
            </button>
          )}
        </div>

        {/* COMPTEUR + TRI */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[13px] text-ink-600">
            <b className="text-ink-900">{filtered.length}</b> closeuse{filtered.length > 1 ? "s" : ""}{filtersActive ? " trouvée" + (filtered.length > 1 ? "s" : "") : " vérifiées"}
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
            {filtered.map((c) => <CloseuseCard key={c.slug} closeuse={c} />)}
          </div>
        ) : (
          <div className="mt-4 grid place-items-center rounded-xl border border-dashed border-line bg-white py-16 text-center">
            <Search className="h-8 w-8 text-ink-300" />
            <p className="mt-3 text-[14px] font-semibold text-ink-700">Aucune closeuse ne correspond</p>
            <button onClick={reset} className="mt-4 rounded-lg bg-kamoo-blue-900 px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-kamoo-blue-800">Réinitialiser les filtres</button>
          </div>
        )}

      </div>
    </div>
  );
}

/* ─── Dropdown générique (même pattern que Transitaires) ──────────── */
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
          <div className={cn("absolute top-[calc(100%+4px)] z-20 max-h-72 w-56 overflow-auto rounded-xl border border-line bg-white p-1 shadow-[var(--shadow-kamoo-lg)]", align === "end" ? "right-0" : "left-0")}>
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
