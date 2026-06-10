"use client";

import { Star, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Modale « Tous les avis » — générique pour transitaires, closeuses et
 * livreurs. V1 : affiche les avis chargés (mock) ; le compteur total vient
 * du profil. V2 : pagination serveur.
 */

export type GenericReview = {
  authorName: string;
  authorCity?: string;
  rating: number;
  comment: string;
  /** Date affichable (déjà formatée ou ISO) */
  date: string;
  avatarBg?: string;
};

export function ReviewsModal({
  partnerName,
  rating,
  reviewsCount,
  reviews,
  onClose,
}: {
  partnerName: string;
  rating: number;
  reviewsCount: number;
  reviews: GenericReview[];
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-kamoo-blue-900/30 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div>
            <h2 className="text-[15px] font-bold text-ink-900">Avis sur {partnerName}</h2>
            <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-ink-500">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <b className="text-ink-900">{rating}</b> · {reviewsCount} avis au total
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-lg text-ink-400 transition hover:bg-paper-2 hover:text-ink-900"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-3">
            {reviews.map((r, i) => (
              <div key={i} className="rounded-xl border border-line bg-paper-2/30 p-3.5">
                <div className="flex items-center gap-2.5">
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white"
                    style={{ background: r.avatarBg ?? "linear-gradient(135deg,#0F2A52,#1E4D8C)" }}
                  >
                    {r.authorName.split(" ").map((n) => n.charAt(0)).slice(0, 2).join("")}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-bold text-ink-900">{r.authorName}</div>
                    {r.authorCity && <div className="text-[10.5px] text-ink-500">{r.authorCity}</div>}
                  </div>
                  <div className="ml-auto flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, k) => (
                      <Star key={k} className={cn("h-3 w-3", k < r.rating ? "fill-amber-400 text-amber-400" : "text-ink-200")} />
                    ))}
                  </div>
                </div>
                <p className="mt-2 text-[12.5px] leading-relaxed text-ink-700">{r.comment}</p>
                <div className="mt-1.5 text-[10.5px] text-ink-400">{r.date}</div>
              </div>
            ))}
          </div>
          {reviewsCount > reviews.length && (
            <p className="mt-3 text-center text-[11.5px] text-ink-400">
              {reviews.length} avis affichés sur {reviewsCount} — les autres seront chargés au fil de l&apos;eau.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
