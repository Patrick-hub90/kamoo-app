"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ConsoleRail } from "@/components/console/console-rail";
import { ChatProvider } from "@/components/kamoo/chat";
import { GlobalSearch } from "@/components/kamoo/global-search";
import { ShopifyAutoSync } from "@/components/kamoo/shopify-auto-sync";
import { Topbar } from "@/components/layout/topbar";
import { TopbarSlotProvider } from "@/components/layout/topbar-slot";

/** Routes déjà reprises à l'identité refonte (header propre intégré → pas de
 *  Topbar global). On étend cette liste au fur et à mesure. */
const HIDE_GLOBAL_TOPBAR = ["/dashboard", "/boutique", "/expeditions", "/clients", "/closing", "/marketplace", "/livraisons", "/disputes"];

/**
 * Layout vendeur — englobe toutes les routes (vendor).
 *
 * Responsive :
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
    <div
      className="flex h-screen w-full min-w-[1100px] bg-paper"
      suppressHydrationWarning
    >
      {/* Recherche globale (Ctrl+K) — montée une seule fois pour toute l'app */}
      <GlobalSearch />
      <ShopifyAutoSync />

      {/* ConsoleRail — slim 72px ≥ lg (expand 240px au hover), drawer < lg */}
      <ConsoleRail
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <TopbarSlotProvider>
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
      </TopbarSlotProvider>
    </div>
    </ChatProvider>
  );
}
