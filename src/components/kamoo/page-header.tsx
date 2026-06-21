"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NotificationsBell } from "@/components/kamoo/notifications-bell";
import { MarketSelector } from "@/components/layout/market-selector";

/**
 * Header commun à TOUTES les pages console — gabarit unique :
 *   [retour?]  [kicker de section / NOM DE PAGE] ……… [cloche] [marché]
 *
 * Le nom de page est affiché (le kicker au-dessus situe la section). Les
 * sous-pages passent `backHref` pour la flèche de retour. Les boutons d'action
 * NE vivent plus ici : ils sont descendus dans le corps de la page (barre
 * d'outils du contenu). Le `children` reste pour de petits éléments
 * contextuels (badges de statut sur les pages détail).
 *
 * À droite, ordre fixe : cloche de notifications puis sélecteur de marché.
 */
export function PageHeader({
  kicker,
  title,
  backHref,
  children,
  hideBell,
  hideTitle,
  hideMarket,
}: {
  kicker?: string;
  title: React.ReactNode;
  /** Si fourni, affiche une flèche de retour à gauche (sous-pages / détail). */
  backHref?: string;
  /** Petits éléments contextuels (badges). Pas de boutons d'action ici. */
  children?: React.ReactNode;
  /** Masque la cloche de notifications (contexte public Partenaires). */
  hideBell?: boolean;
  /** Masque le titre visible (pages détail qui affichent déjà le nom dans le corps). */
  hideTitle?: boolean;
  /** Masque le sélecteur de marché (contexte public Partenaires). */
  hideMarket?: boolean;
}) {
  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-line bg-white">
      <div className="mx-auto flex min-h-[60px] max-w-[1320px] items-center gap-3 px-6 py-2.5">
        {backHref && (
          <Link
            href={backHref}
            aria-label="Retour"
            className="-ml-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-paper-2 text-ink-500 transition hover:text-ink-900"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          {kicker && (
            <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-400">
              {kicker}
            </div>
          )}
          {hideTitle ? (
            <h1 className="sr-only">{title}</h1>
          ) : (
            <h1 className="truncate text-[16px] font-medium leading-tight tracking-tight text-ink-900">
              {title}
            </h1>
          )}
        </div>
        {children}
        {!hideBell && <NotificationsBell />}
        {!hideMarket && <MarketSelector />}
      </div>
    </header>
  );
}
