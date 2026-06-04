"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Copy,
  ImageOff,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MOVEMENT_TYPE_LABELS,
  MOVEMENT_TYPE_TONE,
  MOVEMENT_TYPES_REQUIRING_PARTNER_CONFIRMATION,
  PARTNER_TYPE_LABELS,
  type FinanceMovement,
} from "@/lib/types/finance";
import { formatXOF } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Vue détail d'un mouvement sortant payé : affiche la preuve de paiement,
 * le canal, l'ID transaction, et l'état de confirmation par le partenaire.
 *
 * V2 : depuis cette page, le partenaire (closeuse / transitaire) pourra
 * confirmer la réception via son propre login (PWA partenaire).
 */

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MovementDetailView({
  movement,
  backHref,
  backLabel,
}: {
  movement: FinanceMovement;
  backHref: string;
  backLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  const [proofOpen, setProofOpen] = useState(false);
  const [proofFailed, setProofFailed] = useState(false);

  const tone = MOVEMENT_TYPE_TONE[movement.type];
  const typeLabel = MOVEMENT_TYPE_LABELS[movement.type];
  const partnerLabel = movement.partner
    ? PARTNER_TYPE_LABELS[movement.partner.type]
    : "";
  const requiresConfirmation =
    MOVEMENT_TYPES_REQUIRING_PARTNER_CONFIRMATION.has(movement.type);
  const awaitingPartner =
    requiresConfirmation && !movement.partnerConfirmedAt;

  const handleCopyId = () => {
    if (!movement.transactionId) return;
    navigator.clipboard.writeText(movement.transactionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-full flex-col">
      {/* HEADER */}
      <div className="flex items-center gap-4 border-b border-line bg-white px-10 py-4">
        <Link
          href={backHref}
          className="grid h-9 w-9 place-items-center rounded-lg bg-paper-2 text-ink-500 hover:text-ink-700"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
            {backLabel} · {typeLabel}
          </div>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-ink-900">
            {movement.description}
          </h1>
        </div>
        <PartnerConfirmationBadge
          requiresConfirmation={requiresConfirmation}
          confirmedAt={movement.partnerConfirmedAt}
          partnerName={movement.partner?.name}
        />
      </div>

      <div className="flex-1 overflow-auto px-10 py-6">
        <div className="mx-auto max-w-3xl space-y-5">
          {/* Carte récap */}
          <div className="rounded-2xl border border-line bg-white p-6">
            <div className="flex items-center gap-4">
              <span
                className={cn(
                  "inline-flex items-center rounded-md px-2.5 py-1 text-[12px] font-bold",
                  tone.bg,
                  tone.fg,
                )}
              >
                {typeLabel}
              </span>
              <div className="min-w-0 flex-1">
                {movement.partner && (
                  <div className="text-[12.5px]">
                    <span className="font-semibold text-ink-900">
                      {movement.partner.name}
                    </span>
                    <span className="ml-1.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
                      {partnerLabel}
                    </span>
                  </div>
                )}
                {movement.paidAt && (
                  <div className="mt-0.5 text-[12.5px] text-ink-500">
                    Payé le {formatFullDate(movement.paidAt)} à{" "}
                    {formatTime(movement.paidAt)}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="font-display text-3xl font-extrabold text-ink-900 tabular-nums">
                  −{formatXOF(movement.amountXof, false)}
                  <span className="ml-1 text-[12px] font-bold text-ink-500">
                    F CFA
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Preuve & métadonnées */}
          <div className="grid grid-cols-[1fr_1fr] gap-4">
            {/* Capture */}
            <div className="rounded-2xl border border-line bg-white p-5">
              <div className="mb-3 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
                Capture du paiement
              </div>
              {movement.proofUrl ? (
                <button
                  type="button"
                  onClick={() => setProofOpen(true)}
                  className="group block w-full overflow-hidden rounded-xl bg-paper-2 ring-1 ring-line transition hover:ring-kamoo-blue-600"
                >
                  {proofFailed ? (
                    <div className="grid aspect-[4/3] place-items-center text-center">
                      <div>
                        <div className="mb-1.5 text-2xl">📸</div>
                        <div className="text-[12px] font-bold text-ink-700">
                          Aperçu indisponible
                        </div>
                        <div className="mt-0.5 text-[10.5px] text-ink-400">
                          (mock V1)
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={movement.proofUrl}
                      alt="Capture du paiement"
                      className="aspect-[4/3] w-full object-cover transition group-hover:scale-[1.02]"
                      onError={() => setProofFailed(true)}
                    />
                  )}
                </button>
              ) : (
                <div className="grid aspect-[4/3] place-items-center rounded-xl bg-paper-2/40 ring-1 ring-line">
                  <div className="text-center">
                    <ImageOff className="mx-auto h-6 w-6 text-ink-400" />
                    <div className="mt-2 text-[12px] font-bold text-ink-700">
                      Aucune capture
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Métadonnées */}
            <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5">
              <DetailRow
                label="Moyen de paiement"
                value={
                  movement.paymentMethod ? (
                    <span className="text-[13px] font-semibold text-ink-900">
                      {movement.paymentMethod}
                    </span>
                  ) : (
                    <span className="text-[12px] italic text-ink-400">
                      Non renseigné
                    </span>
                  )
                }
              />
              <DetailRow
                label="Numéro destinataire"
                value={
                  movement.recipientPhone ? (
                    <code className="font-mono text-[12.5px] font-semibold text-ink-900">
                      {movement.recipientPhone}
                    </code>
                  ) : (
                    <span className="text-[12px] italic text-ink-400">
                      —
                    </span>
                  )
                }
              />
              <DetailRow
                label="ID transaction"
                value={
                  movement.transactionId ? (
                    <div className="flex items-center gap-2">
                      <code className="truncate font-mono text-[12.5px] font-semibold text-ink-900">
                        {movement.transactionId}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyId}
                        title="Copier"
                        className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-paper-2 text-ink-500 transition hover:bg-kamoo-blue-50 hover:text-kamoo-blue-700"
                      >
                        {copied ? (
                          <Check className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <span className="text-[12px] italic text-ink-400">
                      Non renseigné
                    </span>
                  )
                }
              />
              {movement.partnerConfirmedAt && (
                <DetailRow
                  label={`Confirmé par ${movement.partner?.name ?? "le partenaire"}`}
                  value={
                    <span className="text-[12.5px] font-semibold text-emerald-700">
                      {formatFullDate(movement.partnerConfirmedAt)} à{" "}
                      {formatTime(movement.partnerConfirmedAt)}
                    </span>
                  }
                />
              )}
            </div>
          </div>

          {/* Bandeau d'attente confirmation */}
          {awaitingPartner && (
            <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="text-[12.5px] text-ink-700">
                <span className="font-bold text-amber-900">
                  En attente de confirmation
                </span>
                <span className="ml-1 text-ink-500">
                  · {movement.partner?.name ?? "le partenaire"} doit confirmer
                  avoir reçu le virement
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Aperçu plein écran de la capture */}
      <Dialog open={proofOpen} onOpenChange={(open) => setProofOpen(open)}>
        <DialogContent className="sm:max-w-3xl p-0 bg-black/95 ring-0">
          <DialogTitle className="sr-only">Capture du paiement</DialogTitle>
          {movement.proofUrl && !proofFailed ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={movement.proofUrl}
              alt="Capture du paiement"
              className="max-h-[85vh] w-full object-contain"
              onError={() => setProofFailed(true)}
            />
          ) : (
            <div className="grid aspect-[4/3] place-items-center text-white">
              <div className="text-center">
                <div className="mb-2 text-4xl">📸</div>
                <div className="text-[14px] font-bold">
                  Aperçu indisponible
                </div>
                <div className="mt-1 text-[11px] text-white/60">(mock V1)</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
        {label}
      </div>
      <div className="text-ink-900">{value}</div>
    </div>
  );
}

function PartnerConfirmationBadge({
  requiresConfirmation,
  confirmedAt,
  partnerName,
}: {
  requiresConfirmation: boolean;
  confirmedAt?: string;
  partnerName?: string;
}) {
  // Pour les types qui ne demandent pas de confirmation : "Payé"
  if (!requiresConfirmation) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-bold text-emerald-700 ring-1 ring-emerald-100">
        <Check className="h-3.5 w-3.5" />
        Payé
      </span>
    );
  }
  if (confirmedAt) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-bold text-emerald-700 ring-1 ring-emerald-100">
        <Check className="h-3.5 w-3.5" />
        Confirmé{partnerName ? ` par ${partnerName.split(" ")[0]}` : ""}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[12px] font-bold text-amber-800 ring-1 ring-amber-100">
      <AlertTriangle className="h-3.5 w-3.5" />
      À confirmer
    </span>
  );
}
