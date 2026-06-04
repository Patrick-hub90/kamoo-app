"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { MonoLabel } from "@/components/console/primitives";
import { formatXOF } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Dernières opérations — feed compact des derniers mouvements cash (in/out).
 * S'affiche dans le bento principal du dashboard sous le chart d'efficacité.
 *
 * Chaque ligne :
 *   [12:14] · [● in/out] · Qui · Quoi    +X F / −X F
 */

export type OperationRow = {
  /** Heure HH:MM (string déjà formatée pour éviter les locale issues) */
  time: string;
  /** "in" = argent qui rentre, "out" = sort */
  kind: "in" | "out";
  /** Acteur — ex: "Awa Diop · Dakar" */
  who: string;
  /** Description courte — ex: "Crème éclaircissante" */
  what: string;
  /** Montant signé en F CFA (positif si in, négatif si out) */
  amountXof: number;
};

type Props = {
  operations: OperationRow[];
  /** Href vers le journal complet (ex: "/finances/journal") */
  seeAllHref?: string;
};

export function RecentOperations({
  operations,
  seeAllHref = "/finances/journal",
}: Props) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <MonoLabel>Dernières opérations</MonoLabel>
        <Link
          href={seeAllHref}
          className="inline-flex items-center gap-1 text-[11px] text-ink-500 hover:text-kamoo-blue-700"
        >
          Tout voir
          <ArrowRight className="h-2.5 w-2.5" />
        </Link>
      </div>
      <div className="flex flex-col">
        {operations.map((op, i) => (
          <div
            key={`${op.time}-${i}`}
            className={cn(
              "flex items-center gap-3 py-2.5",
              i < operations.length - 1 && "border-b border-paper-2",
            )}
          >
            <span className="w-9 font-mono-kamoo text-[11px] text-ink-400">
              {op.time}
            </span>
            <span
              className={cn(
                "h-1.5 w-1.5 shrink-0 rounded-full",
                op.kind === "in" ? "bg-emerald-500" : "bg-red-500",
              )}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold text-ink-900">
                {op.who}
              </div>
              <div className="truncate text-[11px] text-ink-500">{op.what}</div>
            </div>
            <div
              className={cn(
                "shrink-0 font-mono-kamoo text-[13px] font-bold tabular-nums",
                op.kind === "in" ? "text-emerald-700" : "text-ink-900",
              )}
            >
              {op.kind === "in" ? "+" : "−"}
              {formatXOF(Math.abs(op.amountXof), false)}{" "}
              <span className="text-[10px] font-medium text-ink-400">F</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
