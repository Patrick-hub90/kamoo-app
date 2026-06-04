"use client";

import { MonoLabel, LiveDot } from "@/components/console/primitives";
import { formatXOF } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Hero « CA en direct » — bloc identitaire du dashboard.
 *
 * Pensé comme un COMPTEUR FACTUEL, pas un coach :
 *  - Pas de pill contextuelle (« MEILLEUR MOIS », « TEMPS DE RELANCER »…)
 *  - Pas de phrase de coaching (« Tu viens de battre ton record »…)
 *  - Pas de CTA suggérant une action
 *  - Pas de mention de produit star (trop prescriptif)
 *
 * Le hero présente juste les FAITS :
 *  - Mois courant + objectif (pill mono)
 *  - Montant encaissé + « ce mois. »
 *  - Petite ligne factuelle « vs mois dernier : +X% »
 *  - Barre de progression vers l'objectif
 *
 * Le `state` (thriving / normal / quiet) reste utilisé uniquement pour
 * une signalétique visuelle DOUCE — fond gradient + couleur du chiffre.
 * Aucun message ne change.
 */

export type HeroState = "thriving" | "normal" | "quiet";

/**
 * Dérive l'état du hero à partir du contexte :
 *  - `quiet`    : strictement aucune vente ce mois (CA = 0)
 *  - `thriving` : c'est vraiment le meilleur mois — CA mois courant >
 *    max(tous les mois historiques précédents)
 *  - `normal`   : tous les autres cas
 */
export function deriveHeroState(
  caMonthXof: number,
  previousMonthsCa: number[],
): HeroState {
  if (caMonthXof === 0) return "quiet";
  if (
    previousMonthsCa.length > 0 &&
    caMonthXof > Math.max(...previousMonthsCa)
  ) {
    return "thriving";
  }
  return "normal";
}

type HeroCaDirectProps = {
  state: HeroState;
  /** CA encaissé ce mois (F CFA) */
  caMonthXof: number;
  /** Objectif mensuel (F CFA) */
  monthObjectiveXof: number;
  /** Delta vs mois précédent (« +18% »). Affiché en petite ligne factuelle,
   *  coloré vert si positif, rouge si négatif. */
  deltaVsLastMonth: string;
  /** Signe du delta — true si positif (vert), false si négatif (rouge).
   *  Permet de colorer correctement même quand le label utilise « − »
   *  Unicode au lieu de « - » ASCII. */
  deltaPositive: boolean;
  /** Nom du mois courant (« mai 2026 ») */
  monthLabel: string;
};

/* ─── Configs visuelles par état (signalétique douce uniquement) ──── */

const STATE_BG: Record<HeroState, string> = {
  thriving: "linear-gradient(135deg, #064E3B, #0F2A52 60%)",
  normal: "linear-gradient(135deg, #1E3A6B, #0F2A52 65%)",
  quiet: "linear-gradient(135deg, #78350F, #0F2A52 70%)",
};

const STATE_GLOW: Record<HeroState, string> = {
  thriving: "rgba(34,197,94,0.32)",
  normal: "rgba(59,130,246,0.20)",
  quiet: "rgba(245,158,11,0.28)",
};

const STATE_TEXT_HIGHLIGHT: Record<HeroState, string> = {
  thriving: "text-emerald-300",
  normal: "text-sky-300",
  quiet: "text-amber-300",
};

const STATE_PROGRESS_BAR: Record<HeroState, string> = {
  thriving: "linear-gradient(90deg, #22C55E, #86EFAC)",
  normal: "linear-gradient(90deg, #3B82F6, #93C5FD)",
  quiet: "linear-gradient(90deg, #F59E0B, #FCD34D)",
};

const STATE_PROGRESS_GLOW: Record<HeroState, string> = {
  thriving: "0 0 16px rgba(34,197,94,0.5)",
  normal: "0 0 12px rgba(59,130,246,0.35)",
  quiet: "0 0 12px rgba(245,158,11,0.35)",
};

/* ─── Composant ───────────────────────────────────────────────────── */

