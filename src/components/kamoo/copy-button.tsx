"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  label?: string;
  fullWidth?: boolean;
};

export function CopyButton({ value, label, fullWidth = false }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard non dispo */
    }
  };

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
    <button
      onClick={handleCopy}
      className={cn(
        "grid h-7 w-7 place-items-center rounded-md text-ink-400 hover:bg-paper-2 hover:text-ink-700",
        copied && "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
      )}
      title={copied ? "Copié !" : "Copier"}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
