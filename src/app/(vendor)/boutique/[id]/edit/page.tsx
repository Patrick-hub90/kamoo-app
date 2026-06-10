"use client";

import Link from "next/link";
import { use } from "react";
import { ProductForm } from "@/components/kamoo/product-form";
import { useProductsState } from "@/lib/hooks/use-products-state";

type PageProps = {
  params: Promise<{ id: string }>;
};

/**
 * Édition produit — CLIENT component branché sur le store produits :
 * le formulaire s'ouvre avec les valeurs réellement enregistrées
 * (créations + modifications de la session incluses).
 */
export default function EditProduitPage({ params }: PageProps) {
  const { id } = use(params);
  const { getProduct } = useProductsState();
  const p = getProduct(id);

  if (!p) {
    return (
      <div className="grid min-h-[60vh] place-items-center bg-paper px-6 text-center">
        <div>
          <p className="text-[15px] font-semibold text-ink-900">Produit introuvable</p>
          <Link
            href="/boutique"
            className="mt-4 inline-flex rounded-lg bg-kamoo-blue-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-kamoo-blue-800"
          >
            Retour au catalogue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ProductForm
      mode="edit"
      cancelHref={`/boutique/${p.id}`}
      successHref={`/boutique/${p.id}`}
      initial={{
        id: p.id,
        sku: p.sku,
        skuLocked: true,
        name: p.name,
        emoji: p.emoji,
        bg: p.bg,
        description: p.description,
        priceXof: p.priceXof,
        costPriceXof: p.costPriceXof,
        stock: p.stock,
        lowStockThreshold: p.lowStockThreshold,
        isActive: p.isActive,
      }}
    />
  );
}
