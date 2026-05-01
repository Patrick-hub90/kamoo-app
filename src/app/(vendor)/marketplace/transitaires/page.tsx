import { Search, Sparkles } from "lucide-react";
import { TransitaireCard } from "@/components/kamoo/transitaire-card";
import { MOCK_TRANSITAIRES } from "@/lib/data/mock-transitaires";

export default function MarketplaceTransitairesPage() {
  const list = MOCK_TRANSITAIRES;
  const avgRating = (
    list.reduce((s, t) => s + t.rating, 0) / list.length
  ).toFixed(1);

  return (
    <div className="flex h-full flex-col">
      {/* HEADER */}
      <div className="border-b border-line bg-white px-10 py-6">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-ink-500">
          <Sparkles className="h-3.5 w-3.5 text-kamoo-orange-500" />
          Marketplace
          <span className="text-ink-300">/</span>
          <span className="text-ink-900">Transitaires</span>
        </div>
        <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-ink-900">
          Choisissez votre transitaire
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Comparez les tarifs, délais et politiques de paiement avant de vous
          engager. Tous nos transitaires sont vérifiés par Kamoo.
        </p>
      </div>

      {/* BARRE DE FILTRES */}
      <div className="border-b border-line bg-paper-2/60 px-10 py-3">
        <div className="flex items-center gap-3">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              placeholder="Nom du transitaire ou ville…"
              className="h-9 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-[13px] outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600"
            />
          </div>
          <button className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-white px-3 text-[13px] font-semibold text-ink-900 hover:border-ink-300">
            <span className="text-ink-500">Spécialité :</span> Toutes
          </button>
          <button className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-white px-3 text-[13px] font-semibold text-ink-900 hover:border-ink-300">
            <span className="text-ink-500">Tri :</span> ★ Note
          </button>
          <div className="flex-1" />
          <div className="text-[12px] font-semibold text-ink-500">
            {list.length} transitaires · note moyenne ★ {avgRating}
          </div>
        </div>
      </div>

      {/* GRILLE */}
      <div className="flex-1 overflow-y-auto px-10 py-6">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
          {list.map((t) => (
            <TransitaireCard key={t.id} transitaire={t} />
          ))}
        </div>
      </div>
    </div>
  );
}
