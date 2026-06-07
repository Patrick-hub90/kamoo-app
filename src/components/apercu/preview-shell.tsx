"use client";

/**
 * PreviewShell — coquille partagée des prototypes d'identité (sidebar + header
 * + canvas). Garantit que TOUS les écrans proto partagent exactement le même
 * shell de marque. Le contenu de chaque écran est passé en `children`.
 *
 * Exporte aussi les briques réutilisables (Panel, StatusPill, tokens) pour que
 * chaque écran reste visuellement cohérent.
 */

import Link from "next/link";
import {
  Bell,
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
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { MOCK_VENDOR } from "@/lib/data/mock-vendor";

export type Variant = "navy" | "orange";

/* ── tokens partagés ── */
export const CANVAS = "#F6F8FA";
export const CARD =
  "rounded-xl border border-[#ECEEF1] bg-white shadow-[0_1px_1px_rgba(16,24,40,0.03)]";
export const LABEL = "text-[11px] font-medium uppercase tracking-[0.06em] text-[#8A92A0]";

/* ── thème du shell ── */
type ShellTheme = {
  sidebarBg: string;
  ctaClass: string;
  logoDot: string;
  avatarClass: string;
  marker: string;
  textInactive: string;
  textActiveBg: string;
  hover: string;
  sectionLabel: string;
  badge: string;
  border: string;
};

const THEMES: Record<Variant, ShellTheme> = {
  navy: {
    sidebarBg: "#0F2A52",
    ctaClass: "bg-kamoo-orange-500 text-white hover:bg-kamoo-orange-600",
    logoDot: "#F97316",
    avatarClass: "bg-kamoo-orange-500 text-white",
    marker: "bg-kamoo-orange-500",
    textInactive: "text-white/65 hover:text-white",
    textActiveBg: "bg-white/[0.08] text-white",
    hover: "hover:bg-white/[0.05]",
    sectionLabel: "text-white/35",
    badge: "bg-white/10 text-white/80",
    border: "border-white/10",
  },
  orange: {
    sidebarBg: "#EA580C",
    ctaClass: "bg-kamoo-blue-900 text-white hover:bg-kamoo-blue-800",
    logoDot: "#0F2A52",
    avatarClass: "bg-kamoo-blue-900 text-white",
    marker: "bg-white",
    textInactive: "text-white/75 hover:text-white",
    textActiveBg: "bg-white/[0.16] text-white",
    hover: "hover:bg-white/[0.10]",
    sectionLabel: "text-white/55",
    badge: "bg-white/20 text-white",
    border: "border-white/15",
  },
};

type Nav = {
  section: string;
  items: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    sub?: { label: string; icon: React.ComponentType<{ className?: string }> }[];
  }[];
};

const NAV: Nav[] = [
  {
    section: "Tableau de bord",
    items: [{ href: "/apercu", label: "Vue d'ensemble", icon: LayoutDashboard }],
  },
  {
    section: "Découvrir",
    items: [{ href: "/marketplace", label: "Marketplace", icon: Store }],
  },
  {
    section: "Mon activité",
    items: [
      { href: "/expeditions", label: "Expéditions", icon: Package, badge: 12 },
      { href: "/apercu-catalogue", label: "Catalogue", icon: ShoppingBag },
      { href: "/clients", label: "Clients", icon: Users },
      { href: "/closing", label: "Closing", icon: Phone },
      { href: "/livraisons", label: "Livraisons", icon: Truck },
      {
        href: "/finances",
        label: "Finances",
        icon: Wallet,
        sub: [
          { label: "Aperçu", icon: PieChart },
          { label: "Campagnes pubs", icon: Megaphone },
          { label: "Journal", icon: ListOrdered },
        ],
      },
    ],
  },
  {
    section: "Compte",
    items: [{ href: "/parametres", label: "Paramètres", icon: Settings }],
  },
];

