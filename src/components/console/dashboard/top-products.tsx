"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatXOF } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * TopProducts — liste premium horizontale des produits les plus rentables.
 *
 * Format inspiré directement du brief design (validé user) :
 *  - Heading : petit label uppercase « TOP PRODUITS » + gros titre éditorial
 *  - Chaque ligne : [rang][photo 56px][nom+subline] | CA | Bénéfice | Marge
 *  - Sur desktop : ligne horizontale dense
 *  - Sub-line sous le nom : « 12 commandes · 9 livrées · 75% livré » avec
 *    couleur tone selon le taux (vert ≥70%, orange sinon)
 *
 * Sort par défaut côté data feeder : par BÉNÉFICE descendant (= ce qui
 * rapporte vraiment, pas juste le CA brut qui peut être trompeur si la
 * marge est faible).
 */

export type TopProductRow = {
  /** Emoji du produit (placeholder visuel — V2 : vraie photo via imageUrl) */
  emoji: string;
  /** Background CSS de la photo (gradient ou solid) */
  bg: string;
  /** Nom complet du produit */
  name: string;
  /** Nb commandes livrées sur la période */
  sales: number;
  /** Nb commandes APPELÉES contenant ce produit (cohorte du taux livraison) */
  called: number;
  /** Taux de livraison (sales / called) × 100 */
  tauxLivPct: number;
  /** CA total produit (F CFA) sur la période */
  caXof: number;
  /** Bénéfice net (F CFA) = CA - coût marchandise sur la période */
  beneficeXof: number;
  /** % bénéfice par rapport au CA (0-100) */
  beneficePct: number;
};

type Props = {
  /** Sous-titre éditorial du heading */
  subtitle?: string;
  products: TopProductRow[];
  /** Href du CTA « Voir plus » (défaut : /boutique) */
  href?: string;
};

/* Couleurs sémantiques alignées avec le brief — success = vert profond,
 * warning = orange foncé. Utilisées pour le taux livré et la marge. */
const SUCCESS_COLOR = "#00875A";
const WARNING_COLOR = "#C2410C";

export function TopProducts({
  subtitle = "Ce qui rapporte vraiment",
  products,
  href = "/boutique",
}: Props) {
  return (
    <div className="h-full">
      {/* Heading : petit label uppercase + gros titre éditorial */}
      <div className="mb-5">
        <p className="font-mono-kamoo text-[11px] font-extrabold uppercase tracking-[0.16em] text-ink-500">
          Top produits
        </p>
        <h3 className="mt-1.5 font-display text-[20px] font-extrabold leading-tight text-ink-900">
          {subtitle}
        </h3>
      </div>

      {products.length === 0 ? (
        <div className="flex items-center justify-center py-14 text-center">
          <span className="text-[12px] font-bold text-ink-400">
            Aucun produit vendu durant cette période
          </span>
        </div>
      ) : (
        <>
        <div className="flex flex-col">
          {products.map((p, i) => (
            <article
              key={`${p.name}-${i}`}
              className={cn(
                "grid items-center gap-3 py-3.5 sm:gap-4",
                /* Grid responsive : sur mobile = rang+photo+nom seulement,
                   sur desktop ajoute 3 colonnes métriques fixes à droite. */
                "grid-cols-[20px_44px_minmax(140px,1fr)] sm:grid-cols-[24px_48px_minmax(180px,1fr)_auto_auto_auto]",
                i > 0 && "border-t border-paper-2",
              )}
            >
              {/* Rang */}
              <span className="font-mono-kamoo text-[12px] font-bold text-ink-300">
                {String(i + 1).padStart(2, "0")}
              </span>

              {/* Photo produit (emoji centré sur fond produit) */}
              <div
                className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-xl sm:h-12 sm:w-12"
                style={{ background: p.bg }}
              >
                {p.emoji}
              </div>

              {/* Nom + sub-line */}
              <div className="min-w-0">
                <h4 className="truncate text-[14px] font-extrabold leading-tight text-ink-900">
                  {p.name}
                </h4>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-ink-500">
                  <span>{p.called} commandes</span>
                  <span className="text-ink-300">·</span>
                  <span>{p.sales} livrées</span>
                  <span className="text-ink-300">·</span>
                  <strong
                    className="font-extrabold"
                    style={{
                      color:
                        p.tauxLivPct >= 70
                          ? SUCCESS_COLOR
                          : WARNING_COLOR,
                    }}
                  >
                    {p.tauxLivPct}% livré
                  </strong>
                </div>
              </div>

              {/* Métriques desktop seulement (cachées en mobile pour
                  éviter l'écrasement, on les ajoutera en ligne mobile
                  dans une V2 si besoin). */}
              <Metric
                label="CA"
                value={`${formatXOF(p.caXof, false)} F`}
              />
              <Metric
                label="Bénéfice"
                value={`+${formatXOF(p.beneficeXof, false)} F`}
                tone={p.beneficeXof >= 0 ? "success" : "warning"}
              />
              <Metric
                label="Marge"
                value={`${p.beneficePct}%`}
                tone={p.beneficePct >= 50 ? "success" : "warning"}
              />
            </article>
          ))}
        </div>

        {/* CTA Voir plus — aligné avec ClosingLeadsCard / LiveDeliveriesFeed
            pour la cohérence visuelle des sections du dashboard. */}
        <Link
          href={href}
          className={cn(
            "mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2",
            "text-[11px] font-bold text-ink-700 transition hover:border-kamoo-blue-300 hover:text-kamoo-blue-700",
          )}
        >
          Voir plus
          <ArrowRight className="h-3 w-3" />
        </Link>
        </>
      )}
    </div>
  );
}

/* ─── Sous-composant : métrique unitaire dans la ligne ──────────────── */

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success" | "warning";
}) {
  const valueColor =
    tone === "success"
      ? SUCCESS_COLOR
      : tone === "warning"
        ? WARNING_COLOR
        : "#101828";
  return (
    <div className="hidden text-right sm:block">
      <span className="block font-mono-kamoo text-[10px] font-extrabold uppercase tracking-[0.08em] text-ink-400">
        {label}
      </span>
      <strong
        className="mt-1 block whitespace-nowrap text-[14px] font-extrabold tabular-nums"
        style={{ color: valueColor }}
      >
        {value}
      </strong>
    </div>
  );
}
