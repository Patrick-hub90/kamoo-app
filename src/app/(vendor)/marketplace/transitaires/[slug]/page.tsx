import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  MessageCircle,
  Sparkles,
  Star,
  Wallet,
} from "lucide-react";
import { ModeAccordion } from "@/components/kamoo/mode-accordion";
import { getTransitaireBySlug } from "@/lib/data/mock-transitaires";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function TransitaireProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const t = getTransitaireBySlug(slug);
  if (!t) notFound();

  return (
    <div className="flex flex-col">
      {/* HEADER : back link */}
      <div className="border-b border-line bg-white px-10 py-3">
        <Link
          href="/marketplace/transitaires"
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-500 hover:text-ink-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour à la marketplace
        </Link>
      </div>

      {/* HERO : bannière compacte (h-44) + logo overlay */}
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

        {/* Logo overlay (bas-gauche, 80% sur banner / 20% dehors) */}
        <div
          className="absolute bottom-0 left-10 z-20 grid h-24 w-24 translate-y-8 place-items-center overflow-hidden rounded-full border-4 border-white bg-white text-2xl font-extrabold text-white shadow-lg"
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
      <div className="border-b border-line bg-white px-10 pb-4 pt-12">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0 flex-1 pl-32">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-900">
              {t.name}
            </h1>
            <div className="mt-0.5 flex items-center gap-2 text-[13px] text-ink-500">
              <span>
                {t.countryCode} {t.city}
              </span>
              <span className="text-ink-300">·</span>
              <span>Partenaire Kamoo depuis {t.partnerSince}</span>
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-[13px]">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-bold text-ink-900">{t.rating}</span>
              <span className="text-ink-500">
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
          {/* À propos + politique paiement */}
          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
              À propos
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-700">
              {t.about}
            </p>

            {/* Politique de paiement — discret, juste une info */}
            <div className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-[12.5px] text-ink-500">
              <Wallet className="h-3.5 w-3.5 text-ink-400" />
              <span>Politique de paiement :</span>
              <span className="font-semibold text-ink-700">
                {t.paymentPolicy === "upfront"
                  ? "avant l'expédition"
                  : "à l'arrivée"}
              </span>
            </div>
          </section>

          {/* Tarifs détaillés - accordéon par mode */}
          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
              Tarifs détaillés par mode
            </h2>
            <p className="mt-1 text-[12px] text-ink-500">
              Cliquez sur un mode pour voir les produits acceptés et refusés.
            </p>
            <div className="mt-3">
              <ModeAccordion modes={t.modes} />
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

        {/* ═══ COLONNE DROITE — uniquement CTA ═══ */}
        <div className="flex flex-col gap-4">
          <section className="sticky top-6 rounded-2xl border border-line bg-gradient-to-br from-kamoo-blue-50 to-white p-5">
            <h2 className="font-display text-[18px] font-extrabold leading-tight text-ink-900">
              Prêt à travailler avec {t.name.split(" ")[0]} ?
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-500">
              Choisissez ce transitaire pour vos prochaines expéditions depuis
              la Chine. Vous pourrez discuter avec lui directement après
              sélection.
            </p>
            <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-kamoo-orange-500 px-4 py-3 text-[14px] font-bold text-white hover:bg-kamoo-orange-600">
              Choisir ce transitaire
            </button>
            <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-[13px] font-semibold text-ink-900 hover:bg-paper-2">
              <MessageCircle className="h-3.5 w-3.5" />
              Discuter avant de décider
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
