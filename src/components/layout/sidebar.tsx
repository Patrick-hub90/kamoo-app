"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Store,
  Package,
  Phone,
  Truck,
  ShoppingBag,
  Users,
  Wallet,
  Settings,
  ChevronDown,
  Plus,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
};

type Section = {
  label: string;
  items: NavItem[];
};

const SECTIONS: Section[] = [
  {
    label: "Tableau de bord",
    items: [
      {
        href: "/dashboard",
        label: "Vue d'ensemble",
        icon: LayoutDashboard,
      },
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
          {
            href: "/marketplace/closeurs",
            label: "Closeurs",
            icon: Phone,
          },
          {
            href: "/marketplace/livreurs",
            label: "Livreurs",
            icon: Truck,
          },
        ],
      },
    ],
  },
  {
    label: "Mon activité",
    items: [
      { href: "/expeditions", label: "Expéditions", icon: Package, badge: 12 },
      { href: "/boutique", label: "Boutique", icon: ShoppingBag },
      { href: "/clients", label: "Clients", icon: Users },
      { href: "/closing", label: "Closing", icon: Phone },
      { href: "/livraisons", label: "Livraisons", icon: Truck },
      { href: "/finances", label: "Finances", icon: Wallet },
    ],
  },
  {
    label: "Compte",
    items: [{ href: "/parametres", label: "Paramètres", icon: Settings }],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Auto-expand un parent si un enfant est actif
  useEffect(() => {
    const next: Record<string, boolean> = {};
    SECTIONS.forEach((section) => {
      section.items.forEach((item) => {
        if (item.children) {
          const childActive = item.children.some((c) =>
            pathname.startsWith(c.href),
          );
          if (childActive) next[item.href] = true;
        }
      });
    });
    setExpanded((prev) => ({ ...prev, ...next }));
  }, [pathname]);

  const toggle = (href: string) => {
    setExpanded((prev) => ({ ...prev, [href]: !prev[href] }));
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const isParentActive = (item: NavItem) => {
    if (!item.children) return false;
    return item.children.some((c) => isActive(c.href));
  };

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-line bg-white">
      {/* Logo */}
      <div className="px-5 py-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="font-display text-2xl font-extrabold tracking-tight text-kamoo-blue-900">
            Kamoo<span className="text-kamoo-orange-500">.</span>
          </span>
        </Link>
      </div>

      {/* CTA principale */}
      <div className="px-3">
        <Link
          href="/expeditions/nouvelle"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-kamoo-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-kamoo-orange-600"
        >
          <Plus className="h-4 w-4" />
          Nouvelle expédition
        </Link>
      </div>

      {/* Navigation */}
      <nav className="mt-6 flex-1 overflow-y-auto px-3">
        {SECTIONS.map((section) => (
          <div key={section.label} className="mb-6">
            <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.08em] text-ink-400">
              {section.label}
            </div>
            <div className="flex flex-col gap-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                const parentActive = isParentActive(item);
                const hasChildren = !!item.children?.length;
                const isExpanded = hasChildren && (expanded[item.href] || parentActive);

                return (
                  <div key={item.href}>
                    {hasChildren ? (
                      <button
                        onClick={() => toggle(item.href)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13.5px] font-medium transition",
                          parentActive
                            ? "bg-kamoo-blue-50 text-kamoo-blue-700 font-semibold"
                            : "text-ink-700 hover:bg-paper-2",
                        )}
                      >
                        <Icon className="h-[18px] w-[18px]" />
                        <span className="flex-1">{item.label}</span>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform",
                            isExpanded && "rotate-180",
                          )}
                        />
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition",
                          active
                            ? "bg-kamoo-orange-50 text-kamoo-orange-700 font-bold"
                            : "text-ink-700 hover:bg-paper-2",
                        )}
                      >
                        <Icon className="h-[18px] w-[18px]" />
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <span
                            className={cn(
                              "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                              active
                                ? "bg-kamoo-orange-500 text-white"
                                : "bg-ink-100 text-ink-500",
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    )}

                    {/* Sous-menus */}
                    {hasChildren && isExpanded && (
                      <div className="ml-3 mt-1 flex flex-col gap-0.5 border-l border-line pl-3">
                        {item.children!.map((child) => {
                          const ChildIcon = child.icon;
                          const childActive = isActive(child.href);
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={cn(
                                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition",
                                childActive
                                  ? "bg-kamoo-orange-50 text-kamoo-orange-700 font-bold"
                                  : "text-ink-500 hover:bg-paper-2 hover:text-ink-700",
                              )}
                            >
                              <ChildIcon className="h-4 w-4" />
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

      {/* Profil utilisateur */}
      <div className="border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-xl bg-paper-2 p-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-kamoo-orange-500 to-kamoo-blue-700 text-xs font-extrabold text-white">
            AD
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-bold text-ink-900">
              Aïcha Diop
            </div>
            <div className="text-[10px] text-ink-500">Pro · Dakar</div>
          </div>
          <button className="rounded-md p-1.5 text-ink-400 hover:bg-white hover:text-ink-700">
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
