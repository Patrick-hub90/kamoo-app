"use client";

import Link from "next/link";
import { LayoutDashboard, MapPinOff, Search } from "lucide-react";
import { OPEN_SEARCH_EVENT } from "@/components/kamoo/global-search";

/**
 * 404 INTERNE — déclenchée par notFound() dans l'espace vendeur (id de
 * commande/produit/client/expédition inexistant). Hérite de (vendor)/layout
 * (sidebar + topbar conservés) et n'occupe que la zone <main>.
 *
 * Client Component : l'action « Recherche » réutilise la palette globale déjà
 * montée dans le layout via l'événement OPEN_SEARCH_EVENT.
 */
export default function VendorNotFound() {
  return (
    <div className="grid min-h-full place-items-center bg-paper px-6 py-16 text-center">
      <div className="mx-auto flex max-w-sm flex-col items-center">
        {/* Pictogramme (le wordmark est déjà dans la sidebar) */}
        <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl border border-line bg-white">
          <MapPinOff className="h-5 w-5 text-ink-400" />
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
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 text-[13px] font-medium text-ink-900 transition hover:bg-paper-2"
          >
            <Search className="h-4 w-4 text-ink-500" />
            Recherche
          </button>
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
