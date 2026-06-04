"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { CodeChip, LiveDot, MonoLabel } from "@/components/console/primitives";
import {
  ConsoleStatusPill,
  type PillTone,
} from "@/components/console/status-pill";
import {
  DELIVERY_PROGRESS_LABELS,
  type DeliveryProgress,
} from "@/lib/types/closing";
import { cn } from "@/lib/utils";

/**
 * Feed live des livraisons EN COURS — UI symétrique de ClosingLeadsCard,
 * pour que les deux cards du panneau droit du dashboard se lisent pareil :
 *   [ORD-XXX]   [montant vert]                    [pill statut]   [ETA]
 *   1× Produit  [+N]
 *
 * Logique d'affichage (cf. computeDashboardData côté page) :
 *   1. On filtre sur les statuts ACTIFS uniquement : en_attente + alerte.
 *      Les livrées (effectue) ne sont pas dans le feed live — elles ont
 *      leur place dans l'historique de /livraisons.
 *   2. On trie : alertes en premier, puis en_attente par ETA croissant.
 *
 * Le statut suit le type métier `DeliveryProgress`, partagé avec
 * /livraisons :
 *   en_attente · orange · colis confié au livreur, en cours
 *   alerte     · rouge  · le livreur a un problème, action immédiate
 *   effectue   · vert   · (non affiché ici, mais le mapping reste défini
 *                          pour rester compatible avec d'autres feeds)
 */

export type DeliveryFeedItem = {
  /** Code commande (ORD-SN-XXXXX) — sert d'identifiant + d'href futur */
  orderId: string;
  /** Montant COD à percevoir, déjà formaté (« 18 000 F »).
   *  Affiché en accent vert à côté du code commande. */
  amountLabel: string;
  /** Label du produit principal (1er article), ex « 1× Crème » */
  productLabel: string;
  /** Nb d'articles supplémentaires (au-delà du principal). Si > 0,
   *  on affiche un petit « +N » à droite du produit. */
  extraItemsCount: number;
  /** Heure de la dernière modification de la commande (HH:MM ou
   *  « hier 14:30 »). Indique la fraîcheur de l'info — un signal
   *  utile dans un feed LIVE : on sait tout de suite si le statut
   *  est récent ou si la livraison stagne depuis des heures. */
  lastActivityLabel: string;
  /** Statut métier (aligné avec /livraisons) */
  status: DeliveryProgress;
};

/* Mapping DeliveryProgress → PillTone, aligné avec la palette de
 *  ProgressBadge de la page /livraisons. */
const STATUS_TONE: Record<DeliveryProgress, PillTone> = {
  en_attente: "orange",
  effectue: "green",
  alerte: "red",
};

type Props = {
  deliveries: DeliveryFeedItem[];
  /** Nombre TOTAL de livraisons actives (en_attente + alerte) dans le
   *  système — c'est-à-dire le nombre de VENTES EN COURS (chaque livraison
   *  active = une vente qui n'est pas encore encaissée). Sert au chip
   *  header « N ventes en cours ». Peut être > deliveries.length si le
   *  feed est tronqué (top 5 affichés, mais 12 en cours en réalité). */
  totalActiveCount: number;
  /** Override optionnel du label du chip (ex: « 12 en livraison »). Par
   *  défaut on affiche « N ventes en cours » à partir de `totalActiveCount`. */
  activeChipLabel?: string;
  /** Href du CTA « Voir plus » (défaut : /livraisons) */
  href?: string;
};

export function LiveDeliveriesFeed({
  deliveries,
  totalActiveCount,
  activeChipLabel,
  href = "/livraisons",
}: Props) {
  const chipText = activeChipLabel ?? `${totalActiveCount} en cours`;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pb-3 pt-4.5">
        <div className="flex items-center gap-2">
          <LiveDot color="#F97316" />
          <MonoLabel>Livraisons en direct</MonoLabel>
        </div>
        <CodeChip>{chipText}</CodeChip>
      </div>

      {/* Feed — empty state minimal (juste texte centré, pas de CTA) OU
          liste des livraisons + CTA Voir plus. Fond uniforme avec le
          reste du card (pas de zone beige séparée). */}
      <div className="border-t border-line px-5 py-4">
        {deliveries.length === 0 ? (
          <div className="flex items-center justify-center py-14 text-center">
            <span className="text-[12px] font-bold text-ink-400">
              Aucune livraison
            </span>
          </div>
        ) : (
          <>
            <div className="flex flex-col divide-y divide-line/60">
              {deliveries.map((d, i) => {
                const tone = STATUS_TONE[d.status];
                return (
                  <Link
                    key={d.orderId}
                    href={`/livraisons/${d.orderId}`}
                    className={cn(
                      "group/row -mx-2 flex items-center gap-3 rounded-md px-2 transition",
                      "hover:bg-paper-2",
                      i === 0
                        ? "pb-3"
                        : i === deliveries.length - 1
                          ? "pt-3"
                          : "py-3",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="truncate font-mono-kamoo text-[12px] font-extrabold tracking-tight text-ink-900 transition-colors group-hover/row:text-kamoo-blue-700">
                          {d.orderId}
                        </span>
                        <span className="shrink-0 font-mono-kamoo text-[12px] font-extrabold tabular-nums text-emerald-700">
                          {d.amountLabel}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-baseline gap-1.5">
                        <span className="truncate text-[11.5px] text-ink-500">
                          {d.productLabel}
                        </span>
                        {d.extraItemsCount > 0 && (
                          <span
                            className="shrink-0 rounded-md bg-ink-100 px-1.5 py-px font-mono-kamoo text-[10px] font-bold text-ink-600"
                            title={`${d.extraItemsCount} produit${d.extraItemsCount > 1 ? "s" : ""} en plus`}
                          >
                            +{d.extraItemsCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <ConsoleStatusPill
                      label={DELIVERY_PROGRESS_LABELS[d.status]}
                      tone={tone}
                      dot
                    />
                    <span
                      className="w-14 shrink-0 text-right font-mono-kamoo text-[10.5px] text-ink-400"
                      title="Dernière modification"
                    >
                      {d.lastActivityLabel}
                    </span>
                  </Link>
                );
              })}
            </div>
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
    </div>
  );
}
