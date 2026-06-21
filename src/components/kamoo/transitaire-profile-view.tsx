"use client";

import { useMemo, useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  Clock,
  Globe,
  MapPin,
  MessageCircle,
  Package,
  Sparkles,
  Star,
} from "lucide-react";
import { useChat } from "@/components/kamoo/chat";
import { PageHeader } from "@/components/kamoo/page-header";
import { ModeAccordion } from "@/components/kamoo/mode-accordion";
import { PartnerCta } from "@/components/kamoo/partner-cta";
import { useDisputes } from "@/lib/hooks/use-disputes";
import { usePartners } from "@/lib/hooks/use-partners";
import { ReviewsModal } from "@/components/kamoo/reviews-modal";
import type { Transitaire } from "@/lib/types/transitaire";
import { TRANSPORT_MODE_LABELS } from "@/lib/types/expedition";
import { cn } from "@/lib/utils";

export function TransitaireProfileView({ transitaire: raw }: { transitaire: Transitaire }) {
  const { openChat } = useChat();
  const { getReview } = usePartners();
  const { activeFor } = useDisputes();
  const dispute = activeFor(raw.slug);
  const [tab, setTab] = useState<"avis" | "faq">("avis");
  const [allReviews, setAllReviews] = useState(false);

  /* MON avis (laissé via « Laisser un avis » ou à la fin d'un partenariat)
   * s'ajoute en tête de la liste — compteur et note suivent. */
  const t: Transitaire = useMemo(() => {
    const mine = getReview(raw.slug);
    if (!mine) return raw;
    const myEntry = {
      id: "review_mine",
      vendorName: "Aïcha Diop (vous)",
      vendorCity: "Dakar",
      vendorCountryFlag: "🇸🇳",
      rating: mine.rating,
      date: new Date(mine.at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }),
      comment: mine.comment || "(Sans commentaire)",
      avatarBg: "linear-gradient(135deg,#F97316,#FB923C)",
    };
    const reviews = [myEntry, ...raw.reviews];
    const avg = Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10;
    return { ...raw, reviews, reviewsCount: reviews.length, rating: avg };
  }, [raw, getReview]);

  const firstName = t.name.split(" ")[0];
  const chatPartner = {
    id: `transitaire:${t.slug}`,
    name: t.name,
    role: "transitaire" as const,
    avatarBg: t.avatarBg,
  };

  return (
    <div className="min-h-full bg-paper">
      <PageHeader title={t.name} backHref="/transitaires" hideBell />

      {/* COVER */}
      <div className="relative h-44 w-full overflow-hidden">
        {t.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.coverImageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full" style={{ background: t.coverBg }} />
        )}
      </div>

      {/* IDENTITÉ */}
      <div className="border-b border-line bg-white">
        <div className="mx-auto max-w-[1320px] px-6">
          <div className="flex flex-wrap items-end justify-between gap-4 pb-5">
            <div className="flex items-end gap-4">
              <div
                className="relative z-10 -mt-14 grid h-28 w-28 shrink-0 place-items-center rounded-full border-4 border-white text-[30px] font-extrabold text-white shadow-lg"
                style={{ background: t.avatarBg }}
              >
                {t.avatar}
              </div>
              <div className="pb-1">
                <h1 className="text-[26px] font-extrabold tracking-tight text-ink-900">{t.name}</h1>
                <div className="mt-0.5 inline-flex items-center gap-1 text-[13px] text-ink-500">
                  <MapPin className="h-3.5 w-3.5" /> Retrait : {t.localWarehouse ?? t.city} · Partenaire Kamoo depuis {t.partnerSince}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <b className="text-ink-900">{t.rating}</b>
                    <span className="text-ink-500">{t.reviewsCount} avis</span>
                  </span>
                  {dispute && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-0.5 text-[11.5px] font-bold text-white">
                      ⚠ En dispute
                    </span>
                  )}
                  {t.status === "certified" ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-kamoo-orange-200 bg-kamoo-orange-50 px-2.5 py-0.5 text-[11.5px] font-semibold text-kamoo-orange-700">
                      <BadgeCheck className="h-3.5 w-3.5" /> Certifié Kamoo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-kamoo-blue-200 bg-kamoo-blue-50 px-2.5 py-0.5 text-[11.5px] font-semibold text-kamoo-blue-700">
                      <Sparkles className="h-3.5 w-3.5" /> Nouveau
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-5 px-6 py-6 lg:grid-cols-[1.7fr_1fr]">
        {/* ─── GAUCHE ─── */}
        <div className="flex min-w-0 flex-col gap-5">
          {/* À propos */}
          <section className="rounded-2xl border border-line bg-white p-5 shadow-kamoo-sm">
            <h2 className="text-[15px] font-bold text-ink-900">À propos</h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-600">{t.about}</p>
          </section>

          {/* Tarifs & modes (fusionnés) + indicateurs */}
          <section className="rounded-2xl border border-line bg-white p-5 shadow-kamoo-sm">
            <h2 className="text-[15px] font-bold text-ink-900">Tarifs détaillés par mode</h2>
            <p className="mb-3 mt-1 text-[12.5px] text-ink-500">
              Tarifs indicatifs par mode de transport. Cliquez sur un mode pour voir les délais et les catégories acceptées / refusées.
            </p>
            <ModeAccordion modes={t.modes} />
            <p className="mt-3 text-[12px] text-ink-400">
              Hors taxes / douane. Le devis exact est calculé après réception du colis,
              selon le poids / volume et la catégorie.
            </p>
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
                    className={cn(
                      "relative inline-flex shrink-0 items-center px-3 py-3 text-[13px] font-semibold transition",
                      active ? "text-kamoo-blue-900" : "text-ink-500 hover:text-ink-900",
                    )}
                  >
                    {tb.label}
                    {active && <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-t bg-kamoo-blue-900" />}
                  </button>
                );
              })}
            </div>
            <div className="p-5">
              {tab === "avis" ? <Reviews t={t} preview onShowAll={() => setAllReviews(true)} /> : <Faq t={t} />}
            </div>
          </section>
        </div>

        {/* ─── DROITE ─── */}
        <div className="flex flex-col gap-5">
          <section className="sticky top-6 flex flex-col gap-5">
            {/* En bref — caractéristiques calculées par la plateforme,
                en lignes complètes (pas de troncature, pas de pavés colorés) */}
            <div className="rounded-2xl border border-line bg-white p-5 shadow-kamoo-sm">
              <h3 className="mb-3 text-[13px] font-bold text-ink-900">En bref</h3>
              <div className="flex flex-col gap-3 text-[12.5px]">
                <BriefRow icon={Package} tone="text-kamoo-blue-700" label="Expéditions traitées" value={(t.ordersHandled ?? 0).toLocaleString("fr-FR")} />
                <BriefRow icon={Clock} tone="text-kamoo-orange-500" label="Temps de réponse moyen" value={`~${t.responseTime ?? "—"}`} />
                <BriefRow icon={CheckCircle2} tone="text-emerald-600" label="Dans le délai annoncé" value={`${t.onTimePct ?? "—"} % des colis`} />
                <BriefRow icon={Globe} tone="text-purple-700" label="Destinations desservies" value={`${t.countriesServed ?? "—"} pays`} />
                <BriefRow icon={MapPin} tone="text-red-500" label="Entrepôt de retrait" value={t.localWarehouse ?? t.city} />
              </div>
            </div>

            {/* CTA partenariat (choix direct — règle Kamoo) */}
            <PartnerCta
              role="transitaire"
              slug={t.slug}
              name={t.name}
              title={`Prêt à travailler avec ${firstName} ?`}
              description="Choisissez ce transitaire pour vos prochaines expéditions depuis la Chine. Il reçoit la demande et vous échangez via le chat Kamoo."
              chatPartner={chatPartner}
            />
          </section>
        </div>
      </div>

      {allReviews && (
        <ReviewsModal
          partnerName={t.name}
          rating={t.rating}
          reviewsCount={t.reviewsCount}
          reviews={t.reviews.map((r) => ({
            authorName: r.vendorName,
            authorCity: r.vendorCity,
            rating: r.rating,
            comment: r.comment,
            date: r.date,
            avatarBg: r.avatarBg,
          }))}
          onClose={() => setAllReviews(false)}
        />
      )}
    </div>
  );
}

