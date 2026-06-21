"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Check,
  ChevronDown,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Megaphone,
  Package,
  Phone,
  PieChart,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Store,
  ShieldAlert,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { useDisputes } from "@/lib/hooks/use-disputes";
import { cn } from "@/lib/utils";
import { useCurrentMarket } from "@/lib/hooks/use-current-market";
import { MARKET_STATUS_LABELS, MARKET_STATUS_TONE } from "@/lib/types/market";
import { MOCK_EXPEDITIONS } from "@/lib/data/mock-expeditions";

/**
 * ConsoleRail — sidebar CLAIRE fixe 248px (direction validée).
 *
 *  - ≥ lg : rail clair pleine largeur (248px), toujours déployé.
 *  - < lg : drawer slide-in piloté depuis la topbar (mobileOpen/onMobileClose).
 *
 * Rail clair, surface blanche. Accent navy rationné : CTA principal + item
 * actif (icône allumée en pastille navy). Orange réservé aux signaux.
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
          { href: "/marketplace/transitaires", label: "Transitaires", icon: Package },
          { href: "/marketplace/closeurs", label: "Closeurs", icon: Phone },
          { href: "/marketplace/livreurs", label: "Livreurs", icon: Truck },
        ],
      },
    ],
  },
  {
    label: "Mon activité",
    items: [
      { href: "/expeditions", label: "Expéditions", icon: Package, badge: MOCK_EXPEDITIONS.filter((e) => e.status !== "arrived_destination").length },
      { href: "/boutique", label: "Catalogue", icon: ShoppingBag },
      { href: "/clients", label: "Clients", icon: Users },
      { href: "/closing", label: "Closing", icon: Phone },
      { href: "/livraisons", label: "Livraisons", icon: Truck },
      { href: "/disputes", label: "Disputes", icon: ShieldAlert },
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
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

export function ConsoleRail({
  mobileOpen = false,
  onMobileClose,
}: ConsoleRailProps = {}) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  /* Badge rouge « Disputes » : nombre de disputes actives (synchronisé). */
  const { active: activeDisputes } = useDisputes();
  const dynamicBadge = (href: string, base?: number): number | undefined =>
    href === "/disputes" ? (activeDisputes.length || undefined) : base;

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
      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink-900/40 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
          aria-hidden
        />
      )}

      {/* Spacer : 248px réservés ≥ lg */}
      <aside className="hidden shrink-0 lg:block lg:w-[248px]" aria-hidden={!mobileOpen} />

      {/* Rail clair fixe */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-line bg-white",
          "transition-transform duration-200 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="flex h-[68px] items-center px-5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <svg width={30} height={30} viewBox="0 0 40 40" fill="none" aria-label="Kamoo">
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
            <span className="text-[17px] font-bold tracking-tight text-kamoo-blue-900">
              Kamoo<span className="text-kamoo-orange-500">.</span>
            </span>
          </Link>
        </div>

        {/* CTA principale — navy (action) */}
        <div className="px-3 pb-1 pt-1">
          <Link
            href="/expeditions/nouvelle"
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-kamoo-blue-900 px-3 text-[13px] font-semibold text-white transition hover:bg-kamoo-blue-800"
          >
            <Plus className="h-4 w-4" />
            Nouvelle expédition
          </Link>
        </div>

        {/* Recherche globale (Ctrl+K) */}
        <div className="px-3 pb-1">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("kamoo:open-search"))}
            className="flex h-9 w-full items-center gap-2 rounded-lg bg-paper-2 px-3 text-[12.5px] font-medium text-ink-500 ring-1 ring-inset ring-line transition hover:bg-ink-100 hover:text-ink-700"
          >
            <Search className="h-3.5 w-3.5" />
            Rechercher…
            <kbd className="ml-auto rounded bg-ink-200 px-1.5 py-0.5 text-[9.5px] font-semibold text-ink-500">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-3 flex-1 overflow-y-auto overflow-x-hidden px-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SECTIONS.map((section, sIdx) => (
            <div key={section.label} className={cn(sIdx > 0 && "mt-4")}>
              <div className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                {section.label}
              </div>

              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  const parentActive = isParentActive(item);
                  const hasChildren = !!item.children?.length;
                  const isExpanded = hasChildren && !!expanded[item.href];

                  return (
                    <div key={item.href}>
                      {hasChildren ? (
                        <button
                          type="button"
                          onClick={() => toggle(item.href)}
                          aria-expanded={isExpanded}
                          className={cn(
                            "flex h-9 w-full items-center gap-2.5 rounded-lg px-2 text-[13px] transition",
                            parentActive
                              ? "bg-kamoo-blue-50 font-semibold text-kamoo-blue-900"
                              : "font-medium text-ink-700 hover:bg-paper-2 hover:text-ink-900",
                          )}
                        >
                          {/* Actif : l'icône s'allume dans une pastille navy (plus de trait). */}
                          <span
                            className={cn(
                              "grid size-7 shrink-0 place-items-center rounded-md transition-colors",
                              parentActive
                                ? "bg-kamoo-blue-900 text-white shadow-kamoo-sm"
                                : "text-ink-400",
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="flex-1 text-left">{item.label}</span>
                          <ChevronDown
                            className={cn(
                              "h-3.5 w-3.5 shrink-0 text-ink-400 transition-transform",
                              isExpanded && "rotate-180",
                            )}
                          />
                        </button>
                      ) : (
                        <Link
                          href={item.href}
                          className={cn(
                            "flex h-9 items-center gap-2.5 rounded-lg px-2 text-[13px] transition",
                            active
                              ? "bg-kamoo-blue-50 font-semibold text-kamoo-blue-900"
                              : "font-medium text-ink-700 hover:bg-paper-2 hover:text-ink-900",
                          )}
                        >
                          {/* Actif : l'icône s'allume dans une pastille navy (plus de trait). */}
                          <span
                            className={cn(
                              "grid size-7 shrink-0 place-items-center rounded-md transition-colors",
                              active
                                ? "bg-kamoo-blue-900 text-white shadow-kamoo-sm"
                                : "text-ink-400",
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="flex-1">{item.label}</span>
                          {dynamicBadge(item.href, item.badge) ? (
                            <span
                              className={cn(
                                "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                                item.href === "/disputes"
                                  ? "bg-red-500 text-white"
                                  : "bg-ink-100 text-ink-500",
                              )}
                            >
                              {dynamicBadge(item.href, item.badge)}
                            </span>
                          ) : null}
                        </Link>
                      )}

                      {hasChildren && isExpanded && (
                        <div className="ml-[26px] mt-0.5 flex flex-col gap-0.5 border-l border-line pl-2.5">
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
                                  "flex h-8 items-center gap-2 rounded-md px-2 text-[12px] transition",
                                  childActive
                                    ? "font-semibold text-kamoo-blue-900"
                                    : "font-medium text-ink-500 hover:text-ink-900",
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

        {/* Bas de sidebar : widget marché + profil */}
        <div className="space-y-1.5 border-t border-line p-2.5">
          <MarketWidget />
          <div className="flex items-center gap-2.5 rounded-lg bg-paper-2 p-2">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-kamoo-blue-900 text-xs font-bold text-white">
              AD
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-ink-900">Aïcha Diop</div>
              <div className="truncate text-[10px] text-ink-500">Pro · Dakar</div>
            </div>
            <button
              type="button"
              title="Se déconnecter"
              className="rounded-md p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Widget marché (bas de sidebar) ────────────────────────────────
   Remplace le sélecteur de la topbar. Affiche le marché actif et ouvre
   un menu (popover blanc, vers le haut) pour changer de marché. */
function MarketWidget() {
  const { markets, currentMarket, switchToMarket } = useCurrentMarket();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 rounded-lg bg-paper-2 px-2.5 py-2 text-left transition hover:bg-ink-100"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-kamoo-blue-900 text-[11px] font-bold tracking-tight text-white">
          {currentMarket.country.code}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] font-semibold text-ink-900">
            Marché {currentMarket.country.name}
          </div>
          <div className="truncate text-[10px] text-ink-500">
            {currentMarket.country.warehouseCity}
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-ink-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-[calc(100%+8px)] left-1 z-50 w-[264px] rounded-xl border border-line bg-white p-1.5 shadow-[var(--shadow-kamoo-lg)]">
            <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              Vos marchés
            </div>
            {markets.map((m) => {
              const selected = currentMarket.id === m.id;
              const disabled = m.status === "inactive";
              const tone = MARKET_STATUS_TONE[m.status];
              return (
                <button
                  key={m.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    if (!disabled) {
                      switchToMarket(m.id);
                      setOpen(false);
                    }
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition",
                    disabled ? "cursor-not-allowed opacity-60" : "hover:bg-paper-2",
                    selected && "bg-kamoo-blue-50",
                  )}
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-paper-2 text-[10px] font-bold tracking-tight text-ink-700">
                    {m.country.code}
                  </span>
                  <div className="flex-1 leading-tight">
                    <div
                      className={cn(
                        "flex items-center gap-1.5 text-[13px] font-semibold",
                        selected ? "text-kamoo-blue-700" : "text-ink-900",
                      )}
                    >
                      {m.country.name}
                      {m.status !== "active" && (
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-1.5 py-0.5 text-[9.5px] font-bold",
                            tone.bg,
                            tone.fg,
                          )}
                        >
                          {MARKET_STATUS_LABELS[m.status]}
                        </span>
                      )}
                    </div>
                    <div className="text-[10.5px] text-ink-500">
                      {m.country.warehouseCity} · {m.stats.partnersCount} partenaires
                    </div>
                  </div>
                  {selected && <Check className="h-4 w-4 text-kamoo-blue-700" />}
                </button>
              );
            })}
            <div className="my-1.5 h-px bg-line" />
            <Link
              href="/marches/nouveau"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition hover:bg-kamoo-blue-50"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-kamoo-blue-900 text-white">
                <Plus className="h-4 w-4" />
              </span>
              <span className="text-[13px] font-bold text-kamoo-blue-700">
                Ajouter un nouveau marché
              </span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
