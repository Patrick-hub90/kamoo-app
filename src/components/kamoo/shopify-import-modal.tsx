"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Package, ShoppingBag, X } from "lucide-react";
import { useShopifyImport } from "@/lib/hooks/use-shopify-import";
import type { ShopifyProductLite } from "@/lib/shopify/products";
import { formatXOF } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Modale « Importer depuis Shopify » — tire les produits de la boutique du
 * marché courant dans le catalogue Kamoo. Les produits déjà importés sont
 * grisés (anti-doublon). Un seul bouton plein (navy) : « Importer N ».
 */
export function ShopifyImportModal({
  marketId,
  shopDomain,
  onClose,
  onImported,
}: {
  marketId: string;
  shopDomain: string;
  onClose: () => void;
  onImported: (count: number) => void;
}) {
  const { fetchProducts, importProducts, linkedShopifyIds } = useShopifyImport();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<ShopifyProductLite[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchProducts(marketId).then((r) => {
      if (!alive) return;
      setProducts(r.products);
      setError(r.error ?? null);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketId]);

  const importable = useMemo(
    () => products.filter((p) => !linkedShopifyIds.has(p.shopifyProductId)),
    [products, linkedShopifyIds],
  );
  const alreadyCount = products.length - importable.length;
  const allSelected = importable.length > 0 && importable.every((p) => selected.has(p.shopifyProductId));

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(importable.map((p) => p.shopifyProductId)));
  };

  const handleImport = () => {
    setBusy(true);
    const chosen = importable.filter((p) => selected.has(p.shopifyProductId));
    const n = importProducts(chosen);
    onImported(n);
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-kamoo-blue-900/30 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h3 className="inline-flex items-center gap-2 text-[15px] font-semibold text-ink-900">
              <ShoppingBag className="h-4 w-4 text-emerald-600" />
              Importer depuis Shopify
            </h3>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-mono-kamoo text-[12px] text-ink-500">{shopDomain}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-medium text-emerald-700">
                Connecté
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-ink-400 transition hover:bg-paper-2 hover:text-ink-900"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Barre de sélection */}
        {!loading && !error && products.length > 0 && (
          <div className="flex items-center justify-between border-b border-line bg-paper-2/50 px-5 py-2.5">
            <span className="text-[12px] text-ink-500">
              {products.length} produit{products.length > 1 ? "s" : ""} trouvé{products.length > 1 ? "s" : ""}
              {alreadyCount > 0 && ` · ${importable.length} non importé${importable.length > 1 ? "s" : ""}`}
            </span>
            {importable.length > 0 && (
              <button
                onClick={toggleAll}
                className="text-[12px] font-medium text-kamoo-blue-700 transition hover:underline"
              >
                {allSelected ? "Tout désélectionner" : "Tout sélectionner"}
              </button>
            )}
          </div>
        )}

        {/* Corps */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-ink-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-[12.5px]">Chargement des produits…</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-1.5 py-12 text-center">
              <p className="text-[13px] font-medium text-ink-900">Impossible de charger les produits</p>
              <p className="max-w-xs text-[12px] text-ink-500">
                {error === "scopes_manquants"
                  ? "L'autorisation « read_products » est requise sur la boutique."
                  : error === "donnees_client_a_approuver"
                    ? "L'accès aux données produits doit être approuvé côté Shopify."
                    : "Réessayez dans un instant."}
              </p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1.5 py-12 text-center">
              <Package className="h-6 w-6 text-ink-300" />
              <p className="text-[13px] font-medium text-ink-900">Aucun produit sur la boutique</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {products.map((p) => {
                const imported = linkedShopifyIds.has(p.shopifyProductId);
                const checked = selected.has(p.shopifyProductId);
                return (
                  <button
                    key={p.shopifyProductId}
                    onClick={() => !imported && toggle(p.shopifyProductId)}
                    disabled={imported}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                      imported
                        ? "cursor-not-allowed border-line bg-white opacity-60"
                        : checked
                          ? "border-kamoo-blue-600 bg-kamoo-blue-50/40"
                          : "border-line bg-white hover:bg-paper-2/50",
                    )}
                  >
                    {imported ? (
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-emerald-600 text-white">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    ) : (
                      <span
                        className={cn(
                          "grid h-5 w-5 shrink-0 place-items-center rounded-md border",
                          checked ? "border-kamoo-blue-600 bg-kamoo-blue-600 text-white" : "border-ink-300 bg-white",
                        )}
                      >
                        {checked && <Check className="h-3.5 w-3.5" />}
                      </span>
                    )}
                    <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-paper-2">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt={p.title} className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-4 w-4 text-ink-400" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-ink-900">{p.title}</span>
                      <span className="mt-0.5 block text-[11.5px] text-ink-500">
                        {imported
                          ? "Déjà dans le catalogue"
                          : `${p.variantsCount} variante${p.variantsCount > 1 ? "s" : ""}${p.sku ? ` · ${p.sku}` : ""}`}
                      </span>
                    </span>
                    {imported ? (
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-medium text-emerald-700">
                        Importé
                      </span>
                    ) : (
                      <span className="shrink-0 text-[12.5px] font-medium tabular-nums text-ink-900">
                        {formatXOF(p.priceXof, false)} F
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Pied */}
        <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3.5">
          <button
            onClick={onClose}
            className="rounded-lg border border-line bg-white px-4 py-2.5 text-[13px] font-medium text-ink-700 transition hover:bg-paper-2"
          >
            Annuler
          </button>
          <button
            disabled={selected.size === 0 || busy}
            onClick={handleImport}
            className="rounded-lg bg-kamoo-blue-900 px-4 py-2.5 text-[13px] font-medium text-white transition hover:bg-kamoo-blue-800 disabled:opacity-40"
          >
            {busy
              ? "Import…"
              : `Importer ${selected.size > 0 ? selected.size : ""} produit${selected.size > 1 ? "s" : ""}`.trim()}
          </button>
        </div>
      </div>
    </div>
  );
}
