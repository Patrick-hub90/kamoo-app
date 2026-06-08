"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  Grid2x2,
  Headphones,
  LifeBuoy,
  List,
  Search,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";
import { CloseuseCard } from "@/components/kamoo/closeuse-card";
import { MOCK_CLOSEUSES, isTopPerformer } from "@/lib/data/mock-closeuses";
import { CLOSEUSE_SKILLS, type Closeuse } from "@/lib/types/closeuse";
import { cn } from "@/lib/utils";

const COUNTRY: Record<string, string> = { SN: "Sénégal", CI: "Côte d'Ivoire", CM: "Cameroun" };
const fmt = (n: number) => n.toLocaleString("fr-FR");
function respLabel(min: number) {
  return min <= 60 ? "< 1h" : `< ${Math.ceil(min / 60)}h`;
}

type SortKey = "rating" | "commission_asc" | "conversion" | "orders";
const SORT_LABELS: Record<SortKey, string> = {
  rating: "Note (décroissante)",
  conversion: "Meilleure conversion",
  commission_asc: "Commission la plus basse",
  orders: "Plus expérimentées",
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
  const [skills, setSkills] = useState<string[]>([]);
  const [availableNow, setAvailableNow] = useState(false);
  const [maxCommission, setMaxCommission] = useState(2500);
  const [minRating, setMinRating] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>("rating");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [pageSize, setPageSize] = useState(8);
  const [page, setPage] = useState(1);
  const [shortlist, setShortlist] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const toggle = (arr: string[], v: string, set: (x: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const count = (pred: (c: Closeuse) => boolean) => all.filter(pred).length;

  const filtered = useMemo(() => {
    const list = all.filter((c) => {
      if (country !== "all" && c.countryCode !== country) return false;
      if (lang !== "all" && !c.languages.some((l) => l.code === lang)) return false;
      if (skills.length && !skills.some((s) => c.skills?.includes(s))) return false;
      if (availableNow && !c.availableNow) return false;
      if (c.commissionXof > maxCommission) return false;
      if (c.rating < minRating) return false;
      if (badges.length) {
        const ok = badges.some(
          (b) =>
            (b === "verified" && c.status === "certified") ||
            (b === "new" && c.status === "new") ||
            (b === "top" && isTopPerformer(c)),
        );
        if (!ok) return false;
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
  }, [all, country, lang, skills, availableNow, maxCommission, minRating, badges, search, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const shown = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const avgRating = (all.reduce((s, c) => s + c.rating, 0) / all.length).toFixed(1).replace(".", ",");

  const filtersActive =
    !!search || country !== "all" || lang !== "all" || skills.length > 0 || availableNow || maxCommission < 2500 || minRating > 0 || badges.length > 0;

  function reset() {
    setSearch(""); setCountry("all"); setLang("all"); setSkills([]); setAvailableNow(false);
    setMaxCommission(2500); setMinRating(0); setBadges([]); setPage(1);
  }

  // Chips de filtres actifs
  const chips: { label: string; clear: () => void }[] = [];
  if (country !== "all") chips.push({ label: COUNTRY[country] ?? country, clear: () => setCountry("all") });
  if (lang !== "all") chips.push({ label: languages.find((l) => l.code === lang)?.name ?? lang, clear: () => setLang("all") });
  skills.forEach((s) => chips.push({ label: s, clear: () => setSkills(skills.filter((x) => x !== s)) }));
  if (availableNow) chips.push({ label: "Disponible maintenant", clear: () => setAvailableNow(false) });
  if (minRating > 0) chips.push({ label: `Note ${minRating.toString().replace(".", ",")}+`, clear: () => setMinRating(0) });
  if (maxCommission < 2500) chips.push({ label: `≤ ${fmt(maxCommission)} FCFA`, clear: () => setMaxCommission(2500) });
  badges.forEach((b) => chips.push({ label: b === "verified" ? "Vérifié" : b === "top" ? "Top performer" : "Nouveau", clear: () => setBadges(badges.filter((x) => x !== b)) }));

  const shortlisted = shortlist.map((s) => all.find((c) => c.slug === s)).filter(Boolean) as Closeuse[];

  return (
    <div className="min-h-full bg-paper">
      {/* HERO */}
      <section className="border-b border-line bg-gradient-to-br from-white via-kamoo-blue-50/40 to-paper">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-6 px-6 py-9">
          <div className="max-w-xl">
            <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-ink-900">
              Trouvez la closeuse idéale pour vos ventes
            </h1>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-500">
              Comparez des closeuses vérifiées par Kamoo selon la langue, l&apos;expérience, la performance, la disponibilité et le tarif.
            </p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[12.5px] font-medium text-ink-600">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-kamoo-orange-500" /> Profils vérifiés</span>
              <span className="inline-flex items-center gap-1.5"><Star className="h-4 w-4 text-kamoo-orange-500" /> Avis clients authentiques</span>
              <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-kamoo-orange-500" /> Réponse rapide</span>
            </div>
          </div>
          <div className="flex gap-3">
            <HeroStat icon={BadgeCheck} tone="text-kamoo-blue-700 bg-kamoo-blue-50" value={String(count((c) => c.status === "certified"))} label="closeuses vérifiées" sub="Prêtes à travailler" />
            <HeroStat icon={Star} tone="text-amber-600 bg-amber-50" value={`${avgRating}/5`} label="Note moyenne" sub={`Basée sur ${fmt(all.reduce((s, c) => s + c.reviewsCount, 0))} avis`} />
            <HeroStat icon={Globe} tone="text-emerald-600 bg-emerald-50" value={String(countries.length)} label="pays couverts" sub={countries.map((c) => COUNTRY[c]).join(", ")} />
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-[1400px] items-start gap-5 px-6 py-6">
        {/* ─── RAIL DE FILTRES ─── */}
        <aside className="hidden w-[230px] shrink-0 lg:block">
          <div className="sticky top-6 rounded-2xl border border-line bg-white p-4 shadow-kamoo-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[14px] font-bold text-ink-900">Filtres</h2>
              {filtersActive && (
                <button onClick={reset} className="text-[11.5px] font-semibold text-kamoo-orange-600 hover:underline">Réinitialiser</button>
              )}
            </div>

            <FilterGroup label="Pays">
              <select value={country} onChange={(e) => { setCountry(e.target.value); setPage(1); }} className="h-9 w-full rounded-lg border border-line bg-white px-2.5 text-[12.5px] text-ink-800 outline-none focus:border-kamoo-blue-600">
                <option value="all">Tous les pays</option>
                {countries.map((c) => <option key={c} value={c}>{COUNTRY[c] ?? c}</option>)}
              </select>
            </FilterGroup>

            <FilterGroup label="Langues parlées">
              <select value={lang} onChange={(e) => { setLang(e.target.value); setPage(1); }} className="h-9 w-full rounded-lg border border-line bg-white px-2.5 text-[12.5px] text-ink-800 outline-none focus:border-kamoo-blue-600">
                <option value="all">Toutes les langues</option>
                {languages.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
              </select>
            </FilterGroup>

            <FilterGroup label="Spécialités">
              <div className="flex flex-col gap-1.5">
                {CLOSEUSE_SKILLS.map((s) => (
                  <CheckRow key={s} checked={skills.includes(s)} onChange={() => { toggle(skills, s, setSkills); setPage(1); }} label={s} count={count((c) => !!c.skills?.includes(s))} />
                ))}
              </div>
            </FilterGroup>

            <FilterGroup label="Disponibilité">
              <CheckRow checked={availableNow} onChange={() => { setAvailableNow(!availableNow); setPage(1); }} label="Disponible maintenant" count={count((c) => !!c.availableNow)} />
            </FilterGroup>

            <FilterGroup label="Commission max">
              <input type="range" min={1000} max={2500} step={100} value={maxCommission} onChange={(e) => { setMaxCommission(Number(e.target.value)); setPage(1); }} className="w-full accent-kamoo-blue-700" />
              <div className="mt-1 flex justify-between text-[11px] text-ink-500">
                <span>1 000 F</span>
                <span className="font-semibold text-ink-800">≤ {fmt(maxCommission)} F</span>
              </div>
            </FilterGroup>

            <FilterGroup label="Note minimum">
              <div className="flex gap-1.5">
                {[4, 4.5, 4.8].map((r) => (
                  <button
                    key={r}
                    onClick={() => { setMinRating(minRating === r ? 0 : r); setPage(1); }}
                    className={cn(
                      "inline-flex flex-1 items-center justify-center gap-1 rounded-lg border px-1 py-1.5 text-[12px] font-semibold transition",
                      minRating === r ? "border-kamoo-blue-300 bg-kamoo-blue-50 text-kamoo-blue-800" : "border-line text-ink-600 hover:bg-paper-2",
                    )}
                  >
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />{r.toString().replace(".", ",")}+
                  </button>
                ))}
              </div>
            </FilterGroup>

            <FilterGroup label="Badges" last>
              <div className="flex flex-col gap-1.5">
                <CheckRow checked={badges.includes("verified")} onChange={() => { toggle(badges, "verified", setBadges); setPage(1); }} label="Vérifié" count={count((c) => c.status === "certified")} />
                <CheckRow checked={badges.includes("top")} onChange={() => { toggle(badges, "top", setBadges); setPage(1); }} label="Top performer" count={count((c) => isTopPerformer(c))} />
                <CheckRow checked={badges.includes("new")} onChange={() => { toggle(badges, "new", setBadges); setPage(1); }} label="Nouveau" count={count((c) => c.status === "new")} />
              </div>
            </FilterGroup>
          </div>
        </aside>

        {/* ─── COLONNE CENTRALE ─── */}
        <main className="min-w-0 flex-1">
          {/* Top bar */}
          <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-line bg-white p-2 shadow-kamoo-sm">
            <div className="relative min-w-[180px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
              <input
                type="search"
                placeholder="Rechercher une closeuse, ville, compétence…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="h-9 w-full rounded-lg border border-line bg-paper-2/40 pl-9 pr-3 text-[12.5px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600 focus:bg-white"
              />
            </div>
            <label className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 text-[12.5px] text-ink-700">
              <span className="text-ink-500">Trier&nbsp;:</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)} className="bg-transparent font-semibold text-ink-900 outline-none">
                {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => <option key={k} value={k}>{SORT_LABELS[k]}</option>)}
              </select>
            </label>
            <div className="flex items-center rounded-lg border border-line bg-white p-0.5">
              <button onClick={() => setView("grid")} className={cn("grid h-8 w-8 place-items-center rounded-md transition", view === "grid" ? "bg-kamoo-blue-50 text-kamoo-blue-700" : "text-ink-400 hover:bg-paper-2")}><Grid2x2 className="h-4 w-4" /></button>
              <button onClick={() => setView("list")} className={cn("grid h-8 w-8 place-items-center rounded-md transition", view === "list" ? "bg-kamoo-blue-50 text-kamoo-blue-700" : "text-ink-400 hover:bg-paper-2")}><List className="h-4 w-4" /></button>
            </div>
            <button
              onClick={() => shortlist.length && setCompareOpen(true)}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold transition",
                shortlist.length ? "bg-kamoo-blue-900 text-white hover:bg-kamoo-blue-800" : "cursor-not-allowed bg-paper-2 text-ink-400",
              )}
            >
              Comparer ({shortlist.length})
            </button>
          </div>

          {/* Chips */}
          {chips.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[12px] font-semibold text-ink-500">Filtres actifs :</span>
              {chips.map((ch, i) => (
                <button key={i} onClick={ch.clear} className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-2.5 py-1 text-[11.5px] font-medium text-ink-700 transition hover:bg-paper-2">
                  {ch.label}
                  <X className="h-3 w-3 text-ink-400" />
                </button>
              ))}
              <button onClick={reset} className="ml-auto text-[12px] font-semibold text-kamoo-blue-700 hover:underline">Tout effacer</button>
            </div>
          )}

          {/* Grille */}
          {shown.length > 0 ? (
            <div className={cn("mt-4 grid gap-4", view === "grid" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
              {shown.map((c) => (
                <CloseuseCard key={c.slug} closeuse={c} selected={shortlist.includes(c.slug)} onToggle={() => toggle(shortlist, c.slug, setShortlist)} />
              ))}
            </div>
          ) : (
            <div className="mt-4 grid place-items-center rounded-xl border border-dashed border-line bg-white py-16 text-center">
              <Search className="h-8 w-8 text-ink-300" />
              <p className="mt-3 text-[14px] font-semibold text-ink-700">Aucune closeuse ne correspond</p>
              <button onClick={reset} className="mt-4 rounded-lg bg-kamoo-blue-900 px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-kamoo-blue-800">Réinitialiser les filtres</button>
            </div>
          )}

          {/* Pagination */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-[12px] text-ink-500">
            <span>
              Affichage {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} sur {filtered.length} closeuse{filtered.length > 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <button disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} className="grid h-8 w-8 place-items-center rounded-md border border-line bg-white text-ink-500 transition hover:bg-paper-2 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)} className={cn("grid h-8 min-w-8 place-items-center rounded-md px-2 text-[12px] font-semibold transition", safePage === i + 1 ? "bg-kamoo-blue-900 text-white" : "border border-line bg-white text-ink-600 hover:bg-paper-2")}>{i + 1}</button>
                ))}
                <button disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} className="grid h-8 w-8 place-items-center rounded-md border border-line bg-white text-ink-500 transition hover:bg-paper-2 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
              </div>
              <label className="inline-flex items-center gap-1.5">
                Par page
                <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="h-8 rounded-md border border-line bg-white px-1.5 font-semibold text-ink-800 outline-none">
                  {[8, 16, 24].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
            </div>
          </div>
        </main>

        {/* ─── COLONNE DROITE ─── */}
        <aside className="hidden w-[270px] shrink-0 xl:block">
          <div className="sticky top-6 flex flex-col gap-4">
            {/* Shortlist */}
            <div className="rounded-2xl border border-line bg-white p-4 shadow-kamoo-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[13px] font-bold text-ink-900">Ma shortlist</h3>
                <span className="rounded-full bg-kamoo-blue-50 px-2 py-0.5 text-[11px] font-bold text-kamoo-blue-700">{shortlist.length}</span>
              </div>
              {shortlisted.length === 0 ? (
                <p className="text-[12px] leading-relaxed text-ink-400">Cochez « Comparer » sur les profils pour les ajouter ici.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {shortlisted.map((c) => (
                    <div key={c.slug} className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.photoUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12px] font-semibold text-ink-900">{c.name}</div>
                        <div className="inline-flex items-center gap-0.5 text-[10.5px] text-ink-500"><Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />{c.rating}</div>
                      </div>
                      <button onClick={() => setShortlist(shortlist.filter((s) => s !== c.slug))} className="text-ink-300 transition hover:text-ink-700"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                  <button onClick={() => setCompareOpen(true)} className="mt-2 w-full rounded-lg border border-kamoo-blue-200 bg-kamoo-blue-50 py-2 text-[12.5px] font-semibold text-kamoo-blue-800 transition hover:bg-kamoo-blue-100">Comparer ({shortlist.length})</button>
                  <button onClick={() => setShortlist([])} className="text-[11.5px] font-medium text-ink-400 hover:text-ink-700">Vider la shortlist</button>
                </div>
              )}
            </div>

            {/* Aide */}
            <div className="rounded-2xl border border-line bg-white p-4 shadow-kamoo-sm">
              <h3 className="text-[13px] font-bold text-ink-900">Besoin d&apos;aide ?</h3>
              <p className="mt-1.5 text-[12px] leading-relaxed text-ink-500">Notre équipe vous aide à trouver la closeuse idéale.</p>
              <button className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-kamoo-blue-200 py-2 text-[12.5px] font-semibold text-kamoo-blue-800 transition hover:bg-kamoo-blue-50">
                <LifeBuoy className="h-4 w-4" /> Demander conseil
              </button>
              <p className="mt-2 text-center text-[10.5px] text-ink-400">Réponse sous 24h</p>
            </div>

            {/* Confiance */}
            <div className="rounded-2xl border border-line bg-white p-4 text-[12px] shadow-kamoo-sm">
              <Trust icon={ShieldCheck} tone="text-emerald-600" title="Paiement sécurisé" sub="Transactions protégées par Kamoo" />
              <Trust icon={BadgeCheck} tone="text-kamoo-blue-700" title="Satisfaction garantie" sub="Remplacement gratuit si non satisfait" />
              <Trust icon={Headphones} tone="text-kamoo-orange-500" title="Support réactif" sub="Nous vous accompagnons à chaque étape" last />
            </div>
          </div>
        </aside>
      </div>

      {/* MODALE COMPARER */}
      {compareOpen && (
        <CompareModal closeuses={shortlisted} onClose={() => setCompareOpen(false)} />
      )}
    </div>
  );
}

/* ─── Sous-composants ─────────────────────────────────────────── */
function HeroStat({
  icon: Icon, tone, value, label, sub,
}: { icon: React.ComponentType<{ className?: string }>; tone: string; value: string; label: string; sub: string }) {
  return (
    <div className="flex w-[170px] items-start gap-3 rounded-xl border border-line bg-white/70 px-3 py-3 backdrop-blur">
      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full", tone)}><Icon className="h-4 w-4" /></span>
      <div className="min-w-0">
        <div className="text-[18px] font-extrabold leading-tight tabular-nums text-ink-900">{value}</div>
        <div className="text-[11.5px] font-semibold text-ink-700">{label}</div>
        <div className="truncate text-[10px] text-ink-400">{sub}</div>
      </div>
    </div>
  );
}

function FilterGroup({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={cn("py-3", !last && "border-b border-line")}>
      <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-400">{label}</div>
      {children}
    </div>
  );
}

function CheckRow({ checked, onChange, label, count }: { checked: boolean; onChange: () => void; label: string; count: number }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[12.5px] text-ink-700">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded border-line accent-kamoo-blue-700" />
      <span className="flex-1">{label}</span>
      <span className="text-[11px] tabular-nums text-ink-400">{count}</span>
    </label>
  );
}

function Trust({ icon: Icon, tone, title, sub, last }: { icon: React.ComponentType<{ className?: string }>; tone: string; title: string; sub: string; last?: boolean }) {
  return (
    <div className={cn("flex items-start gap-2.5 py-2.5", !last && "border-b border-line")}>
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", tone)} />
      <div>
        <div className="text-[12px] font-semibold text-ink-900">{title}</div>
        <div className="text-[10.5px] text-ink-500">{sub}</div>
      </div>
    </div>
  );
}

function CompareModal({ closeuses, onClose }: { closeuses: Closeuse[]; onClose: () => void }) {
  const rows: { label: string; render: (c: Closeuse) => React.ReactNode }[] = [
    { label: "Note", render: (c) => <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /><b>{c.rating}</b> <span className="text-ink-400">({c.reviewsCount})</span></span> },
    { label: "Conversion", render: (c) => <b className="text-emerald-700">{c.kpi.confirmationRate}%</b> },
    { label: "Réponse", render: (c) => respLabel(c.kpi.avgResponseMin) },
    { label: "Cmdes traitées", render: (c) => fmt(c.kpi.ordersHandled) },
    { label: "Commission", render: (c) => `${fmt(c.commissionXof)} F` },
    { label: "Langues", render: (c) => c.languages.map((l) => l.name).join(", ") },
    { label: "Disponibilité", render: (c) => (c.availableNow ? <span className="text-emerald-600">Disponible</span> : "Sur réservation") },
    { label: "Statut", render: (c) => (isTopPerformer(c) ? "Top performer" : c.status === "certified" ? "Vérifiée" : "Nouveau") },
  ];
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-3xl overflow-auto rounded-2xl border border-line bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between border-b border-line bg-white px-5 py-3.5">
          <h2 className="text-[15px] font-bold text-ink-900">Comparer {closeuses.length} closeuse{closeuses.length > 1 ? "s" : ""}</h2>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-lg text-ink-400 hover:bg-paper-2 hover:text-ink-900"><X className="h-4 w-4" /></button>
        </div>
        <div className="overflow-x-auto p-5">
          <table className="w-full min-w-[480px] text-[12.5px]">
            <thead>
              <tr>
                <th className="w-28" />
                {closeuses.map((c) => (
                  <th key={c.slug} className="px-2 pb-3 text-center align-bottom">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.photoUrl} alt="" className="mx-auto h-12 w-12 rounded-full object-cover" />
                    <div className="mt-1.5 text-[12px] font-bold text-ink-900">{c.name}</div>
                    <div className="text-[10.5px] text-ink-500">{c.city}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.label}>
                  <td className="py-2.5 pr-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400">{r.label}</td>
                  {closeuses.map((c) => (
                    <td key={c.slug} className="px-2 py-2.5 text-center text-ink-800">{r.render(c)}</td>
                  ))}
                </tr>
              ))}
              <tr>
                <td />
                {closeuses.map((c) => (
                  <td key={c.slug} className="px-2 pt-3 text-center">
                    <Link href={`/marketplace/closeurs/${c.slug}`} className="inline-block rounded-lg bg-kamoo-blue-900 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-kamoo-blue-800">Voir</Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
