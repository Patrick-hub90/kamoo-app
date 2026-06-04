"use client";

import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Versement } from "@/lib/types/finance";

/**
 * Modale ouverte quand le vendeur clique « Pas reçu » sur un versement.
 * Propose 2 actions : ouvrir une dispute (formel) ou discuter (informel).
 */
export function RefuseVersementDialog({
  versement,
  onClose,
  onCreateDispute,
}: {
  versement: Versement | null;
  onClose: () => void;
  onCreateDispute: (v: Versement) => void;
}) {
  return (
    <Dialog
      open={versement !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-sm p-5">
        <DialogTitle className="text-center font-display text-base font-extrabold text-ink-900">
          Pas reçu — que faire ?
        </DialogTitle>

        <div className="mt-1 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => versement && onCreateDispute(versement)}
            className="flex items-center justify-center gap-2 rounded-xl bg-red-50 p-3 transition hover:bg-red-100"
          >
            <AlertTriangle className="h-4 w-4 text-red-700" />
            <span className="text-[13px] font-bold text-red-900">
              Ouvrir une dispute
            </span>
          </button>

          {/* Note: en V2, ajouter ici un canal de discussion direct via le
              module Messages (à implémenter). En V1, la dispute est le seul
              chemin formel — éviter un lien mort vers /messages. */}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-1 self-center text-[12px] font-semibold text-ink-500 hover:text-ink-700"
        >
          Annuler
        </button>
      </DialogContent>
    </Dialog>
  );
}
