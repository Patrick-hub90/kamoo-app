"use client";

import { MonoLabel } from "@/components/console/primitives";
import { cn } from "@/lib/utils";

/**
 * Efficacité boutique — chart 3 séries cumulatives sur 30 jours :
 *   Reçues   (gris pointillé) — leads bruts entrants
 *   Confirmées (bleu plein)   — validés par closing
 *   Livrées  (vert plein)     — cash COD encaissé
 *
 * Affiche aussi en header un funnel summary : Reçues → Confirmées → Livrées
 * avec les taux de conversion entre étapes (colorés vert ≥80%, orange ≥60%,
 * rouge sinon).
 *
 * Les 3 séries doivent être des arrays de même longueur (typiquement 30
 * points). Le composant ne décide pas de l'agrégation — c'est au caller
 * de calculer (ou de fournir un mock).
 */

type EfficiencyChartProps = {
  /** Série « commandes reçues » par jour (30 points) */
  recues: number[];
  /** Série « commandes confirmées par closing » par jour */
  confirmees: number[];
  /** Série « commandes livrées + payées COD » par jour */
  livrees: number[];
  /** Labels de l'axe X (date), affichés à intervalles réguliers */
  xLabels?: string[];
};

const W = 760;
const H = 200;

export function EfficiencyChart({
  recues,
  confirmees,
  livrees,
  xLabels = ["04 avr", "11 avr", "18 avr", "25 avr", "04 mai"],
}: EfficiencyChartProps) {
  const n = recues.length;
  const lastIdx = n - 1;
  const max = Math.max(...recues);
  const stepX = W / (n - 1);

  const pathFor = (data: number[]) => {
    const pts = data.map((v, i) => {
      const x = (i * stepX).toFixed(1);
      const y = (H - (v / max) * H * 0.85).toFixed(1);
      return [x, y] as const;
    });
    const d = "M " + pts.map((p) => p.join(",")).join(" L ");
    return { d, pts };
  };

  const r = pathFor(recues);
  const c = pathFor(confirmees);
  const l = pathFor(livrees);

  // Taux de conversion (sur la dernière valeur — état actuel du pipeline)
  const confRate = Math.round((confirmees[lastIdx] / recues[lastIdx]) * 100);
  const delRate = Math.round((livrees[lastIdx] / recues[lastIdx]) * 100);
  const closingToDeliveryRate = Math.round(
    (livrees[lastIdx] / confirmees[lastIdx]) * 100,
  );

  // X labels — affichés à des intervalles équidistants (5 labels)
  const labelsStep = Math.max(1, Math.floor((n - 1) / (xLabels.length - 1)));

  return (
    <div>
      {/* Funnel summary header */}
      <div className="mb-4 flex items-stretch rounded-xl bg-paper-2 p-3">
        <FunnelStep
          label="Reçues"
          value={String(recues[lastIdx])}
          sub="30 jours"
          color="#9CA3AF"
        />
        <FunnelArrow rate={confRate} />
        <FunnelStep
          label="Confirmées"
          value={String(confirmees[lastIdx])}
          sub="par closing"
          color="#2563EB"
        />
        <FunnelArrow rate={closingToDeliveryRate} />
        <FunnelStep
          label="Livrées"
          value={String(livrees[lastIdx])}
          sub="payées COD"
          color="#16A34A"
          highlight
        />
      </div>

      {/* SVG chart */}
      <svg
        viewBox={`0 0 ${W} ${H + 26}`}
        className="block h-auto w-full"
      >
        <defs>
          <linearGradient id="effRecFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#9CA3AF" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#9CA3AF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="effConfFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="effLivFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#16A34A" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#16A34A" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid horizontal (25/50/75/100%) */}
        {[0.25, 0.5, 0.75, 1].map((p) => (
          <line
            key={p}
            x1="0"
            x2={W}
            y1={H * (1 - p)}
            y2={H * (1 - p)}
            stroke="#F5F5EE"
            strokeWidth={1}
          />
        ))}

        {/* Reçues (gris pointillé) — area + ligne */}
        <path
          d={`${r.d} L ${r.pts[lastIdx][0]} ${H} L ${r.pts[0][0]} ${H} Z`}
          fill="url(#effRecFill)"
        />
        <path
          d={r.d}
          fill="none"
          stroke="#9CA3AF"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="2 3"
        />

        {/* Confirmées (bleu) */}
        <path
          d={`${c.d} L ${c.pts[lastIdx][0]} ${H} L ${c.pts[0][0]} ${H} Z`}
          fill="url(#effConfFill)"
        />
        <path
          d={c.d}
          fill="none"
          stroke="#2563EB"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Livrées (vert) — la série la plus importante, trait plus épais */}
        <path
          d={`${l.d} L ${l.pts[lastIdx][0]} ${H} L ${l.pts[0][0]} ${H} Z`}
          fill="url(#effLivFill)"
        />
        <path
          d={l.d}
          fill="none"
          stroke="#16A34A"
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* End dots */}
        <circle
          cx={r.pts[lastIdx][0]}
          cy={r.pts[lastIdx][1]}
          r={4}
          fill="white"
          stroke="#9CA3AF"
          strokeWidth={2}
        />
        <circle
          cx={c.pts[lastIdx][0]}
          cy={c.pts[lastIdx][1]}
          r={4}
          fill="white"
          stroke="#2563EB"
          strokeWidth={2}
        />
        <circle
          cx={l.pts[lastIdx][0]}
          cy={l.pts[lastIdx][1]}
          r={5}
          fill="white"
          stroke="#16A34A"
          strokeWidth={2.5}
        />

        {/* X labels (mono, 5 dates équidistantes) */}
        {xLabels.map((label, k) => {
          const idx = Math.min(n - 1, k * labelsStep);
          return (
            <text
              key={`${label}-${k}`}
              x={idx * stepX}
              y={H + 18}
              fontSize={9}
              fill="#9CA3AF"
              textAnchor="middle"
              fontFamily="'JetBrains Mono', monospace"
            >
              {label}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="mt-1 flex gap-5 border-t border-dashed border-paper-2 px-1 pt-2">
        {[
          { c: "#9CA3AF", l: "Reçues", s: "leads bruts", dashed: true },
          { c: "#2563EB", l: "Confirmées", s: "closing validé" },
          { c: "#16A34A", l: "Livrées", s: "cash encaissé COD" },
        ].map((item) => (
          <div key={item.l} className="flex items-center gap-2">
            <div className="flex h-1 w-[18px] items-center">
              <div
                className="h-[3px] w-full rounded-[2px]"
                style={{
                  background: item.dashed
                    ? `repeating-linear-gradient(90deg, ${item.c} 0 4px, transparent 4px 7px)`
                    : item.c,
                }}
              />
            </div>
            <div>
              <div className="text-[12px] font-bold text-ink-900">
                {item.l}
              </div>
              <div className="text-[10px] text-ink-500">{item.s}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────── */

function FunnelStep({
  label,
  value,
  sub,
  color,
  highlight = false,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex-1 px-2 text-center">
      <div className="flex items-center justify-center gap-1.5">
        <span
          aria-hidden
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: color }}
        />
        <MonoLabel>{label}</MonoLabel>
      </div>
      <div
        className="mt-1 font-display text-[26px] font-extrabold leading-none tabular-nums"
        style={{ color, letterSpacing: "-0.02em" }}
      >
        {value}
      </div>
      <div className={cn("mt-0.5 text-[10px]", highlight ? "text-ink-700 font-semibold" : "text-ink-500")}>
        {sub}
      </div>
    </div>
  );
}

function FunnelArrow({ rate }: { rate: number }) {
  const tone =
    rate >= 80
      ? { bg: "bg-emerald-100/50", fg: "text-emerald-700" }
      : rate >= 60
        ? { bg: "bg-amber-100/50", fg: "text-amber-700" }
        : { bg: "bg-red-100/50", fg: "text-red-700" };
  return (
    <div className="flex min-w-[56px] flex-col items-center justify-center gap-1 px-1">
      <span
        className={cn(
          "rounded px-1.5 py-0.5 font-mono-kamoo text-[10px] font-extrabold",
          tone.bg,
          tone.fg,
        )}
      >
        {rate}%
      </span>
      <svg width="30" height="14" viewBox="0 0 30 14">
        <path
          d="M2 7 L 26 7 M 22 3 L 26 7 L 22 11"
          stroke="#D1D5DB"
          strokeWidth={1.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
