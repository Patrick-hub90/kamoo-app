"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, ShoppingBag } from "lucide-react";
import { useProductsState } from "@/lib/hooks/use-products-state";
import { useShopify } from "@/lib/hooks/use-shopify";
import { useShopifyImport } from "@/lib/hooks/use-shopify-import";
import { needsCompletion } from "@/lib/types/produit";
import type { ShopifyProductLite } from "@/lib/shopify/products";
import { cn } from "@/lib/utils";

/**
 * Bandeau de réconciliation produits ↔ Shopify (catalogue).
 *
 * Deux relances actionnables, affichées seulement si elles ont du contenu :
 *  1. « À compléter » : produits créés automatiquement depuis des commandes
 *     (origin shopify_order) dont le prix d'achat manque → marge non calculée.
 *  2. « À importer » : produits présents sur la boutique Shopify mais pas
 *     encore dans le catalogue Kamoo (détecte aussi les nouveaux produits).
 *
 * Aucun import/écriture automatique : on PROPOSE, le vendeur décide.
 */
export function CatalogueReconBanner({
  marketId,
  onImport,
  onShowIncomplete,
}: {
  marketId: string;
  onImport: () => void;
  onShowIncomplete: () => void;
}) {
  const { products } = useProductsState();
  const { getConnection, liveMode } = useShopify();
  const { fetchProducts, linkedShopifyIds } = useShopifyImport();

  const conn = getConnection(marketId);
  const connected = conn?.isConnected === true;
  const mode = conn?.mode;

  /* Produits à compléter (prix d'achat manquant, issus d'une commande). */
  const incompleteCount = useMemo(
    () => products.filter(needsCompletion).length,
    [products],
  );

  /* Produits Shopify non importés — pull par (marché, mode), comparé aux liens. */
  const [shopifyProducts, setShopifyProducts] = useState<ShopifyProductLite[] | null>(null);
  const fetchedKey = useRef<string | null>(null);
  useEffect(() => {
    // On attend la résolution du mode (liveMode part de null le temps de l'appel
    // /status) : sinon un 1er fetch partirait en DÉMO (liste fictive) et ne
    // serait jamais rejoué une fois le mode réel connu.
    if (!connected || liveMode == null) {
      if (!connected) {
        fetchedKey.current = null;
        setShopifyProducts(null);
      }
      return;
    }
    // La clé inclut mode + liveMode → re-fetch au passage démo↔live.
    const key = `${marketId}:${liveMode}:${mode}`;
    if (fetchedKey.current === key) return;
    fetchedKey.current = key;
    let cancelled = false;
    fetchProducts(marketId).then(({ products: list, error }) => {
      if (cancelled) return;
      if (error) {
        // Échec transitoire (réseau, throttle) : on libère la clé pour réessayer.
        if (fetchedKey.current === key) fetchedKey.current = null;
        return;
      }
      setShopifyProducts(list);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketId, connected, liveMode, mode]);

  const missingCount = useMemo(
    () =>
      shopifyProducts
        ? shopifyProducts.filter((p) => !linkedShopifyIds.has(p.shopifyProductId)).length
        : 0,
    [shopifyProducts, linkedShopifyIds],
  );

  if (incompleteCount === 0 && missingCount === 0) return null;

  return (
    <div className="flex flex-col divide-y divide-line overflow-hidden rounded-xl border border-line bg-white shadow-kamoo-sm">
      {incompleteCount > 0 && (
        <ReconRow
          tone="amber"
          icon={AlertTriangle}
          title={`${incompleteCount} produit${incompleteCount > 1 ? "s" : ""} à compléter`}
          desc="Ajoutés automatiquement depuis vos commandes. Renseignez le prix d'achat pour calculer la marge."
          cta="Compléter"
          onClick={onShowIncomplete}
        />
      )}
      {missingCount > 0 && (
        <ReconRow
          tone="blue"
          icon={ShoppingBag}
          title={`${missingCount} produit${missingCount > 1 ? "s" : ""} Shopify non importé${missingCount > 1 ? "s" : ""}`}
          desc="Des produits de votre boutique ne sont pas encore dans le catalogue Kamoo."
          cta="Importer"
          onClick={onImport}
        />
      )}
    </div>
  );
}

function ReconRow({
  tone,
  icon: Icon,
  title,
  desc,
  cta,
  onClick,
}: {
  tone: "amber" | "blue";
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-lg ring-1",
          tone === "amber"
            ? "bg-amber-50 text-amber-700 ring-amber-100"
            : "bg-kamoo-blue-50 text-kamoo-blue-700 ring-kamoo-blue-100",
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium text-ink-900">{title}</div>
        <div className="text-[11.5px] leading-snug text-ink-500">{desc}</div>
      </div>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[12px] font-medium text-ink-700 transition hover:bg-paper-2"
      >
        {cta}
        <ArrowRight className="h-3.5 w-3.5 text-ink-400" />
      </button>
    </div>
  );
}
