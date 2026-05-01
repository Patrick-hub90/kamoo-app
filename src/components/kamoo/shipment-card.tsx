import Link from "next/link";
import { ArrowRight, ChevronRight, Clock } from "lucide-react";
import {
  type Expedition,
  STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/types/expedition";
import { StatusPill } from "./status-pill";

type Props = {
  expedition: Expedition;
};

/**
 * Carte d'une expédition dans la liste.
 *
 * Direction : Wave-style minimaliste.
 *  - Thumbnail emoji sur fond neutre paper-2 (plus de dégradés colorés)
 *  - Hiérarchie typographique forte (titre gros, méta discrète)
 *  - UNE SEULE étiquette colorée par card
 *  - Pas d'icônes superflues (transitaire avatar / mode transport / star colorée)
 *  - Action en bandeau bas, sobre (border-top + texte + flèche)
 */
export function ShipmentCard({ expedition: e }: Props) {
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
      className="group block overflow-hidden rounded-2xl border border-line bg-white transition hover:border-ink-300"
    >
      {/* Contenu principal */}
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Vignette neutre */}
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-paper-2 text-2xl">
          {e.thumb.emoji}
        </div>

        {/* Infos */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <span className="truncate text-[15px] font-bold text-ink-900">
              {e.productName}
              {e.otherProductsCount > 0 && (
                <span className="font-medium text-ink-500">
                  {" + "}
                  {e.otherProductsCount}
                </span>
              )}
            </span>
            <StatusPill tone={primaryPill.tone} label={primaryPill.label} />
          </div>

          <div className="mt-1 flex items-center gap-2 text-[12px] text-ink-500">
            <span className="font-mono-kamoo">{e.publicCode}</span>
            <span className="text-ink-300">·</span>
            <span>{e.transitaire.name}</span>
            <span className="text-ink-300">·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {e.eta}
            </span>
          </div>

          <div className="mt-0.5 text-[11px] text-ink-400">
            {secondaryStatusText}
          </div>
        </div>

        {/* Chevron à droite */}
        <ChevronRight className="h-4 w-4 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-ink-500" />
      </div>

      {/* Bandeau action (si nécessaire) — sobre, pas un gradient */}
      {e.action && (
        <div
          className={`flex items-center justify-between border-t border-line px-5 py-2.5 text-[12.5px] font-semibold ${
            e.action.urgent
              ? "bg-kamoo-orange-50 text-kamoo-orange-700"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          <span>{e.action.label}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </div>
      )}
    </Link>
  );
}
