"use client";

import { useRef, useState } from "react";
import type { TimelinePoint } from "@/lib/types/finance";
import { formatXOF } from "@/lib/format";

/**
 * Graphique trésorerie (CA in + dépenses out) avec courbe lissée + tooltip.
 *
 * Utilisé sur :
 *  - /finances (Aperçu) — `showOnly="both"` (rentré + sorti)
 *  - /dashboard (Vue d'ensemble) — `showOnly="in"` (CA encaissé uniquement)
 *
 * Style et algo identiques (interpolation cubique monotone Fritsch-Carlson).
 */

type ShowOnly = "both" | "in" | "out";

type LineStyle = {
  /** Couleur principale de la ligne (hex) */
  color: string;
  /** Couleur du gradient bas (souvent même couleur opacity 0) */
  gradientId: string;
  /** Libellé pour le tooltip */
  label: string;
  /** Préfixe affiché devant la valeur dans le tooltip (ex: "+", "−") */
  prefix?: string;
};

export function CashflowChart({
  timeline,
  compareTimeline,
  periodLabel,
  comparePeriodLabel,
  showOnly = "both",
  height = 240,
  styleIn,
  styleOut,
  format = "currency",
}: {
  timeline: TimelinePoint[];
  /** Timeline de la période précédente, même longueur que `timeline`,
   *  rendue en pointillé subtil (style Shopify Analytics). UNIQUEMENT
   *  pour la série primaire (in) — évite le bruit visuel. */
  compareTimeline?: TimelinePoint[];
  /** Label de la période courante (« 17 mai 2026 ») — bottom legend. */
  periodLabel?: string;
  /** Label de la période de comparaison (« 16 mai 2026 ») — bottom legend. */
  comparePeriodLabel?: string;
  showOnly?: ShowOnly;
  /** Hauteur en px (le SVG s'étire à 100% en largeur via viewBox) */
  height?: number;
  /** Personnalisation de la ligne "in" — défaut emerald + "Rentré" */
  styleIn?: Partial<LineStyle>;
  /** Personnalisation de la ligne "out" — défaut amber + "Sorti" */
  styleOut?: Partial<LineStyle>;
  /** Format des valeurs : F CFA ou nombre simple (commandes) */
  format?: "currency" | "count";
}) {
  const inStyle: LineStyle = {
    color: "#10B981",
    gradientId: "grad-in",
    label: "Rentré",
    prefix: "+",
    ...styleIn,
  };
  const outStyle: LineStyle = {
    color: "#F59E0B",
    gradientId: "grad-out",
    label: "Sorti",
    prefix: "−",
    ...styleOut,
  };
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (timeline.length === 0) {
    return (
      <div className="grid h-48 place-items-center text-[13px] text-ink-500">
        Pas de données sur cette période
      </div>
    );
  }

  const showIn = showOnly === "both" || showOnly === "in";
  const showOut = showOnly === "both" || showOnly === "out";

  const W = 900;
  const H = height;
  /* Padding bas augmenté (32 → 44) pour respirer entre les points du graphe
     et les labels de l'axe X — sinon les libellés horaires « 00h, 02h... »
     se collent à la baseline et donnent un rendu cramped. */
  const PADDING = { top: 16, right: 24, bottom: 44, left: 56 };
  const innerW = W - PADDING.left - PADDING.right;
  const innerH = H - PADDING.top - PADDING.bottom;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const xRel = e.clientX - rect.left;
    const xInSvg = (xRel / rect.width) * W;
    const idx = Math.round((xInSvg - PADDING.left) / xStep);
    setHoveredIdx(Math.max(0, Math.min(timeline.length - 1, idx)));
  };

  /* maxValue inclut la timeline de comparaison (in uniquement) pour que
     les 2 courbes soient sur la même échelle. */
  const maxValue = Math.max(
    1,
    ...timeline.flatMap((p) => {
      const vals: number[] = [];
      if (showIn) vals.push(p.in);
      if (showOut) vals.push(p.out);
      return vals;
    }),
    ...(compareTimeline && showIn ? compareTimeline.map((p) => p.in) : []),
  );

  const xStep = innerW / Math.max(1, timeline.length - 1);
  const yScale = (v: number) => innerH - (v / maxValue) * innerH;

  const inPoints = timeline.map((p, i) => ({
    x: PADDING.left + i * xStep,
    y: PADDING.top + yScale(p.in),
  }));
  const outPoints = timeline.map((p, i) => ({
    x: PADDING.left + i * xStep,
    y: PADDING.top + yScale(p.out),
  }));

  const inPath = smoothPath(inPoints);
  const outPath = smoothPath(outPoints);

  /* Comparaison période précédente — UNIQUEMENT pour la série primaire
     (in). Même barème, rendue en pointillé subtil dans la même couleur
     à opacity 50% (style Shopify Analytics). */
  const compareInPoints = compareTimeline?.map((p, i) => ({
    x: PADDING.left + i * xStep,
    y: PADDING.top + yScale(p.in),
  }));
  const compareInPath = compareInPoints ? smoothPath(compareInPoints) : null;

  const baselineY = PADDING.top + innerH;
  const inArea =
    inPath +
    ` L${inPoints[inPoints.length - 1].x},${baselineY}` +
    ` L${inPoints[0].x},${baselineY} Z`;
  const outArea =
    outPath +
    ` L${outPoints[outPoints.length - 1].x},${baselineY}` +
    ` L${outPoints[0].x},${baselineY} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(maxValue * t));
  const labelStep = timeline.length > 16 ? Math.ceil(timeline.length / 12) : 1;

  return (
    <div className="relative overflow-x-auto">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: `${H}px` }}
        preserveAspectRatio="none"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <defs>
          <linearGradient id={inStyle.gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={inStyle.color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={inStyle.color} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={outStyle.gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={outStyle.color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={outStyle.color} stopOpacity="0" />
          </linearGradient>
          <filter id="line-shadow" x="-2%" y="-10%" width="104%" height="120%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
            <feOffset dy="1" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.15" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {yTicks.map((v, i) => {
          const y = PADDING.top + yScale(v);
          return (
            <g key={i}>
              <line
                x1={PADDING.left}
                x2={W - PADDING.right}
                y1={y}
                y2={y}
                stroke="#F1F5F9"
                strokeWidth={1}
              />
              <text
                x={PADDING.left - 10}
                y={y + 3.5}
                fill="#94A3B8"
                fontSize="11"
                fontFamily="ui-monospace,monospace"
                textAnchor="end"
              >
                {format === "count" ? v : formatShortXof(v)}
              </text>
            </g>
          );
        })}

        {/* Comparaison série primaire — ligne pointillée subtile (style
            Shopify Analytics : même couleur, opacity 50%, dasharray 2,6) */}
        {showIn && compareInPath && (
          <path
            d={compareInPath}
            fill="none"
            stroke={inStyle.color}
            strokeOpacity={0.5}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="2 6"
          />
        )}

        {showOut && (
          <path d={outArea} fill={`url(#${outStyle.gradientId})`} />
        )}
        {showIn && (
          <path d={inArea} fill={`url(#${inStyle.gradientId})`} />
        )}

        {showOut && (
          <path
            d={outPath}
            fill="none"
            stroke={outStyle.color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#line-shadow)"
          />
        )}
        {showIn && (
          <path
            d={inPath}
            fill="none"
            stroke={inStyle.color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#line-shadow)"
          />
        )}

        {timeline.map((p, i) => {
          const x = PADDING.left + i * xStep;
          const yIn = PADDING.top + yScale(p.in);
          const yOut = PADDING.top + yScale(p.out);
          const showLabel = i % labelStep === 0 || i === timeline.length - 1;
          return (
            <g key={i}>
              {showIn && (
                <circle
                  cx={x}
                  cy={yIn}
                  r={3.5}
                  fill="white"
                  stroke={inStyle.color}
                  strokeWidth={2}
                />
              )}
              {showOut && (
                <circle
                  cx={x}
                  cy={yOut}
                  r={3.5}
                  fill="white"
                  stroke={outStyle.color}
                  strokeWidth={2}
                />
              )}
              {showLabel && (
                <text
                  x={x}
                  y={H - 14}
                  fill="#475569"
                  fontSize="12"
                  fontWeight="600"
                  fontFamily="ui-sans-serif,system-ui"
                  textAnchor="middle"
                  letterSpacing="0.02em"
                >
                  {p.label}
                </text>
              )}
            </g>
          );
        })}

        {hoveredIdx !== null && (
          <g pointerEvents="none">
            <line
              x1={PADDING.left + hoveredIdx * xStep}
              x2={PADDING.left + hoveredIdx * xStep}
              y1={PADDING.top}
              y2={PADDING.top + innerH}
              stroke="#94A3B8"
              strokeWidth={1}
              strokeDasharray="3,3"
            />
            {showIn && (
              <circle
                cx={PADDING.left + hoveredIdx * xStep}
                cy={PADDING.top + yScale(timeline[hoveredIdx].in)}
                r={5}
                fill={inStyle.color}
                stroke="white"
                strokeWidth={2.5}
              />
            )}
            {showOut && (
              <circle
                cx={PADDING.left + hoveredIdx * xStep}
                cy={PADDING.top + yScale(timeline[hoveredIdx].out)}
                r={5}
                fill={outStyle.color}
                stroke="white"
                strokeWidth={2.5}
              />
            )}
          </g>
        )}
      </svg>

      {hoveredIdx !== null && (
        <ChartTooltip
          point={timeline[hoveredIdx]}
          leftPct={((PADDING.left + hoveredIdx * xStep) / W) * 100}
          isLeftSide={hoveredIdx < timeline.length / 2}
          showIn={showIn}
          showOut={showOut}
          inStyle={inStyle}
          outStyle={outStyle}
          format={format}
        />
      )}

      {/* Légende bas-centre style Shopify Analytics — 2 dots colorés + dates.
          Plein pour la période courante, opacity 50% pour la comparaison. */}
      {(periodLabel || comparePeriodLabel) && (
        <div className="mt-3 flex items-center justify-center gap-5 text-[12px]">
          {periodLabel && (
            <div className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: inStyle.color }}
                aria-hidden
              />
              <span className="font-medium text-ink-500">{periodLabel}</span>
            </div>
          )}
          {comparePeriodLabel && (
            <div className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: inStyle.color, opacity: 0.5 }}
                aria-hidden
              />
              <span className="font-medium text-ink-500">
                {comparePeriodLabel}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChartTooltip({
  point,
  leftPct,
  isLeftSide,
  showIn,
  showOut,
  inStyle,
  outStyle,
  format,
}: {
  point: TimelinePoint;
  leftPct: number;
  isLeftSide: boolean;
  showIn: boolean;
  showOut: boolean;
  inStyle: LineStyle;
  outStyle: LineStyle;
  format: "currency" | "count";
}) {
  const fullDate = new Date(point.date).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const formatValue = (v: number) =>
    format === "count" ? v.toString() : formatXOF(v, false);
  return (
    <div
      className="pointer-events-none absolute top-2 z-10"
      style={{
        left: `${leftPct}%`,
        transform: isLeftSide
          ? "translateX(8px)"
          : "translateX(-100%) translateX(-8px)",
      }}
    >
      <div className="rounded-xl border border-line bg-white px-3.5 py-2.5 shadow-[var(--shadow-kamoo-lg)]">
        <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
          {fullDate}
        </div>
        <div className="mt-1.5 flex flex-col gap-1 text-[12px]">
          {showIn && (
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-ink-700">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: inStyle.color }}
                />
                {inStyle.label}
              </span>
              <span
                className="font-display font-extrabold tabular-nums"
                style={{ color: inStyle.color }}
              >
                {inStyle.prefix ?? ""}
                {formatValue(point.in)}
                {format === "currency" && (
                  <span className="ml-0.5 text-[10px] font-bold text-ink-500">
                    F
                  </span>
                )}
              </span>
            </div>
          )}
          {showOut && (
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-ink-700">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: outStyle.color }}
                />
                {outStyle.label}
              </span>
              <span
                className="font-display font-extrabold tabular-nums"
                style={{ color: outStyle.color }}
              >
                {outStyle.prefix ?? ""}
                {formatValue(point.out)}
                {format === "currency" && (
                  <span className="ml-0.5 text-[10px] font-bold text-ink-500">
                    F
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Interpolation cubique monotone (Fritsch-Carlson) — courbe lisse qui ne
 * dépasse jamais les valeurs des points (pas de plongée sous zéro entre 2
 * points hauts).
 */
function smoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;
  if (points.length === 2) {
    return `M${points[0].x},${points[0].y} L${points[1].x},${points[1].y}`;
  }

  const n = points.length;
  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    slopes.push(dx === 0 ? 0 : dy / dx);
  }

  const tangents: number[] = new Array(n);
  tangents[0] = slopes[0];
  tangents[n - 1] = slopes[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (slopes[i - 1] * slopes[i] <= 0) {
      tangents[i] = 0;
    } else {
      tangents[i] = (slopes[i - 1] + slopes[i]) / 2;
    }
  }

  for (let i = 0; i < n - 1; i++) {
    if (slopes[i] === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
      continue;
    }
    const alpha = tangents[i] / slopes[i];
    const beta = tangents[i + 1] / slopes[i];
    const sumSq = alpha * alpha + beta * beta;
    if (sumSq > 9) {
      const tau = 3 / Math.sqrt(sumSq);
      tangents[i] = tau * alpha * slopes[i];
      tangents[i + 1] = tau * beta * slopes[i];
    }
  }

  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const dx = (points[i + 1].x - points[i].x) / 3;
    const cp1x = points[i].x + dx;
    const cp1y = points[i].y + tangents[i] * dx;
    const cp2x = points[i + 1].x - dx;
    const cp2y = points[i + 1].y - tangents[i + 1] * dx;
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${points[i + 1].x},${points[i + 1].y}`;
  }
  return d;
}

function formatShortXof(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}k`;
  return String(v);
}
