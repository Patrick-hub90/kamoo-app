import Link from "next/link";
import {
  ArrowRight,
  Check,
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
 *  • Gauche : logo transitaire + code expédition
 *  • Centre : produit, statuts, méta (transitaire / mode / créée / ETA)
 *  • Droite haut : montant
 *  • Droite bas : bouton Payer (si paiement requis) ou check vert "Payé"
 *
 * Toutes les infos clés visibles en 1 seconde.
 */
export function ShipmentCard({ expedition: e }: Props) {
  const TransportIcon = TRANSPORT_ICON[e.transportMode];
  const needsPayment =
    e.paymentStatus === "unpaid" && e.amountXof !== null;
  const hasAmount = e.amountXof !== null;

  return (
    <Link
      href={`/expeditions/${e.id}`}
      className="group flex items-stretch gap-4 rounded-2xl border border-line bg-white p-4 transition hover:border-ink-300"
    >
      {/* GAUCHE : logo transitaire + code expédition */}
      <div className="flex w-[88px] shrink-0 flex-col items-center justify-between gap-2">
        <div
          className="grid h-12 w-12 place-items-center rounded-xl text-sm font-extrabold text-white"
          style={{ background: e.transitaire.avatarBg }}
          title={e.transitaire.name}
        >
          {e.transitaire.avatar}
        </div>
        <span className="font-mono-kamoo text-[10.5px] font-bold text-ink-500">
          #{e.publicCode.replace(/^KMO-/, "")}
        </span>
      </div>

      {/* CENTRE : infos */}
      <div className="min-w-0 flex-1">
        {/* Ligne 1 — Produit */}
        <div className="truncate text-[15px] font-bold text-ink-900">
          {e.productName}
          {e.otherProductsCount > 0 && (
            <span className="font-medium text-ink-500">
              {" + "}
              {e.otherProductsCount}
            </span>
          )}
        </div>

        {/* Ligne 2 — Position + paiement */}
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

        {/* Ligne 3 — Meta complète */}
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

      {/* DROITE : montant en haut + action en bas */}
      <div className="flex w-32 shrink-0 flex-col items-end justify-between">
        {hasAmount ? (
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
              Montant
            </div>
            <div
              className={`font-display text-[16px] font-extrabold leading-tight ${
                needsPayment
                  ? "text-kamoo-orange-600"
                  : "text-ink-900"
              }`}
            >
              {formatXOF(e.amountXof!, false)}
            </div>
            <div className="text-[10px] font-bold text-ink-500">F CFA</div>
          </div>
        ) : (
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
              Devis
            </div>
            <div className="text-[12px] font-semibold text-ink-400">
              à venir
            </div>
          </div>
        )}

        {needsPayment ? (
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-kamoo-orange-500 px-3 py-1.5 text-[12px] font-bold text-white transition group-hover:bg-kamoo-orange-600">
            <Wallet className="h-3.5 w-3.5" />
            Payer
            <ArrowRight className="h-3 w-3" />
          </div>
        ) : e.paymentStatus === "paid" ? (
          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
            <Check className="h-3 w-3" />
            Payé
          </div>
        ) : (
          <span className="text-[11px] font-medium text-ink-400">—</span>
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