export function HeroCaDirect({
  state,
  caMonthXof,
  monthObjectiveXof,
  deltaVsLastMonth,
  deltaPositive,
  monthLabel,
}: HeroCaDirectProps) {
  const pct = Math.min(
    100,
    Math.round((caMonthXof / monthObjectiveXof) * 100),
  );
  const remaining = Math.max(0, monthObjectiveXof - caMonthXof);

  return (
    <div
      className="relative overflow-hidden rounded-2xl text-white"
      style={{ background: STATE_BG[state], minHeight: 220 }}
    >
      {/* Glow contextuel doux (couleur dépend de l'état) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 h-80 w-80 rounded-full"
        style={{
          background: `radial-gradient(circle, ${STATE_GLOW[state]}, transparent 65%)`,
        }}
      />
      <svg aria-hidden className="absolute inset-0 h-full w-full opacity-40">
        <defs>
          <pattern
            id="heroCaDots"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1" fill="rgba(255,255,255,0.06)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#heroCaDots)" />
      </svg>

      <div className="relative p-7">
        {/* Pill uniforme : juste « CA EN DIRECT » + meta mois/objectif */}
        <div className="mb-3 flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-kamoo-blue-500 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.10em] text-white">
            <LiveDot color="#FFFFFF" size={6} />
            CA en direct
          </span>
          <MonoLabel className="text-white/55">
            {monthLabel} · objectif {formatXOF(monthObjectiveXof, false)} F
          </MonoLabel>
        </div>

        {/* Titre uniforme : juste le montant + « encaissés ce mois. » */}
        <h2
          className="font-display text-[36px] font-extrabold leading-[1.05]"
          style={{ letterSpacing: "-0.025em" }}
        >
          <span className={STATE_TEXT_HIGHLIGHT[state]}>
            {formatXOF(caMonthXof, false)} F
          </span>{" "}
          encaissés
          <br />
          ce mois.
        </h2>

        {/* Petite ligne factuelle : delta vs mois précédent.
            Le % est coloré vert (positif) ou rouge (négatif) — le préfixe
            « vs mois dernier · » reste neutre pour rester sobre. */}
        <p className="mt-3 font-mono-kamoo text-[11px] font-bold uppercase tracking-[0.06em] text-white/55">
          vs mois dernier ·{" "}
          <span
            className={cn(
              deltaPositive ? "text-emerald-300" : "text-red-400",
            )}
          >
            {deltaVsLastMonth}
          </span>
        </p>

        {/* Barre de progression vers objectif (sauf si CA = 0) */}
        {pct > 0 && (
          <div className="mt-5 max-w-[640px]">
            <div className="mb-1.5 flex items-center justify-between">
              <MonoLabel className="text-white/55" size={9}>
                Objectif mois
              </MonoLabel>
              <span
                className={cn(
                  "font-mono-kamoo text-[11px] font-bold",
                  STATE_TEXT_HIGHLIGHT[state],
                )}
              >
                {pct}% · reste {formatXOF(remaining, false)} F
              </span>
            </div>
            <div className="relative h-2 overflow-hidden rounded bg-white/10">
              <div
                className="h-full rounded transition-all"
                style={{
                  width: `${pct}%`,
                  background: STATE_PROGRESS_BAR[state],
                  boxShadow: STATE_PROGRESS_GLOW[state],
                }}
              />
              {/* Milestones 25 / 50 / 75 / 100% — repères visuels discrets */}
              {[0.25, 0.5, 0.75, 1].map((p) => (
                <div
                  key={p}
                  aria-hidden
                  className="absolute top-0.5 h-1.5 w-1 rounded-sm bg-white/30"
                  style={{ left: `calc(${p * 100}% - 2px)` }}
                />
              ))}
            </div>
            {/* Graduations chiffrées sous la barre */}
            <div className="mt-1.5 flex justify-between font-mono-kamoo text-[9px] text-white/40">
              <span>0</span>
              <span>{formatXOF(monthObjectiveXof * 0.25, false)}</span>
              <span>{formatXOF(monthObjectiveXof * 0.5, false)}</span>
              <span>{formatXOF(monthObjectiveXof * 0.75, false)}</span>
              <span>{formatXOF(monthObjectiveXof, false)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

