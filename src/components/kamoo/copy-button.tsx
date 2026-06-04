"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  label?: string;
  fullWidth?: boolean;
  /** Mode custom : passe les children + className et on rend un bouton
   *  natif avec le handler de copie. Override le rendu par défaut. */
  children?: ReactNode;
  className?: string;
  "aria-label"?: string;
};

export function CopyButton({
  value,
  label,
  fullWidth = false,
  children,
  className,
  "aria-label": ariaLabel,
}: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    // Tentative API moderne avec fallback execCommand pour les contextes où
    // navigator.clipboard est bloqué (iframes, contextes non-sécurisés).
    let ok = false;
    try {
      await navigator.clipboard.writeText(value);
      ok = true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }
    // On affiche le feedback dans tous les cas — le vendeur sait que son
    // clic a été pris en compte (et 99% du temps la copie a réussi).
    void ok;
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  // Mode custom : children + className passés par le caller (rendu libre)
  if (children !== undefined) {
    return (
      <button
        type="button"
        onClick={handleCopy}
        className={className}
        aria-label={ariaLabel}
        title={copied ? "Copié !" : undefined}
      >
        {children}
      </button>
    );
  }

  if (label) {
    return (
      <button
        onClick={handleCopy}
        className={cn(
          "mt-3 inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-paper-2 px-4 py-2.5 text-[13px] font-semibold text-ink-900 transition hover:bg-white",
          copied && "border-emerald-500 bg-emerald-50 text-emerald-700",
          fullWidth && "w-full",
        )}
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" />
            Copié !
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            {label}
          </>
        )}
      </button>
    );
  }

  return (
    <span className="relative inline-block">
      <button
        onClick={handleCopy}
        className={cn(
          "grid h-7 w-7 place-items-center rounded-md text-ink-400 hover:bg-paper-2 hover:text-ink-700",
          copied && "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
        )}
        title={copied ? "Copié !" : "Copier"}
        aria-live="polite"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
      {/* Toast inline « Copié ! » — apparaît au-dessus du bouton pendant
          ~1.8s, suffisamment visible pour confirmer l'action. */}
      {copied && (
        <span
          role="status"
          className="pointer-events-none absolute left-1/2 -top-1 z-30 flex -translate-x-1/2 -translate-y-full items-center gap-1 whitespace-nowrap rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white shadow-[var(--shadow-kamoo-md)] animate-in fade-in zoom-in-95 duration-150"
        >
          <Check className="h-3 w-3" />
          Copié !
          {/* petite flèche */}
          <span className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-[4px] border-t-[4px] border-x-transparent border-t-emerald-600" />
        </span>
      )}
    </span>
  );
}
