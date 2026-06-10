"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bookmark,
  CheckCircle2,
  Clock,
  MapPin,
  MessageCircle,
  Plane,
  Ship,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react";

import { usePartners } from "@/lib/hooks/use-partners";
import type { Transitaire } from "@/lib/types/transitaire";
import type { TransportMode } from "@/lib/types/expedition";
import { TRANSPORT_MODE_LABELS } from "@/lib/types/expedition";
import { cn } from "@/lib/utils";

const MODE_ICON: Record<TransportMode, typeof Ship> = {
  sea: Ship,
  air_standard: Plane,
  air_express: Zap,
};

const fmt = (n: number) => n.toLocaleString("fr-FR");

type Props = {
  transitaire: Transitaire;
  /** Transitaire enregistré (épinglé en tête de liste) */
  saved?: boolean;
  onToggleSave?: () => void;
};

export function TransitaireCard({ transitaire: t, saved = false, onToggleSave }: Props) {
  const { getPartnership } = usePartners();
  const partnership = getPartnership("transitaire", t.slug);

  return (
    <div
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border bg-white transition",
        saved
          ? "border-kamoo-blue-300 ring-1 ring-kamoo-blue-100"
          : "border-line hover:border-ink-300 hover:shadow-[var(--shadow-kamoo-md)]",
      )}
    >
      {/* COUVERTURE */}
      <div className="relative h-28">
        {t.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.coverImageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full" style={{ background: t.coverBg }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {/* On travaille déjà ensemble : badge prioritaire sur « Enregistré » */}
          {partnership?.status === "active" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
              <BadgeCheck className="h-2.5 w-2.5" /> Votre transitaire
            </span>
          )}
          {partnership?.status === "pending" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
              <Clock className="h-2.5 w-2.5" /> Demande envoyée
            </span>
          )}
          {saved && !partnership && (
            <span className="inline-flex items-center gap-1 rounded-full bg-kamoo-blue-900/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
              <Bookmark className="h-2.5 w-2.5 fill-current" /> Enregistré
            </span>
          )}
        </div>
        <div className="absolute right-3 top-3">
          {t.status === "new" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-kamoo-blue-700 shadow-sm">
              <Sparkles className="h-2.5 w-2.5" /> Nouveau
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-kamoo-orange-600 shadow-sm">
              <BadgeCheck className="h-2.5 w-2.5" /> Certifié Kamoo
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4">
        {/* Avatar (chevauche la couverture) */}
        <div
          className="relative z-10 -mt-7 mb-2 grid h-14 w-14 place-items-center rounded-full border-[3px] border-white text-[15px] font-extrabold text-white shadow-md"
          style={{ background: t.avatarBg }}
        >
          {t.avatar}
        </div>

        {/* Nom + note + certifié */}
        <h3 className="text-[16px] font-bold leading-tight text-ink-900">{t.name}</h3>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px]">
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <b className="text-ink-900">{t.rating}</b>
            <span className="text-ink-500">({t.reviewsCount} avis)</span>
          </span>
          {t.status === "certified" && (
            <span className="inline-flex items-center gap-1 text-kamoo-blue-700">
              <BadgeCheck className="h-3.5 w-3.5" /> Certifié Kamoo
            </span>
          )}
        </div>
        <div className="mt-1 inline-flex items-center gap-1 text-[12px] text-ink-500">
          <MapPin className="h-3 w-3 shrink-0" /> Retrait : {t.localWarehouse ?? t.city} · Partenaire depuis {t.partnerSince}
        </div>

        {/* Description */}
        <p className="mt-2.5 line-clamp-2 text-[12.5px] leading-relaxed text-ink-600">{t.about}</p>

        {/* Fiabilité — 3 indicateurs distincts, calculés par la plateforme */}
        <div className="mt-3 grid grid-cols-3 divide-x divide-line rounded-xl border border-line bg-paper-2/40 py-2.5 text-center text-[11px]">
          <Stat icon={Ship} value={fmt(t.ordersHandled ?? 0)} label="Expéditions" />
          <Stat icon={Clock} value={`~${t.responseTime ?? "—"}`} label="Répond en" />
          <Stat icon={CheckCircle2} value={`${t.onTimePct ?? "—"} %`} label="Dans les délais" />
        </div>

        {/* Tarifs — pleine largeur, montants explicites */}
        <div className="mt-3">
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-400">
            Tarifs
          </div>
          <div className="flex flex-col divide-y divide-[#F4F5F6] rounded-xl border border-line">
            {t.modes.slice(0, 3).map((m) => {
              const Icon = MODE_ICON[m.mode];
              return (
                <div key={m.mode} className="flex items-center justify-between gap-2 px-3 py-2">
                  <span className="inline-flex min-w-0 items-center gap-2 text-[12px] text-ink-700">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                    <span className="truncate">
                      {TRANSPORT_MODE_LABELS[m.mode]}
                      <span className="ml-1.5 text-[10.5px] text-ink-400">{m.delay}</span>
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="text-[13.5px] font-bold tabular-nums text-ink-900">
                      {fmt(m.fromXof)} – {fmt(m.toXof)}
                    </span>
                    <span className="ml-1 text-[10.5px] font-medium text-ink-400">
                      F CFA / {m.unit === "cbm" ? "CBM" : "kg"}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center gap-2">
          <Link
            href={`/marketplace/transitaires/${t.slug}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-kamoo-blue-900 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-kamoo-blue-800"
          >
            Voir le profil
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            title={saved ? "Retirer des enregistrés" : "Enregistrer"}
            onClick={onToggleSave}
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-lg border transition",
              saved
                ? "border-kamoo-blue-300 bg-kamoo-blue-50 text-kamoo-blue-700"
                : "border-line text-ink-500 hover:bg-paper-2 hover:text-ink-900",
            )}
          >
            <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 text-center">
      <Icon className="h-3.5 w-3.5 text-ink-400" />
      <span className="font-bold tabular-nums text-ink-900">{value}</span>
      <span className="leading-tight text-ink-400">{label}</span>
    </div>
  );
}
