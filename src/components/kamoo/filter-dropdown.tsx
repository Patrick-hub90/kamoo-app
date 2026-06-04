"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type FilterDropdownProps = {
  label: string;
  value: string;
  isActive: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  /** Largeur du dropdown (Tailwind class). Défaut w-56. */
  width?: string;
  children: React.ReactNode;
};

/**
 * Dropdown filtre standard, utilisé sur les pages liste (closing, livraisons,
 * marketplace…). Usage : contrôler `isOpen` côté parent pour gérer
 * l'exclusivité (en ouvrir un ferme les autres).
 */
export function FilterDropdown({
  label,
  value,
  isActive,
  isOpen,
  onToggle,
  onClose,
  width = "w-56",
  children,
}: FilterDropdownProps) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={cn(
          "inline-flex h-9 max-w-[220px] items-center gap-2 whitespace-nowrap rounded-lg border bg-white px-3 text-[13px] font-semibold text-ink-900 hover:border-ink-300",
          isActive ? "border-kamoo-blue-600" : "border-line",
        )}
      >
        <span className="text-ink-500">{label} :</span>
        <span className="truncate">{value}</span>
        <ChevronDown className="h-3 w-3 shrink-0 text-ink-400" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={onClose} />
          <div
            className={cn(
              "absolute left-0 top-[calc(100%+4px)] z-20 max-h-[60vh] overflow-y-auto rounded-xl border border-line bg-white p-1 shadow-[var(--shadow-kamoo-lg)]",
              width,
            )}
          >
            {children}
          </div>
        </>
      )}
    </div>
  );
}

type DropdownItemProps = {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

export function DropdownItem({ active, onClick, children }: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-[13px] hover:bg-paper-2",
        active ? "font-bold text-ink-900" : "font-medium text-ink-700",
      )}
    >
      {children}
    </button>
  );
}
