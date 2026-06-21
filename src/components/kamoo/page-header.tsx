"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NotificationsBell } from "@/components/kamoo/notifications-bell";

/**
 * Header commun à TOUTES les pages console — gabarit unique :
 *   [retour?] [kicker de section] ……… [contrôles de page] [cloche]
 *
 * Le NOM de page n'est jamais affiché dans le header (présent en sr-only
 * pour l'accessibilité) — l'identité de l'écran est portée par la sidebar.
 * Les sous-pages passent `backHref` pour la flèche de retour.
 */
export function PageHeader({
  kicker,
  title,
  backHref,
  children,
  hideBell,
}: {
  kicker?: string;
  title: React.ReactNode;
  /** Si fourni, affiche une flèche de retour à gauche (sous-pages / détail). */
  backHref?: string;
  /** Contrôles de page — rendus entre le kicker et la cloche. */
  children?: React.ReactNode;
  /** Masque la cloche de notifications (contexte public Partenaires). */
  hideBell?: boolean;
}) {
  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-line bg-white">
      <div className="mx-auto flex h-[56px] max-w-[1320px] items-center gap-3 px-6">
        {backHref && (
          <Link
            href={backHref}
            aria-label="Retour"
            className="-ml-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-paper-2 text-ink-500 transition hover:text-ink-900"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        )}
        <h1 className="sr-only">{title}</h1>
        <div className="min-w-0 flex-1">
          {kicker && (
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">
              {kicker}
            </div>
          )}
        </div>
        {children}
        {!hideBell && <NotificationsBell />}
      </div>
    </header>
  );
}
