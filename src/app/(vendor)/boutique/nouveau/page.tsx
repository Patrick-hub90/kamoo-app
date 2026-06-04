import { ProductForm } from "@/components/kamoo/product-form";

/**
 * Génère un SKU placeholder lisible. En V2 ce sera fait côté serveur lors
 * du save (avec collision check sur le tenant) — ici c'est juste une preview.
 */
function generateSkuPreview(): string {
  // ex: SKU-NEW-2841 — déterministe-ish pour éviter l'hydration mismatch
  const stamp = String(Date.now()).slice(-4);
  return `SKU-NEW-${stamp}`;
}

export default function NouveauProduitPage() {
  return (
    <ProductForm
      mode="create"
      cancelHref="/boutique"
      successHref="/boutique"
      initial={{
        sku: generateSkuPreview(),
        skuLocked: false,
        name: "",
        emoji: "📦",
        bg: "linear-gradient(135deg,#F1F5F9,#94A3B8)",
        description: "",
        priceXof: 0,
        costPriceXof: undefined,
        stock: 0,
        lowStockThreshold: 10,
        isActive: true,
      }}
    />
  );
}
