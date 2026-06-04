"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  LiveDot,
  MonoLabel,
  NumGiant,
} from "@/components/console/primitives";
import { ConsoleStatusPill } from "@/components/console/status-pill";
import type { PillTone } from "@/components/console/status-pill";
import {
  CLOSING_STATUS_LABELS,
  type ClosingStatus,
} from "@/lib/types/closing";
import { cn } from "@/lib/utils";

/* Mapping ClosingStatus → PillTone, calé sur les couleurs utilisées dans
 *  la page /closing (cf. statusClasses()). On n'a pas cyan/amber dans la
 *  palette PillTone — on tombe sur la teinte la plus proche :
 *    livraison_en_cours → blue (cyan ≈ blue dans la palette console)
 *    injoignable        → gray (amber muté ≈ gris neutre éteint)
 *  Si on veut un jour la fidélité 100%, ajouter cyan + amber à
 *  ConsoleStatusPill. */
const CLOSING_STATUS_TONE: Record<ClosingStatus, PillTone> = {
  nouvelle: "blue",
  rappele: "orange",
  livraison_en_cours: "blue",
  livre: "green",
  annule: "red",
  injoignable: "gray",
};

/**
 * Closing card — visible dans la colonne droite du bento principal.
 *
 * Affiche en grand le nombre total de clients OBTENUS (toutes étapes du
 * funnel confondues), un mini funnel coloré (à appeler / confirmés /
 * annulés), puis la liste des 3 prochains leads avec code commande,
 * montant, produits, statut et délai. CTA « Voir plus » vers la page
 * complète Closing.
 */

export type ClosingLead = {
  /** Code commande (ex: « ORD-SN-00128 »), sert aussi d'href vers /closing/[id] */
  orderId: string;
  /** Montant total de la commande, déjà formaté (ex: « 18 500 F »).
   *  Affiché en accent vert à côté du code — signal de priorité pour
   *  la closeuse (un appel à 50k F prime sur un appel à 5k F). */
  amountLabel: string;
  /** Label du produit principal (1er article de la commande), ex:
   *  « 1× Crème éclaircissante ». Affiché en sous-ligne. */
  productLabel: string;
  /** Nombre d'articles supplémentaires (au-delà du principal).
   *  Si > 0, on affiche un petit « + N » discret à droite du produit
   *  principal pour signaler que la commande est multi-articles. */
  extraItemsCount: number;
  /** Statut canonique du module closing — la pill rend automatiquement
   *  le label depuis CLOSING_STATUS_LABELS et le tone via
   *  CLOSING_STATUS_TONE, alignés avec la page /closing. */
  status: ClosingStatus;
  /** Délai d'appel ou temps depuis dernière activité — « 2 min », « 1 h » */
  mins: string;
};

type FunnelBucket = {
  count: number;
  label: string;
  color: string;
};

type Props = {
  /** Nb total de commandes APPELÉES par la closeuse — c'est-à-dire toutes
   *  les assignations sauf celles encore en statut `nouvelle` (jamais
   *  appelées). Mesure le volume de travail traité par la closeuse. */
  totalCalled: number;
  /** Buckets pour la mini funnel (3 max : À appeler / Confirmés / Annulés) */
  buckets: FunnelBucket[];
  /** Liste des 3 prochains leads */
  leads: ClosingLead[];
  /** Href vers la page Closing */
  href?: string;
};

export function ClosingLeadsCard({
  totalCalled,
  buckets,
  leads,
  href = "/closing",
}: Props) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 pt-4.5 pb-3">
        <LiveDot color="#16A34A" />
        <MonoLabel>Closing en direct</MonoLabel>
      </div>

      {/* Big number — total commandes appelées par la closeuse */}
      <div className="px-5 pb-4">
        <div className="flex items-baseline gap-2.5">
          <NumGiant size={48}>{totalCalled}</NumGiant>
          <div className="flex-1">
            <div className="text-sm font-bold leading-tight text-ink-900">
              commandes appelées
            </div>
          </div>
        </div>

        {/* Mini funnel — 3 buckets côte à côte */}
        <div className="mt-3 flex gap-1">
          {buckets.map((b) => (
            <div
              key={b.label}
              className="min-w-0 flex-1 basis-0 rounded-md px-2 py-1.5 text-center"
              style={{
                background: `${b.color}14`,
              }}
            >
              <div
                className="font-mono-kamoo text-[14px] font-extrabold leading-none"
                style={{ color: b.color }}
              >
                {b.count}
              </div>
              <div
                className="mt-1 truncate text-[9px] font-bold"
                style={{ color: b.color }}
              >
                {b.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Commandes list — empty state minimal (juste le texte centré, pas
          de CTA quand il n'y a rien à voir) OU liste des leads + CTA.
          Fond uniforme avec le reste du card (pas de zone beige séparée). */}
      <div className="border-t border-line px-5 py-4">
        {leads.length === 0 ? (
          <div className="flex items-center justify-center py-14 text-center">
            <span className="text-[12px] font-bold text-ink-400">
              Aucune commande à traiter
            </span>
          </div>
        ) : (
          <>
            {/* Items séparés par une fine hairline (border-line/60) ; les
                premières/dernières lignes n'ont pas de padding superflu. */}
            <div className="flex flex-col divide-y divide-line/60">
              {leads.map((lead, i) => (
                <Link
                  key={lead.orderId}
                  href={`/closing/${lead.orderId}`}
                  className={cn(
                    "group/row -mx-2 flex items-center gap-3 rounded-md px-2 transition",
                    "hover:bg-paper-2",
                    i === 0
                      ? "pb-3"
                      : i === leads.length - 1
                        ? "pt-3"
                        : "py-3",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="truncate font-mono-kamoo text-[12px] font-extrabold tracking-tight text-ink-900 transition-colors group-hover/row:text-kamoo-blue-700">
                        {lead.orderId}
                      </span>
                      <span className="shrink-0 font-mono-kamoo text-[12px] font-extrabold tabular-nums text-emerald-700">
                        {lead.amountLabel}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-baseline gap-1.5">
                      <span className="truncate text-[11.5px] text-ink-500">
                        {lead.productLabel}
                      </span>
                      {lead.extraItemsCount > 0 && (
                        <span
                          className="shrink-0 rounded-md bg-ink-100 px-1.5 py-px font-mono-kamoo text-[10px] font-bold text-ink-600"
                          title={`${lead.extraItemsCount} produit${lead.extraItemsCount > 1 ? "s" : ""} en plus`}
                        >
                          +{lead.extraItemsCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <ConsoleStatusPill
                    label={CLOSING_STATUS_LABELS[lead.status]}
                    tone={CLOSING_STATUS_TONE[lead.status]}
                    dot
                  />
                  <span className="w-10 shrink-0 text-right font-mono-kamoo text-[10.5px] text-ink-400">
                    {lead.mins}
                  </span>
                </Link>
              ))}
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
