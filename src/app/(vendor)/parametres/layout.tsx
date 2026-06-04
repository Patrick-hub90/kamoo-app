"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Globe,
  IdCard,
  KeyRound,
  Plug,
  Receipt,
  Store,
  UserCircle,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/parametres/compte", label: "Compte", icon: UserCircle },
  { href: "/parametres/marches", label: "Marchés", icon: Store },
  {
    href: "/parametres/wallets",
    label: "Méthodes de paiement",
    icon: Wallet,
  },
  { href: "/parametres/connexions", label: "Connexions", icon: Plug },
  { href: "/parametres/securite", label: "Sécurité", icon: KeyRound },
  { href: "/parametres/kyc", label: "KYC & vérification", icon: IdCard },
  { href: "/parametres/facturation", label: "Facturation", icon: Receipt },
] as const;

export default function ParametresLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      {/* HEADER */}
      <div className="border-b border-line bg-white px-4 py-4 sm:px-6 lg:px-10">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
          Paramètres
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Gérez votre compte, vos marchés et vos préférences.
        </p>
      </div>

      {/* ONGLETS HORIZONTAUX — visibles uniquement < lg (mobile/tablette) */}
      <div className="border-b border-line bg-white lg:hidden">
        <nav className="flex gap-1 overflow-x-auto px-4 py-2 sm:px-6 scrollbar-hide">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition",
                  isActive
                    ? "bg-paper-2 text-ink-900 font-semibold"
                    : "text-ink-500 hover:bg-paper-2 hover:text-ink-700",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap">{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* BODY : menu vertical (≥ lg) + contenu */}
      <div className="flex flex-1 overflow-hidden">
        {/* ONGLETS VERTICAUX — visibles uniquement ≥ lg (desktop) */}
        <aside className="hidden w-60 shrink-0 overflow-y-auto border-r border-line bg-white px-3 py-6 lg:block">
          <nav className="flex flex-col gap-0.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition",
                    isActive
                      ? "bg-paper-2 text-ink-900 font-semibold"
                      : "text-ink-700 hover:bg-paper-2",
                  )}
                >
                  {/* Liseré orange à gauche quand actif */}
                  {isActive && (
                    <span
                      className="absolute inset-y-1.5 left-0 w-[3px] rounded-r bg-kamoo-orange-500"
                      aria-hidden
                    />
                  )}
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive ? "text-ink-900" : "text-ink-500",
                    )}
                  />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* CONTENU — padding adaptatif */}
        <div className="flex-1 overflow-auto px-4 py-6 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-3xl">{children}</div>
        </div>
      </div>
    </div>
  );
}
