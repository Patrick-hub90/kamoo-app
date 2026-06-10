"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Bike,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Crown,
  Headphones,
  MapPin,
  MessageCircle,
  Package,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Users,
} from "lucide-react";
import { useChat } from "@/components/kamoo/chat";
import { ReviewsModal } from "@/components/kamoo/reviews-modal";
import { ALL_DAYS } from "@/lib/types/closeuse";
import { LIVREUR_TYPE_LABELS, type Livreur } from "@/lib/types/livreur";
import { cn } from "@/lib/utils";

const COUNTRY: Record<string, string> = { SN: "Sénégal", CI: "Côte d'Ivoire", CM: "Cameroun" };
const fmt = (n: number) => n.toLocaleString("fr-FR");
function formatHour(hhmm: string) {
  const [h, m] = hhmm.split(":");
  return m && m !== "00" ? `${h}h${m}` : `${h}h`;
}

export function LivreurProfileView({ livreur: l }: { livreur: Livreur }) {
  const { openChat } = useChat();
  const [tab, setTab] = useState<"avis" | "faq">("avis");
  const [allReviews, setAllReviews] = useState(false);
  const chatPartner = {
    id: `livreur:${l.slug}`,
    name: l.name,
    role: "livreur" as const,
    photoUrl: l.photoUrl,
    avatarBg: l.avatarBg,
  };
  const isAgence = l.type === "agence";
  const cta = isAgence ? l.name : l.name.split(" ")[0];
  const minPrice = Math.min(...l.zones.map((z) => z.priceXof));
  const top = l.kpi.deliverySuccessRate >= 95;

  return (
    <div className="min-h-full bg-paper">
      {/* Retour */}
      <div className="border-b border-line bg-white px-6 py-3">
        <Link href="/marketplace/livreurs" className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-500 transition hover:text-ink-900">
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour à la marketplace
        </Link>
      </div>

      {/* HERO navy + portrait / logo */}
      <section className="relative overflow-hidden bg-gradient-to-br from-kamoo-blue-900 to-kamoo-blue-800">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.22) 0%, transparent 70%)" }} />
        <div className="relative mx-auto flex max-w-[1320px] flex-wrap items-center gap-6 px-6 py-8">
          {l.photoUrl ? (
            <div className="h-32 w-32 shrink-0 overflow-hidden rounded-2xl border-4 border-white/15 shadow-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.photoUrl} alt={l.name} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="grid h-32 w-32 shrink-0 place-items-center rounded-2xl border-4 border-white/15 text-[34px] font-extrabold text-white shadow-xl" style={{ background: l.avatarBg }}>
              {l.initials}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-[28px] font-extrabold tracking-tight text-white">{l.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-white/70">
              <span className="inline-flex items-center gap-1">{isAgence ? <Building2 className="h-3.5 w-3.5" /> : <Bike className="h-3.5 w-3.5" />}{LIVREUR_TYPE_LABELS[l.type]}</span>
              <span className="text-white/25">·</span>
              <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {l.city}, {COUNTRY[l.countryCode] ?? l.countryCode}</span>
              <span className="text-white/25">·</span>
              <span>Partenaire Kamoo depuis {new Date(l.joinedAt).getFullYear()}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px]">
              <span className="inline-flex items-center gap-1 text-white">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <b>{l.rating}</b>
                <span className="text-white/60">{l.reviewsCount} avis</span>
              </span>
              {top && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2.5 py-0.5 text-[11.5px] font-semibold text-amber-200 ring-1 ring-inset ring-amber-300/30">
                  <Crown className="h-3.5 w-3.5" /> Top livreur
                </span>
              )}
              {l.status === "certified" ? (
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
          {/* À propos + indicateurs */}
          <section className="rounded-2xl border border-line bg-white p-5 shadow-kamoo-sm">
            <h2 className="text-[15px] font-bold text-ink-900">À propos</h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-600">{l.bio}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 sm:grid-cols-4">
              <Stat icon={CheckCircle2} tone="bg-emerald-50 text-emerald-700" value={`${l.kpi.deliverySuccessRate}%`} label="Taux de réussite" />
              <Stat icon={Clock} tone="bg-kamoo-orange-50 text-kamoo-orange-600" value={`${l.kpi.avgDeliveryMin} min`} label="Délai de réponse" />
              <Stat icon={Package} tone="bg-kamoo-blue-50 text-kamoo-blue-700" value={fmt(l.kpi.deliveriesHandled)} label="Livraisons" />
              <Stat icon={Users} tone="bg-purple-50 text-purple-700" value={String(l.activePartners)} label="Partenaires actifs" />
            </div>
          </section>

          {/* Zones & disponibilité */}
          <section className="rounded-2xl border border-line bg-white p-5 shadow-kamoo-sm">
            <h2 className="text-[15px] font-bold text-ink-900">Zones desservies &amp; tarifs</h2>
            <p className="mb-3 mt-1 text-[12.5px] text-ink-500">Tarif fixe par zone, payé sur chaque livraison effectuée.</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {l.zones.map((z) => (
                <div key={z.name} className="flex items-center justify-between rounded-xl border border-line bg-paper-2/30 px-3 py-2">
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-800">
                    <MapPin className="h-3.5 w-3.5 text-ink-400" /> {z.name}
                  </span>
                  <span className="text-right">
                    <span className="text-[12.5px] font-bold tabular-nums text-ink-900">{fmt(z.priceXof)} F</span>
                    {z.estimatedMin != null && <span className="ml-1.5 text-[10.5px] text-ink-400">~{z.estimatedMin} min</span>}
                  </span>
                </div>
              ))}
            </div>

            {/* Disponibilité */}
            <div className="mt-4 border-t border-line pt-4">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-400">Disponibilité</div>
              <div className="flex items-center gap-1.5">
                {ALL_DAYS.map((d) => {
                  const active = l.schedule.days.includes(d.key);
                  return (
                    <div key={d.key} title={d.long} className={cn("grid h-9 flex-1 place-items-center rounded-lg text-[11px] font-bold", active ? "bg-kamoo-blue-700 text-white" : "bg-paper-2 text-ink-300 line-through")}>
                      {d.short}
                    </div>
                  );
                })}
              </div>
              <div className="mt-2.5 flex items-center justify-center gap-2 rounded-lg bg-paper-2/50 py-2 text-[13px] font-semibold text-ink-800">
                <Clock className="h-3.5 w-3.5 text-ink-500" />
                {formatHour(l.schedule.startTime)} — {formatHour(l.schedule.endTime)}
              </div>
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
                  <button key={tb.id} onClick={() => setTab(tb.id)} className={cn("relative inline-flex shrink-0 items-center px-3 py-3 text-[13px] font-semibold transition", active ? "text-kamoo-orange-600" : "text-ink-500 hover:text-ink-900")}>
                    {tb.label}
                    {active && <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-t bg-kamoo-orange-500" />}
                  </button>
                );
              })}
            </div>
            <div className="p-5">{tab === "avis" ? <Reviews l={l} onShowAll={() => setAllReviews(true)} /> : <Faq l={l} cta={cta} minPrice={minPrice} />}</div>
          </section>
        </div>

        {/* ─── DROITE ─── */}
        <div className="flex flex-col gap-5">
          <section className="sticky top-6 flex flex-col gap-5">
            {/* CTA */}
            <div className="rounded-2xl border border-line bg-white p-5 shadow-kamoo-sm">
              <h2 className="text-[17px] font-bold leading-tight text-ink-900">Travailler avec {cta} ?</h2>
              <div className="mt-3 rounded-xl bg-paper-2/50 px-3 py-2.5">
                <div className="text-[10.5px] font-medium uppercase tracking-wide text-ink-400">Tarif</div>
                <div className="text-[20px] font-extrabold tabular-nums text-ink-900">dès {fmt(minPrice)} <span className="text-[12px] font-semibold text-ink-500">F CFA / livraison</span></div>
                <div className="mt-0.5 text-[11px] text-ink-400">Tarif fixe selon la zone, payé sur chaque livraison.</div>
              </div>
              <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-kamoo-orange-500 px-4 py-3 text-[14px] font-bold text-white transition hover:bg-kamoo-orange-600">
                Choisir ce livreur
              </button>
              <button
                onClick={() => openChat(chatPartner)}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-[13px] font-semibold text-ink-900 transition hover:bg-paper-2"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Discuter avant de décider
              </button>
              <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
                <Trust icon={ShieldCheck} tone="text-emerald-600" title="Profil vérifié par Kamoo" sub="Identité et fiabilité contrôlées" />
                <Trust icon={Truck} tone="text-kamoo-blue-700" title="Suivi de livraison intégré" sub="Statut en temps réel sur Kamoo" />
                <Trust icon={Headphones} tone="text-kamoo-orange-500" title="Support Kamoo en cas de litige" sub="Nous vous accompagnons" />
              </div>
            </div>

            {/* En bref */}
            <div className="rounded-2xl border border-line bg-white p-5 shadow-kamoo-sm">
              <h3 className="mb-3 text-[13px] font-bold text-ink-900">En bref</h3>
              <div className="flex flex-col gap-3 text-[12.5px]">
                <BriefRow icon={CheckCircle2} tone="text-emerald-600" label="Taux de réussite" value={`${l.kpi.deliverySuccessRate}%`} />
                <BriefRow icon={Clock} tone="text-kamoo-orange-500" label="Délai de réponse" value={`${l.kpi.avgDeliveryMin} min`} />
                <BriefRow icon={Calendar} tone="text-kamoo-blue-700" label="Ancienneté" value={`${l.kpi.monthsOnPlatform} mois`} />
                <BriefRow icon={MapPin} tone="text-purple-700" label="Zone principale" value={`${l.city}, ${COUNTRY[l.countryCode] ?? l.countryCode}`} />
              </div>
            </div>
          </section>
        </div>
      </div>

      {allReviews && (
        <ReviewsModal
          partnerName={l.name}
          rating={l.rating}
          reviewsCount={l.reviewsCount}
          reviews={l.reviews.map((r) => ({
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
function Stat({ icon: Icon, tone, value, label }: { icon: React.ComponentType<{ className?: string }>; tone: string; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full", tone)}><Icon className="h-4 w-4" /></span>
      <div className="min-w-0">
        <div className="text-[15px] font-bold tabular-nums leading-tight text-ink-900">{value}</div>
        <div className="truncate text-[10.5px] text-ink-400">{label}</div>
      </div>
    </div>
  );
}

function Reviews({ l, onShowAll }: { l: Livreur; onShowAll?: () => void }) {
  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button onClick={onShowAll} className="text-[12px] font-semibold text-kamoo-blue-700 hover:underline">Voir tous les avis ({l.reviewsCount})</button>
      </div>
      {l.reviews.length === 0 ? (
        <p className="py-6 text-center text-[12.5px] italic text-ink-400">Aucun avis pour le moment.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {l.reviews.map((r, i) => (
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

function Faq({ l, cta, minPrice }: { l: Livreur; cta: string; minPrice: number }) {
  const items = [
    { q: "Comment se passe une livraison ?", a: `Vous assignez la commande à ${cta} depuis Kamoo. Il récupère le colis puis livre dans la zone convenue, avec suivi de statut en temps réel.` },
    { q: "Quels sont les tarifs ?", a: `Tarif fixe par zone, dès ${fmt(minPrice)} F CFA / livraison. Voir le détail des ${l.zones.length} zones desservies ci-dessus.` },
    { q: "Quelles zones sont couvertes ?", a: l.zones.map((z) => z.name).join(", ") + "." },
    { q: "Quand est-il disponible ?", a: `Du ${ALL_DAYS.filter((d) => l.schedule.days.includes(d.key)).map((d) => d.long.toLowerCase()).join(", ")}, de ${formatHour(l.schedule.startTime)} à ${formatHour(l.schedule.endTime)}.` },
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

function Trust({ icon: Icon, tone, title, sub }: { icon: React.ComponentType<{ className?: string }>; tone: string; title: string; sub: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", tone)} />
      <div>
        <div className="text-[12.5px] font-semibold text-ink-900">{title}</div>
        <div className="text-[11px] text-ink-500">{sub}</div>
      </div>
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
