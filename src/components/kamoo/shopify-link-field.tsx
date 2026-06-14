"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, Link2, Loader2, Package, Search, X } from "lucide-react";
import { useShopifyImport } from "@/lib/hooks/use-shopify-import";
import type { ShopifyProductLite } from "@/lib/shopify/products";
import { formatXOF } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Champ « connexion Shopify » d'un produit en cours de création/édition.
 *
 *  - Boutique connectée + produit NON lié → avertissement (ambre) : le produit
 *    ne sera pas rattaché à Shopify, + bouton pour le relier à un produit
 *    Shopify existant (recherche dans la boutique).
 *  - Produit lié → confirmation (vert) + « Détacher ».
 *  - Boutique non connectée → rien (l'avertissement n'aurait pas de sens).
 *
 * Le composant ne fait qu'éditer un `value` (le produit Shopify choisi) ; la
 * persistance du lien est faite par le parent à l'enregistrement.
 */
export function ShopifyLinkField({
  connected,
  marketId,
  shopDomain,
  value,
  onChange,
}: {
  connected: boolean;
  marketId: string;
  shopDomain: string;
  value: ShopifyProductLite | null;
  onChange: (v: ShopifyProductLite | null) => void;
}) {
  const { fetchProducts, linkedShopifyIds } = useShopifyImport();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [products, setProducts] = useState<ShopifyProductLite[]>([]);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // Charge la liste à la 1ʳᵉ ouverture du sélecteur.
  useEffect(() => {
    if (!open || loaded) return;
    let alive = true;
    setLoading(true);
    fetchProducts(marketId).then((r) => {
      if (!alive) return;
      setProducts(r.products);
      setLoaded(true);
      setLoading(false);
      searchRef.current?.focus();
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, loaded, marketId]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => !linkedShopifyIds.has(p.shopifyProductId))
      .filter((p) => !q || p.title.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q));
  }, [products, query, linkedShopifyIds]);

  if (!connected) return null;

  /* ─── État LIÉ ─── */
  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-3.5 py-3">
        <Check className="h-4 w-4 shrink-0 text-emerald-600" />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium text-emerald-800">Lié à un produit Shopify</div>
          <div className="mt-0.5 truncate text-[12px] text-ink-500">
            {value.title}
            {shopDomain && <span className="font-mono-kamoo"> · {shopDomain}</span>}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="shrink-0 rounded-lg border border-line bg-white px-3 py-1.5 text-[12px] font-medium text-ink-700 transition hover:bg-paper-2"
        >
          Détacher
        </button>
      </div>
    );
  }

  /* ─── État NON LIÉ : avertissement + sélecteur ─── */
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium text-amber-800">
            Ce produit ne sera pas connecté à Shopify
          </div>
          <div className="mt-0.5 text-[12px] leading-relaxed text-ink-600">
            Vous le créez directement dans Kamoo. Les commandes de votre boutique Shopify ne s&apos;y
            rattacheront pas automatiquement.
          </div>
          {!open && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-[12.5px] font-medium text-amber-800 transition hover:bg-amber-50"
            >
              <Link2 className="h-3.5 w-3.5" />
              Connecter à un produit Shopify existant
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="overflow-hidden rounded-xl border border-line bg-white">
          <div className="flex items-center gap-2 border-b border-line px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-ink-400" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un produit de la boutique…"
              className="flex-1 bg-transparent py-1 text-[13px] outline-none placeholder:text-ink-400"
            />
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setQuery("");
              }}
              className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-ink-400 transition hover:bg-paper-2 hover:text-ink-700"
              aria-label="Fermer la recherche"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="max-h-56 overflow-y-auto p-1.5">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-ink-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-[12px]">Chargement…</span>
              </div>
            ) : results.length === 0 ? (
              <p className="px-2 py-6 text-center text-[12.5px] text-ink-500">
                {query.trim()
                  ? `Aucun produit Shopify pour « ${query.trim()} ».`
                  : "Aucun produit Shopify disponible à lier."}
              </p>
            ) : (
              results.map((p) => (
                <button
                  key={p.shopifyProductId}
                  type="button"
                  onClick={() => {
                    onChange(p);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-paper-2"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-paper-2">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt={p.title} className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-4 w-4 text-ink-400" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-medium text-ink-900">{p.title}</span>
                    <span className="mt-0.5 block text-[11px] text-ink-500">
                      Shopify · {formatXOF(p.priceXof, false)} F
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
