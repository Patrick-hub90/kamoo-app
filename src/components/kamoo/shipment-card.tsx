import Link from "next/link";
import { AlertTriangle, ArrowRight, Clock, Plane, Ship } from "lucide-react";
import {
  type Expedition,
  STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  TRANSPORT_MODE_LABELS,
} from "@/lib/types/expedition";
import { StatusPill } from "./status-pill";

type Props = {
  expedition: Expedition;
};

/**
 * Carte d'une expédition dans la liste.
 *
 * Convention validée : UNE SEULE étiquette visible par card.
 *  - Si paiement attendu → "Non payé" (orange)
 *  - Sinon → statut logistique
 * Le statut secondaire apparaît en texte gris discret.
 */
export function ShipmentCard({ expedition: e }: Props) {
  const TransportIcon = e.transportMode === "sea" ? Ship : Plane;

  // Logique étiquette unique
  const showPaymentPill = e.paymentStatus === "unpaid";
  const primaryPill = showPaymentPill
    ? { tone: "orange" as const, label: PAYMENT_STATUS_LABELS.unpaid }
    : (() => {
        const tone =
          e.status === "arrived_destination"
            ? ("green" as const)
            : e.status === "received_china"
              ? ("blue" as const)
              : ("gray" as const);
        return { tone, label: STATUS_LABELS[e.status] };
      })();

  const secondaryStatusText = showPaymentPill
    ? STATUS_LABELS[e.status]
    : PAYMENT_STATUS_LABELS[e.paymentStatus];

  return (
    <Link
      href={`/expeditions/${e.id}`}
      className="group block overflow-hidden rounded-2xl border border-line bg-white transition hover:border-ink-300 hover:shadow-[var(--shadow-kamoo-md)]"
    >
      {/* Bandeau action si applicable */}
      {e.action && (
        <div
          className={`flex items-center justify-between gap-3 px-5 py-2.5 text-xs font-bold text-white ${
            e.action.urgent
              ? "bg-gradient-to-r from-kamoo-orange-500 to-kamoo-orange-600"
              : "bg-gradient-to-r from-emerald-500 to-emerald-600"
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5" />
            {e.action.label}
          </span>
          <span className="inline-flex items-center gap-1">
            Action rapide <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      )}

      {/* Contenu */}
      <div className="flex items-center gap-4 p-4">
        {/* Vignette */}
        <div
          className="grid h-14 w-14 shrink-0 place-items-center rounded-xl text-3xl"
          style={{ background: e.thumb.bg }}
        >
          {e.thumb.emoji}
        </div>

        {/* Infos */}
        <div className="min-w-0 flex-1">
          {/* Code + étiquette unique */}
          <div className="flex items-center gap-2.5">
            <span className="font-mono-kamoo text-[11.5px] font-bold text-ink-500">
              {e.publicCode}
            </span>
            <StatusPill tone={primaryPill.tone} label={primaryPill.label} />
            <span className="text-[11px] text-ink-400">·</span>
            <span className="text-[11px] text-ink-500">
              {secondaryStatusText}
            </span>
          </div>

          {/* Nom du produit */}
          <div className="mt-1 truncate text-[15px] font-bold text-ink-900">
            {e.productName}
            {e.otherProductsCount > 0 && (
              <span className="font-medium text-ink-500">
                {" et "}
                {e.otherProductsCount} autre
                {e.otherProductsCount > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Meta : transitaire · mode · ETA */}
          <div className="mt-2 flex items-center gap-3 text-[12px] text-ink-500">
            <div className="inline-flex items-center gap-1.5">
              <span
                className="grid h-5 w-5 place-items-center rounded-full text-[9px] font-extrabold text-white"
                style={{ background: e.transitaire.avatarBg }}
              >
                {e.transitaire.avatar}
              </span>
              <span className="font-semibold text-ink-700">
                {e.transitaire.name}
              </span>
              <span className="font-bold text-amber-500">
                ★ {e.transitaire.rating}
              </span>
            </div>
            <span className="h-1 w-1 rounded-full bg-ink-300" />
            <span className="inline-flex items-center gap-1">
              <TransportIcon className="h-3 w-3" />
              <span className="font-semibold text-ink-700">
                {TRANSPORT_MODE_LABELS[e.transportMode]}
              </span>
            </span>
            <span className="h-1 w-1 rounded-full bg-ink-300" />
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span className="font-semibold text-ink-700">{e.eta}</span>
            </span>
          </div>
        </div>

        {/* Chevron */}
        <ArrowRight className="h-4 w-4 text-ink-300 transition group-hover:translate-x-1 group-hover:text-ink-500" />
      </div>
    </Link>
  );
}
