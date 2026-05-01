import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
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
  if (from === to) return k(from);
  return `${k(from)}–${k(to)}`;
}

type Props = {
  transitaire: Transitaire;
};

export function TransitaireCard({ transitaire: t }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white transition hover:border-ink-300 hover:shadow-[var(--shadow-kamoo-md)]">
      {/* HEADER : bannière + logo overlay positionné absolument */}
      <div className="relative">
        {/* Bannière (en arrière-plan, image clippée) */}
        <div
          className="h-28 w-full overflow-hidden"
          style={!t.coverImageUrl ? { background: t.coverBg } : undefined}
        >
          {t.coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={t.coverImageUrl}
              alt={`${t.name} - bannière`}
              className="h-full w-full object-cover"
            />
          )}
        </div>

        {/* Badge dans le coin haut droit de la bannière */}
        <div className="absolute right-3 top-3 z-10">
          {t.status === "new" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-kamoo-blue-700 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
              <Sparkles className="h-2.5 w-2.5" />
              Nouveau
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-kamoo-orange-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
              <BadgeCheck className="h-2.5 w-2.5" />
              Certifié Kamoo
            </span>
          )}
        </div>

        {/* Logo absolument positionné AU-DESSUS de la bannière (z-10) */}
        <div
          className="absolute left-4 top-[80px] z-20 grid h-16 w-16 place-items-center overflow-hidden rounded-full border-[3px] border-white bg-white text-base font-extrabold text-white shadow-md"
          style={!t.logoImageUrl ? { background: t.avatarBg } : undefined}
        >
          {t.logoImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={t.logoImageUrl}
              alt={`${t.name} - logo`}
              className="h-full w-full object-cover"
            />
          ) : (
            t.avatar
          )}
        </div>
      </div>

      <div className="px-4 pb-4 pt-2">
        {/* Note alignée à droite (le logo est en absolute à gauche) */}
        <div className="flex h-7 items-start justify-end">
          <div className="flex items-center gap-1 text-[12px]">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="font-bold text-ink-900">{t.rating}</span>
            <span className="text-ink-500">({t.reviewsCount})</span>
          </div>
        </div>

        {/* Nom + ville */}
        <div className="mt-1">
          <h3 className="font-display text-[17px] font-extrabold leading-tight text-ink-900">
            {t.name}
          </h3>
          <div className="mt-0.5 text-[12px] text-ink-500">
            {t.countryCode} {t.city} · Partenaire depuis {t.partnerSince}
          </div>
        </div>

        {/* TARIFS PAR MODE — info clé */}
        <div className="mt-4 rounded-xl border border-line bg-paper-2/40 p-2.5">
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-500">
            Tarifs indicatifs · délais
          </div>
          <div className="flex flex-col gap-1.5">
            {t.modes.map((m) => {
              const Icon = MODE_ICON[m.mode];
              return (
                <div
                  key={m.mode}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-[12px]"
                >
                  <Icon className="h-3.5 w-3.5 text-ink-700" />
                  <div>
                    <div className="font-semibold text-ink-900">
                      {TRANSPORT_MODE_LABELS[m.mode]}
                    </div>
                    <div className="text-[10.5px] text-ink-500">
                      {m.delay}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-ink-900">
                      {fmtRange(m.fromXof, m.toXof)}
                    </div>
                    <div className="text-[10px] font-semibold text-ink-500">
                      F CFA / {m.unit === "kg" ? "kg" : "CBM"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer : vendeurs actifs + CTA */}
        <div className="mt-3 flex items-center justify-between text-[11.5px]">
          <span className="inline-flex items-center gap-1 text-ink-500">
            <Users className="h-3 w-3" />
            <b className="text-ink-700">{t.activeVendors}</b> vendeurs actifs
          </span>
        </div>

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
