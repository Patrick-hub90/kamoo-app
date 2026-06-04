import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock,
  MapPin,
  Plane,
  Ship,
  Star,
  Zap,
} from "lucide-react";
import {
  type Expedition,
  STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  TRANSPORT_MODE_LABELS,
} from "@/lib/types/expedition";
import { formatXOF } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  expedition: Expedition;
};

const TRANSPORT_ICON = {
  sea: Ship,
  air_standard: Plane,
  air_express: Zap,
} as const;

/**
 * Carte d'une expédition — design « banner action » :
 *
 *  ┌──────────────────────────────────────────────────────┐
 *  │ ⚠ Paie 245 000 F CFA pour libérer    Action rapide → │  ← banner couleur si action
 *  ├──────────────────────────────────────────────────────┤
 *  │ KMO-SN-78421  [Non payé] [📍 Reçu]    245 000 F CFA  │
 *  │ 🧴 Crème hydratante L'Oréal et 1 autre   [Détails →] │
 *  │ LW Liang Wei ★ 4.9 · 🚢 Maritime · ⏰ 18 nov. 2025    │
 *  └──────────────────────────────────────────────────────┘
 *
 * Le banner du haut met en avant l'action requise (paiement, récupération).
 * Couleurs :
 *  - Orange : paiement requis (urgent ou à l'arrivée)
 *  - Vert   : colis arrivé, à récupérer
 *  - Aucun  : pas d'action immédiate (en transit payé / en attente devis)
 */
