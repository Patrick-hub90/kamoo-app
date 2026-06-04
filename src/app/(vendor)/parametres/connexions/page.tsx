"use client";

import { Check, ExternalLink, Plug, RefreshCw, X } from "lucide-react";
import { MOCK_MARKETS } from "@/lib/data/mock-markets";
import type { Market } from "@/lib/types/market";
import { cn } from "@/lib/utils";

/**
 * Connexions — intégrations externes du compte vendeur. En V1 on liste les
 * boutiques Shopify branchées (1 par marché). En V2 viendront aussi
 * WhatsApp Business, PSP (Moneroo), passerelle SMS (Africa's Talking), etc.
 */
export default function ConnexionsPage() {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-line bg-white p-4 sm:p-6">
        <div>
          <h2 className="font-display text-base font-extrabold text-ink-900">
            Boutiques Shopify
          </h2>
          <p className="mt-1 text-[13px] text-ink-500">
            Tes boutiques branchées sur Kamoo. Une commande créée sur ces
            boutiques arrive automatiquement dans Closing pour appel.
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          {MOCK_MARKETS.map((m) => (
            <ShopifyRow key={m.id} market={m} />
          ))}
        </div>
      </section>

      {/* Stub pour les autres intégrations à venir — communique l'intention */}
      <section className="rounded-2xl border border-dashed border-line bg-paper-2/40 p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-white text-ink-400 ring-1 ring-line">
            <Plug className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-ink-900">
              Autres intégrations à venir
            </h3>
            <p className="mt-0.5 text-[11.5px] text-ink-500">
              WhatsApp Business, Moneroo (paiements), Africa&apos;s Talking
              (SMS), Resend (emails transactionnels)…
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function ShopifyRow({ market }: { market: Market }) {
  const sh = market.shopify;
  const connected = sh?.isConnected === true;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-paper-2/40 p-3.5 sm:flex-nowrap sm:gap-4">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-[13px] font-extrabold text-ink-900 ring-1 ring-line">
        {market.country.code}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[14px] font-bold text-ink-900">
            {market.country.flag} {market.country.name}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold",
              connected
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700",
            )}
          >
            {connected ? (
              <>
                <Check className="h-3 w-3" />
                Connecté
              </>
            ) : (
              <>
                <X className="h-3 w-3" />
                Non connecté
              </>
            )}
          </span>
        </div>
        <div className="mt-0.5 truncate text-[11.5px] text-ink-500">
          {sh ? (
            <>
              <span className="font-mono-kamoo font-semibold text-ink-700">
                {sh.domain}
              </span>
              {sh.lastSyncAt && (
                <>
                  {" · Dernière sync "}
                  <span className="font-semibold text-ink-700">
                    {formatRelative(sh.lastSyncAt)}
                  </span>
                </>
              )}
            </>
          ) : (
            <span className="italic">Aucune boutique connectée</span>
          )}
        </div>
      </div>

      {sh && (
        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:ml-0">
          {connected && (
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[11.5px] font-bold text-ink-700 hover:border-kamoo-blue-600 hover:text-kamoo-blue-700"
              title="Forcer une synchronisation"
            >
              <RefreshCw className="h-3 w-3" />
              Sync
            </button>
          )}
          <a
            href={`https://${sh.domain}/admin`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[11.5px] font-bold text-ink-700 hover:border-kamoo-blue-600 hover:text-kamoo-blue-700"
          >
            Admin
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const diffH = Math.round(diffMs / 3_600_000);
  if (diffH < 1) return "à l'instant";
  if (diffH < 24) return `il y a ${diffH}h`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 7) return `il y a ${diffD} j`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
