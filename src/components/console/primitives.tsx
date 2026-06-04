/**
 * Kamoo Console — atomes du design system.
 *
 * Direction : « editorial × mission control » — chaque écran a sa propre
 * métaphore (front page éditoriale / flight board / terminal trading /
 * switchboard supervisor) unifiée par ces primitives.
 *
 * Référence : design ref dans `design-ref/kamoo/project/console-shell.jsx`.
 *
 * Règles :
 *  - `MonoLabel`  → JetBrains Mono, UPPERCASE 10px tracking 0.12em. À mettre
 *    sur chaque libellé de section / sous-titre métrique.
 *  - `NumGiant`   → Plus Jakarta Sans 800, tabular-nums, size paramétrable.
 *  - `Hairline`   → bordure 1px discrète.
 *  - `CodeChip`   → mono, fond paper-2, pour codes (KMO-SN-…, ORD-SN-…).
 *  - `LiveDot`    → pastille pulsante pour indicateurs temps réel.
 *  - `Sparkline`  → mini-chart inline 80×32 par défaut, fill optionnel.
 *  - `Bento`      → carte blanche radius 16, bordure line.
 *  - `KpiTile`    → bento spécialisée : label mono / chiffre géant / spark /
 *    delta + footnote. Bloc de base des dashboards.
 */

import type { ReactNode, CSSProperties } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── MonoLabel ───────────────────────────────────────────────────── */

type MonoLabelProps = {
  children: ReactNode;
  /** Couleur via classe Tailwind (défaut : text-ink-500). */
  className?: string;
  /** Taille de police en px (défaut : 10). */
  size?: number;
};

export function MonoLabel({
  children,
  className,
  size = 10,
}: MonoLabelProps) {
  return (
    <span
      className={cn(
        "font-mono-kamoo font-bold uppercase text-ink-500",
        className,
      )}
      style={{ fontSize: size, letterSpacing: "0.12em" }}
    >
      {children}
    </span>
  );
}

/* ─── NumGiant ────────────────────────────────────────────────────── */

type NumGiantProps = {
  children: ReactNode;
  /** Taille de police en px (défaut : 48). */
  size?: number;
  /** Classe Tailwind pour la couleur (défaut : text-ink-900). */
  className?: string;
};

export function NumGiant({
  children,
  size = 48,
  className,
}: NumGiantProps) {
  return (
    <div
      className={cn(
        "font-display font-extrabold tabular-nums leading-none text-ink-900",
        className,
      )}
      style={{ fontSize: size, letterSpacing: "-0.035em", lineHeight: 0.95 }}
    >
      {children}
    </div>
  );
}

/* ─── Hairline ────────────────────────────────────────────────────── */

type HairlineProps = {
  /** Verticale (défaut : horizontale). */
  vertical?: boolean;
  /** Longueur ou hauteur en px / unité CSS. Défaut : 100% du parent. */
  length?: number | string;
  /** Classe pour customiser la couleur (défaut : bg-line). */
  className?: string;
};

export function Hairline({
  vertical = false,
  length,
  className,
}: HairlineProps) {
  if (vertical) {
    return (
      <div
        aria-hidden
        className={cn("w-px shrink-0 bg-line", className)}
        style={{ height: length ?? "100%" }}
      />
    );
  }
  return (
    <div
      aria-hidden
      className={cn("h-px shrink-0 bg-line", className)}
      style={{ width: length ?? "100%" }}
    />
  );
}

/* ─── CodeChip ────────────────────────────────────────────────────── */

type CodeChipProps = {
  children: ReactNode;
  /** Variant accent orange (utile pour les codes urgents/highlight). */
  accent?: boolean;
  className?: string;
};

