import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Plane,
  Ship,
  Sparkles,
  Star,
  Users,
  Wallet,
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

function fmtNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

function fmtRange(from: number, to: number): string {
  if (from === to) return fmtNumber(from);
  // Si écart faible : "65–95k F CFA"
  const k = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `${n}`;
  return `${k(from)}–${k(to)}`;
}

type Props = {
  transitaire: Transitaire;
};

export function TransitaireCard({ transitaire: t }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white transition hover:border-ink-300 hover:shadow-[var(--shadow-kamoo-md)]">
      {/* COVER + AVATAR + RATING */}
      <div
        className="relative h-20 w-full"
        style={{ background: t.coverBg }}
      >
        {/* Badges en haut à droite */}
        <div className="absolute right-3 top-3 flex gap-1.5">
          {t.isTopChoice && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-kamoo-orange-700 backdrop-blur">
              <Sparkles className="h-2.5 w-2.5" />
              Top choix
            </span>
          )}
          {t.isVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 backdrop-blur">
              <CheckCircle2 className="h-2.5 w-2.5" />
              Vérifié
            </span>
          )}
        </div>
      </div>

      <div className="px-4 pb-4">
        {/* Logo qui chevauche la cover */}
        <div className="-mt-7 flex items-end justify-between">
          <div
            className="grid h-14 w-14 place-items-center rounded-2xl border-4 border-white text-base font-extrabold text-white"
            style={{ background: t.avatarBg }}
          >
            {t.avatar}
          </div>
          <div className="flex items-center gap-1 text-[12px]">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="font-bold text-ink-900">{t.rating}</span>
            <span className="text-ink-500">({t.reviewsCount})</span>
          </div>
        </div>

        {/* Nom + ville */}
        <div className="mt-2">
          <h3 className="font-display text-[17px] font-extrabold leading-tight text-ink-900">
            {t.name}
          </h3>
          <div className="mt-0.5 text-[12px] text-ink-500">
            {t.countryCode} {t.city} · Partenaire depuis {t.partnerSince}
          </div>
        </div>

        {/* TARIFS PAR MODE — info clé pour décider */}
        <div className="mt-4 rounded-xl border border-line bg-paper-2/40 p-2.5">
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-500">
            Tarifs indicatifs par mode
          </div>
          <div className="flex flex-col gap-1.5">
            {t.modes.map((m) => {
              const Icon = MODE_ICON[m.mode];
              return (
                <div
                  key={m.mode}
                  className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 text-[12px]"
                >
                  <Icon className="h-3.5 w-3.5 text-ink-700" />
                  <span className="font-semibold text-ink-900">
                    {TRANSPORT_MODE_LABELS[m.mode]}
                  </span>
                  <span className="font-bold text-ink-900">
                    {fmtRange(m.fromXof, m.toXof)}
                    <span className="text-[10px] font-semibold text-ink-500">
                      {" "}
                      F CFA / {m.unit === "kg" ? "kg" : "CBM"}
                    </span>
                  </span>
                  <span className="text-[11px] text-ink-500">{m.delay}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Spécialités */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {t.specialties.slice(0, 3).map((s) => (
            <span
              key={s}
              className="rounded-full bg-kamoo-blue-50 px-2 py-0.5 text-[10.5px] font-semibold text-kamoo-blue-700"
            >
              {s}
            </span>
          ))}
        </div>

        {/* Footer : politique paiement + vendeurs actifs */}
        <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-[11.5px]">
          <span
            className={`inline-flex items-center gap-1 font-bold ${
              t.paymentPolicy === "upfront"
                ? "text-kamoo-orange-700"
                : "text-emerald-700"
            }`}
          >
            <Wallet className="h-3 w-3" />
            {t.paymentPolicy === "upfront"
              ? "Paiement avant"
              : "Paiement à l'arrivée"}
          </span>
          <span className="inline-flex items-center gap-1 text-ink-500">
            <Users className="h-3 w-3" />
            <b className="text-ink-700">{t.activeVendors}</b> vendeurs actifs
          </span>
        </div>

        {/* CTA */}
        <Link
          href={`/marketplace/transitaires/${t.slug}`}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-4 py-2.5 text-[13px] font-bold text-ink-900 transition hover:bg-paper-2"
        >
          Voir le profil
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
