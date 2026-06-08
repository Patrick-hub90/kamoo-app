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
import type { Transitaire } from "@/lib/types/transitaire";
import type { TransportMode } from "@/lib/types/expedition";
import { TRANSPORT_MODE_LABELS } from "@/lib/types/expedition";

const MODE_ICON: Record<TransportMode, typeof Ship> = {
  sea: Ship,
  air_standard: Plane,
  air_express: Zap,
};

function fmtRange(from: number, to: number): string {
  const k = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `${n}`;
  return from === to ? k(from) : `${k(from)}–${k(to)}`;
}

export function TransitaireCard({ transitaire: t }: { transitaire: Transitaire }) {
  const unit = t.modes[0]?.unit === "cbm" ? "CBM" : "kg";
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:border-ink-300 hover:shadow-[var(--shadow-kamoo-md)]">
      {/* COUVERTURE */}
      <div className="relative h-28">
        {t.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.coverImageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full" style={{ background: t.coverBg }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
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
        {/* Avatar (chevauche la couverture) — relative z-10 pour passer
            AU-DESSUS de la bannière (qui est `relative` donc positionnée). */}
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
          <MapPin className="h-3 w-3 shrink-0" /> {t.countryCode} {t.city} · Partenaire depuis {t.partnerSince}
        </div>

        {/* Description */}
        <p className="mt-2.5 line-clamp-2 text-[12.5px] leading-relaxed text-ink-600">{t.about}</p>

        {/* Spécialités */}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {t.specialties.slice(0, 3).map((s) => (
            <span key={s} className="rounded-md bg-paper-2 px-2 py-0.5 text-[11px] font-medium text-ink-700">
              {s}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-line bg-paper-2/40 px-2 py-2.5 text-[11px]">
          <Stat icon={Users} value={String(t.activeVendors)} label="vendeurs actifs" />
          <Stat icon={Clock} value={t.responseTime ?? "—"} label="rép. moyenne" />
          <Stat icon={CheckCircle2} value={`${t.onTimePct ?? "—"}%`} label="à temps" />
        </div>

        {/* Routes + Tarifs */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-400">
              Exemples de routes
            </div>
            <div className="flex flex-col gap-1">
              {(t.exampleRoutes ?? []).map((r) => (
                <div key={r.label} className="flex items-center justify-between gap-2 text-[11.5px]">
                  <span className="font-semibold text-ink-700">{r.label}</span>
                  <span className="tabular-nums text-ink-500">{r.delay}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-400">
              Tarifs · F CFA / {unit}
            </div>
            <div className="flex flex-col gap-1">
              {t.modes.slice(0, 3).map((m) => {
                const Icon = MODE_ICON[m.mode];
                return (
                  <div key={m.mode} className="flex items-center justify-between gap-2 text-[11.5px]">
                    <span className="inline-flex min-w-0 items-center gap-1 text-ink-700">
                      <Icon className="h-3 w-3 shrink-0 text-ink-400" />
                      <span className="truncate">{TRANSPORT_MODE_LABELS[m.mode]}</span>
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums text-ink-900">
                      {fmtRange(m.fromXof, m.toXof)}
                    </span>
                  </div>
                );
              })}
            </div>
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
            title="Discuter sur Kamoo"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line text-ink-500 transition hover:bg-paper-2 hover:text-ink-900"
          >
            <MessageCircle className="h-4 w-4" />
          </button>
          <button
            title="Enregistrer"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line text-ink-500 transition hover:bg-paper-2 hover:text-ink-900"
          >
            <Bookmark className="h-4 w-4" />
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
