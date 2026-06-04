import Link from "next/link";
import { ArrowRight, BadgeCheck, MapPin, Sparkles, Star } from "lucide-react";
import type { Livreur } from "@/lib/types/livreur";

type Props = {
  livreur: Livreur;
};

/**
 * Card livreur — épurée, scannable en 1s.
 * 3 infos prioritaires (selon l'usage vendeur) :
 *   1. Note + nb d'avis            (réputation)
 *   2. Régions / zones desservies  (couverture — info clé pour livraison)
 *   3. Marge de prix               (combien ça va me coûter)
 *
 * Tout le reste (dispo, grille tarifaire détaillée, description, type
 * agence/perso, partenariats, avis) est sur la page profil.
 */
export function LivreurCard({ livreur: l }: Props) {
  const prices = l.zones.map((z) => z.priceXof);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  // Aperçu des zones : 3 premières + count des autres
  const previewZones = l.zones.slice(0, 3).map((z) => z.name);
  const extraZones = l.zones.length - previewZones.length;

  return (
    <Link
      href={`/marketplace/livreurs/${l.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:border-ink-300 hover:shadow-[var(--shadow-kamoo-md)]"
    >
      {/* Bannière + badge statut */}
      <div className="relative">
        <div
          className="h-24 w-full"
          style={!l.coverImageUrl ? { background: l.coverBg } : undefined}
        >
          {l.coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={l.coverImageUrl}
              alt={`${l.name} - bannière`}
              className="h-full w-full object-cover"
            />
          )}
        </div>

        {l.status === "new" ? (
          <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-kamoo-blue-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
            <Sparkles className="h-2.5 w-2.5" />
            Nouveau
          </span>
        ) : (
          <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-kamoo-orange-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
            <BadgeCheck className="h-2.5 w-2.5" />
            Certifié
          </span>
        )}

        {/* Photo / Logo overlay */}
        <div
          className="absolute left-4 top-[60px] z-20 grid h-16 w-16 place-items-center overflow-hidden rounded-full border-[3px] border-white text-base font-extrabold text-white shadow-md"
          style={!l.photoUrl ? { background: l.avatarBg } : undefined}
        >
          {l.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={l.photoUrl}
              alt={l.name}
              className="h-full w-full object-cover"
            />
          ) : (
            l.initials
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-2">
        {/* Note alignée à droite (la photo prend la gauche) */}
        <div className="flex h-7 items-start justify-end">
          <div className="flex items-center gap-1 text-[12px]">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="font-bold text-ink-900">{l.rating}</span>
            <span className="text-ink-500">({l.reviewsCount} avis)</span>
          </div>
        </div>

        {/* Nom + ville */}
        <div className="mt-1">
          <h3 className="font-display truncate text-[17px] font-extrabold leading-tight text-ink-900">
            {l.name}
          </h3>
          <div className="mt-0.5 flex items-center gap-1 text-[12px] text-ink-500">
            <MapPin className="h-3 w-3" />
            {l.city}
          </div>
        </div>

        {/* RÉGIONS DESSERVIES — info clé */}
        <div className="mt-5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
            {l.zones.length} zone{l.zones.length > 1 ? "s" : ""} desservie
            {l.zones.length > 1 ? "s" : ""}
          </div>
          <div className="mt-1 text-[13px] font-semibold text-ink-700">
            {previewZones.join(" · ")}
            {extraZones > 0 && (
              <span className="text-ink-500"> +{extraZones}</span>
            )}
          </div>
        </div>

        {/* Footer : marge de prix + CTA */}
        <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
          <span className="font-display text-[15px] font-extrabold leading-none text-ink-900">
            {minPrice.toLocaleString("fr-FR")} – {maxPrice.toLocaleString("fr-FR")}{" "}
            <span className="text-[11px] font-bold text-ink-500">F</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[12px] font-bold text-ink-500 transition group-hover:text-kamoo-blue-700">
            Voir
            <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
