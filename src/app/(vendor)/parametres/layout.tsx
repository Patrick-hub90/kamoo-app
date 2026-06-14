"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IdCard,
  KeyRound,
  LayoutGrid,
  Plug,
  Receipt,
  Store,
  UserCircle,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/kamoo/page-header";
import { cn } from "@/lib/utils";

/**
 * Navigation Paramètres — groupée PAR USAGE (pas une liste à plat) pour donner
 * une vraie hiérarchie : qui je suis · ce que je vends · l'argent.
 */
type Tab = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const GROUPS: { title: string; items: Tab[] }[] = [
  {
    title: "Compte",
    items: [
      { href: "/parametres/compte", label: "Profil", icon: UserCircle },
      { href: "/parametres/securite", label: "Sécurité", icon: KeyRound },
      { href: "/parametres/kyc", label: "KYC & vérification", icon: IdCard },
    ],
  },
  {
    title: "Mon activité",
    items: [
      { href: "/parametres/marches", label: "Marchés", icon: Store },
      { href: "/parametres/connexions", label: "Connexions", icon: Plug },
    ],
  },
  {
    title: "Facturation",
    items: [
      { href: "/parametres/wallets", label: "Méthodes de paiement", icon: Wallet },
      { href: "/parametres/facturation", label: "Facturation", icon: Receipt },
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
  const isHub = pathname === "/parametres";
  const activeTab = ALL_TABS.find((t) => t.href === pathname);

  return (
    <div className="min-h-full bg-paper">
      {/* HEADER unique — gabarit commun (cloche incluse). Fil d'Ariane :
          hub → « Réglages / Paramètres » ; sous-page → « Paramètres / <onglet> ». */}
      <PageHeader
        kicker={isHub ? "Réglages" : "Paramètres"}
        title={isHub ? "Paramètres" : (activeTab?.label ?? "Paramètres")}
      />

      {/* HUB : pleine largeur, pas de nav latérale (les cartes SONT la nav). */}
      {isHub ? (
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      ) : (
        <>
          {/* ONGLETS HORIZONTAUX — mobile / tablette (< lg) */}
          <div className="sticky top-[68px] z-10 border-b border-line bg-white lg:hidden">
            <nav className="scrollbar-hide flex gap-1 overflow-x-auto px-4 py-2 sm:px-6">
              <TabLink
                href="/parametres"
                label="Vue d'ensemble"
                Icon={LayoutGrid}
                active={false}
                horizontal
              />
              {ALL_TABS.map((tab) => (
                <TabLink
                  key={tab.href}
                  href={tab.href}
                  label={tab.label}
                  Icon={tab.icon}
                  active={pathname === tab.href}
                  horizontal
                />
              ))}
            </nav>
          </div>

          {/* BODY : nav verticale groupée (≥ lg) + contenu */}
          <div className="mx-auto flex w-full max-w-[1280px] gap-6 px-4 py-6 sm:px-6 lg:px-8">
            <aside className="sticky top-[92px] hidden h-fit w-60 shrink-0 lg:block">
              {/* Retour au hub */}
              <Link
                href="/parametres"
                className="mb-4 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[12.5px] font-semibold text-ink-500 transition hover:bg-white hover:text-ink-900"
              >
                <LayoutGrid className="h-4 w-4 text-ink-400" />
                Vue d&apos;ensemble
              </Link>

              <nav className="flex flex-col gap-5">
                {GROUPS.map((group) => (
                  <div key={group.title}>
                    <div className="px-3 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">
                      {group.title}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {group.items.map((tab) => (
                        <TabLink
                          key={tab.href}
                          href={tab.href}
                          label={tab.label}
                          Icon={tab.icon}
                          active={pathname === tab.href}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </nav>
            </aside>

            {/* CONTENU — deux colonnes (rail descriptif + contrôles) */}
            <div className="min-w-0 flex-1">
              <div className="mx-auto max-w-4xl">{children}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** Élément de navigation — variante verticale (sidebar) ou horizontale (mobile). */
function TabLink({
  href,
  label,
  Icon,
  active,
  horizontal = false,
}: {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  horizontal?: boolean;
}) {
  if (horizontal) {
    return (
      <Link
        href={href}
        className={cn(
          "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition",
          active
            ? "bg-paper-2 font-semibold text-ink-900"
            : "font-medium text-ink-500 hover:bg-paper-2 hover:text-ink-700",
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="whitespace-nowrap">{label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition",
        active
          ? "bg-white font-semibold text-ink-900 shadow-kamoo-sm ring-1 ring-line"
          : "font-medium text-ink-600 hover:bg-white/70 hover:text-ink-900",
      )}
    >
      {active && (
        <span
          className="absolute inset-y-2 left-0 w-[3px] rounded-r bg-kamoo-orange-500"
          aria-hidden
        />
      )}
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          active ? "text-kamoo-blue-700" : "text-ink-400",
        )}
      />
      <span>{label}</span>
    </Link>
  );
}
