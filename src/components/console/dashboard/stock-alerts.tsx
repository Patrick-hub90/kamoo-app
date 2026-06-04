"use client";

import { ArrowRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Stock alerts (bottom-right bento du dashboard).
 *
 * Liste verticale de notifications stock/produit :
 *   - Rupture (rouge)
 *   - Stock bas (amber)
 *   - ETA de réception prochain (bleu info)
 *
 * Header aligné avec TopProducts : petit label uppercase + gros titre
 * éditorial. CTA « Voir plus » en bas pour cohérence avec les autres
 * cards du dashboard.
 */

export type StockAlertItem = {
  /** Lucide icon component */
  icon: LucideIcon;
  title: string;
  /** Phrase descriptive courte */
  sub: string;
  /** Couleur d'accent (hex) — bg = tone+0F, border = tone+26 */
  tone: string;
  href: string;
};

type Props = {
  alerts: StockAlertItem[];
  /** Sous-titre éditorial du heading */
  subtitle?: string;
  /** Href du CTA « Voir plus » (défaut : /boutique) */
  href?: string;
};

export function StockAlerts({
  alerts,
  subtitle = "Demande attention",
  href = "/boutique",
}: Props) {
  return (
    <div className="flex h-full flex-col">
      {/* Heading — petit label uppercase + gros titre éditorial,
          identique à TopProducts pour la cohérence visuelle. */}
      <div className="mb-5">
        <p className="font-mono-kamoo text-[11px] font-extrabold uppercase tracking-[0.16em] text-ink-500">
          Alertes
        </p>
        <h3 className="mt-1.5 font-display text-[20px] font-extrabold leading-tight text-ink-900">
          {subtitle}
        </h3>
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-14 text-center">
          <span className="text-[12px] font-bold text-ink-400">
            Aucune alerte stock pour le moment
          </span>
        </div>
      ) : (
        <>
          <div className="flex flex-1 flex-col gap-2.5">
            {alerts.map((a, i) => {
              const Icon = a.icon;
              return (
                <Link
                  key={`${a.title}-${i}`}
                  href={a.href}
                  className="group flex items-start gap-3 rounded-xl border p-3 transition hover:shadow-[var(--shadow-kamoo-sm)]"
                  style={{
                    background: `${a.tone}0F`,
                    borderColor: `${a.tone}26`,
                  }}
                >
                  <div
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white"
                    style={{ color: a.tone }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-bold text-ink-900">
                      {a.title}
                    </div>
                    <div className="mt-0.5 text-[11px] text-ink-700">
                      {a.sub}
                    </div>
                  </div>
                  <ArrowRight
                    className="h-3.5 w-3.5 shrink-0 transition group-hover:translate-x-0.5"
                    style={{ color: a.tone }}
                  />
                </Link>
              );
            })}
          </div>

          {/* CTA Voir plus — même style que TopProducts, ClosingLeads,
              LiveDeliveries pour uniformité du dashboard. */}
          <Link
            href={href}
            className={cn(
              "mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2",
              "text-[11px] font-bold text-ink-700 transition hover:border-kamoo-blue-300 hover:text-kamoo-blue-700",
            )}
          >
            Voir plus
            <ArrowRight className="h-3 w-3" />
          </Link>
        </>
      )}
    </div>
  );
}
