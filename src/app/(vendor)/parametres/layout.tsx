"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IdCard,
  KeyRound,
  Plug,
  Receipt,
  Search,
  Store,
  UserCircle,
  Wallet,
} from "lucide-react";
import { NotificationsBell } from "@/components/kamoo/notifications-bell";
import { cn } from "@/lib/utils";

/**
 * Paramètres — shell « liste / détail » façon messagerie : à gauche la liste
 * des réglages (lignes icône + label + sous-texte, groupées par usage), à
 * droite le détail de la section sélectionnée. Accent navy (sélection +
 * actions). Sur mobile, la liste devient une rangée de puces défilantes.
 */
type Tab = {
  href: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const GROUPS: { title: string; items: Tab[] }[] = [
  {
    title: "Compte",
    items: [
      { href: "/parametres/compte", label: "Profil", description: "Identité & contact", icon: UserCircle },
      { href: "/parametres/securite", label: "Sécurité", description: "Mot de passe, 2FA, sessions", icon: KeyRound },
      { href: "/parametres/kyc", label: "KYC & vérification", description: "Statut de vérification", icon: IdCard },
    ],
  },
  {
    title: "Mon activité",
    items: [
      { href: "/parametres/marches", label: "Marchés", description: "Pays & devises", icon: Store },
      { href: "/parametres/connexions", label: "Connexions", description: "Shopify & intégrations", icon: Plug },
    ],
  },
  {
    title: "Facturation",
    items: [
      { href: "/parametres/wallets", label: "Méthodes de paiement", description: "Wave, Orange Money…", icon: Wallet },
      { href: "/parametres/facturation", label: "Facturation", description: "Plan & reçus", icon: Receipt },
    ],
  },
];

const ALL_TABS = GROUPS.flatMap((g) => g.items);

export default function ParametresLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const activeTab = ALL_TABS.find((t) => t.href === pathname);

  return (
    <div className="flex h-full min-h-0 bg-paper">
      {/* ════ COLONNE LISTE (≥ lg) ════ */}
      <aside className="hidden w-[300px] shrink-0 flex-col border-r border-line bg-white lg:flex">
        <div className="px-4 pb-3 pt-5">
          <div className="px-1 text-[18px] font-medium tracking-tight text-ink-900">
            Paramètres
          </div>
          <div className="mt-3 flex h-9 items-center gap-2 rounded-full bg-paper-2 px-3">
            <Search className="h-3.5 w-3.5 shrink-0 text-ink-400" />
            <input
              type="search"
              placeholder="Rechercher un réglage…"
              className="min-w-0 flex-1 bg-transparent text-[12.5px] text-ink-900 outline-none placeholder:text-ink-400"
            />
          </div>
        </div>

        <nav className="min-h-0 flex-1 space-y-4 overflow-y-auto px-2 pb-6">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <div className="px-3 pb-1 pt-1 text-[10.5px] font-medium uppercase tracking-[0.08em] text-ink-400">
                {group.title}
              </div>
              <div className="flex flex-col gap-0.5">
                {group.items.map((tab) => (
                  <SettingRow key={tab.href} tab={tab} active={pathname === tab.href} />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* ════ VOLET DÉTAIL ════ */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* En-tête détail */}
        <header className="sticky top-0 z-10 flex h-[60px] shrink-0 items-center gap-3 border-b border-line bg-white px-5">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[16px] font-medium tracking-tight text-ink-900">
              {activeTab?.label ?? "Paramètres"}
            </div>
            {activeTab?.description && (
              <div className="truncate text-[12px] text-ink-400">{activeTab.description}</div>
            )}
          </div>
          <NotificationsBell />
        </header>

        {/* Puces de navigation — mobile / tablette (< lg) */}
        <div className="border-b border-line bg-white lg:hidden">
          <nav className="scrollbar-hide flex gap-1.5 overflow-x-auto px-4 py-2.5">
            {ALL_TABS.map((tab) => {
              const active = pathname === tab.href;
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] transition",
                    active
                      ? "bg-kamoo-blue-900 text-white"
                      : "bg-paper-2 text-ink-600 hover:text-ink-900",
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Contenu de la section */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

/** Ligne de la liste des réglages (icône + label + sous-texte). */
function SettingRow({ tab, active }: { tab: Tab; active: boolean }) {
  const Icon = tab.icon;
  return (
    <Link
      href={tab.href}
      className={cn(
        "relative flex items-center gap-3 rounded-xl px-2.5 py-2 transition",
        active ? "bg-kamoo-blue-50" : "hover:bg-paper-2",
      )}
    >
      {active && (
        <span
          className="absolute inset-y-2 left-0 w-[3px] rounded-r bg-kamoo-blue-900"
          aria-hidden
        />
      )}
      <span
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-lg transition",
          active ? "bg-kamoo-blue-900 text-white" : "bg-paper-2 text-ink-500",
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate text-[13.5px]",
            active ? "font-medium text-kamoo-blue-900" : "text-ink-900",
          )}
        >
          {tab.label}
        </span>
        <span className="block truncate text-[11px] text-ink-400">{tab.description}</span>
      </span>
    </Link>
  );
}
