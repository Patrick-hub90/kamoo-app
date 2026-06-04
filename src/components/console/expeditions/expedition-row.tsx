"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Plane,
  Ship,
  Zap,
} from "lucide-react";
import { MonoLabel } from "@/components/console/primitives";
import { formatXOF } from "@/lib/format";
import {
  TRANSPORT_MODE_LABELS,
  type Expedition,
} from "@/lib/types/expedition";
import { cn } from "@/lib/utils";

/**
 * ExpeditionRow — table 6 colonnes (Code · Produit · Transitaire · Mode ·
 * Statut · Montant) + chevron. Composant `ExpeditionRow` + son header
 * `ExpeditionRowHeader`. Colonnes compactées pour tenir dans un layout
 * lisible sans déborder hors du panneau.
 *
 * Ligne urgente (statut « action requise ») :
 *   - box-shadow inset orange 3px à gauche
 *   - bg cream très léger
 *   - flag « Paie pour libérer » inline
 */

type Props = {
  expedition: Expedition;
  /** Si true, retire le border-top (première ligne sous le header). Desktop only. */
  isFirst?: boolean;
};

/* ─── Mapping statut → schéma sémantique strict ──────────────────────── */

type ShipmentTone = "action" | "info" | "success" | "neutral" | "danger";

type ShipmentStatus = {
  label: string;
  tone: ShipmentTone;
};

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

const TONE_STYLES: Record<
  ShipmentTone,
  { bg: string; fg: string; dot: string }
> = {
  action: { bg: "bg-kamoo-orange-50", fg: "text-kamoo-orange-700", dot: "bg-kamoo-orange-500" },
  info: { bg: "bg-kamoo-blue-50", fg: "text-kamoo-blue-700", dot: "bg-kamoo-blue-600" },
  success: { bg: "bg-emerald-50", fg: "text-emerald-700", dot: "bg-emerald-500" },
  neutral: { bg: "bg-paper-2", fg: "text-ink-600", dot: "bg-ink-400" },
  danger: { bg: "bg-red-50", fg: "text-red-700", dot: "bg-red-500" },
};

function modeIcon(mode: Expedition["transportMode"]) {
  if (mode === "sea") return Ship;
  if (mode === "air_express") return Zap;
  return Plane;
}

function modeColor(mode: Expedition["transportMode"]): string {
  if (mode === "sea") return "#1E40AF";
  return "#F97316";
}

function formatEtd(createdAt: string): string {
  const d = new Date(createdAt);
  const day = d.getDate();
  const month = d.toLocaleDateString("fr-FR", { month: "short" });
  return `ETD ${day} ${month}`;
}

/* ─── Pastille statut (réutilisée desktop + mobile) ──────────────────── */

function StatusPill({ status }: { status: ShipmentStatus }) {
  const t = TONE_STYLES[status.tone];
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[10.5px] font-extrabold uppercase tracking-[0.04em]",
        t.bg,
        t.fg,
      )}
    >
      <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", t.dot)} />
      {status.label}
    </span>
  );
}

/* ─── Desktop : table 6 cols + chevron ───────────────────────────────── */

/** Grid template partagé header ↔ rows.
 *  Colonnes compactées (Code · Produit · Transitaire · Mode · Statut ·
 *  Montant · chevron) — total min ~990px pour tenir confortablement dans
 *  un panneau ≥ 1024px sans cacher le chevron. */
const GRID_COLS =
  "120px minmax(180px,1fr) 170px 90px 140px 130px 32px";

