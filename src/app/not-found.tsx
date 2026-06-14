import Link from "next/link";
import { LayoutDashboard, ShoppingBag } from "lucide-react";

/**
 * 404 GLOBALE — capte toute URL non matchée hors de l'espace vendeur.
 * Rendue dans le root layout (Poppins + bg-paper) mais HORS du shell sidebar
 * → écran plein, centré, de marque. Server Component (aucun hook).
 *
 * Pour les notFound() déclenchés DANS l'espace vendeur (id inexistant), c'est
 * (vendor)/not-found.tsx qui prend le relais (reste dans le shell sidebar).
 */
export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-paper px-6 py-16 text-center">
      <div className="mx-auto flex max-w-sm flex-col items-center">
        {/* Marque */}
        <div className="mb-7 flex items-center gap-2.5">
          <svg width={34} height={34} viewBox="0 0 40 40" fill="none" aria-label="Kamoo">
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
          <span className="text-[18px] font-medium tracking-tight text-ink-900">
            Kamoo<span className="text-kamoo-orange-500">.</span>
          </span>
        </div>

        <p className="mb-2.5 text-[10px] font-medium uppercase tracking-[0.1em] text-ink-400">
          Erreur 404
        </p>
        <h1 className="mb-2 text-[18px] font-medium text-ink-900">
          Cette page est introuvable
        </h1>
        <p className="mb-6 max-w-[360px] text-[13px] leading-relaxed text-ink-500">
          Le lien a peut-être expiré ou la page a été déplacée. Rien n&apos;est
          perdu — voici par où repartir.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-kamoo-blue-900 px-3.5 text-[13px] font-medium text-white transition hover:bg-kamoo-blue-800"
          >
            <LayoutDashboard className="h-4 w-4" />
            Retour au tableau de bord
          </Link>
          <Link
            href="/boutique"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 text-[13px] font-medium text-ink-900 transition hover:bg-paper-2"
          >
            <ShoppingBag className="h-4 w-4 text-ink-500" />
            Parcourir le catalogue
          </Link>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <Link
            href="/boutique"
            className="text-[12px] font-medium text-kamoo-blue-700 transition hover:text-kamoo-blue-900"
          >
            Catalogue
          </Link>
          <span className="text-ink-300" aria-hidden>
            ·
          </span>
          <Link
            href="/clients"
            className="text-[12px] font-medium text-kamoo-blue-700 transition hover:text-kamoo-blue-900"
          >
            Clients
          </Link>
          <span className="text-ink-300" aria-hidden>
            ·
          </span>
          <Link
            href="/closing"
            className="text-[12px] font-medium text-kamoo-blue-700 transition hover:text-kamoo-blue-900"
          >
            Closing
          </Link>
        </div>
      </div>
    </div>
  );
}
