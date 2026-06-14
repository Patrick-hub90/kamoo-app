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
  /**
   * Rendu : "full" = badge + bouton (défaut), "badge" = pastille seule
   * (en-tête), "button" = bouton seul (rail). Les deux variantes lisent le
   * même état live → restent synchronisées.
   */
  variant?: "full" | "badge" | "button";
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
  variant = "full",
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

  const badge = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium transition",
        active ? "bg-emerald-50 text-emerald-700" : "bg-paper-2 text-ink-500",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          active ? "bg-emerald-500" : "bg-ink-400",
        )}
      />
      {active ? "En vente" : "Inactif"}
    </span>
  );

  const button = (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={active ? `Désactiver ${productName}` : `Activer ${productName}`}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 text-[13px] font-medium text-ink-900 transition hover:bg-paper-2",
        variant === "button" && "w-full justify-center",
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
  );

  if (variant === "badge") return badge;
  if (variant === "button") return button;
  return <div className="flex items-center gap-2">{badge}{button}</div>;
}