export function ExpeditionRow({ expedition: e, isFirst = false }: Props) {
  const status = deriveStatus(e);
  const isActionRequired = status.tone === "action";
  const ModeIcon = modeIcon(e.transportMode);
  const productLabel =
    e.otherProductsCount > 0
      ? `${e.productName} · +${e.otherProductsCount}`
      : e.productName;

  return (
    <Link
      href={`/expeditions/${e.id}`}
      className={cn(
        "group/row grid items-center gap-4 px-5 py-3.5 transition",
        !isFirst && "border-t border-paper-2",
        isActionRequired
          ? "bg-[#FFFAF6] shadow-[inset_3px_0_0_#FF6B1A] hover:bg-[#FFF5EC]"
          : "hover:bg-paper-2/50",
      )}
      style={{ gridTemplateColumns: GRID_COLS, minHeight: 68 }}
    >
      {/* 1 · Code + ETD */}
      <div>
        <div className="font-mono-kamoo text-[12px] font-extrabold tracking-tight text-ink-900">
          {e.publicCode}
        </div>
        <div className="mt-0.5 font-mono-kamoo text-[10px] text-ink-400">
          {formatEtd(e.createdAt)}
        </div>
      </div>

      {/* 2 · Produit */}
      <div className="flex min-w-0 items-center gap-3">
        <div
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-xl"
          style={{ background: e.thumb.bg }}
        >
          {e.thumb.emoji}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[13px] font-bold text-ink-900">
            {productLabel}
          </div>
          {isActionRequired && (
            <div className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-kamoo-orange-700">
              <AlertTriangle className="h-3 w-3" />
              Paie pour libérer
            </div>
          )}
        </div>
      </div>

      {/* 3 · Transitaire */}
      <div className="flex min-w-0 items-center gap-2">
        <div
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md font-display text-[10px] font-extrabold text-white"
          style={{ background: e.transitaire.avatarBg }}
        >
          {e.transitaire.avatar}
        </div>
        <div className="min-w-0 truncate text-[12px] font-semibold text-ink-900">
          {e.transitaire.name}
        </div>
      </div>

      {/* 4 · Mode */}
      <div
        className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-700"
        title={TRANSPORT_MODE_LABELS[e.transportMode]}
      >
        <ModeIcon
          className="h-3.5 w-3.5"
          style={{ color: modeColor(e.transportMode) }}
        />
        {TRANSPORT_MODE_LABELS[e.transportMode].split(" ")[0]}
      </div>

      {/* 5 · Statut */}
      <div className="flex items-center">
        <StatusPill status={status} />
      </div>

      {/* 6 · Montant */}
      <div className="text-right">
        {e.amountXof !== null ? (
          <>
            <div className="font-display text-[15px] font-extrabold tabular-nums leading-none text-ink-900">
              {formatXOF(e.amountXof, false)}{" "}
              <span className="text-[10.5px] font-medium text-ink-500">F</span>
            </div>
            <div
              className={cn(
                "mt-1 text-[10.5px] font-bold",
                e.paymentStatus === "paid"
                  ? "text-emerald-700"
                  : "text-kamoo-orange-700",
              )}
            >
              {e.paymentStatus === "paid" ? "Payé" : "Non payé"}
            </div>
          </>
        ) : (
          <div className="text-[11px] italic text-ink-400">En attente</div>
        )}
      </div>

      {/* 7 · Chevron */}
      <ArrowRight className="h-4 w-4 justify-self-end text-ink-300 transition group-hover/row:translate-x-0.5 group-hover/row:text-kamoo-blue-700" />
    </Link>
  );
}

/* ─── Header table (alignement garanti via GRID_COLS partagé) ────────── */

export function ExpeditionRowHeader() {
  return (
    <div
      className="grid items-center gap-4 border-b border-paper-2 bg-paper-2/50 px-5 py-3"
      style={{ gridTemplateColumns: GRID_COLS }}
    >
      <MonoLabel>Code</MonoLabel>
      <MonoLabel>Produit</MonoLabel>
      <MonoLabel>Transitaire</MonoLabel>
      <MonoLabel>Mode</MonoLabel>
      <MonoLabel>Statut</MonoLabel>
      <MonoLabel className="text-right">Montant</MonoLabel>
      <span />
    </div>
  );
}