/* ─── Sous-composants ─────────────────────────────────────────── */


function Reviews({ t, preview, onShowAll }: { t: Transitaire; preview?: boolean; onShowAll?: () => void }) {
  const list = preview ? t.reviews.slice(0, 4) : t.reviews;
  return (
    <div>
      {preview && (
        <div className="mb-3 flex justify-end">
          <button onClick={onShowAll} className="text-[12px] font-semibold text-kamoo-blue-700 hover:underline">
            Voir tous les avis ({t.reviewsCount})
          </button>
        </div>
      )}
      <div className={cn("grid gap-3", preview ? "sm:grid-cols-2" : "grid-cols-1")}>
        {list.map((r) => (
          <div key={r.id} className="rounded-xl border border-line bg-paper-2/30 p-3.5">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white" style={{ background: r.avatarBg }}>
                {r.vendorName.charAt(0)}
              </span>
              <div className="min-w-0">
                <div className="text-[12.5px] font-bold text-ink-900">{r.vendorName}</div>
                <div className="text-[10.5px] text-ink-500">{r.vendorCountryFlag} {r.vendorCity}</div>
              </div>
              <div className="ml-auto flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={cn("h-3 w-3", i < r.rating ? "fill-amber-400 text-amber-400" : "text-ink-200")} />
                ))}
              </div>
            </div>
            <p className="mt-2 text-[12.5px] leading-relaxed text-ink-700">{r.comment}</p>
            <div className="mt-1.5 text-[10.5px] text-ink-400">{r.date}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Faq({ t }: { t: Transitaire }) {
  const items = [
    {
      q: "Quelle est la politique de paiement ?",
      a:
        t.paymentPolicy === "upfront"
          ? "Le paiement se fait avant l'expédition depuis la Chine, de façon sécurisée via la plateforme Kamoo."
          : "Le paiement peut se faire à l'arrivée de la marchandise — un vrai plus pour votre trésorerie en cash-on-delivery.",
    },
    {
      q: "Quels sont les délais par mode ?",
      a: t.modes.map((m) => `${TRANSPORT_MODE_LABELS[m.mode]} : ${m.delay}`).join(" · "),
    },
    {
      q: "Quelles catégories ne sont pas acceptées ?",
      a:
        t.refusedCategories.length > 0
          ? `Ce transitaire ne prend pas en charge : ${t.refusedCategories.join(", ")}.`
          : "Aucune catégorie refusée à ce jour — voir l'onglet Modes pour le détail par mode.",
    },
    {
      q: "Comment se passe le suivi de mon expédition ?",
      a: "Suivi photo systématique à la réception en entrepôt, puis mises à jour de statut jusqu'à l'arrivée. Vous échangez avec le transitaire via le chat Kamoo.",
    },
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


function BriefRow({
  icon: Icon,
  tone,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="inline-flex items-center gap-2 text-ink-500">
        <Icon className={cn("h-4 w-4", tone)} />
        {label}
      </span>
      <span className="text-right font-semibold text-ink-900">{value}</span>
    </div>
  );
}
