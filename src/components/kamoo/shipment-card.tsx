import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  MapPin,
  Plane,
  Ship,
  Wallet,
  Zap,
} from "lucide-react";
import {
  type Expedition,
  STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  TRANSPORT_MODE_LABELS,
} from "@/lib/types/expedition";
import { formatXOF } from "@/lib/format";

type Props = {
  expedition: Expedition;
};

const TRANSPORT_ICON = {
  sea: Ship,
  air_standard: Plane,
  air_express: Zap,
} as const;

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Carte d'une expédition dans la liste.
 *
 * Disposition :
 *  • Gauche : bouton "Payer" (si à payer) OU emoji du produit
 *  • Centre : produit, position, paiement, transitaire, mode, créée, ETA
 *  • Droite : chevron
 *
 * Toutes les infos clés visibles en 1 seconde, sans surcharge.
 */
export function ShipmentCard({ expedition: e }: Props) {
  const TransportIcon = TRANSPORT_ICON[e.transportMode];
  const needsPayment =
    e.paymentStatus === "unpaid" && e.amountXof !== null;

  return (
    <Link
      href={`/expeditions/${e.id}`}
      className="group flex items-stretch gap-4 rounded-2xl border border-line bg-white p-4 transition hover:border-ink-300"
    >
      {/* GAUCHE : bouton Payer OU vignette produit */}
      {needsPayment ? (
        <div className="flex w-32 shrink-0 flex-col items-center justify-center gap-1 rounded-xl bg-kamoo-orange-500 px-3 py-3 text-white transition group-hover:bg-kamoo-orange-600">
          <Wallet className="h-4 w-4" />
          <span className="text-[11px] font-bold uppercase tracking-wider">
            Payer
          </span>
          <span className="font-display text-[15px] font-extrabold leading-none">
            {formatXOF(e.amountXof!, false)}
          </span>
          <span className="text-[10px] font-semibold opacity-90">F CFA</span>
        </div>
      ) : (
        <div className="grid w-14 shrink-0 place-items-center self-stretch rounded-xl bg-paper-2 text-2xl">
          {e.thumb.emoji}
        </div>
      )}

      {/* CENTRE : infos */}
      <div className="min-w-0 flex-1">
        {/* Ligne 1 — Produit + code */}
        <div className="flex items-baseline gap-2.5">
          <span className="truncate text-[15px] font-bold text-ink-900">
            {e.productName}
            {e.otherProductsCount > 0 && (
              <span className="font-medium text-ink-500">
                {" + "}
                {e.otherProductsCount}
              </span>
            )}
          </span>
          <span className="font-mono-kamoo text-[11px] text-ink-400">
            {e.publicCode}
          </span>
        </div>

        {/* Ligne 2 — Position + paiement (les 2 statuts clés) */}
        <div className="mt-1.5 flex items-center gap-3 text-[12.5px]">
          <span className="inline-flex items-center gap-1.5 font-semibold text-ink-900">
            <PositionDot status={e.status} />
            {STATUS_LABELS[e.status]}
          </span>
          <span className="text-ink-300">·</span>
          <span
            className={`inline-flex items-center gap-1.5 font-semibold ${
              e.paymentStatus === "paid"
                ? "text-emerald-700"
                : "text-kamoo-orange-700"
            }`}
          >
            <PaymentDot status={e.paymentStatus} />
            {PAYMENT_STATUS_LABELS[e.paymentStatus]}
          </span>
        </div>

        {/* Ligne 3 — Meta : transitaire · mode · créée · ETA */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-ink-500">
          <MetaItem label="Transitaire" value={e.transitaire.name} />
          <Sep />
          <MetaItem
            label="Mode"
            value={TRANSPORT_MODE_LABELS[e.transportMode]}
            icon={<TransportIcon className="h-3 w-3" />}
          />
          <Sep />
          <MetaItem label="Créée" value={formatDateShort(e.createdAt)} />
          <Sep />
          <MetaItem
            label="ETA"
            value={e.eta}
            icon={<MapPin className="h-3 w-3" />}
          />
        </div>
      </div>

      {/* DROITE : chevron */}
      <div className="grid place-items-center self-center text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-ink-500">
        {needsPayment ? (
          <ArrowRight className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </div>
    </Link>
  );
}

/* ─── Helpers visuels ───────────────────────────────────────────── */

function PositionDot({ status }: { status: Expedition["status"] }) {
  const color =
    status === "arrived_destination"
      ? "bg-emerald-500"
      : status === "received_china"
        ? "bg-kamoo-blue-600"
        : "bg-ink-300";
  return <span className={`h-1.5 w-1.5 rounded-full ${color}`} />;
}

function PaymentDot({ status }: { status: Expedition["paymentStatus"] }) {
  return (
    <span
      className={`h-1.5 w-1.5 rounded-full ${
        status === "paid" ? "bg-emerald-500" : "bg-kamoo-orange-500"
      }`}
    />
  );
}

function MetaItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-baseline gap-1">
      {icon && <span className="self-center">{icon}</span>}
      <span className="text-ink-400">{label} :</span>
      <span className="font-semibold text-ink-700">{value}</span>
    </span>
  );
}

function Sep() {
  return <span className="text-ink-300">·</span>;
}
