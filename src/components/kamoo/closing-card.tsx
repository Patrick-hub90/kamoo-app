import {
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  RotateCcw,
  XCircle,
} from "lucide-react";
import {
  type ClosingAssignment,
  CLOSING_STATUS_LABELS,
  CANCELLATION_REASON_LABELS,
} from "@/lib/types/closing";
import { formatXOF } from "@/lib/format";
import { StatusPill } from "./status-pill";

type Props = {
  assignment: ClosingAssignment;
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `il y a ${diffHr}h`;
  const diffDays = Math.floor(diffHr / 24);
  return `il y a ${diffDays}j`;
}

export function ClosingCard({ assignment: a }: Props) {
  const statusTone = (() => {
    switch (a.status) {
      case "to_call":
        return "amber" as const;
      case "called":
        return "blue" as const;
      case "callback_scheduled":
        return "blue" as const;
      case "confirmed":
        return "green" as const;
      case "cancelled":
        return "red" as const;
      case "delivered":
        return "gray" as const;
    }
  })();

  const statusIcon = (() => {
    switch (a.status) {
      case "to_call":
      case "called":
        return <Phone className="h-3 w-3" />;
      case "callback_scheduled":
        return <RotateCcw className="h-3 w-3" />;
      case "confirmed":
        return <CheckCircle2 className="h-3 w-3" />;
      case "cancelled":
        return <XCircle className="h-3 w-3" />;
      case "delivered":
        return <CheckCircle2 className="h-3 w-3" />;
    }
  })();

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-line bg-white p-4">
      {/* Vignette produit */}
      <div
        className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-2xl"
        style={{ background: a.productBg }}
      >
        {a.productEmoji}
      </div>

      {/* Bloc central */}
      <div className="min-w-0 flex-1">
        {/* Ligne 1 : produit + code */}
        <div className="flex items-baseline gap-2.5">
          <span className="truncate text-[14.5px] font-bold text-ink-900">
            {a.productName}
          </span>
          <span className="font-mono-kamoo text-[11px] text-ink-400">
            {a.publicCode}
          </span>
        </div>

        {/* Ligne 2 : statut + montant + tentatives */}
        <div className="mt-1 flex items-center gap-2.5 text-[12px]">
          <StatusPill
            tone={statusTone}
            label={CLOSING_STATUS_LABELS[a.status]}
            icon={statusIcon}
          />
          <span className="text-ink-300">·</span>
          <span className="font-bold text-ink-900">
            {formatXOF(a.amountXof)}
          </span>
          {a.callAttempts > 0 && (
            <>
              <span className="text-ink-300">·</span>
              <span className="text-ink-500">
                {a.callAttempts} tentative{a.callAttempts > 1 ? "s" : ""}
              </span>
            </>
          )}
        </div>

        {/* Ligne 3 : client */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-ink-500">
          <span>
            <span className="text-ink-400">Client :</span>{" "}
            <span className="font-semibold text-ink-700">{a.client.name}</span>
            {a.client.isReturning && (
              <span className="ml-1.5 inline-flex items-center rounded bg-emerald-50 px-1.5 py-0.5 text-[9.5px] font-bold uppercase text-emerald-700">
                Fidèle
              </span>
            )}
          </span>
          <span className="text-ink-300">·</span>
          <span className="inline-flex items-center gap-1">
            <Phone className="h-3 w-3" />
            <span className="font-mono-kamoo font-semibold text-ink-700">
              {a.client.phone}
            </span>
          </span>
          <span className="text-ink-300">·</span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span className="font-semibold text-ink-700">{a.client.city}</span>
          </span>
        </div>

        {/* Ligne 4 : info contextuelle selon statut */}
        {(a.status === "callback_scheduled" && a.callbackAt) && (
          <div className="mt-1.5 inline-flex items-center gap-1 rounded bg-kamoo-blue-50 px-2 py-0.5 text-[11px] font-semibold text-kamoo-blue-700">
            <Clock className="h-3 w-3" />
            Rappel prévu : {formatDateTime(a.callbackAt)}
          </div>
        )}
        {a.status === "confirmed" && a.scheduledDeliveryAt && (
          <div className="mt-1.5 inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
            <Clock className="h-3 w-3" />
            Livraison prévue : {formatDateTime(a.scheduledDeliveryAt)}
          </div>
        )}
        {a.status === "cancelled" && a.cancellationReason && (
          <div className="mt-1.5 text-[11px] text-red-700">
            Motif : {CANCELLATION_REASON_LABELS[a.cancellationReason]}
          </div>
        )}
      </div>

      {/* Droite : dernière activité */}
      <div className="shrink-0 text-right text-[10.5px] text-ink-400">
        <div>Dernière activité</div>
        <div className="font-semibold text-ink-500">
          {formatRelativeTime(a.lastActivityAt)}
        </div>
      </div>
    </div>
  );
}
