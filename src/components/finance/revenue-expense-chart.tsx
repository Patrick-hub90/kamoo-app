"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatXOF } from "@/lib/format";

/**
 * RevenueExpenseChart — graphe dashboard opérationnel CA & dépenses.
 *
 * Brief design (validé user) :
 *  - CA       : barres verticales bleu nuit (#102A52)
 *  - Dépenses : ligne orange (#FF6B1A) — coût à surveiller
 *  - Net      : tooltip + KPI header, PAS dans le graphe (évite surcharge)
 *
 * Style : fond clair, bordure fine, radius 12, grille horizontale très
 * légère, labels sobres. Pas d'effet décoratif. Tous les buckets sont
 * rendus même ceux à 0 (axe X régulier).
 */

export type RevenueExpensePoint = {
  /** Label X-axis déjà formaté (ex: « 18 mai », « 14 h », « janv. 2025 ») */
  label: string;
  /** ISO de début du bucket — sert au tooltip pour reformatter si besoin */
  date: string;
  /** CA encaissé sur le bucket (F CFA) */
  ca: number;
  /** Dépenses sur le bucket (F CFA) */
  depenses: number;
};

type Props = {
  data: RevenueExpensePoint[];
  /** Label de la période sélectionnée (ex: « Derniers 30 jours ») */
  periodLabel?: string;
  /** Hauteur du graphe en px */
  height?: number;
  /** Slot optionnel rendu en haut à droite du header — typiquement un
   *  toggle entre plusieurs charts (tabs CA/Commandes). */
  headerRight?: React.ReactNode;
};

/* Couleurs définies dans le brief — tokens hardcodés pour rester
 *  parfaitement fidèles au design demandé. */
const CA_COLOR = "#102A52"; // bleu nuit
const EXPENSE_COLOR = "#FF6B1A"; // orange signal
const GRID_COLOR = "#E8E5DA"; // beige clair (paper-2-like)
const AXIS_LABEL_COLOR = "#667085"; // ink-500-like
const TITLE_COLOR = "#101828"; // ink-900-like

/* Formatte en « 12k » / « 1,2M » pour l'axe Y et compact. */
function formatShortMoney(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${Math.round(v / 1_000)}k`;
  return String(v);
}

export function RevenueExpenseChart({
  data,
  periodLabel,
  height = 320,
  headerRight,
}: Props) {
  /* Totaux sur la période — affichés à droite (sous les tabs). */
  const caTotal = data.reduce((s, p) => s + p.ca, 0);
  const depensesTotal = data.reduce((s, p) => s + p.depenses, 0);

  return (
    <section className="rounded-xl border border-line bg-white p-6">
      {/* Header : titre+période à gauche, tabs+totaux à droite (empilés) */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3
            className="text-[16px] font-extrabold"
            style={{ color: TITLE_COLOR }}
          >
            CA &amp; dépenses
          </h3>
          {periodLabel && (
            <p
              className="mt-0.5 text-[12px]"
              style={{ color: AXIS_LABEL_COLOR }}
            >
              {periodLabel}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {headerRight}
          {/* Totaux période — alignés à droite sous les tabs */}
          <div className="flex flex-wrap items-baseline justify-end gap-x-4 gap-y-1 font-mono-kamoo text-[11px] font-bold tabular-nums">
            <TotalChip
              label="CA"
              value={`${formatXOF(caTotal, false)} F`}
              color={CA_COLOR}
            />
            <TotalChip
              label="Dépenses"
              value={`${formatXOF(depensesTotal, false)} F`}
              color={EXPENSE_COLOR}
            />
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 24, left: 8, bottom: 8 }}
        >
          <CartesianGrid stroke={GRID_COLOR} vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: AXIS_LABEL_COLOR, fontSize: 12 }}
            interval="preserveStartEnd"
            padding={{ left: 8, right: 8 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: AXIS_LABEL_COLOR, fontSize: 12 }}
            tickFormatter={formatShortMoney}
            width={48}
          />
          <Tooltip
            cursor={{ fill: "rgba(16, 42, 82, 0.04)" }}
            formatter={(value, name) => {
              const label =
                name === "ca"
                  ? "CA"
                  : name === "depenses"
                    ? "Dépenses"
                    : String(name);
              return [`${formatXOF(Number(value), false)} F`, label];
            }}
            labelStyle={{ color: TITLE_COLOR, fontWeight: 700 }}
            contentStyle={{
              borderRadius: 8,
              border: `1px solid ${GRID_COLOR}`,
              boxShadow: "0 8px 24px rgba(16, 24, 40, 0.10)",
              fontSize: 12,
            }}
          />
          <Bar
            dataKey="ca"
            name="ca"
            fill={CA_COLOR}
            radius={[5, 5, 0, 0]}
            maxBarSize={28}
          />
          <Line
            type="monotone"
            dataKey="depenses"
            name="depenses"
            stroke={EXPENSE_COLOR}
            strokeWidth={3}
            /* Dots à chaque bucket (y compris à 0) → l'utilisateur voit
                qu'on a bien une mesure à chaque point, pas un trou. */
            dot={{
              r: 3,
              fill: "#fff",
              stroke: EXPENSE_COLOR,
              strokeWidth: 2,
            }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </section>
  );
}

/* ─── Sous-composant : chip total inline ────────────────────────────── */

/* Format : `LABEL` mono uppercase muted · `VALUE` colorée selon la
 * sémantique (couleur de la série). Compact pour rester sur 1 ligne. */
function TotalChip({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span
        className="font-mono-kamoo text-[9.5px] font-extrabold uppercase tracking-[0.08em]"
        style={{ color: AXIS_LABEL_COLOR }}
      >
        {label}
      </span>
      <span
        className="font-mono-kamoo text-[12px] font-extrabold tabular-nums"
        style={{ color }}
      >
        {value}
      </span>
    </span>
  );
}

