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

/**
 * CalledDeliveredChart — chart « tunnel opérationnel » commandes.
 *
 * Brief design (validé user) :
 *  - Appelées (called) : barres bleu clair (#DCE7FF) — volume traité
 *  - Livrées  (delivered) : ligne verte (#12B76A) — résultat réussi
 *  - Même axe Y (les 2 valeurs sont des nb commandes)
 *  - Taux de livraison (livrées / appelées) affiché dans le tooltip
 *
 * Logique tunnel : la barre donne l'effort commercial (appels effectués),
 * la courbe verte donne l'efficacité réelle (commandes finalisées).
 * L'écart entre les 2 = le manque à gagner / perte de conversion.
 */

export type CalledDeliveredPoint = {
  /** Label X-axis déjà formaté (ex: « 18 mai », « 14 h », « janv. 2025 ») */
  label: string;
  /** ISO de début du bucket */
  date: string;
  /** Nb de commandes appelées (status != nouvelle) sur le bucket */
  called: number;
  /** Nb de commandes livrées (delivery.progress = effectue) sur le bucket */
  delivered: number;
};

type Props = {
  data: CalledDeliveredPoint[];
  /** Label de la période sélectionnée (ex: « Derniers 30 jours ») */
  periodLabel?: string;
  /** Hauteur du graphe en px */
  height?: number;
  /** Slot optionnel rendu en haut à droite du header — typiquement un
   *  toggle entre plusieurs charts (tabs CA/Commandes). */
  headerRight?: React.ReactNode;
};

/* Couleurs alignées avec RevenueExpenseChart : barres bleu navy pour le
 *  volume (constant d'un chart à l'autre), ligne couleur sémantique selon
 *  ce que mesure la métrique (orange pour les coûts, vert pour le succès). */
const CALLED_COLOR = "#102A52"; // bleu navy — même que CA bars
const DELIVERED_COLOR = "#12B76A"; // vert signal
const GRID_COLOR = "#E8E5DA";
const AXIS_LABEL_COLOR = "#667085";
const TITLE_COLOR = "#101828";

export function CalledDeliveredChart({
  data,
  periodLabel,
  height = 320,
  headerRight,
}: Props) {
  /* Totaux période — alignés à droite sous les tabs. */
  const calledTotal = data.reduce((s, p) => s + p.called, 0);
  const deliveredTotal = data.reduce((s, p) => s + p.delivered, 0);

  return (
    <section className="rounded-xl border border-line bg-white p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3
            className="text-[16px] font-extrabold"
            style={{ color: TITLE_COLOR }}
          >
            Commandes appelées &amp; livrées
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
          <div className="flex flex-wrap items-baseline justify-end gap-x-4 gap-y-1 font-mono-kamoo text-[11px] font-bold tabular-nums">
            <TotalChip
              label="Appelées"
              value={String(calledTotal)}
              color={CALLED_COLOR}
            />
            <TotalChip
              label="Livrées"
              value={String(deliveredTotal)}
              color={DELIVERED_COLOR}
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
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fill: AXIS_LABEL_COLOR, fontSize: 12 }}
            width={36}
          />
          <Tooltip
            cursor={{ fill: "rgba(16, 42, 82, 0.04)" }}
            formatter={(value, name, item) => {
              if (name === "called") return [value, "Appelées"];
              if (name === "delivered") {
                // Taux de livraison = livrées / appelées sur ce bucket précis
                const payload = item?.payload as
                  | CalledDeliveredPoint
                  | undefined;
                const rate =
                  payload && payload.called > 0
                    ? Math.round((payload.delivered / payload.called) * 100)
                    : 0;
                return [`${value} (${rate}%)`, "Livrées · taux"];
              }
              return [value, name];
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
            dataKey="called"
            name="called"
            fill={CALLED_COLOR}
            radius={[5, 5, 0, 0]}
            maxBarSize={28}
          />
          <Line
            type="monotone"
            dataKey="delivered"
            name="delivered"
            stroke={DELIVERED_COLOR}
            strokeWidth={3}
            /* Dots à chaque bucket (y compris à 0) → l'utilisateur voit
                qu'on a bien une mesure à chaque point, pas un trou. */
            dot={{
              r: 3,
              fill: "#fff",
              stroke: DELIVERED_COLOR,
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
