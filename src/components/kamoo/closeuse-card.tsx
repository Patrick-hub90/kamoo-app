import Link from "next/link";
import { ArrowRight, BadgeCheck, Sparkles, Star } from "lucide-react";
import type { Closeuse } from "@/lib/types/closeuse";
import { formatXOF } from "@/lib/format";

type Props = {
  closeuse: Closeuse;
};

/**
 * Card closeuse — épurée, scannable en 1 seconde.
 * 4 infos seulement :
 *   1. Photo + nom + note   (qui ?)
 *   2. Langues parlées      (peut-elle parler à mes clients ?)
 *   3. Commission           (combien ?)
 *   4. CTA                  (action)
 *
 * Tout le reste (bio, ancienneté, etc.) est sur la page profil.
 */
export function CloseuseCard({ closeuse: c }: Props) {
  return (
    <Link
      href={`/marketplace/closeurs/${c.slug}`}
      className="group flex flex-col rounded-2xl border border-line bg-white p-5 transition hover:border-ink-300 hover:shadow-[var(--shadow-kamoo-md)]"
    >
      {/* Header : avatar + nom + note + badge statut */}
      <div className="flex items-start gap-3">
        <div
          className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full text-base font-extrabold text-white shadow-sm"
          style={!c.photoUrl ? { background: c.avatarBg } : undefined}
        >
          {c.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={c.photoUrl}
              alt={c.name}
              className="h-full w-full object-cover"
            />
          ) : (
            c.initials
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display truncate text-[16px] font-extrabold leading-tight text-ink-900">
            {c.name}
          </h3>
          <div className="mt-1 flex items-center gap-1 text-[12px]">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="font-bold text-ink-900">{c.rating}</span>
            <span className="text-ink-500">({c.reviewsCount} avis)</span>
          </div>
        </div>
        {c.status === "new" ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-kamoo-blue-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            <Sparkles className="h-2.5 w-2.5" />
            Nouveau
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-kamoo-orange-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            <BadgeCheck className="h-2.5 w-2.5" />
            Certifié
          </span>
        )}
      </div>

      {/* Langues parlées — info qualitative clé */}
      <div className="mt-5 text-[13px] font-semibold text-ink-700">
        {c.languages.map((l) => l.name).join(" · ")}
      </div>

      {/* Footer : commission + CTA — séparés visuellement */}
      <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
        <span className="font-display text-[15px] font-extrabold leading-none text-ink-900">
          {formatXOF(c.commissionXof, false)}{" "}
          <span className="text-[11px] font-bold text-ink-500">/ commande</span>
        </span>
        <span className="inline-flex items-center gap-1 text-[12px] font-bold text-ink-500 transition group-hover:text-kamoo-blue-700">
          Voir
          <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
