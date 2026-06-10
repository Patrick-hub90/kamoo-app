"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  Clock,
  Crown,
  MapPin,
  MessageCircle,
  ShoppingBag,
  Sparkles,
  Star,
} from "lucide-react";
import { useChat } from "@/components/kamoo/chat";
import { PartnerCta } from "@/components/kamoo/partner-cta";
import { ReviewsModal } from "@/components/kamoo/reviews-modal";
import { isTopPerformer } from "@/lib/data/mock-closeuses";
import {
  ALL_DAYS,
  LANGUAGE_LEVEL_LABELS,
  type Closeuse,
} from "@/lib/types/closeuse";
import { cn } from "@/lib/utils";

const COUNTRY: Record<string, string> = { SN: "Sénégal", CI: "Côte d'Ivoire", CM: "Cameroun" };
const fmt = (n: number) => n.toLocaleString("fr-FR");
function respLabel(min: number) {
  return min <= 60 ? "< 1h" : `< ${Math.ceil(min / 60)}h`;
}
function formatHour(hhmm: string) {
  const [h, m] = hhmm.split(":");
  return m && m !== "00" ? `${h}h${m}` : `${h}h`;
}

export function CloseuseProfileView({ closeuse: c }: { closeuse: Closeuse }) {
  const { openChat } = useChat();
  const [tab, setTab] = useState<"avis" | "faq">("avis");
  const [allReviews, setAllReviews] = useState(false);
  const firstName = c.name.split(" ")[0];
  const top = isTopPerformer(c);
  const chatPartner = {
    id: `closeuse:${c.slug}`,
    name: c.name,
    role: "closeuse" as const,
    photoUrl: c.photoUrl,
  };

  return (
    <div className="min-h-full bg-paper">
      {/* Retour */}
      <div className="border-b border-line bg-white px-6 py-3">
        <Link href="/marketplace/closeurs" className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-500 transition hover:text-ink-900">
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour à la marketplace
        </Link>
      </div>

      {/* HERO — bandeau navy de marque + portrait net (pas de fausse bannière) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-kamoo-blue-900 to-kamoo-blue-800">
        <div
          className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(249,115,22,0.22) 0%, transparent 70%)" }}
        />
        <div className="relative mx-auto flex max-w-[1320px] flex-wrap items-center gap-6 px-6 py-8">
          <div className="h-32 w-32 shrink-0 overflow-hidden rounded-2xl border-4 border-white/15 shadow-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.photoUrl} alt={c.name} className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[28px] font-extrabold tracking-tight text-white">{c.name}</h1>
            <div className="mt-1 inline-flex items-center gap-1 text-[13px] text-white/70">
              <MapPin className="h-3.5 w-3.5" /> {c.city}, {COUNTRY[c.countryCode] ?? c.countryCode} · Closeuse Kamoo depuis {new Date(c.joinedAt).getFullYear()}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px]">
              <span className="inline-flex items-center gap-1 text-white">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <b>{c.rating}</b>
                <span className="text-white/60">{c.reviewsCount} avis</span>
              </span>
              {top && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2.5 py-0.5 text-[11.5px] font-semibold text-amber-200 ring-1 ring-inset ring-amber-300/30">
                  <Crown className="h-3.5 w-3.5" /> Top performer
                </span>
              )}
              {c.status === "certified" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-kamoo-orange-500 px-2.5 py-0.5 text-[11.5px] font-bold text-white">
                  <BadgeCheck className="h-3.5 w-3.5" /> Certifié Kamoo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[11.5px] font-semibold text-white">
                  <Sparkles className="h-3.5 w-3.5" /> Nouveau
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* BODY */}
      <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-5 px-6 py-6 lg:grid-cols-[1.7fr_1fr]">
        {/* ─── GAUCHE ─── */}
        <div className="flex min-w-0 flex-col gap-5">
          {/* À propos — la bio seule ; les indicateurs vivent dans « En bref » */}
          <section className="rounded-2xl border border-line bg-white p-5 shadow-kamoo-sm">
            <h2 className="text-[15px] font-bold text-ink-900">À propos</h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-600">{c.bio}</p>
          </section>

          {/* Disponibilité & langues */}
          <section className="rounded-2xl border border-line bg-white p-5 shadow-kamoo-sm">
            <h2 className="text-[15px] font-bold text-ink-900">Disponibilité &amp; langues</h2>
            {/* Planning */}
            <div className="mt-3 flex items-center gap-1.5">
              {ALL_DAYS.map((d) => {
                const active = c.schedule.days.includes(d.key);
                return (
                  <div
                    key={d.key}
                    title={d.long}
                    className={cn(
                      "grid h-9 flex-1 place-items-center rounded-lg text-[11px] font-bold",
                      active ? "bg-kamoo-blue-700 text-white" : "bg-paper-2 text-ink-300 line-through",
                    )}
                  >
                    {d.short}
                  </div>
                );
              })}
            </div>
            <div className="mt-2.5 flex items-center justify-center gap-2 rounded-lg bg-paper-2/50 py-2 text-[13px] font-semibold text-ink-800">
              <Clock className="h-3.5 w-3.5 text-ink-500" />
              {formatHour(c.schedule.startTime)} — {formatHour(c.schedule.endTime)}
            </div>
            {/* Langues */}
            <div className="mt-4 flex flex-wrap gap-2">
              {c.languages.map((l) => (
                <span key={l.code} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[12.5px]">
                  <span className="text-base leading-none">{l.flag}</span>
                  <span className="font-semibold text-ink-900">{l.name}</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                      l.level === "natif" ? "bg-emerald-50 text-emerald-700" : l.level === "courant" ? "bg-kamoo-blue-50 text-kamoo-blue-700" : "bg-paper-2 text-ink-500",
                    )}
                  >
                    {LANGUAGE_LEVEL_LABELS[l.level]}
                  </span>
                </span>
              ))}
            </div>
          </section>

          {/* Avis + FAQ (onglets) */}
          <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-kamoo-sm">
            <div className="flex gap-1 border-b border-line px-3">
              {(
                [
                  { id: "avis", label: "Avis des e-commerçants" },
                  { id: "faq", label: "Questions fréquentes" },
                ] as const
              ).map((tb) => {
                const active = tab === tb.id;
                return (
                  <button
                    key={tb.id}
                    onClick={() => setTab(tb.id)}
                    className={cn("relative inline-flex shrink-0 items-center px-3 py-3 text-[13px] font-semibold transition", active ? "text-kamoo-orange-600" : "text-ink-500 hover:text-ink-900")}
                  >
                    {tb.label}
                    {active && <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-t bg-kamoo-orange-500" />}
                  </button>
                );
              })}
            </div>
            <div className="p-5">{tab === "avis" ? <Reviews c={c} onShowAll={() => setAllReviews(true)} /> : <Faq c={c} firstName={firstName} />}</div>
          </section>
        </div>

        {/* ─── DROITE ─── */}
        <div className="flex flex-col gap-5">
          <section className="sticky top-6 flex flex-col gap-5">
            {/* En bref — indicateurs calculés par la plateforme */}
            <div className="rounded-2xl border border-line bg-white p-5 shadow-kamoo-sm">
              <h3 className="mb-3 text-[13px] font-bold text-ink-900">En bref</h3>
              <div className="flex flex-col gap-3 text-[12.5px]">
                <BriefRow icon={CheckCircle2} tone="text-emerald-600" label="Taux de confirmation" value={`${c.kpi.confirmationRate}%`} />
                <BriefRow icon={Clock} tone="text-kamoo-orange-500" label="Réponse moyenne" value={respLabel(c.kpi.avgResponseMin)} />
                <BriefRow icon={ShoppingBag} tone="text-kamoo-blue-700" label="Commandes traitées" value={fmt(c.kpi.ordersHandled)} />
                <BriefRow icon={Calendar} tone="text-purple-700" label="Ancienneté" value={`${c.kpi.monthsOnPlatform} mois`} />
                <BriefRow icon={MapPin} tone="text-red-500" label="Zone" value={`${c.city}, ${COUNTRY[c.countryCode] ?? c.countryCode}`} />
              </div>
            </div>

            {/* CTA partenariat (choix direct — règle Kamoo) */}
            <PartnerCta
              role="closeuse"
              slug={c.slug}
              name={c.name}
              title={`Travailler avec ${firstName} ?`}
              description="Choisissez cette closeuse pour confirmer vos commandes. Elle reçoit la demande sur son application et vous échangez via le chat Kamoo."
              priceLabel="Commission"
              priceValue={`${fmt(c.commissionXof)} F CFA / commande livrée`}
              priceHint="Payé uniquement quand la commande est livrée et encaissée."
              chatPartner={chatPartner}
            />
          </section>
        </div>
      </div>

      {allReviews && (
        <ReviewsModal
          partnerName={c.name}
          rating={c.rating}
          reviewsCount={c.reviewsCount}
          reviews={c.reviews.map((r) => ({
            authorName: r.vendorName,
            authorCity: r.vendorCity,
            rating: r.rating,
            comment: r.comment,
            date: new Date(r.at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }),
            avatarBg: r.vendorAvatarBg,
          }))}
          onClose={() => setAllReviews(false)}
        />
      )}
    </div>
  );
}

