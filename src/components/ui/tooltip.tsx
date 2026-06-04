"use client";

import * as React from "react";
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";

import { cn } from "@/lib/utils";

/**
 * Wrapper minimal autour du Tooltip Base UI. Utilisé pour les en-têtes de
 * colonnes (KPI, ratios) qui méritent une explication courte au survol.
 *
 * Usage :
 *   <Tooltip content="Coût Per Acquisition">
 *     <span>CPA</span>
 *   </Tooltip>
 */

function TooltipProvider({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider delay={250} {...props} />;
}

export function Tooltip({
  children,
  content,
  side = "top",
  className,
}: {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
}) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger
          render={<span className="cursor-help" />}
        >
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Positioner sideOffset={6} side={side}>
            <TooltipPrimitive.Popup
              className={cn(
                "z-50 max-w-[260px] rounded-lg bg-ink-900 px-2.5 py-1.5 text-[11.5px] font-medium text-white shadow-lg ring-1 ring-ink-900/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
                className,
              )}
            >
              {content}
            </TooltipPrimitive.Popup>
          </TooltipPrimitive.Positioner>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipProvider>
  );
}
