import { notFound } from "next/navigation";
import { ProductForm } from "@/components/kamoo/product-form";
import { getProduit } from "@/lib/data/mock-produits";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProduitPage({ params }: PageProps) {
  const { id } = await params;
  const p = getProduit(id);
  if (!p) notFound();

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