function Sidebar({ theme: t, activeHref }: { theme: ShellTheme; activeHref: string }) {
  return (
    <aside className="flex w-[248px] shrink-0 flex-col" style={{ backgroundColor: t.sidebarBg }}>
      <div className="flex h-[68px] items-center px-5">
        <div className="flex items-center gap-2.5">
          <svg width={30} height={30} viewBox="0 0 40 40" fill="none" aria-label="Kamoo">
            <rect width="40" height="40" rx="10" fill="#ffffff" fillOpacity="0.12" />
            <path
              d="M13 10 L13 30 M13 20 L23 10 M13 20 L23 30"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="29" cy="13" r="3.5" fill={t.logoDot} />
          </svg>
          <span className="text-[17px] font-bold tracking-tight text-white">Kamoo.</span>
        </div>
      </div>

      <div className="px-3 pb-1 pt-1">
        <Link
          href="/expeditions/nouvelle"
          className={`flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-[13px] font-semibold transition ${t.ctaClass}`}
        >
          <Plus className="h-4 w-4" />
          Nouvelle expédition
        </Link>
      </div>

      <nav className="mt-3 flex-1 overflow-y-auto px-2.5">
        {NAV.map((sec) => (
          <div key={sec.section} className="mb-4">
            <div className={`px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${t.sectionLabel}`}>
              {sec.section}
            </div>
            <div className="flex flex-col gap-0.5">
              {sec.items.map((it) => {
                const Icon = it.icon;
                const active = it.href === activeHref;
                return (
                  <div key={it.href}>
                    <Link
                      href={it.href}
                      className={[
                        "relative flex h-9 items-center gap-3 rounded-lg px-2.5 text-[13px] transition",
                        active ? `font-semibold ${t.textActiveBg}` : `font-medium ${t.textInactive} ${t.hover}`,
                      ].join(" ")}
                    >
                      {active && (
                        <span className={`absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r ${t.marker}`} />
                      )}
                      <Icon className="h-[17px] w-[17px] shrink-0" />
                      <span className="flex-1">{it.label}</span>
                      {it.badge && (
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${t.badge}`}>
                          {it.badge}
                        </span>
                      )}
                      {it.sub && <ChevronDown className="h-3.5 w-3.5 text-white/40" />}
                    </Link>
                    {it.sub && (
                      <div className={`ml-[26px] mt-0.5 flex flex-col gap-0.5 border-l ${t.border} pl-2.5`}>
                        {it.sub.map((s) => {
                          const SubIcon = s.icon;
                          return (
                            <div
                              key={s.label}
                              className={`flex h-7 items-center gap-2 rounded-md px-2 text-[12px] font-medium ${t.textInactive}`}
                            >
                              <SubIcon className="h-3.5 w-3.5" />
                              {s.label}
                            </div>
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

      <div className={`border-t ${t.border} p-2.5`}>
        <div className="flex items-center gap-2.5 rounded-lg bg-white/[0.06] p-2">
          <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold ${t.avatarClass}`}>
            {MOCK_VENDOR.initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] font-semibold text-white">
              {MOCK_VENDOR.firstName} {MOCK_VENDOR.lastName}
            </div>
            <div className="truncate text-[10px] text-white/55">Pro · Dakar</div>
          </div>
          <LogOut className="h-3.5 w-3.5 text-white/50" />
        </div>
      </div>
    </aside>
  );
}

/** Header flexible : eyebrow + titre à gauche, contrôles (ou `right`) à droite. */
export function Header({
  eyebrow,
  title,
  right,
}: {
  eyebrow: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 flex h-[68px] items-center gap-4 border-b border-[#ECEEF1] bg-white px-6">
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#A7AEBA]">{eyebrow}</div>
        <div className="text-[19px] font-bold tracking-tight text-ink-900">{title}</div>
      </div>
      <div className="flex items-center gap-2">
        {right ?? (
          <>
            <button className="flex h-9 items-center gap-2 rounded-lg border border-[#E4E7EC] bg-white px-3 text-[12.5px] font-medium text-ink-700 transition hover:bg-[#F7F8FA]">
              <Search className="h-3.5 w-3.5 text-[#98A0AC]" />
              Rechercher
            </button>
            <button className="flex h-9 items-center gap-1.5 rounded-lg border border-[#E4E7EC] bg-white px-3 text-[12.5px] font-medium text-ink-700 transition hover:bg-[#F7F8FA]">
              Ce mois-ci
              <ChevronDown className="h-3.5 w-3.5 text-[#98A0AC]" />
            </button>
            <button className="grid h-9 w-9 place-items-center rounded-lg border border-[#E4E7EC] bg-white text-ink-500 transition hover:bg-[#F7F8FA]">
              <Bell className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </header>
  );
}

export function PreviewShell({
  variant = "navy",
  fontFamily,
  activeHref,
  header,
  children,
}: {
  variant?: Variant;
  fontFamily?: string;
  activeHref: string;
  header: React.ReactNode;
  children: React.ReactNode;
}) {
  const t = THEMES[variant];
  return (
    <div
      className="flex h-screen w-full min-w-[1100px] overflow-hidden text-ink-900"
      style={{ backgroundColor: CANVAS, fontFamily: fontFamily ?? "var(--font-inter)" }}
    >
      <Sidebar theme={t} activeHref={activeHref} />
      <div className="flex min-w-0 flex-1 flex-col">
        {header}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

/* ── briques partagées ── */
export function Panel({
  title,
  right,
  children,
  className = "",
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`${CARD} flex flex-col ${className}`}>
      <div className="flex items-center justify-between border-b border-[#F1F2F4] px-5 py-3.5">
        <div className="text-[13.5px] font-semibold text-ink-900">{title}</div>
        {right}
      </div>
      <div className="flex-1">{children}</div>
    </section>
  );
}

export function VoirTout() {
  return (
    <button className="text-[12px] font-medium text-[#8A92A0] transition hover:text-ink-700">Voir tout →</button>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    nouvelle: { label: "Nouveau", cls: "bg-kamoo-blue-50 text-kamoo-blue-700" },
    rappele: { label: "À rappeler", cls: "bg-amber-50 text-amber-700" },
    injoignable: { label: "Injoignable", cls: "bg-red-50 text-red-600" },
    en_attente: { label: "En route", cls: "bg-kamoo-blue-50 text-kamoo-blue-700" },
    alerte: { label: "Alerte", cls: "bg-red-50 text-red-600" },
    effectue: { label: "Livré", cls: "bg-emerald-50 text-emerald-700" },
    livre: { label: "Livré", cls: "bg-emerald-50 text-emerald-700" },
    livraison_en_cours: { label: "En route", cls: "bg-kamoo-blue-50 text-kamoo-blue-700" },
  };
  const s = map[status] ?? { label: status, cls: "bg-ink-100 text-ink-500" };
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${s.cls}`}>{s.label}</span>;
}