export function ShipmentCard({ expedition: e }: Props) {
  const needsPayment =
    e.paymentStatus === "unpaid" && e.amountXof !== null;
  const isPaid = e.paymentStatus === "paid";
  const hasAmount = e.amountXof !== null;
  const isArrived = e.status === "arrived_destination";
  const TransportIcon = TRANSPORT_ICON[e.transportMode];

  // Action label dérivée de l'état (assure cohérence même si mock incomplet)
  const banner = needsPayment
    ? {
        tone: "orange" as const,
        label:
          e.transitaire.paymentPolicy === "upfront"
            ? `Paie ${formatXOF(e.amountXof!, false)} F CFA pour libérer`
            : `Paie ${formatXOF(e.amountXof!, false)} F CFA à l'arrivée`,
      }
    : isArrived
      ? {
          tone: "green" as const,
          label: "Récupère ton colis · Mermoz, Dakar",
        }
      : null;

  return (
    <Link
      href={`/expeditions/${e.id}`}
      className="group block overflow-hidden rounded-2xl border border-line bg-white transition hover:border-ink-300 hover:shadow-[var(--shadow-kamoo-md)]"
    >
      {/* BANNER d'action (si pertinent) */}
      {banner && (
        <div
          className={cn(
            "flex items-center justify-between gap-3 px-4 py-2 text-[12.5px] font-bold text-white",
            banner.tone === "orange" && "bg-kamoo-orange-500",
            banner.tone === "green" && "bg-emerald-600",
          )}
        >
          <span className="inline-flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="truncate">{banner.label}</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 text-[12px] opacity-95 transition group-hover:opacity-100">
            Action rapide
            <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
          </span>
        </div>
      )}

      {/* CONTENU — grille 3 colonnes : [thumb | info | side]
          Les 3 lignes du milieu (pills / produit / meta) alignent
          exactement avec les éléments à droite (amount / spacer / bouton).
          La gap-y régulière garantit un rythme vertical homogène. */}
      <div className="grid grid-cols-[44px_1fr_auto] items-center gap-x-4 p-4">
        {/* COLONNE 1 — thumb produit (centré verticalement sur 3 lignes) */}
        <div
          className="row-span-3 grid h-11 w-11 place-items-center rounded-xl text-[22px] leading-none"
          style={{ background: e.thumb.bg }}
        >
          {e.thumb.emoji}
        </div>

        {/* COLONNE 2 — info (3 lignes : pills / produit / meta) */}
        {/* Ligne 1 : code + pills */}
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px]">
          <span className="font-mono-kamoo font-bold text-ink-500">
            {e.publicCode}
          </span>
          <StatusPill
            tone={isPaid ? "green" : "red"}
            icon={isPaid ? <Check className="h-3 w-3" /> : undefined}
            label={PAYMENT_STATUS_LABELS[e.paymentStatus]}
          />
          <StatusPill
            tone={positionTone(e.status)}
            icon={positionIcon(e.status)}
            label={STATUS_LABELS[e.status]}
          />
        </div>

        {/* COLONNE 3 (ligne 1) — montant aligné à droite avec les pills */}
        <div className="text-right leading-none">
          {hasAmount ? (
            <>
              <span
                className={cn(
                  "font-display text-[18px] font-extrabold tabular-nums",
                  needsPayment
                    ? "text-kamoo-orange-600"
                    : "text-ink-900",
                )}
              >
                {formatXOF(e.amountXof!, false)}
              </span>
              <span className="ml-1 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                F CFA
              </span>
            </>
          ) : (
            <span className="text-[11.5px] font-semibold text-ink-400">
              Devis à venir
            </span>
          )}
        </div>

        {/* COLONNE 2 (ligne 2) — produit (nom + co-produits) */}
        <h3 className="mt-2 min-w-0 truncate text-[15px] font-bold leading-tight text-ink-900">
          {e.productName}
          {e.otherProductsCount > 0 && (
            <span className="ml-1 font-medium text-ink-500">
              et {e.otherProductsCount}{" "}
              {e.otherProductsCount > 1 ? "autres" : "autre"}
            </span>
          )}
        </h3>

        {/* COLONNE 3 (ligne 2) — vide pour conserver l'alignement vertical */}
        <div className="mt-2" />

        {/* COLONNE 2 (ligne 3) — meta : transitaire · mode · ETA */}
        <div className="mt-2.5 flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] text-ink-500">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="grid h-5 w-5 place-items-center rounded-md text-[9px] font-extrabold text-white"
              style={{ background: e.transitaire.avatarBg }}
              title={e.transitaire.name}
            >
              {e.transitaire.avatar}
            </span>
            <span className="font-semibold text-ink-700">
              {e.transitaire.name}
            </span>
            <span className="inline-flex items-center gap-0.5 text-kamoo-orange-500">
              <Star className="h-3 w-3 fill-current" />
              <span className="font-bold">
                {e.transitaire.rating.toFixed(1)}
              </span>
            </span>
          </span>
          <Sep />
          <span className="inline-flex items-center gap-1">
            <TransportIcon className="h-3 w-3 text-ink-400" />
            <span className="font-semibold text-ink-700">
              {TRANSPORT_MODE_LABELS[e.transportMode]}
            </span>
          </span>
          <Sep />
          <span className="inline-flex items-center gap-1">
            {isArrived ? (
              <MapPin className="h-3 w-3 text-emerald-600" />
            ) : (
              <Clock className="h-3 w-3 text-ink-400" />
            )}
            <span className="font-semibold text-ink-700">{e.eta}</span>
          </span>
        </div>

        {/* COLONNE 3 (ligne 3) — bouton Détails aligné avec la meta */}
        <span className="mt-2.5 inline-flex shrink-0 items-center gap-1 justify-self-end rounded-lg border border-line bg-white px-2.5 py-1 text-[11.5px] font-bold text-ink-700 transition group-hover:border-kamoo-blue-600 group-hover:text-kamoo-blue-700">
          Détails
          <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

/* ─── Sub-components ─────────────────────────────────── */

type PillTone = "red" | "green" | "blue" | "amber" | "cyan" | "grey";

function StatusPill({
  tone,
  icon,
  label,
}: {
  tone: PillTone;
  icon?: React.ReactNode;
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-bold",
        tone === "red" && "bg-red-50 text-red-700",
        tone === "green" && "bg-emerald-50 text-emerald-700",
        tone === "blue" && "bg-kamoo-blue-50 text-kamoo-blue-700",
        tone === "amber" && "bg-amber-50 text-amber-700",
        tone === "cyan" && "bg-cyan-50 text-cyan-700",
        tone === "grey" && "bg-paper-2 text-ink-600",
      )}
    >
      {icon}
      {label}
    </span>
  );
}

function positionTone(status: Expedition["status"]): PillTone {
  if (status === "arrived_destination") return "green";
  if (status === "received_china") return "blue";
  return "cyan"; // awaiting_quote
}

function positionIcon(status: Expedition["status"]): React.ReactNode {
  if (status === "arrived_destination")
    return <MapPin className="h-3 w-3" />;
  if (status === "received_china") return <MapPin className="h-3 w-3" />;
  return <Clock className="h-3 w-3" />;
}

function Sep() {
  return <span className="text-ink-300">·</span>;
}
