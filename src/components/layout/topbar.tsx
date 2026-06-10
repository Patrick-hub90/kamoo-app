"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { NotificationsBell } from "@/components/kamoo/notifications-bell";
import { useTopbarSlot } from "./topbar-slot";

type TopbarProps = {
  /** Callback du hamburger mobile (visible uniquement < lg) */
  onMobileMenuToggle?: () => void;
};

/**
 * Topbar global — affiché uniquement sur les pages PAS encore refondues
 * (cf. HIDE_GLOBAL_TOPBAR). Le sélecteur de marché n'y figure PLUS : le
 * widget marché vit dans la sidebar (un seul endroit, pas de doublon).
 * La cloche est la vraie cloche de notifications (synchrone partout).
 */
export function Topbar({ onMobileMenuToggle }: TopbarProps = {}) {
  const slot = useTopbarSlot();

  return (
    <header className="flex items-center gap-3 border-b border-line bg-white px-4 py-3 sm:px-6 lg:px-8 lg:py-3">
      {/* Hamburger mobile uniquement < lg */}
      <button
        type="button"
        onClick={onMobileMenuToggle}
        className="rounded-lg p-2 text-ink-700 hover:bg-paper-2 lg:hidden"
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Logo Kamoo visible sur mobile uniquement */}
      <Link
        href="/dashboard"
        className="font-display text-lg font-extrabold tracking-tight text-kamoo-blue-900 lg:hidden"
      >
        Kamoo<span className="text-kamoo-orange-500">.</span>
      </Link>

      {slot ? (
        <>
          {/* Contexte page (ex: commande) */}
          <div className="hidden min-w-0 shrink-0 lg:block">{slot.lead}</div>

          <div className="flex-1" />

          {/* Actions page */}
          <div className="flex shrink-0 items-center gap-2.5">{slot.actions}</div>

          <NotificationsBell />
        </>
      ) : (
        <>
          <div className="flex-1" />
          <NotificationsBell />
        </>
      )}
    </header>
  );
}
