"use client";

import Link from "next/link";
import { AlertTriangle, ChevronRight, Plane, Ship, Zap } from "lucide-react";
import { useSavedCovers } from "@/components/kamoo/product-image-manager";
import { formatXOF } from "@/lib/format";
import { TRANSPORT_MODE_LABELS, type Expedition } from "@/lib/types/expedition";
import { cn } from "@/lib/utils";

/**
 * ExpeditionRow — ligne d'expédition (Code · Produit · Transitaire · Mode ·
 * Statut · Montant + chevron encadré). Identité Kamoo, attention en ROUGE
 * (choix user : action/urgence en rouge plutôt qu'orange).
 */

type Props = {
  expedition: Expedition;
  isFirst?: boolean;
};

type ShipmentTone = "action" | "info" | "success" | "neutral" | "danger";
type ShipmentStatus = { label: string; tone: ShipmentTone };

function deriveStatus(e: Expedition): ShipmentStatus {
  if (e.paymentStatus === "unpaid" && e.amountXof !== null) {
    return { label: "Action requise", tone: "action" };
  }
  if (e.status === "arrived_destination") {
    return { label: "Arrivé à Dakar", tone: "success" };
  }
  if (e.status === "awaiting_quote") {
    return { label: "Attente devis", tone: "neutral" };
  }
  return { label: "En transit", tone: "info" };
}

/* Pastilles de statut (pastel) — attention en rouge. */
const TONE: Record<ShipmentTone, { pill: string; dot: string }> = {
  action: { pill: "bg-red-50 text-red-700", dot: "bg-red-500" },
  info: { pill: "bg-kamoo-blue-50 text-kamoo-blue-700", dot: "bg-kamoo-blue-600" },
  success: { pill: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  neutral: { pill: "bg-ink-100 text-ink-500", dot: "bg-ink-400" },
  danger: { pill: "bg-red-50 text-red-600", dot: "bg-red-500" },
};

function modeIcon(mode: Expedition["transportMode"]) {
  if (mode === "sea") return Ship;
  if (mode === "air_express") return Zap;
  return Plane;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatusPill({ status }: { status: ShipmentStatus }) {
  const t = TONE[status.tone];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold", t.pill)}>
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", t.dot)} />
      {status.label}
    </span>
  );
}

/** Grille partagée header ↔ rows. */
const GRID_COLS = "130px minmax(200px,1fr) 190px 150px 150px 130px 48px";

export function ExpeditionRow({ expedition: e, isFirst = false }: Props) {
  const status = deriveStatus(e);
  const isActionRequired = status.tone === "action";
  const ModeIcon = modeIcon(e.transportMode);
  const productLabel =
    e.otherProductsCount > 0 ? `${e.productName} · +${e.otherProductsCount}` : e.productName;
  /* Visuel relié au catalogue : photo de couverture du produit si dispo */
  const covers = useSavedCovers();
  const cover = e.productId ? covers[e.productId] : undefined;

  return (
    <Link
      href={`/expeditions/${e.id}`}
      className={cn(
        "group/row grid items-center gap-4 px-5 py-4 transition hover:bg-paper-2/50",
        !isFirst && "border-t border-line",
      )}
      style={{ gridTemplateColumns: GRID_COLS }}
    >
      {/* 1 · Code + date */}
      <div>
        <div className="text-[13px] font-semibold tabular-nums text-ink-900">{e.publicCode}</div>
        <div className="mt-0.5 text-[11px] tabular-nums text-ink-400">{formatDate(e.createdAt)}</div>
      </div>

      {/* 2 · Produit — même visuel que le catalogue (photo si dispo, sinon emoji) */}
      <div className="flex min-w-0 items-center gap-3">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
        ) : (
          <div
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-[18px]"
            style={{ background: e.thumb.bg }}
          >
            {e.thumb.emoji}
          </div>
        )}
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold text-ink-900">{productLabel}</div>
          {isActionRequired && (
            <div className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-red-600">
              <AlertTriangle className="h-3 w-3" />
              Paie pour libérer
            </div>
          )}
        </div>
      </div>

      {/* 3 · Transitaire */}
      <div className="flex min-w-0 items-center gap-2">
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-ink-100 text-[10px] font-bold text-ink-700">
          {e.transitaire.avatar}
        </div>
        <div className="min-w-0 truncate text-[12.5px] font-medium text-ink-900">{e.transitaire.name}</div>
      </div>

      {/* 4 · Mode */}
      <div className="flex items-center gap-1.5 whitespace-nowrap text-[12.5px] font-medium text-ink-700">
        <ModeIcon className="h-3.5 w-3.5 shrink-0 text-ink-400" />
        {TRANSPORT_MODE_LABELS[e.transportMode]}
      </div>

      {/* 5 · Statut */}
      <div className="flex items-center">
        <StatusPill status={status} />
      </div>

      {/* 6 · Montant */}
      <div className="text-right">
        {e.amountXof !== null ? (
          <>
            <div className="text-[14px] font-bold tabular-nums leading-none text-ink-900">
              {formatXOF(e.amountXof, false)}{" "}
              <span className="text-[10.5px] font-medium text-ink-400">F</span>
            </div>
            <div
              className={cn(
                "mt-1 text-[11px] font-semibold",
                e.paymentStatus === "paid" ? "text-emerald-600" : "text-red-600",
              )}
            >
              {e.paymentStatus === "paid" ? "Payé" : "Non payé"}
            </div>
          </>
        ) : (
          <>
            <div className="text-[14px] font-bold leading-none text-ink-300">—</div>
            <div className="mt-1 text-[11px] font-medium text-ink-400">En attente</div>
          </>
        )}
      </div>

      {/* 7 · Chevron encadré */}
      <span className="grid h-8 w-8 place-items-center justify-self-end rounded-lg border border-line text-ink-400 transition group-hover/row:border-kamoo-blue-200 group-hover/row:text-kamoo-blue-700">
        <ChevronRight className="h-4 w-4" />
      </span>
    </Link>
  );
}

export function ExpeditionRowHeader() {
  return (
    <div
      className="grid items-center gap-4 border-b border-line bg-white px-5 py-3"
      style={{ gridTemplateColumns: GRID_COLS }}
    >
      <Hd>Code</Hd>
      <Hd>Produit</Hd>
      <Hd>Transitaire</Hd>
      <Hd>Mode</Hd>
      <Hd>Statut</Hd>
      <Hd className="text-right">Montant</Hd>
      <span />
    </div>
  );
}

function Hd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("text-[10.5px] font-semibold uppercase tracking-[0.05em] text-ink-400", className)}>
      {children}
    </div>
  );
}
