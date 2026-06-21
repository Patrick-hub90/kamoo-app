"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConsoleRail } from "@/components/console/console-rail";
import { ChatProvider } from "@/components/kamoo/chat";
import { GlobalSearch } from "@/components/kamoo/global-search";
import { ShopifyAutoSync } from "@/components/kamoo/shopify-auto-sync";
import { Topbar } from "@/components/layout/topbar";
import { TopbarSlotProvider } from "@/components/layout/topbar-slot";
import { cn } from "@/lib/utils";

/** Routes déjà reprises à l'identité refonte (header propre intégré → pas de
 *  Topbar global). On étend cette liste au fur et à mesure. */
const HIDE_GLOBAL_TOPBAR = ["/dashboard", "/boutique", "/expeditions", "/clients", "/closing", "/livraisons", "/disputes", "/parametres", "/finances"];

/**
 * Layout vendeur — englobe toutes les routes (vendor).
 *
 * Deux coques selon le contexte :
 *  - **Marketplace** (`/marketplace/*`) : coque PUBLIQUE « Partenaires »
 *    (servie sur `partners.kamoo.me` via `proxy.ts`). Pas de sidebar vendeur,
 *    pas de recherche globale ni d'auto-sync Shopify, mise en page responsive.
 *  - **Console vendeur** : sidebar + topbar habituels (desktop-only).
 *
 * `ChatProvider` et `TopbarSlotProvider` enveloppent les DEUX coques pour
 * rester stables (pas de remount) — les fiches partenaires utilisent
 * `useChat()` / la cloche de notifications, qui doivent toujours trouver leur
 * contexte.
 *
 * Responsive (console) :
 *  - ≥ lg : sidebar visible en permanence à gauche (240px)
 *  - < lg : sidebar masquée par défaut, ouverte en drawer overlay via le
 *           hamburger de la topbar. Se referme automatiquement quand
 *           l'utilisateur navigue vers une autre route.
 *
 * `suppressHydrationWarning` : neutralise les warnings React provoqués par
 * l'extension Bitdefender qui injecte `bis_skin_checked="1"` sur tous les
 * <div> côté client avant l'hydratation. Cosmétique seulement.
 */
export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isMarketplace = pathname.startsWith("/marketplace");

  // Refermer le drawer mobile à chaque navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Bloquer le scroll body quand drawer ouvert (UX classique)
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [mobileOpen]);

  return (
    <ChatProvider>
      <TopbarSlotProvider>
        {isMarketplace ? (
          /* ─── Coque publique « Partenaires » (partners.kamoo.me) ─── */
          <div className="min-h-screen bg-paper" suppressHydrationWarning>
            <PartnersTopBar />
            <main suppressHydrationWarning>{children}</main>
          </div>
        ) : (
          /* ─── Console vendeur ─── */
          <div
            className="flex h-screen w-full min-w-[1100px] bg-paper"
            suppressHydrationWarning
          >
            {/* Recherche globale (Ctrl+K) — uniquement côté console */}
            <GlobalSearch />
            <ShopifyAutoSync />

            {/* ConsoleRail — slim 72px ≥ lg (expand 240px au hover), drawer < lg */}
            <ConsoleRail
              mobileOpen={mobileOpen}
              onMobileClose={() => setMobileOpen(false)}
            />

            <div
              className="flex min-w-0 flex-1 flex-col"
              suppressHydrationWarning
            >
              {/* Écrans repris à l'identité refonte : header propre intégré à la
                  page (un seul bandeau, façon /apercu). On masque donc le Topbar
                  global. La liste s'étend au fur et à mesure de la propagation. */}
              {!HIDE_GLOBAL_TOPBAR.some((p) => pathname === p || pathname.startsWith(p + "/")) && (
                <Topbar onMobileMenuToggle={() => setMobileOpen((v) => !v)} />
              )}
              <main
                className="flex-1 overflow-y-auto"
                suppressHydrationWarning
              >
                {children}
              </main>
            </div>
          </div>
        )}
      </TopbarSlotProvider>
    </ChatProvider>
  );
}

/* ─── Bandeau de l'espace public Partenaires ───────────────────────── */
function PartnersTopBar() {
  const pathname = usePathname();
  // Sur le sous-domaine partenaires, « Espace vendeur » renvoie vers le
  // domaine principal ; en local / sur kamoo.me on reste en interne.
  const [vendorHref, setVendorHref] = useState("/dashboard");
  useEffect(() => {
    if (window.location.hostname.startsWith("partners.")) {
      setVendorHref("https://kamoo.me/dashboard");
    }
  }, []);

  const tabs = [
    { href: "/marketplace/transitaires", label: "Transitaires" },
    { href: "/marketplace/closeurs", label: "Closeuses" },
    { href: "/marketplace/livreurs", label: "Livreurs" },
  ];

  return (
    <header className="border-b border-line bg-white" suppressHydrationWarning>
      <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-6 px-6">
        <Link
          href="/marketplace/transitaires"
          className="flex shrink-0 items-baseline gap-2"
        >
          <span className="text-[17px] font-medium tracking-tight text-kamoo-blue-900">
            Kamoo<span className="text-kamoo-orange-500">.</span>
          </span>
          <span className="hidden text-[11px] font-medium uppercase tracking-[0.12em] text-ink-400 sm:inline">
            Partenaires
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {tabs.map((t) => {
            const active = pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[13px] transition",
                  active
                    ? "bg-kamoo-blue-50 font-medium text-kamoo-blue-900"
                    : "text-ink-600 hover:bg-paper-2 hover:text-ink-900",
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>

        <a
          href={vendorHref}
          className="ml-auto shrink-0 text-[12.5px] font-medium text-ink-500 transition hover:text-kamoo-blue-900"
        >
          Espace vendeur →
        </a>
      </div>
    </header>
  );
}
