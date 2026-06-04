"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Megaphone,
  Package,
  Phone,
  PieChart,
  Plus,
  Settings,
  ShoppingBag,
  Store,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ConsoleRail — sidebar hybride 72px → 240px au hover.
 *
 * Pattern :
 *  - L'`<aside>` extérieur prend 72px dans le flow (le main content garde
 *    sa place et NE BOUGE PAS au survol).
 *  - L'inner `<div>` du rail est positionné absolument et expand à 240px
 *    au hover, en overlayant légèrement le contenu (z-30).
 *  - Délai 150ms avant expand → évite l'expand intempestif quand la souris
 *    fait juste passer en bord d'écran. Pas de délai en sortie.
 *
 * Sur mobile (< lg) : devient un drawer slide-in classique pilotable depuis
 * la topbar (cf. `mobileOpen` / `onMobileClose`).
 */

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  children?: NavChild[];
};

type NavChild = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
};

type Section = {
  label: string;
  items: NavItem[];
};

/** Structure identique à celle de l'ancienne `Sidebar` — on garde la même
 *  source de vérité pour ne pas dériver. À terme on consolide les deux. */
const SECTIONS: Section[] = [
  {
    label: "Tableau de bord",
    items: [
      { href: "/dashboard", label: "Vue d'ensemble", icon: LayoutDashboard },
    ],
  },
  {
    label: "Découvrir",
    items: [
      {
        href: "/marketplace",
        label: "Marketplace",
        icon: Store,
        children: [
          {
            href: "/marketplace/transitaires",
            label: "Transitaires",
            icon: Package,
          },
          { href: "/marketplace/closeurs", label: "Closeurs", icon: Phone },
          { href: "/marketplace/livreurs", label: "Livreurs", icon: Truck },
        ],
      },
    ],
  },
  {
    label: "Mon activité",
    items: [
      { href: "/expeditions", label: "Expéditions", icon: Package, badge: 12 },
      { href: "/boutique", label: "Catalogue", icon: ShoppingBag },
      { href: "/clients", label: "Clients", icon: Users },
      { href: "/closing", label: "Closing", icon: Phone },
      { href: "/livraisons", label: "Livraisons", icon: Truck },
      {
        href: "/finances",
        label: "Finances",
        icon: Wallet,
        children: [
          { href: "/finances", label: "Aperçu", icon: PieChart, exact: true },
          { href: "/finances/pubs", label: "Campagnes pubs", icon: Megaphone },
          { href: "/finances/journal", label: "Journal", icon: ListOrdered },
        ],
      },
    ],
  },
  {
    label: "Compte",
    items: [{ href: "/parametres", label: "Paramètres", icon: Settings }],
  },
];

type ConsoleRailProps = {
  /** True quand le drawer mobile est ouvert (ignoré ≥ lg). */
  mobileOpen?: boolean;
  /** Callback à appeler quand l'overlay mobile ou un lien est cliqué. */
  onMobileClose?: () => void;
};

