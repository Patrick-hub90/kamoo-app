"use client";

import { useState } from "react";
import { Loader2, Power } from "lucide-react";
import { useProductsState } from "@/lib/hooks/use-products-state";
import { cn } from "@/lib/utils";

type Props = {
  /** ID du produit — source de vérité pour la lecture / écriture */
  productId: string;
  /** État initial (lu côté serveur depuis le mock — fallback si pas d'override) */
  initialActive: boolean;
  /** Nom court — pour l'aria-label */
  productName: string;
};

/**
 * Badge statut + Toggle Activer / Désactiver pour un produit.
 *
 * Lit l'état via `useProductsState` (sessionStorage) → quand on toggle,
 * la valeur est répercutée sur le Catalogue, le Dashboard (alertes stock),
 * et toute autre vue qui consomme le même hook.
 *
 * V2 : le hook sera remplacé par une server action + revalidatePath.
 */
export function ProductActiveToggle({
  productId,
  initialActive,
  productName,
}: Props) {
  const { getProduct, toggleActive } = useProductsState();
  const liveProduct = getProduct(productId);
  const active = liveProduct?.isActive ?? initialActive;

  const [pending, setPending] = useState(false);

  const handleClick = () => {
    if (pending) return;
    setPending(true);
    // Simule un appel API
    setTimeout(() => {
      toggleActive(productId);
      setPending(false);
    }, 200);
  };

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition",
          active
            ? "bg-emerald-600 text-white"
            : "bg-paper-2 text-ink-500 ring-1 ring-inset ring-line",
        )}
      >
        {active ? "● En vente" : "○ Inactif"}
      </span>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-label={
          active ? `Désactiver ${productName}` : `Activer ${productName}`
        }
        className={cn(
          "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[13px] font-semibold transition",
          active
            ? "border-line bg-white text-ink-900 hover:border-amber-500 hover:bg-paper-2"
            : "border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600",
          pending && "cursor-wait opacity-70",
        )}
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Power className="h-3.5 w-3.5" />
        )}
        {active ? "Désactiver" : "Activer"}
      </button>
    </div>
  );
}
