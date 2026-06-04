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
  User,
  UserMinus,
  Users,
} from "lucide-react";
import { getCloseuse, isActiveCloseusePartner } from "@/lib/data/mock-closeuses";
import {
  ALL_DAYS,
  GENDER_LABELS,
  LANGUAGE_LEVEL_LABELS,
  STATUS_LABELS,
  type Closeuse,
} from "@/lib/types/closeuse";
import { formatXOF } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Formate "08:00" -> "08h" / "18:30" -> "18h30" */
function formatHour(hhmm: string): string {
  const [h, m] = hhmm.split(":");
  return m && m !== "00" ? `${h}h${m}` : `${h}h`;
}

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

export default async function CloseuseProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const c = getCloseuse(slug);
  if (!c) notFound();

  const isPartner = isActiveCloseusePartner(c);

  return (
    <div className="flex flex-col">
      {/* HEADER COMPACT */}
      <div className="flex items-center gap-4 border-b border-line bg-white px-10 py-5">
        <Link
          href="/marketplace/closeurs"
          className="grid h-9 w-9 place-items-center rounded-lg bg-paper-2 text-ink-500 hover:text-ink-700"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-ink-500">
            <Sparkles className="h-3.5 w-3.5 text-kamoo-orange-500" />
            Marketplace
            <span className="text-ink-300">/</span>
            <Link
              href="/marketplace/closeurs"
              className="hover:text-ink-700"
            >
              Closeuses
            </Link>
            <span className="text-ink-300">/</span>
            <span className="text-ink-900">{c.name}</span>
          </div>
        </div>
      </div>

      {/* BODY 2 COLONNES */}
      <div className="grid grid-cols-[1.5fr_1fr] gap-5 px-10 py-6">
        {/* ═══ COLONNE GAUCHE ═══ */}
        <div className="flex flex-col gap-4">
          {/* HERO PROFIL */}
          <div className="rounded-2xl border border-line bg-white p-6">
            <div className="flex items-start gap-5">
              <div
                className="relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full text-xl font-extrabold text-white shadow-lg"
                style={!c.photoUrl ? { background: c.avatarBg } : undefined}
              >
                {c.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.photoUrl}
                    alt={c.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  c.initials
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-900">
                    {c.name}
                  </h1>
                  {c.status === "new" ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-kamoo-blue-700 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      <Sparkles className="h-2.5 w-2.5" />
                      {STATUS_LABELS.new}
                    </span>
                  ) : (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-kamoo-orange-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      <BadgeCheck className="h-2.5 w-2.5" />
                      {STATUS_LABELS.certified}
                    </span>
                  )}
                </div>

                {/* Détails : Femme/Homme · Ville · Partenaire depuis */}
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-500">
                  <span className="inline-flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {GENDER_LABELS[c.gender]}
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {c.city}
                  </span>
                  <span>·</span>
                  <span>
                    Partenaire depuis{" "}
                    <b className="text-ink-700">{formatDate(c.joinedAt)}</b>
                  </span>
                </div>

                <div className="mt-3 inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  <span className="font-bold text-amber-900">{c.rating}</span>
                  <span className="text-[12px] font-semibold text-amber-700">
                    ({c.reviewsCount} avis)
                  </span>
                </div>
              </div>
            </div>

            {/* Bio */}
            <p className="mt-5 rounded-xl bg-paper-2/40 p-4 text-[13.5px] leading-relaxed text-ink-700">
              {c.bio}
            </p>
          </div>

          {/* AVIS */}
          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
                Avis vendeurs
              </div>
              <span className="text-[11px] font-semibold text-ink-500">
                {c.reviews.length} sur {c.reviewsCount} affichés
              </span>
            </div>

            {c.reviews.length === 0 ? (
              <p className="text-center text-[12px] italic text-ink-500">
                Aucun avis pour le moment
              </p>
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  {c.reviews.map((r, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-line bg-paper-2/30 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-extrabold text-white"
                          style={{ background: r.vendorAvatarBg }}
                        >
                          {r.vendorName
                            .split(" ")
                            .map((n) => n.charAt(0))
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-bold text-ink-900">
                            {r.vendorName}
                          </div>
                          <div className="text-[10.5px] text-ink-500">
                            {formatDate(r.at)}
                          </div>
                        </div>
                        <div className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5">
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                          <span className="text-[11.5px] font-bold text-amber-900">
                            {r.rating}
                          </span>
                        </div>
                      </div>
                      <p className="mt-3 text-[12.5px] italic leading-relaxed text-ink-700">
                        « {r.comment} »
                      </p>
                    </div>
                  ))}
                </div>

                {/* CTA "Voir plus" — affiché uniquement s'il reste des avis non chargés */}
                {c.reviewsCount > c.reviews.length && (
                  <button
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-4 py-2.5 text-[13px] font-bold text-ink-900 transition hover:border-kamoo-blue-600 hover:bg-paper-2"
                    title={`Charger les ${c.reviewsCount - c.reviews.length} autres avis`}
                  >
                    Voir les {c.reviewsCount - c.reviews.length} autres avis
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* ═══ COLONNE DROITE ═══ */}
        <div className="flex flex-col gap-4">
          {/* CTA PRINCIPAL */}
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
                Commission
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="font-display text-3xl font-extrabold leading-none">
                  {formatXOF(c.commissionXof, false)}
                </span>
                <span className="text-sm font-bold opacity-85">
                  F CFA / commande livrée
                </span>
              </div>
              <p className="mt-3 text-[12px] leading-relaxed opacity-85">
                Vous payez uniquement quand la commande est livrée et le
                paiement encaissé. Aucun frais fixe.
              </p>

              {isPartner ? (
                <>
                  {/* Statut discret — texte + point vert, pas de chip lourde */}
                  <div className="mt-5 flex items-center justify-center gap-2 text-[12px] font-semibold opacity-90">
                    <span className="grid h-1.5 w-1.5 place-items-center rounded-full bg-emerald-400" />
                    Partenaire actif
                  </div>

                  {/* CTA principal : message — même esthétique orange que le CTA non-partenaire */}
                  <button
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-kamoo-orange-500 px-4 py-3.5 text-sm font-extrabold text-white transition hover:bg-kamoo-orange-600"
                    title={`Envoyer un message à ${c.name}`}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Lui envoyer un message
                  </button>

                  {/* Action destructive : lien texte minimal en bas */}
                  <button
                    className="mt-3 flex w-full items-center justify-center gap-1.5 text-[12px] font-semibold text-white/60 transition hover:text-red-300"
                    title={`Mettre fin à la collaboration avec ${c.name}`}
                  >
                    <UserMinus className="h-3 w-3" />
                    Mettre fin à la collaboration
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-kamoo-orange-500 px-4 py-3.5 text-sm font-extrabold text-white transition hover:bg-kamoo-orange-600"
                    title={`Demander à travailler avec ${c.name}`}
                  >
                    Travailler avec {c.name.split(" ")[0]}
                  </button>

                  {/* Bouton secondaire : Discuter d'abord */}
                  <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-[13px] font-semibold text-white ring-1 ring-inset ring-white/15 hover:bg-white/15">
                    <MessageCircle className="h-3.5 w-3.5" />
                    Discuter d&apos;abord
                  </button>
                </>
              )}
            </div>
          </div>

          {/* LANGUES */}
          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-ink-500">
              <MessageCircle className="h-3 w-3" />
              Langues parlées
            </div>
            <div className="flex flex-col gap-2">
              {c.languages.map((l) => (
                <div
                  key={l.code}
                  className="flex items-center justify-between rounded-xl bg-paper-2/40 px-3 py-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl leading-none">{l.flag}</span>
                    <span className="text-[13.5px] font-bold text-ink-900">
                      {l.name}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10.5px] font-bold",
                      l.level === "natif"
                        ? "bg-emerald-50 text-emerald-700"
                        : l.level === "courant"
                          ? "bg-kamoo-blue-50 text-kamoo-blue-700"
                          : "bg-paper-2 text-ink-500",
                    )}
                  >
                    {LANGUAGE_LEVEL_LABELS[l.level]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* DISPONIBILITÉ — jours travaillés + plage horaire */}
          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-ink-500">
              <Clock className="h-3 w-3" />
              Disponibilité
            </div>

            {/* Pastilles des 7 jours, désactivées si elle ne travaille pas */}
            <div className="flex items-center justify-between gap-1.5">
              {ALL_DAYS.map((d) => {
                const isActive = c.schedule.days.includes(d.key);
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

            {/* Plage horaire */}
            <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-paper-2/60 py-2.5">
              <Clock className="h-3.5 w-3.5 text-ink-500" />
              <span className="font-display text-[15px] font-extrabold text-ink-900">
                {formatHour(c.schedule.startTime)} —{" "}
                {formatHour(c.schedule.endTime)}
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
                  {c.activePartners}
                </div>
                <div className="mt-0.5 text-[12px] text-ink-500">
                  vendeur{c.activePartners > 1 ? "s" : ""} {c.activePartners > 1 ? "travaillent" : "travaille"} actuellement avec elle
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