export function ConsoleRail({
  mobileOpen = false,
  onMobileClose,
}: ConsoleRailProps = {}) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Auto-expand un parent quand un enfant est actif
  useEffect(() => {
    const next: Record<string, boolean> = {};
    SECTIONS.forEach((section) => {
      section.items.forEach((item) => {
        if (item.children) {
          const childActive = item.children.some((c) =>
            c.exact ? pathname === c.href : pathname.startsWith(c.href),
          );
          if (childActive) next[item.href] = true;
        }
      });
    });
    setExpanded((prev) => ({ ...prev, ...next }));
  }, [pathname]);

  const toggle = (href: string) =>
    setExpanded((prev) => ({ ...prev, [href]: !prev[href] }));

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const isParentActive = (item: NavItem) =>
    item.children?.some((c) => isActive(c.href)) ?? false;

  return (
    <>
      {/* Overlay sombre derrière le drawer mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink-900/40 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
          aria-hidden
        />
      )}

      {/* Spacer : 72px réservés dans le flex parent ≥ lg.
          < lg : le drawer est fixed donc le spacer fait 0. */}
      <aside
        className={cn(
          "shrink-0",
          "hidden lg:block lg:w-[72px]",
        )}
        aria-hidden={!mobileOpen}
      />

      {/* Rail réel — fixed left, overlay quand expand au hover.
          Sur mobile : slide depuis la gauche en drawer plein 240px. */}
      <div
        className={cn(
          "group/rail",
          "fixed inset-y-0 left-0 z-40",
          "flex flex-col border-r border-line bg-white",
          // Width : drawer 240 sur mobile (toujours expand quand open),
          // collapse 72 → expand 240 au hover sur desktop.
          "w-60 lg:w-[72px] lg:hover:w-60",
          // Délai sur l'expand uniquement (pas sur le collapse)
          "transition-[width,transform] duration-200 ease-out lg:hover:delay-150",
          // Mobile : slide quand fermé, in-flow quand ouvert
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          // Shadow quand expand (le rail flotte au-dessus du contenu)
          "lg:hover:shadow-[var(--shadow-kamoo-md)]",
        )}
      >
        {/* Logo — K seul collapsed / Kamoo. expanded */}
        <div className="flex h-[68px] items-center px-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 transition-opacity"
          >
            {/* Logo K (toujours visible) */}
            <svg
              width={32}
              height={32}
              viewBox="0 0 40 40"
              fill="none"
              className="shrink-0"
              aria-label="Kamoo"
            >
              <rect width="40" height="40" rx="10" fill="#0F2A52" />
              <path
                d="M13 10 L13 30 M13 20 L23 10 M13 20 L23 30"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="29" cy="13" r="3.5" fill="#F97316" />
            </svg>
            {/* Wordmark — visible only when expanded */}
            <span
              className={cn(
                "font-display text-lg font-extrabold tracking-tight text-kamoo-blue-900",
                "overflow-hidden whitespace-nowrap opacity-0 transition-opacity duration-100",
                "lg:group-hover/rail:opacity-100 lg:group-hover/rail:delay-150",
                mobileOpen && "opacity-100",
              )}
            >
              Kamoo<span className="text-kamoo-orange-500">.</span>
            </span>
          </Link>
        </div>

        {/* CTA principale — + collapsed / + Nouvelle expédition expanded */}
        <div className="px-3">
          <Link
            href="/expeditions/nouvelle"
            title="Nouvelle expédition"
            className={cn(
              "flex h-10 items-center gap-2 rounded-xl bg-kamoo-orange-500 px-3 text-white transition hover:bg-kamoo-orange-600",
              "justify-center lg:group-hover/rail:justify-start",
              mobileOpen && "justify-start",
            )}
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span
              className={cn(
                "overflow-hidden whitespace-nowrap text-sm font-bold opacity-0 transition-opacity duration-100",
                "lg:group-hover/rail:opacity-100 lg:group-hover/rail:delay-150",
                mobileOpen && "opacity-100",
              )}
            >
              Nouvelle expédition
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="mt-4 flex-1 overflow-y-auto overflow-x-hidden px-2">
          {SECTIONS.map((section, sIdx) => (
            <div key={section.label} className={cn(sIdx > 0 && "mt-4")}>
              {/* Section label — visible only when expanded */}
              <div
                className={cn(
                  "px-3 pb-1 font-mono-kamoo text-[10px] font-bold uppercase text-ink-400",
                  "h-[18px] overflow-hidden opacity-0 transition-opacity duration-100",
                  "lg:group-hover/rail:opacity-100 lg:group-hover/rail:delay-150",
                  mobileOpen && "opacity-100",
                )}
                style={{ letterSpacing: "0.08em" }}
              >
                {section.label}
              </div>

              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  const parentActive = isParentActive(item);
                  const hasChildren = !!item.children?.length;
                  const isExpanded =
                    hasChildren && !!expanded[item.href];

                  return (
                    <div key={item.href}>
                      {hasChildren ? (
                        <button
                          type="button"
                          onClick={() => toggle(item.href)}
                          aria-expanded={isExpanded}
                          title={item.label}
                          className={cn(
                            "flex h-10 w-full items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition",
                            parentActive
                              ? "bg-kamoo-blue-50 text-kamoo-blue-700 font-semibold"
                              : "text-ink-700 hover:bg-paper-2",
                            // Center icon when collapsed
                            "justify-start",
                          )}
                        >
                          <Icon className="h-[18px] w-[18px] shrink-0" />
                          <span
                            className={cn(
                              "flex-1 overflow-hidden whitespace-nowrap text-left opacity-0 transition-opacity duration-100",
                              "lg:group-hover/rail:opacity-100 lg:group-hover/rail:delay-150",
                              mobileOpen && "opacity-100",
                            )}
                          >
                            {item.label}
                          </span>
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 shrink-0 text-ink-400 transition-transform",
                              isExpanded && "rotate-180",
                              parentActive && "text-kamoo-blue-700",
                              // Hide chevron in collapsed state
                              "opacity-0 lg:group-hover/rail:opacity-100 lg:group-hover/rail:delay-150",
                              mobileOpen && "opacity-100",
                            )}
                          />
                        </button>
                      ) : (
                        <Link
                          href={item.href}
                          title={item.label}
                          className={cn(
                            "flex h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition",
                            active
                              ? "bg-kamoo-orange-50 text-kamoo-orange-700 font-bold"
                              : "text-ink-700 hover:bg-paper-2",
                          )}
                        >
                          <Icon className="h-[18px] w-[18px] shrink-0" />
                          <span
                            className={cn(
                              "flex-1 overflow-hidden whitespace-nowrap opacity-0 transition-opacity duration-100",
                              "lg:group-hover/rail:opacity-100 lg:group-hover/rail:delay-150",
                              mobileOpen && "opacity-100",
                            )}
                          >
                            {item.label}
                          </span>
                          {item.badge && (
                            <span
                              className={cn(
                                "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                                active
                                  ? "bg-kamoo-orange-500 text-white"
                                  : "bg-ink-100 text-ink-500",
                                // Hide badge when collapsed (would overflow)
                                "opacity-0 lg:group-hover/rail:opacity-100 lg:group-hover/rail:delay-150",
                                mobileOpen && "opacity-100",
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      )}

                      {/* Sub-menu — only visible when parent expanded AND
                          rail is in expanded state */}
                      {hasChildren && isExpanded && (
                        <div
                          className={cn(
                            "ml-5 mt-0.5 flex flex-col gap-0.5 border-l border-line pl-2.5",
                            "hidden lg:group-hover/rail:flex lg:group-hover/rail:delay-150",
                            mobileOpen && "flex",
                          )}
                        >
                          {item.children!.map((child) => {
                            const ChildIcon = child.icon;
                            const childActive = child.exact
                              ? pathname === child.href
                              : isActive(child.href);
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                className={cn(
                                  "flex h-8 items-center gap-2 rounded-md px-2.5 text-[12.5px] font-medium transition",
                                  childActive
                                    ? "bg-kamoo-orange-50 text-kamoo-orange-700 font-bold"
                                    : "text-ink-500 hover:bg-paper-2 hover:text-ink-700",
                                )}
                              >
                                <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                                <span>{child.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Profil utilisateur en bas */}
        <div className="border-t border-line p-2.5">
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl bg-paper-2 p-2",
              "lg:group-hover/rail:px-2.5",
            )}
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-kamoo-orange-500 to-kamoo-blue-700 text-xs font-extrabold text-white">
              AD
            </div>
            <div
              className={cn(
                "min-w-0 flex-1 overflow-hidden opacity-0 transition-opacity duration-100",
                "lg:group-hover/rail:opacity-100 lg:group-hover/rail:delay-150",
                mobileOpen && "opacity-100",
              )}
            >
              <div className="truncate text-xs font-bold text-ink-900">
                Aïcha Diop
              </div>
              <div className="truncate text-[10px] text-ink-500">
                Pro · Dakar
              </div>
            </div>
            <button
              type="button"
              title="Se déconnecter"
              className={cn(
                "rounded-md p-1.5 text-ink-400 hover:bg-white hover:text-ink-700",
                "opacity-0 transition-opacity duration-100",
                "lg:group-hover/rail:opacity-100 lg:group-hover/rail:delay-150",
                mobileOpen && "opacity-100",
              )}
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
