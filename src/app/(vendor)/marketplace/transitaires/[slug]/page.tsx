import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Ban,
  MessageCircle,
  Plane,
  Ship,
  Sparkles,
  Star,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { getTransitaireBySlug } from "@/lib/data/mock-transitaires";
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

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function TransitaireProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const t = getTransitaireBySlug(slug);
  if (!t) notFound();

  return (
    <div className="flex flex-col">
      {/* HEADER : back link + breadcrumb */}
      <div className="border-b border-line bg-white px-10 py-4">
        <Link
          href="/marketplace/transitaires"
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-500 hover:text-ink-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour à la marketplace
        </Link>
      </div>

      {/* HERO : bannière + logo overlay + nom + actions */}
      <div className="relative">
        <div
          className="h-44 w-full overflow-hidden"
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

        {/* Badge */}
        <div className="absolute right-10 top-4 z-10">
          {t.status === "new" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-kamoo-blue-700 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow">
              <Sparkles className="h-3 w-3" />
              Nouveau
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-kamoo-orange-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow">
              <BadgeCheck className="h-3 w-3" />
              Certifié Kamoo
            </span>
          )}
        </div>

        {/* Logo absolute */}
        <div
          className="absolute left-10 top-[120px] z-20 grid h-24 w-24 place-items-center overflow-hidden rounded-full border-4 border-white bg-white text-2xl font-extrabold text-white shadow-lg"
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

      {/* IDENTITÉ + ACTIONS */}
      <div className="border-b border-line bg-white px-10 pb-6 pt-4">
        <div className="flex items-start justify-between gap-6 pl-32">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink-900">
              {t.name}
            </h1>
            <div className="mt-1 flex items-center gap-3 text-[13px] text-ink-500">
              <span>
                {t.countryCode} {t.city}
              </span>
              <span className="text-ink-300">·</span>
              <span>Partenaire Kamoo depuis {t.partnerSince}</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-base font-bold text-ink-900">
                {t.rating}
              </span>
              <span className="text-[13px] text-ink-500">
                · {t.reviewsCount} avis · {t.activeVendors} vendeurs actifs
              </span>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <button className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-[13px] font-semibold text-ink-900 hover:bg-paper-2">
              <MessageCircle className="h-4 w-4" />
              Discuter
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl bg-kamoo-orange-500 px-5 py-2.5 text-[13px] font-bold text-white hover:bg-kamoo-orange-600">
              Choisir ce transitaire
            </button>
          </div>
        </div>
      </div>

      {/* BODY 2 colonnes */}
      <div className="grid grid-cols-[1.6fr_1fr] gap-5 px-10 py-6">
        {/* ═══ COLONNE GAUCHE ═══ */}
        <div className="flex flex-col gap-4">
          {/* À propos */}
          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
              À propos
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-700">
              {t.about}
            </p>
            {t.specialties.length > 0 && (
              <div className="mt-4">
                <div className="text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
                  Spécialités
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {t.specialties.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-kamoo-blue-50 px-2.5 py-1 text-[11.5px] font-semibold text-kamoo-blue-700"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Tarifs détaillés */}
          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
              Tarifs détaillés par mode
            </h2>
            <p className="mt-1 text-[12px] text-ink-500">
              Fourchette : tarif minimum (contenu standard) → maximum (contenu
              sensible / volumineux).
            </p>
            <div className="mt-4 flex flex-col gap-2.5">
              {t.modes.map((m) => {
                const Icon = MODE_ICON[m.mode];
                return (
                  <div
                    key={m.mode}
                    className="flex items-center gap-4 rounded-xl bg-paper-2 p-4"
                  >
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-ink-700 shadow-sm">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-bold text-ink-900">
                        {TRANSPORT_MODE_LABELS[m.mode]}
                      </div>
                      <div className="text-[12px] text-ink-500">{m.delay}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-[16px] font-extrabold leading-none text-ink-900">
                        {fmtNumber(m.fromXof)}{" "}
                        <span className="text-ink-300">–</span>{" "}
                        {fmtNumber(m.toXof)}
                      </div>
                      <div className="mt-1 text-[10.5px] font-semibold text-ink-500">
                        F CFA / {m.unit === "kg" ? "kg" : "CBM"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Avis */}
          <section className="rounded-2xl border border-line bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
                Avis des vendeurs · {t.reviews.length} récents
              </h2>
              <button className="text-[12px] font-bold text-kamoo-blue-700 hover:underline">
                Voir tous les avis ({t.reviewsCount})
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {t.reviews.map((r) => (
                <div key={r.id} className="rounded-xl bg-paper-2 p-3.5">
                  <div className="flex items-start gap-3">
                    <div
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[12px] font-extrabold text-white"
                      style={{ background: r.avatarBg }}
                    >
                      {r.vendorName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-ink-900">
                          {r.vendorName}
                        </span>
                        <span className="text-[11px] text-ink-500">
                          {r.vendorCountryFlag} {r.vendorCity}
                        </span>
                        <span className="text-ink-300">·</span>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < r.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-ink-200"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="mt-1 text-[13px] leading-relaxed text-ink-700">
                        {r.comment}
                      </p>
                      <div className="mt-1 text-[10.5px] text-ink-400">
                        {r.date}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ═══ COLONNE DROITE ═══ */}
        <div className="flex flex-col gap-4">
          {/* Politique de paiement */}
          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
              Politique de paiement
            </h2>
            <div
              className={`mt-3 flex items-center gap-3 rounded-xl p-3 ${
                t.paymentPolicy === "upfront"
                  ? "bg-kamoo-orange-50 text-kamoo-orange-700"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              <div
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                  t.paymentPolicy === "upfront"
                    ? "bg-kamoo-orange-500"
                    : "bg-emerald-500"
                } text-white`}
              >
                <Wallet className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[13px] font-extrabold">
                  {t.paymentPolicy === "upfront"
                    ? "Paiement avant l'expédition"
                    : "Paiement à l'arrivée"}
                </div>
                <div className="mt-0.5 text-[11px] opacity-90">
                  {t.paymentPolicy === "upfront"
                    ? "Vous payez le devis avant que le colis ne quitte la Chine."
                    : "Vous payez à l'arrivée du colis dans votre pays."}
                </div>
              </div>
            </div>
          </section>

          {/* Catégories refusées */}
          {t.refusedCategories.length > 0 && (
            <section className="rounded-2xl border border-red-200 bg-red-50/50 p-5">
              <h2 className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-red-700">
                <Ban className="h-3 w-3" />
                Catégories non acceptées
              </h2>
              <ul className="mt-2 flex flex-col gap-1">
                {t.refusedCategories.map((c) => (
                  <li
                    key={c}
                    className="flex items-center gap-1.5 text-[13px] text-ink-900"
                  >
                    <span className="h-1 w-1 rounded-full bg-red-500" />
                    {c}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] leading-relaxed text-ink-500">
                Si vous tentez d&apos;envoyer ces catégories, le transitaire
                refusera la réception en Chine.
              </p>
            </section>
          )}

          {/* Stats clés */}
          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
              Chiffres clés
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Stat
                icon={<Users className="h-4 w-4" />}
                value={t.activeVendors.toString()}
                label="Vendeurs actifs"
              />
              <Stat
                icon={<Star className="h-4 w-4 fill-amber-400 text-amber-400" />}
                value={t.rating.toString()}
                label={`${t.reviewsCount} avis`}
              />
            </div>
          </section>

          {/* CTA final */}
          <section className="rounded-2xl border border-line bg-gradient-to-br from-kamoo-blue-50 to-white p-5">
            <h2 className="font-display text-[16px] font-extrabold text-ink-900">
              Prêt à travailler avec {t.name.split(" ")[0]} ?
            </h2>
            <p className="mt-1 text-[12px] text-ink-500">
              Choisissez ce transitaire pour vos prochaines expéditions depuis
              la Chine.
            </p>
            <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-kamoo-orange-500 px-4 py-3 text-[13px] font-bold text-white hover:bg-kamoo-orange-600">
              Choisir ce transitaire
            </button>
            <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-[12px] font-semibold text-ink-900 hover:bg-paper-2">
              <MessageCircle className="h-3.5 w-3.5" />
              Discuter avant de décider
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-xl bg-paper-2 p-3">
      <div className="grid h-7 w-7 place-items-center rounded-lg bg-white text-ink-700">
        {icon}
      </div>
      <div className="mt-2 font-display text-xl font-extrabold text-ink-900">
        {value}
      </div>
      <div className="text-[10.5px] font-semibold text-ink-500">{label}</div>
    </div>
  );
}
