import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono, Poppins } from "next/font/google";
import { BitdefenderHydrationFix } from "@/components/bitdefender-hydration-fix";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

// Police d'identité Kamoo (choix user) — appliquée globalement via les tokens
// --font-sans / --font-display dans globals.css.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kamoo — Vends. On s'occupe du reste.",
  description:
    "Plateforme de gestion logistique pour e-commerçants africains : importation Chine, closing, livraison, encaissement.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${plusJakarta.variable} ${jetBrainsMono.variable} ${poppins.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-paper text-ink-900"
        suppressHydrationWarning
      >
        <BitdefenderHydrationFix />
        {children}
      </body>
    </html>
  );
}
