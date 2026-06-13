"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Check,
  ExternalLink,
  Loader2,
  Plug,
  RefreshCw,
  ShoppingBag,
  X,
} from "lucide-react";
import { MOCK_MARKETS } from "@/lib/data/mock-markets";
import { useShopify } from "@/lib/hooks/use-shopify";
import { useShopifySync } from "@/lib/hooks/use-shopify-sync";
import type { Market } from "@/lib/types/market";
import { cn } from "@/lib/utils";

/**
 * Connexions — intégrations externes. Cœur : les boutiques Shopify (1 par
 * marché). Une commande créée sur la boutique arrive automatiquement dans
 * Closing ; les produits, eux, se publient à la demande (workflow façon DSers,
 * géré côté Catalogue).
 */
export default function ConnexionsPage() {
  return (
    <Suspense fallback={null}>
      <ConnexionsInner />
    </Suspense>
  );
}

function ConnexionsInner() {
  const { liveMode, registerLiveConnection } = useShopify();
  const searchParams = useSearchParams();

  /* Retour du callback OAuth réel → enregistrer la connexion + nettoyer l'URL */
  useEffect(() => {
    const shop = searchParams.get("shopify_connected");
    const market = searchParams.get("market");
    if (shop && market) {
      registerLiveConnection(market, shop);
      window.history.replaceState({}, "", "/parametres/connexions");
    }
  }, [searchParams, registerLiveConnection]);

  const oauthError = searchParams.get("shopify_error");

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-line bg-white p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-extrabold text-ink-900">
              Boutiques Shopify
            </h2>
            <p className="mt-1 text-[13px] text-ink-500">
              Une commande créée sur ta boutique arrive automatiquement dans
              Closing, et le client est ajouté à ta base. 1 boutique par marché.
            </p>
          </div>
          {liveMode !== null && (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold",
                liveMode ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
              )}
            >
              {liveMode ? "Mode réel (OAuth)" : "Mode démo"}
            </span>
          )}
        </div>

        {oauthError === "scopes_manquants" ? (
          <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-[12.5px] leading-relaxed text-amber-900">
            <b>Boutique connectée, mais l&apos;app n&apos;a aucune autorisation API.</b>{" "}
            Les autorisations se déclarent dans la <b>configuration de l&apos;app</b> sur
            ton Partner Dashboard (pas dans Kamoo) :
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>
                <b>partners.shopify.com</b> → Apps → ton app <b>Kamoo</b> → onglet{" "}
                <b>Configuration</b> (ou « API access »)
              </li>
              <li>
                Section <b>Admin API integration / access scopes</b> → coche :{" "}
                <span className="font-mono-kamoo">read_orders, write_orders, read_products, write_products, read_customers, write_merchant_managed_fulfillment_orders</span>
              </li>
              <li>
                Section <b>Protected customer data access</b> → demande l&apos;accès
                (motif « App functionality ») + champs Nom, Téléphone, Adresse
              </li>
              <li>
                Enregistre, puis reviens ici et clique{" "}
                <b>« Mettre à jour les autorisations »</b> sur la boutique.
              </li>
            </ol>
          </div>
        ) : oauthError ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12.5px] text-red-700">
            Connexion Shopify échouée ({oauthError}). Vérifie tes clés API et
            l&apos;URL de redirection, puis réessaie.
          </div>
        ) : null}

        {liveMode === false && (
          <div className="mt-4 rounded-xl border border-kamoo-blue-100 bg-kamoo-blue-50/50 px-3.5 py-2.5 text-[12px] leading-relaxed text-kamoo-blue-800">
            <b>Mode démo actif.</b> La connexion et la synchronisation sont
            simulées mais injectent de vraies commandes dans Closing. Pour
            passer en réel : crée une app sur ton Shopify Partner Dashboard et
            renseigne <span className="font-mono-kamoo">SHOPIFY_API_KEY</span> /{" "}
            <span className="font-mono-kamoo">SHOPIFY_API_SECRET</span> dans{" "}
            <span className="font-mono-kamoo">.env.local</span> (voir{" "}
            <span className="font-mono-kamoo">.env.local.example</span>).
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2.5">
          {MOCK_MARKETS.map((m) => (
            <ShopifyRow key={m.id} market={m} />
          ))}
        </div>
      </section>

      {/* Autres intégrations à venir */}
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
  const { getConnection, connectDemo, connectLive, disconnect, liveMode } = useShopify();
  const { syncNow } = useShopifySync();
  const conn = getConnection(market.id);
  const connected = conn?.isConnected === true;

  const [connectOpen, setConnectOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  /* Bilan de santé de la connexion réelle (token + scopes) */
  const [health, setHealth] = useState<string | null>(null);
  useEffect(() => {
    if (!connected || conn?.mode !== "live") {
      setHealth(null);
      return;
    }
    let alive = true;
    fetch(`/api/shopify/health?shop=${encodeURIComponent(conn.domain)}`)
      .then((r) => r.json())
      .then((d: { status: string }) => alive && setHealth(d.status))
      .catch(() => alive && setHealth(null));
    return () => {
      alive = false;
    };
  }, [connected, conn?.mode, conn?.domain]);

  async function handleSync() {
    setSyncing(true);
    setFlash(null);
    const res = await syncNow(market.id);
    setSyncing(false);
    setFlash(
      res.error === "donnees_client_a_approuver"
        ? "⚠ Accès données client à approuver — onglet « API access » de ton app → « Protected customer data access » → Request access, puis « Mettre à jour les autorisations »"
        : res.error === "scopes_manquants"
          ? "⚠ Autorisations API manquantes — configure les scopes de ton app puis « Mettre à jour les autorisations »"
          : res.error
            ? `Échec : ${res.error}`
          : res.imported > 0
            ? `${res.imported} commande${res.imported > 1 ? "s" : ""} importée${res.imported > 1 ? "s" : ""} → Closing`
            : res.fetched > 0
              ? `${res.fetched} commande${res.fetched > 1 ? "s" : ""} déjà importée${res.fetched > 1 ? "s" : ""}`
              : "Aucune commande trouvée dans la boutique",
    );
    setTimeout(() => setFlash(null), 8000);
  }

  return (
    <>
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
                connected ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
              )}
            >
              {connected ? (
                <>
                  <Check className="h-3 w-3" /> Connecté
                </>
              ) : (
                <>
                  <X className="h-3 w-3" /> Non connecté
                </>
              )}
            </span>
            {connected && conn?.mode === "demo" && (
              <span className="rounded-full bg-paper-2 px-1.5 py-0.5 text-[9.5px] font-bold uppercase text-ink-400">
                Démo
              </span>
            )}
            {health === "ok" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                <Check className="h-2.5 w-2.5" /> API opérationnelle
              </span>
            )}
            {health === "scopes_manquants" && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800" title="Déclare les scopes dans la configuration de ton app (Partner Dashboard), puis « Mettre à jour les autorisations »">
                ⚠ Autorisations API manquantes
              </span>
            )}
            {health === "donnees_client" && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800" title="Demande « Protected customer data access » dans l'onglet API access de ton app, puis « Mettre à jour les autorisations »">
                ⚠ Accès données client à approuver
              </span>
            )}
            {health === "token_absent" && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                Token absent — reconnecte la boutique
              </span>
            )}
          </div>
          <div className="mt-0.5 truncate text-[11.5px] text-ink-500">
            {conn ? (
              <>
                <span className="font-mono-kamoo font-semibold text-ink-700">{conn.domain}</span>
                {conn.lastSyncAt && (
                  <>
                    {" · Sync "}
                    <span className="font-semibold text-ink-700">{formatRelative(conn.lastSyncAt)}</span>
                  </>
                )}
                {conn.ordersImported > 0 && (
                  <>
                    {" · "}
                    <span className="font-semibold text-ink-700">{conn.ordersImported}</span> importée
                    {conn.ordersImported > 1 ? "s" : ""}
                  </>
                )}
              </>
            ) : (
              <span className="italic">Aucune boutique connectée</span>
            )}
          </div>
          {flash && (
            <div
              className={cn(
                "mt-1 text-[11px] font-semibold",
                flash.startsWith("⚠") || flash.startsWith("Échec") ? "text-amber-700" : "text-emerald-700",
              )}
            >
              {flash}
            </div>
          )}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:ml-0">
          {connected ? (
            <>
              <button
                type="button"
                onClick={handleSync}
                disabled={syncing}
                className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[11.5px] font-bold text-ink-700 transition hover:border-kamoo-blue-600 hover:text-kamoo-blue-700 disabled:opacity-50"
                title="Importer les nouvelles commandes"
              >
                {syncing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                Sync
              </button>
              {conn!.mode === "live" && (
                <button
                  type="button"
                  onClick={() => connectLive(market.id, conn!.domain)}
                  className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-[11.5px] font-bold text-amber-800 transition hover:bg-amber-100"
                  title="Relance l'autorisation Shopify (après modification des scopes de l'app)"
                >
                  Mettre à jour les autorisations
                </button>
              )}
              <a
                href={`https://${conn!.domain}/admin`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[11.5px] font-bold text-ink-700 transition hover:border-kamoo-blue-600 hover:text-kamoo-blue-700"
              >
                Admin <ExternalLink className="h-3 w-3" />
              </a>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Déconnecter la boutique de ${market.country.name} ?`)) disconnect(market.id);
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[11.5px] font-bold text-ink-500 transition hover:border-red-300 hover:text-red-600"
              >
                Déconnecter
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConnectOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-kamoo-blue-900 px-3 py-2 text-[12px] font-bold text-white transition hover:bg-kamoo-blue-800"
            >
              <ShoppingBag className="h-3.5 w-3.5" /> Connecter Shopify
            </button>
          )}
        </div>

        {/* Encadré d'action persistant quand la config Shopify est incomplète */}
        {health === "donnees_client" && (
          <div className="mt-2 w-full rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-[12px] leading-relaxed text-amber-900">
            <b>Dernière étape : approuver l&apos;accès aux données client.</b> Tes scopes
            sont bons, mais Shopify protège l&apos;objet <b>Commande</b> derrière une
            autorisation séparée.
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>
                <b>partners.shopify.com</b> → Apps → ton app <b>Kamoo</b> → onglet{" "}
                <b>API access</b>
              </li>
              <li>
                Section <b>Protected customer data access</b> → <b>Request access</b>
              </li>
              <li>
                Coche <b>Protected customer data</b> + les champs <b>Name, Phone,
                Address</b> (motif : <i>App functionality</i>) → Save
              </li>
              <li>
                Reviens ici → <b>« Mettre à jour les autorisations »</b> → puis{" "}
                <b>Sync</b>.
              </li>
            </ol>
          </div>
        )}
        {health === "scopes_manquants" && (
          <div className="mt-2 w-full rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-[12px] leading-relaxed text-amber-900">
            <b>Ton app n&apos;a aucune autorisation API.</b> Dans{" "}
            <b>partners.shopify.com</b> → ton app → <b>Configuration</b> → coche les
            scopes{" "}
            <span className="font-mono-kamoo text-[11px]">read_orders, write_orders, read_products, write_products, read_customers, write_merchant_managed_fulfillment_orders</span>{" "}
            → Save → reviens ici → <b>« Mettre à jour les autorisations »</b>.
          </div>
        )}
      </div>

      {connectOpen && (
        <ConnectModal
          market={market}
          liveMode={liveMode === true}
          onClose={() => setConnectOpen(false)}
          onConnectDemo={(domain) => {
            connectDemo(market.id, domain);
            setConnectOpen(false);
          }}
          onConnectLive={(domain) => connectLive(market.id, domain)}
        />
      )}
    </>
  );
}

/* ─── Modale de connexion (domaine → OAuth réel OU autorisation simulée) ─── */

function ConnectModal({
  market,
  liveMode,
  onClose,
  onConnectDemo,
  onConnectLive,
}: {
  market: Market;
  liveMode: boolean;
  onClose: () => void;
  onConnectDemo: (domain: string) => void;
  onConnectLive: (domain: string) => void;
}) {
  const [handle, setHandle] = useState("");
  const [step, setStep] = useState<"domain" | "consent">("domain");
  const domain = normalizeHandle(handle);
  const valid = domain !== null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-kamoo-blue-900/30 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h3 className="inline-flex items-center gap-2 text-[15px] font-bold text-ink-900">
            <ShoppingBag className="h-4 w-4 text-emerald-600" />
            Connecter Shopify · {market.country.flag} {market.country.name}
          </h3>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-lg text-ink-400 transition hover:bg-paper-2 hover:text-ink-900" aria-label="Fermer">
            <X className="h-4 w-4" />
          </button>
        </div>

        {step === "domain" ? (
          <div className="flex flex-col gap-3.5 px-5 py-4">
            <div>
              <label className="mb-1 block text-[11.5px] font-semibold text-ink-600">
                Domaine de ta boutique
              </label>
              <div className="flex items-center rounded-lg border border-line bg-white px-3 focus-within:border-kamoo-blue-600">
                <input
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="ma-boutique"
                  className="h-10 flex-1 bg-transparent text-[13px] text-ink-900 outline-none placeholder:text-ink-400"
                  autoFocus
                />
                <span className="text-[12.5px] font-medium text-ink-400">.myshopify.com</span>
              </div>
              {handle && !valid && (
                <p className="mt-1 text-[11px] text-red-600">Domaine invalide.</p>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 rounded-lg border border-line bg-white py-2.5 text-[13px] font-semibold text-ink-700 transition hover:bg-paper-2">
                Annuler
              </button>
              <button
                disabled={!valid}
                onClick={() => {
                  if (!domain) return;
                  if (liveMode) onConnectLive(domain);
                  else setStep("consent");
                }}
                className="flex-1 rounded-lg bg-kamoo-blue-900 py-2.5 text-[13px] font-bold text-white transition hover:bg-kamoo-blue-800 disabled:opacity-40"
              >
                {liveMode ? "Continuer vers Shopify" : "Continuer"}
              </button>
            </div>
          </div>
        ) : (
          /* Écran d'autorisation SIMULÉ (mode démo) — reproduit le consentement OAuth */
          <div className="flex flex-col gap-3.5 px-5 py-4">
            <div className="rounded-xl border border-line bg-paper-2/40 p-3.5">
              <div className="text-[12.5px] font-bold text-ink-900">
                {domain} souhaite installer <span className="text-emerald-700">Kamoo</span>
              </div>
              <p className="mt-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-ink-400">
                Kamoo pourra :
              </p>
              <ul className="mt-1.5 flex flex-col gap-1 text-[12.5px] text-ink-700">
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" /> Lire vos commandes &amp; clients</li>
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" /> Lire &amp; publier vos produits</li>
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" /> Mettre à jour le statut des commandes</li>
              </ul>
            </div>
            <p className="text-[11px] leading-relaxed text-ink-400">
              Démonstration : aucune vraie autorisation n&apos;est demandée. En mode réel,
              ce bouton ouvrirait l&apos;écran d&apos;installation officiel de Shopify.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setStep("domain")} className="flex-1 rounded-lg border border-line bg-white py-2.5 text-[13px] font-semibold text-ink-700 transition hover:bg-paper-2">
                Retour
              </button>
              <button
                onClick={() => domain && onConnectDemo(domain)}
                className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-[13px] font-bold text-white transition hover:bg-emerald-700"
              >
                Installer Kamoo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function normalizeHandle(input: string): string | null {
  const raw = input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!raw) return null;
  if (/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(raw)) return raw;
  if (/^[a-z0-9][a-z0-9-]*$/.test(raw)) return `${raw}.myshopify.com`;
  return null;
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH}h`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 7) return `il y a ${diffD} j`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
