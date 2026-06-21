"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  ImageOff,
  X,
} from "lucide-react";
import { RefuseVersementDialog } from "@/components/finance/refuse-versement-dialog";
import { PageHeader } from "@/components/kamoo/page-header";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useVersementsState } from "@/lib/hooks/use-versements-state";
import { MOCK_TODAY } from "@/lib/data/mock-finances";
import type { Versement } from "@/lib/types/finance";
import { formatXOF } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Vue détail d'un versement déclaré par un livreur. Lue côté client via
 * useVersementsState (sessionStorage) pour refléter en temps réel les
 * actions Valider/Pas reçu déclenchées depuis Aperçu ou Journal.
 *
 * Si l'id n'existe pas dans l'état persistant (versement supprimé), on
 * fallback sur le versement initial passé par le serveur.
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

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function VersementDetailView({
  initialVersement,
  backHref,
  backLabel,
}: {
  initialVersement: Versement;
  backHref: string;
  backLabel: string;
}) {
  const { versements, validateVersement, refuseVersement } =
    useVersementsState();

  // Live state si trouvé, sinon fallback sur la valeur initiale (mock).
  const versement = useMemo(
    () =>
      versements.find((v) => v.id === initialVersement.id) ?? initialVersement,
    [versements, initialVersement],
  );

  const [refusing, setRefusing] = useState<Versement | null>(null);
  const [copied, setCopied] = useState(false);
  const [proofOpen, setProofOpen] = useState(false);
  const [proofFailed, setProofFailed] = useState(false);

  const initials = getInitials(versement.versedBy.name);
  const isPending = versement.status === "en_attente_validation";

  const elapsedHours = Math.round(
    (MOCK_TODAY.getTime() - new Date(versement.date).getTime()) / 3600000,
  );

  const handleCopyId = () => {
    if (!versement.transactionId) return;
    navigator.clipboard.writeText(versement.transactionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader kicker={`${backLabel} · Versement`} title={`Versement de ${versement.versedBy.name}`} backHref={backHref} hideTitle>
        <StatusBadge status={versement.status} />
      </PageHeader>

      {/* CONTENT */}
      <div className="flex-1 overflow-auto px-10 py-6">
        <div className="mx-auto max-w-3xl space-y-5">
          {/* Titre de l'entité — déplacé hors du header (convention globale). */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
              Versement
            </div>
            <h2 className="mt-1 font-display text-2xl font-extrabold text-ink-900">
              Versement de {versement.versedBy.name}
            </h2>
          </div>
          {/* Carte récap */}
          <div className="rounded-2xl border border-line bg-white p-6">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-amber-50 text-[16px] font-bold text-amber-800 ring-2 ring-amber-100">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-lg font-extrabold text-ink-900">
                  {versement.versedBy.name}
                </div>
                <div className="text-[12.5px] text-ink-500">
                  Livreur · {formatFullDate(versement.date)} à{" "}
                  {formatTime(versement.date)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-3xl font-extrabold text-ink-900 tabular-nums">
                  {formatXOF(versement.amountXof, false)}
                  <span className="ml-1 text-[12px] font-bold text-ink-500">
                    F CFA
                  </span>
                </div>
                {isPending && elapsedHours < 48 && (
                  <div className="mt-0.5 text-[11px] font-semibold text-amber-700">
                    Déclaré il y a {elapsedHours}h
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bloc preuve & ID */}
          <div className="grid grid-cols-[1fr_1fr] gap-4">
            {/* Capture */}
            <div className="rounded-2xl border border-line bg-white p-5">
              <div className="mb-3 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
                Capture du paiement
              </div>
              {versement.proofUrl ? (
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
                      src={versement.proofUrl}
                      alt="Capture du paiement"
                      className="aspect-[4/3] w-full object-cover transition group-hover:scale-[1.02]"
                      onError={() => setProofFailed(true)}
                    />
                  )}
                </button>
              ) : (
                <div className="grid aspect-[4/3] place-items-center rounded-xl bg-red-50/40 ring-1 ring-red-100">
                  <div className="text-center">
                    <ImageOff className="mx-auto h-6 w-6 text-red-400" />
                    <div className="mt-2 text-[12px] font-bold text-red-700">
                      Aucune capture fournie
                    </div>
                    <div className="mt-0.5 text-[10.5px] text-ink-500">
                      À demander au livreur
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
                  versement.paymentMethod ? (
                    <span className="text-[13px] font-semibold text-ink-900">
                      {versement.paymentMethod}
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
                  versement.recipientPhone ? (
                    <code className="font-mono text-[12.5px] font-semibold text-ink-900">
                      {versement.recipientPhone}
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
                  versement.transactionId ? (
                    <div className="flex items-center gap-2">
                      <code className="truncate font-mono text-[12.5px] font-semibold text-ink-900">
                        {versement.transactionId}
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
              {versement.note && (
                <DetailRow
                  label="Note du livreur"
                  value={
                    <span className="text-[12.5px] italic text-ink-700">
                      « {versement.note} »
                    </span>
                  }
                />
              )}
              {versement.validatedAt && (
                <DetailRow
                  label="Validé le"
                  value={
                    <span className="text-[12.5px] font-semibold text-emerald-700">
                      {formatFullDate(versement.validatedAt)} à{" "}
                      {formatTime(versement.validatedAt)}
                    </span>
                  }
                />
              )}
              {versement.disputeId && (
                <DetailRow
                  label="Dispute liée"
                  value={
                    <code className="font-mono text-[11px] font-semibold text-red-700">
                      {versement.disputeId}
                    </code>
                  }
                />
              )}
            </div>
          </div>

          {/* Actions */}
          {isPending && (
            <div className="rounded-2xl border border-line bg-white p-5">
              <div className="mb-3 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
                Action requise
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => validateVersement(versement.id)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 text-[13.5px] font-bold text-white transition hover:bg-emerald-700 active:translate-y-px"
                >
                  <Check className="h-4 w-4" />
                  J&apos;ai bien reçu
                </button>
                <button
                  type="button"
                  onClick={() => setRefusing(versement)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-red-50 text-[13.5px] font-bold text-red-700 ring-1 ring-red-100 transition hover:bg-red-100 hover:ring-red-200 active:translate-y-px"
                >
                  <X className="h-4 w-4" />
                  Pas reçu
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <RefuseVersementDialog
        versement={refusing}
        onClose={() => setRefusing(null)}
        onCreateDispute={(v) => {
          refuseVersement(v);
          setRefusing(null);
        }}
      />

      {/* Aperçu plein écran de la capture */}
      <Dialog
        open={proofOpen}
        onOpenChange={(open) => setProofOpen(open)}
      >
        <DialogContent className="sm:max-w-3xl p-0 bg-black/95 ring-0">
          <DialogTitle className="sr-only">Capture du paiement</DialogTitle>
          {versement.proofUrl && !proofFailed ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={versement.proofUrl}
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
                <div className="mt-1 text-[11px] text-white/60">
                  (mock V1)
                </div>
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

function StatusBadge({
  status,
}: {
  status: Versement["status"];
}) {
  const config = {
    en_attente_validation: {
      label: "À valider",
      classes: "bg-amber-50 text-amber-800 ring-amber-100",
      Icon: AlertTriangle,
    },
    valide: {
      label: "Validé",
      classes: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      Icon: Check,
    },
    en_litige: {
      label: "En litige",
      classes: "bg-red-50 text-red-700 ring-red-100",
      Icon: AlertTriangle,
    },
  }[status];
  const Icon = config.Icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold ring-1",
        config.classes,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}
