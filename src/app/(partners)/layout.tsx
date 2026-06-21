"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChatProvider } from "@/components/kamoo/chat";
import { TopbarSlotProvider } from "@/components/layout/topbar-slot";
import { cn } from "@/lib/utils";

/**
 * Layout de l'espace public **Partenaires** (servi sur `partners.kamoo.me`
 * via `src/proxy.ts`, et accessible aussi en interne pendant le dev).
 *
 * Coque épurée : bandeau de marque + onglets de pôle, PAS de sidebar vendeur.
 * `ChatProvider` + `TopbarSlotProvider` sont fournis ici car les fiches
 * partenaires utilisent `useChat()` (bouton « Discuter ») et la cloche de
 * `PageHeader` — ils doivent trouver leur contexte même hors console vendeur.
 */
export default function PartnersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChatProvider>
      <TopbarSlotProvider>
        <div className="min-h-screen bg-paper" suppressHydrationWarning>
          <PartnersTopBar />
          <main suppressHydrationWarning>{children}</main>
        </div>
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
    { href: "/transitaires", label: "Transitaires" },
    { href: "/closeurs", label: "Closeuses" },
    { href: "/livreurs", label: "Livreurs" },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white" suppressHydrationWarning>
      <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-6 px-6">
        <Link href="/partenaires" className="flex shrink-0 items-baseline gap-2">
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