/* ─── Sous-composants ─────────────────────────────────────────── */
function Reviews({ c, onShowAll }: { c: Closeuse; onShowAll?: () => void }) {
  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button onClick={onShowAll} className="text-[12px] font-semibold text-kamoo-blue-700 hover:underline">
          Voir tous les avis ({c.reviewsCount})
        </button>
      </div>
      {c.reviews.length === 0 ? (
        <p className="py-6 text-center text-[12.5px] italic text-ink-400">Aucun avis pour le moment.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {c.reviews.map((r, i) => (
            <div key={i} className="rounded-xl border border-line bg-paper-2/30 p-3.5">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white" style={{ background: r.vendorAvatarBg }}>
                  {r.vendorName.split(" ").map((n) => n.charAt(0)).slice(0, 2).join("")}
                </span>
                <div className="min-w-0">
                  <div className="text-[12.5px] font-bold text-ink-900">{r.vendorName}</div>
                  <div className="text-[10.5px] text-ink-500">{r.vendorCity}</div>
                </div>
                <div className="ml-auto flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <Star key={k} className={cn("h-3 w-3", k < r.rating ? "fill-amber-400 text-amber-400" : "text-ink-200")} />
                  ))}
                </div>
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-ink-700">{r.comment}</p>
              <div className="mt-1.5 text-[10.5px] text-ink-400">{new Date(r.at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Faq({ c, firstName }: { c: Closeuse; firstName: string }) {
  const items = [
    { q: "Comment se passe la collaboration ?", a: `Vous validez la demande puis vous échangez via le chat Kamoo. ${firstName} appelle vos prospects, confirme les commandes et planifie les livraisons.` },
    { q: "Quelle est la commission ?", a: `${fmt(c.commissionXof)} F CFA par commande livrée. Vous ne payez que sur les ventes effectivement encaissées — aucun frais fixe.` },
    { q: "Quelles langues parle-t-elle ?", a: c.languages.map((l) => `${l.name} (${LANGUAGE_LEVEL_LABELS[l.level].toLowerCase()})`).join(", ") + "." },
    { q: "Quand est-elle disponible ?", a: `Du ${ALL_DAYS.filter((d) => c.schedule.days.includes(d.key)).map((d) => d.long.toLowerCase()).join(", ")}, de ${formatHour(c.schedule.startTime)} à ${formatHour(c.schedule.endTime)}.` },
  ];
  return (
    <div className="flex flex-col gap-2">
      {items.map((it, i) => (
        <details key={i} className="group rounded-xl border border-line bg-paper-2/30 p-3.5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-[13px] font-semibold text-ink-900">
            {it.q}
            <span className="text-ink-400 transition group-open:rotate-180">⌄</span>
          </summary>
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink-600">{it.a}</p>
        </details>
      ))}
    </div>
  );
}

function BriefRow({ icon: Icon, tone, label, value }: { icon: React.ComponentType<{ className?: string }>; tone: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="inline-flex items-center gap-2 text-ink-500"><Icon className={cn("h-4 w-4", tone)} />{label}</span>
      <span className="text-right font-semibold text-ink-900">{value}</span>
    </div>
  );
}
