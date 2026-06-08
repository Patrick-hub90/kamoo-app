import {
  BadgeCheck,
  ChevronDown,
  Clock,
  Headphones,
  MapPin,
  Scale,
  Search,
  ShieldCheck,
  Ship,
  SlidersHorizontal,
  Star,
  Tag,
  Users,
} from "lucide-react";
import { TransitaireCard } from "@/components/kamoo/transitaire-card";
import { MOCK_TRANSITAIRES } from "@/lib/data/mock-transitaires";

const FILTERS: { icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { icon: MapPin, label: "Ville" },
  { icon: Tag, label: "Spécialité" },
  { icon: Ship, label: "Mode" },
  { icon: BadgeCheck, label: "Certifié" },
  { icon: Star, label: "Note" },
  { icon: Clock, label: "Délais" },
];

export default function MarketplaceTransitairesPage() {
  const list = MOCK_TRANSITAIRES;

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
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              placeholder="Rechercher un transitaire, une ville, une spécialité…"
              className="h-9 w-full rounded-lg border border-line bg-paper-2/40 pl-9 pr-3 text-[12.5px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600 focus:bg-white"
            />
          </div>
          {FILTERS.map((f) => (
            <button
              key={f.label}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 text-[12.5px] font-medium text-ink-700 transition hover:bg-paper-2"
            >
              <f.icon className="h-3.5 w-3.5 text-ink-400" />
              {f.label}
              <ChevronDown className="h-3 w-3 text-ink-400" />
            </button>
          ))}
          <button className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] font-semibold text-kamoo-blue-700 transition hover:bg-kamoo-blue-50">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Plus de filtres
          </button>
        </div>

        {/* COMPTEUR + TRI */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-[13px] text-ink-600">
            <b className="text-ink-900">1 243</b> transitaires trouvés
          </div>
          <div className="flex items-center gap-2 text-[12.5px] text-ink-500">
            Trier par
            <button className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 font-semibold text-ink-900 transition hover:bg-paper-2">
              Meilleure note
              <ChevronDown className="h-3.5 w-3.5 text-ink-400" />
            </button>
          </div>
        </div>

        {/* GRILLE */}
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((t) => (
            <TransitaireCard key={t.id} transitaire={t} />
          ))}
        </div>

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
