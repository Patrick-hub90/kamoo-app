"use client";

import { NotificationsBell } from "@/components/kamoo/notifications-bell";

/**
 * Header commun à toutes les pages console — même gabarit que « Vue
 * d'ensemble » : bandeau blanc sticky, kicker + titre à gauche, puis les
 * contrôles de page (période, CTA…) et TOUJOURS la cloche en dernier.
 *
 * Convention d'ordre (identique partout) :
 *   [kicker/titre] ……… [widget période] [actions de page] [cloche]
 */
export function PageHeader({
  kicker,
  title,
  children,
}: {
  kicker?: string;
  title: React.ReactNode;
  /** Contrôles de page — rendus entre le titre et la cloche */
  children?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-line bg-white">
      <div className="mx-auto flex h-[68px] max-w-[1320px] items-center gap-3 px-6">
        <div className="min-w-0 flex-1">
          {kicker && (
            <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-ink-400">
              {kicker}
            </div>
          )}
          <div className="truncate text-[19px] font-medium tracking-tight text-ink-900">
            {title}
          </div>
        </div>
        {children}
        <NotificationsBell />
      </div>
    </header>
  );
}
