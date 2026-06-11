"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import {
  DISPUTE_REASONS,
  useDisputes,
  type DisputeReason,
} from "@/lib/hooks/use-disputes";
import type { PartnerRole } from "@/lib/hooks/use-partners";

/**
 * Modale « Ouvrir une dispute » — partagée par tous les points d'entrée
 * (profil partenaire, détail expédition, détail commande/livraison).
 *
 * Ce que l'utilisateur doit comprendre AVANT d'ouvrir :
 *  - le profil du partenaire sera publiquement marqué « En dispute » ;
 *  - Kamoo n'intervient qu'après 72 h si rien n'est réglé entre vous.
 */
export function OpenDisputeModal({
  againstRole,
  againstSlug,
  againstName,
  context,
  onClose,
}: {
  againstRole: PartnerRole;
  againstSlug: string;
  againstName: string;
  /** Contexte métier affiché et enregistré, ex. « Expédition KMO-SN-78421 » */
  context?: string;
  onClose: () => void;
}) {
  const { open } = useDisputes();
  const [reason, setReason] = useState<DisputeReason | "">("");
  const [description, setDescription] = useState("");
  const valid = reason !== "" && description.trim().length >= 20;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-kamoo-blue-900/30 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h3 className="inline-flex items-center gap-2 text-[15px] font-bold text-ink-900">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Ouvrir une dispute
          </h3>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-lg text-ink-400 transition hover:bg-paper-2 hover:text-ink-900" aria-label="Fermer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex max-h-[65vh] flex-col gap-3.5 overflow-y-auto px-5 py-4">
          <p className="text-[12.5px] leading-relaxed text-ink-500">
            Dispute contre <b className="text-ink-700">{againstName}</b>
            {context && (
              <>
                {" "}
                · <span className="text-ink-700">{context}</span>
              </>
            )}
            . Son profil sera <b>publiquement marqué « En dispute »</b> tant qu&apos;elle
            n&apos;est pas réglée.
          </p>

          <div>
            <label className="mb-1 block text-[11.5px] font-semibold text-ink-600">
              Motif <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as DisputeReason)}
              className="h-10 w-full rounded-lg border border-line bg-white px-3 text-[13px] text-ink-900 outline-none focus:border-kamoo-blue-600"
            >
              <option value="" disabled>
                Choisir un motif…
              </option>
              {DISPUTE_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11.5px] font-semibold text-ink-600">
              Décrivez précisément le problème <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Faits, dates, montants… (min. 20 caractères) — ces éléments serviront si Kamoo doit intervenir."
              className="w-full resize-none rounded-lg border border-line bg-white px-3 py-2 text-[13px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600"
            />
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] leading-relaxed text-amber-800">
            Vous avez <b>72 h</b> pour régler le problème directement avec{" "}
            {againstName.split(" ")[0]} (via le chat). Passé ce délai, l&apos;option{" "}
            <b>« Faire intervenir Kamoo »</b> s&apos;active pour vous deux.
          </div>
        </div>

        <div className="flex gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="flex-1 rounded-lg border border-line bg-white py-2.5 text-[13px] font-semibold text-ink-700 transition hover:bg-paper-2">
            Annuler
          </button>
          <button
            disabled={!valid}
            onClick={() => {
              open({
                againstRole,
                againstSlug,
                againstName,
                reason: reason as DisputeReason,
                description: description.trim(),
                context,
              });
              onClose();
            }}
            className="flex-1 rounded-lg bg-red-600 py-2.5 text-[13px] font-bold text-white transition hover:bg-red-700 disabled:opacity-40"
          >
            Ouvrir la dispute
          </button>
        </div>
      </div>
    </div>
  );
}