export function CodeChip({ children, accent = false, className }: CodeChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono-kamoo text-[11px] font-semibold",
        accent
          ? "border-kamoo-orange-200 bg-kamoo-orange-50 text-kamoo-orange-700"
          : "border-line bg-paper-2 text-ink-700",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ─── LiveDot ─────────────────────────────────────────────────────── */

type LiveDotProps = {
  /** Couleur du dot (hex). Défaut : orange Kamoo. */
  color?: string;
  /** Taille en px. Défaut : 8. */
  size?: number;
  className?: string;
};

export function LiveDot({
  color = "#F97316",
  size = 8,
  className,
}: LiveDotProps) {
  return (
    <span
      aria-hidden
      className={cn("inline-block shrink-0 rounded-full", className)}
      style={{
        width: size,
        height: size,
        background: color,
        boxShadow: `0 0 0 ${size / 2}px ${color}33`,
      }}
    />
  );
}

/* ─── Sparkline ───────────────────────────────────────────────────── */

type SparklineProps = {
  data: number[];
  color?: string;
  /** Hauteur en px. Défaut : 32. */
  height?: number;
  /** Largeur en px. Défaut : 80. */
  width?: number;
  /** Rendre l'aire sous la courbe avec un gradient (défaut : true). */
  fill?: boolean;
  className?: string;
};

export function Sparkline({
  data,
  color = "#F97316",
  height = 32,
  width = 80,
  fill = true,
  className,
}: SparklineProps) {
  if (!data || data.length < 2) {
    return <svg width={width} height={height} className={className} />;
  }
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  // 85% de la hauteur pour l'amplitude, 2px de marge en haut, 0 en bas
  const points = data
    .map((v, i) => {
      const x = (i * stepX).toFixed(1);
      const y = (height - ((v - min) / range) * height * 0.85 - 2).toFixed(1);
      return `${x},${y}`;
    })
    .join(" ");
  const path = `M ${points.split(" ").join(" L ")}`;
  // ID unique pour le gradient (évite collision si plusieurs sparklines)
  const gradId = `sg_${color.replace("#", "")}_${data.length}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("block", className)}
    >
      {fill && (
        <>
          <defs>
            <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.32" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={`${path} L ${width} ${height} L 0 ${height} Z`}
            fill={`url(#${gradId})`}
          />
        </>
      )}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ─── Bento ───────────────────────────────────────────────────────── */

type BentoProps = {
  children: ReactNode;
  /** `gridColumn` CSS value (ex: "1 / span 2"). */
  span?: string;
  /** `gridRow` CSS value. */
  row?: string;
  /** Padding intérieur custom (défaut : 20px). */
  padding?: number | string;
  className?: string;
  style?: CSSProperties;
};

export function Bento({
  children,
  span,
  row,
  padding = 20,
  className,
  style,
}: BentoProps) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border border-line bg-white",
        className,
      )}
      style={{
        gridColumn: span,
        gridRow: row,
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ─── KpiTile ─────────────────────────────────────────────────────── */

/**
 * Tile minimaliste : label mono / valeur géante / delta optionnel / footnote.
 *
 * Décision design (validée user) : PAS de sparkline dans les KPI tiles —
 * volonté de garder un look « calme et identitaire » plutôt que dense
 * trading. Le composant `Sparkline` reste dispo pour les hero blocks
 * (« CA en direct ») et les listes inline.
 */

type KpiTileProps = {
  /** Libellé court (mono uppercase) — ex: "CA encaissé". */
  label: string;
  /** Valeur formatée (string pour éviter les soucis de locale). */
  value: string;
  /** Unité affichée à côté (ex: "F", "cmds"). */
  unit?: string;
  /** Delta % (ex: "+18%") affiché en pill colorée. */
  delta?: string;
  /** True si le delta est positif (vert) ; false → rouge. Défaut : true. */
  deltaPos?: boolean;
  /** Texte secondaire (ex: "vs 30 j précédents"). */
  footnote?: string;
  /**
   * Définition du KPI affichée dans un tooltip au hover sur un petit
   * icon `i` à côté du label. Ex: « Chiffre d'affaires effectué durant
   * la période sélectionnée ». Maximum ~2 phrases.
   */
  info?: string;
  /**
   * Teinte sémantique du chiffre principal :
   *   - "emerald" : argent qui rentre (À encaisser, recettes…)
   *   - "red"     : argent qui sort / dette / pertes (À régler…)
   *   - "default" : neutre ink-900 (par défaut)
   */
  valueTone?: "emerald" | "red" | "default";
};

const VALUE_TONE_CLASSES: Record<
  NonNullable<KpiTileProps["valueTone"]>,
  string
> = {
  emerald: "text-emerald-700",
  red: "text-red-700",
  default: "text-ink-900",
};

export function KpiTile({
  label,
  value,
  unit,
  delta,
  deltaPos = true,
  footnote,
  info,
  valueTone = "default",
}: KpiTileProps) {
  return (
    <Bento padding={18}>
      {/* Header : label + icon info (tooltip) + delta */}
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center gap-1">
          <MonoLabel>{label}</MonoLabel>
          {info && <InfoTooltip text={info} />}
        </span>
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono-kamoo text-[10px] font-extrabold",
              deltaPos
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700",
            )}
          >
            <span aria-hidden>{deltaPos ? "↑" : "↓"}</span>
            {delta}
          </span>
        )}
      </div>

      {/* Valeur géante — teinte sémantique selon valueTone */}
      <div className="mt-2.5 flex items-baseline gap-1.5">
        <NumGiant size={32} className={VALUE_TONE_CLASSES[valueTone]}>
          {value}
        </NumGiant>
        {unit && (
          <span className="text-xs font-semibold text-ink-500">{unit}</span>
        )}
      </div>

      {/* Footnote */}
      {footnote && (
        <div className="mt-2 text-[11px] text-ink-500">{footnote}</div>
      )}
    </Bento>
  );
}

/* ─── InfoTooltip ─────────────────────────────────────────────────── */

/**
 * Petit icône `i` cliquable/hoverable qui affiche un tooltip explicatif.
 * Utilisé à côté des labels de KPI tiles pour expliquer ce que le chiffre
 * représente sans le forcer dans la card.
 *
 * Implémentation CSS-only via `group/info` + `peer` — pas de dépendance,
 * positionné en absolute au-dessus de l'icône, flèche pointant vers le bas.
 */
function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="group/info relative inline-flex">
      <Info
        className="h-3 w-3 cursor-help text-ink-400 transition group-hover/info:text-ink-700"
        aria-label={text}
      />
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-[240px] -translate-x-1/2",
          "font-display", // Plus Jakarta Sans — plus polish que Inter pour un tooltip court
          "rounded-xl border border-line bg-white px-3.5 py-2.5 text-left text-[12px] font-medium leading-[1.45] text-ink-600",
          "shadow-[var(--shadow-kamoo-md)]",
          "opacity-0 transition-opacity duration-150 group-hover/info:opacity-100",
        )}
        style={{ letterSpacing: "-0.005em" }}
      >
        {text}
        {/* Petite flèche pointant vers le bas */}
        <span
          aria-hidden
          className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-[5px] border-t-[5px] border-x-transparent border-t-white"
        />
      </span>
    </span>
  );
}
