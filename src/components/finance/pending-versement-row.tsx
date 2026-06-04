"use client";

import Link from "next/link";
import { Check, X } from "lucide-react";
import type { Versement } from "@/lib/types/finance";
import { formatXOF } from "@/lib/format";
import { MOCK_TODAY } from "@/lib/data/mock-finances";

/**
 * Card d'un versement en attente de validation, avec actions Reçu / Pas reçu.
 * Composant utilisé sur Aperçu (panneau Versements à valider) et Journal
 * (lignes versements inline). Style Kamoo : 2 boutons largeur égale, sobre.
 */

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diffMs = MOCK_TODAY.getTime() - d.getTime();
  const diffH = Math.round(diffMs / 3600000);
  if (diffH < 1) return "à l'instant";
  if (diffH < 24) return `il y a ${diffH}h`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 7) return `il y a ${diffD} j`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function PendingVersementRow({
  versement,
  onValidate,
  onRefuse,
}: {
  versement: Versement;
  onValidate: () => void;
  onRefuse: () => void;
}) {
  const initials = getInitials(versement.versedBy.name);
  return (
    <div className="rounded-2xl border border-line bg-white p-3 shadow-[var(--shadow-kamoo-sm)] transition hover:border-amber-200">
      {/* Zone cliquable : ouvre la fiche détail. Les boutons ci-dessous restent
          atomiques et ne déclenchent pas la navigation. */}
      <Link
        href={`/finances/versements/${versement.id}?from=journal`}
        className="group flex items-center gap-3"
      >
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-50 text-[12px] font-bold text-amber-800 ring-2 ring-amber-100">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-bold text-ink-900 group-hover:text-kamoo-blue-700">
            {versement.versedBy.name}
          </div>
          <div className="text-[10.5px] text-ink-500">
            {formatRelative(versement.date)}
          </div>
        </div>
        <div className="font-display text-base font-extrabold text-ink-900 tabular-nums">
          {formatXOF(versement.amountXof, false)}
          <span className="ml-0.5 text-[10px] font-bold text-ink-500">F</span>
        </div>
      </Link>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onValidate}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 text-[12.5px] font-bold text-white transition hover:bg-emerald-700 active:translate-y-px"
        >
          <Check className="h-3.5 w-3.5" />
          Reçu
        </button>
        <button
          type="button"
          onClick={onRefuse}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-red-50 text-[12.5px] font-bold text-red-700 ring-1 ring-red-100 transition hover:bg-red-100 hover:ring-red-200 active:translate-y-px"
        >
          <X className="h-3.5 w-3.5" />
          Pas reçu
        </button>
      </div>
    </div>
  );
}
