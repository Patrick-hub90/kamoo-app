import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Clock,
  MapPin,
  MessageCircle,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { ALL_DAYS } from "@/lib/types/closeuse";
import { getLivreur } from "@/lib/data/mock-livreurs";
import {
  LIVREUR_STATUS_LABELS,
  LIVREUR_TYPE_LABELS,
} from "@/lib/types/livreur";
import { formatXOF } from "@/lib/format";
import { cn } from "@/lib/utils";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatHour(hhmm: string): string {
  const [h, m] = hhmm.split(":");
  return m && m !== "00" ? `${h}h${m}` : `${h}h`;
}

export default async function LivreurProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const l = getLivreur(slug);
  if (!l) notFound();

  // Tarifs : extraire min / max pour résumer la fourchette
  const prices = l.zones.map((z) => z.priceXof);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const isAgence = l.type === "agence";

  return (
    <div className="flex flex-col">
      {/* HEADER avec bannière */}
      <div className="relative">
        <div
          className="h-40 w-full"
          style={!l.coverImageUrl ? { background: l.coverBg } : undefined}
        >
          {l.coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={l.coverImageUrl}
              alt={`${l.name} - bannière`}
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <Link
          href="/marketplace/livreurs"
          className="absolute left-10 top-4 grid h-9 w-9 place-items-center rounded-lg bg-white/90 text-ink-700 shadow-sm hover:bg-white"
          title="Retour à la marketplace"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>

      {/* IDENTITÉ + ACTIONS */}
      <div className="border-b border-line bg-white px-10 pb-5 pt-3">
        <div className="flex items-start gap-5">
          {/* Photo en overlay sur la bannière */}
          <div
            className="relative -mt-12 grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full border-[4px] border-white text-xl font-extrabold text-white shadow-lg"
            style={!l.photoUrl ? { background: l.avatarBg } : undefined}
          >
            {l.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={l.photoUrl}
                alt={l.name}
                className="h-full w-full object-cover"
              />
            ) : (
              l.initials
            )}
          </div>

          <div className="min-w-0 flex-1 pt-2">
            <div className="flex items-center gap-2 text-[12px] font-semibold text-ink-500">
              <Sparkles className="h-3.5 w-3.5 text-kamoo-orange-500" />
              Marketplace
              <span className="text-ink-300">/</span>
              <Link
                href="/marketplace/livreurs"
                className="hover:text-ink-700"
              >
                Livreurs
              </Link>
              <span className="text-ink-300">/</span>
              <span className="text-ink-900">{l.name}</span>
            </div>

            <div className="mt-1 flex items-center gap-3">
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-900">
                {l.name}
              </h1>
              {l.status === "new" ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-kamoo-blue-700 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  <Sparkles className="h-2.5 w-2.5" />
                  {LIVREUR_STATUS_LABELS.new}
                </span>
              ) : (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-kamoo-orange-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  <BadgeCheck className="h-2.5 w-2.5" />
                  {LIVREUR_STATUS_LABELS.certified}
                </span>
              )}
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                  isAgence
                    ? "bg-kamoo-blue-50 text-kamoo-blue-700"
                    : "bg-paper-2 text-ink-700",
                )}
              >
                {LIVREUR_TYPE_LABELS[l.type]}
              </span>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-500">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {l.city} · {l.countryFlag} {l.countryCode}
              </span>
              <span>·</span>
              <span>
                Partenaire depuis{" "}
                <b className="text-ink-700">{formatDate(l.joinedAt)}</b>
              </span>
            </div>

            <div className="mt-3 inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1">
              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
              <span className="font-bold text-amber-900">{l.rating}</span>
              <span className="text-[12px] font-semibold text-amber-700">
                ({l.reviewsCount} avis)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BODY 2 COLONNES */}
      <div className="grid grid-cols-[1.5fr_1fr] gap-5 px-10 py-6">
        {/* ═══ COLONNE GAUCHE ═══ */}
        <div className="flex flex-col gap-4">
          {/* À PROPOS */}
          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
              À propos
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-700">
              {l.bio}
            </p>
          </section>

          {/* TARIFS PAR ZONE */}
          <section className="rounded-2xl border border-line bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
                Zones desservies
              </h2>
              <span className="text-[11px] font-semibold text-ink-500">
                {l.zones.length} zone{l.zones.length > 1 ? "s" : ""} ·{" "}
                {formatXOF(minPrice, false)} – {formatXOF(maxPrice, false)} F
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {l.zones.map((z) => (
                <div
                  key={z.name}
                  className="flex items-center justify-between rounded-xl bg-paper-2/40 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-ink-900">
                      {z.name}
                    </div>
                    {z.estimatedMin && (
                      <div className="text-[11px] text-ink-500">
                        ~{z.estimatedMin} min
                      </div>
                    )}
                  </div>
                  <div className="ml-2 shrink-0 text-right">
                    <div className="font-display text-[14px] font-extrabold text-ink-900">
                      {formatXOF(z.priceXof, false)}
                    </div>
                    <div className="text-[10px] font-bold text-ink-500">F</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* AVIS */}
          <section className="rounded-2xl border border-line bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
                Avis des vendeurs · {l.reviews.length} récents
              </h2>
              {l.reviewsCount > 0 && (
                <button className="text-[12px] font-bold text-kamoo-blue-700 hover:underline">
                  Voir tous les avis ({l.reviewsCount})
                </button>
              )}
            </div>

            {l.reviews.length === 0 ? (
              <p className="text-center text-[12px] italic text-ink-500">
                Aucun avis pour le moment
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {l.reviews.map((r, i) => (
                  <div key={i} className="rounded-xl bg-paper-2 p-3.5">
                    <div className="flex items-start gap-3">
                      <div
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[12px] font-extrabold text-white"
                        style={{ background: r.vendorAvatarBg }}
                      >
                        {r.vendorName.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-ink-900">
                            {r.vendorName}
                          </span>
                          <span className="text-[11px] text-ink-500">
                            {r.vendorCountryCode} {r.vendorCity}
                          </span>
                          <span className="text-ink-300">·</span>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <Star
                                key={idx}
                                className={cn(
                                  "h-3 w-3",
                                  idx < r.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-ink-200",
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="mt-1 text-[13px] leading-relaxed text-ink-700">
                          {r.comment}
                        </p>
                        <div className="mt-1 text-[10.5px] text-ink-400">
                          {formatDate(r.at)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ═══ COLONNE DROITE ═══ */}
        <div className="flex flex-col gap-4">
          {/* CTA */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-kamoo-blue-900 to-kamoo-blue-700 p-6 text-white">
            <div
              className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(249,115,22,0.4) 0%, transparent 70%)",
              }}
            />
            <div className="relative">
              <div className="text-[11px] font-bold uppercase tracking-[0.08em] opacity-70">
                Tarifs livraison
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="font-display text-3xl font-extrabold leading-none">
                  {formatXOF(minPrice, false)} – {formatXOF(maxPrice, false)}
                </span>
                <span className="text-sm font-bold opacity-85">F CFA</span>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed opacity-85">
                Tarif fixe selon la zone, payé à la livraison réussie. Pas de
                frais fixes ni d'abonnement.
              </p>

              <div className="mt-5 flex flex-col gap-2">
                <button
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-kamoo-orange-500 px-3 py-3 text-[14px] font-bold text-white transition hover:bg-kamoo-orange-600"
                  title={`Demander à travailler avec ${l.name}`}
                >
                  Travailler avec {l.name.split(" ")[0]}
                </button>
                <button
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 text-[13px] font-semibold text-white ring-1 ring-inset ring-white/15 hover:bg-white/15"
                  title={`Contacter ${l.name} via la messagerie Kamoo`}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Discuter d&apos;abord
                </button>
              </div>
            </div>
          </div>

          {/* DISPONIBILITÉ */}
          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-ink-500">
              <Clock className="h-3 w-3" />
              Disponibilité
            </div>

            <div className="flex items-center justify-between gap-1.5">
              {ALL_DAYS.map((d) => {
                const isActive = l.schedule.days.includes(d.key);
                return (
                  <div
                    key={d.key}
                    className={cn(
                      "flex h-9 flex-1 flex-col items-center justify-center rounded-lg text-[11px] font-bold",
                      isActive
                        ? "bg-kamoo-blue-700 text-white"
                        : "bg-paper-2 text-ink-300 line-through opacity-60",
                    )}
                    title={`${d.long}${isActive ? "" : " — non travaillé"}`}
                  >
                    {d.short}
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-paper-2/60 py-2.5">
              <Clock className="h-3.5 w-3.5 text-ink-500" />
              <span className="font-display text-[15px] font-extrabold text-ink-900">
                {formatHour(l.schedule.startTime)} —{" "}
                {formatHour(l.schedule.endTime)}
              </span>
            </div>
          </div>

          {/* PARTENAIRES ACTIFS */}
          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-kamoo-orange-50 text-kamoo-orange-600">
                <Users className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-display text-2xl font-extrabold leading-none text-ink-900">
                  {l.activePartners}
                </div>
                <div className="mt-0.5 text-[12px] text-ink-500">
                  vendeur{l.activePartners > 1 ? "s" : ""}{" "}
                  {l.activePartners > 1 ? "travaillent" : "travaille"}{" "}
                  actuellement avec {isAgence ? "cette agence" : "ce livreur"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

