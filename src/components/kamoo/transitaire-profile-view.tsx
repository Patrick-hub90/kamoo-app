"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Camera,
  CheckCircle2,
  Clock,
  Globe,
  Headphones,
  Lock,
  MessageCircle,
  Route,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Users,
} from "lucide-react";
import { ModeAccordion } from "@/components/kamoo/mode-accordion";
import type { Transitaire } from "@/lib/types/transitaire";
import { TRANSPORT_MODE_LABELS } from "@/lib/types/expedition";
import { cn } from "@/lib/utils";

export function TransitaireProfileView({ transitaire: t }: { transitaire: Transitaire }) {
  const [tab, setTab] = useState<"avis" | "faq">("avis");
  const firstName = t.name.split(" ")[0];

  return (
    <div className="min-h-full bg-paper">
      {/* Retour */}
      <div className="border-b border-line bg-white px-6 py-3">
        <Link
          href="/marketplace/transitaires"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-500 transition hover:text-ink-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour à la marketplace
        </Link>
      </div>

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
                <div className="mt-0.5 text-[13px] text-ink-500">
                  {t.countryCode} {t.city} · Partenaire Kamoo depuis {t.partnerSince}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <b className="text-ink-900">{t.rating}</b>
                    <span className="text-ink-500">{t.reviewsCount} avis</span>
                  </span>
                  <span className="text-ink-300">·</span>
                  <span className="text-ink-500">{t.activeVendors} e-commerçants actifs</span>
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
            <div className="mt-4 flex flex-wrap gap-2">
              <Feature icon={ShieldCheck} label={t.paymentPolicy === "upfront" ? "Paiement avant l'expédition" : "Paiement à l'arrivée"} />
              <Feature icon={Camera} label="Suivi photo systématique" />
              <Feature icon={Tag} label="Tarification transparente" />
            </div>
            <div className="mt-4 border-t border-line pt-4">
              <StatsRow t={t} />
            </div>
          </section>

          {/* Tarifs & modes (fusionnés) + indicateurs */}
          <section className="rounded-2xl border border-line bg-white p-5 shadow-kamoo-sm">
            <h2 className="text-[15px] font-bold text-ink-900">Tarifs détaillés par mode</h2>
            <p className="mb-3 mt-1 text-[12.5px] text-ink-500">
              Tarifs indicatifs par mode de transport. Cliquez sur un mode pour voir les délais et les catégories acceptées / refusées.
            </p>
            <ModeAccordion modes={t.modes} />
            <p className="mt-3 text-[12px] text-ink-400">
              Hors taxes / douane. Le devis exact est calculé après votre demande, selon le volume et la catégorie.
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
                      active ? "text-kamoo-orange-600" : "text-ink-500 hover:text-ink-900",
                    )}
                  >
                    {tb.label}
                    {active && <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-t bg-kamoo-orange-500" />}
                  </button>
                );
              })}
            </div>
            <div className="p-5">
              {tab === "avis" ? <Reviews t={t} preview /> : <Faq t={t} />}
            </div>
          </section>
        </div>

        {/* ─── DROITE ─── */}
        <div className="flex flex-col gap-5">
          <section className="sticky top-6 flex flex-col gap-5">
            {/* CTA */}
            <div className="rounded-2xl border border-line bg-white p-5 shadow-kamoo-sm">
              <h2 className="text-[17px] font-bold leading-tight text-ink-900">
                Prêt à travailler avec {firstName} ?
              </h2>
              <p className="mt-2 text-[12.5px] leading-relaxed text-ink-500">
                Choisissez ce transitaire pour vos prochaines expéditions depuis la Chine.
                Vous pourrez discuter avec lui directement après sélection.
              </p>
              <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-kamoo-orange-500 px-4 py-3 text-[14px] font-bold text-white transition hover:bg-kamoo-orange-600">
                Choisir ce transitaire
              </button>
              <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-[13px] font-semibold text-ink-900 transition hover:bg-paper-2">
                <MessageCircle className="h-3.5 w-3.5" />
                Discuter avant de décider
              </button>

              <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
                <Trust icon={ShieldCheck} tone="text-emerald-600" title="Profil vérifié par Kamoo" sub="Transitaire certifié et contrôlé" />
                <Trust icon={Lock} tone="text-kamoo-blue-700" title="Paiement sécurisé via plateforme" sub="Vos paiements sont protégés" />
                <Trust icon={Headphones} tone="text-kamoo-orange-500" title="Support Kamoo en cas de litige" sub="Nous vous accompagnons" />
              </div>
            </div>

            {/* En bref */}
            <div className="rounded-2xl border border-line bg-white p-5 shadow-kamoo-sm">
              <h3 className="mb-3 text-[13px] font-bold text-ink-900">En bref</h3>
              <div className="flex flex-col gap-3 text-[12.5px]">
                <BriefRow icon={Clock} tone="text-kamoo-orange-500" label="Répond en moyenne" value={t.responseTime ?? "—"} />
                <BriefRow icon={CheckCircle2} tone="text-emerald-600" label="Livraisons à temps" value={`${t.onTimePct ?? "—"}%`} />
                <BriefRow icon={Route} tone="text-kamoo-blue-700" label="Itinéraire principal" value={`${t.city} → Afrique de l'Ouest`} />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/* ─── Sous-composants ─────────────────────────────────────────── */
function Feature({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-line bg-paper-2/40 px-3 py-2 text-[12.5px] font-medium text-ink-700">
      <Icon className="h-4 w-4 text-ink-400" />
      {label}
    </span>
  );
}

function StatsRow({ t }: { t: Transitaire }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard icon={Clock} tone="bg-kamoo-orange-50 text-kamoo-orange-600" value={t.responseTime ?? "—"} label="Répond en moyenne" />
      <StatCard icon={CheckCircle2} tone="bg-emerald-50 text-emerald-700" value={`${t.onTimePct ?? "—"}%`} label="Livraisons à temps" />
      <StatCard icon={Users} tone="bg-kamoo-blue-50 text-kamoo-blue-700" value={String(t.activeVendors)} label="E-commerçants actifs" />
      <StatCard icon={Globe} tone="bg-purple-50 text-purple-700" value={`${t.countriesServed ?? "—"} pays`} label="Destinations desservies" />
    </div>
  );
}

function StatCard({
  icon: Icon,
  tone,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-line bg-paper-2/30 p-3">
      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full", tone)}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <div className="text-[16px] font-bold tabular-nums leading-tight text-ink-900">{value}</div>
        <div className="truncate text-[10.5px] text-ink-400">{label}</div>
      </div>
    </div>
  );
}

function Reviews({ t, preview }: { t: Transitaire; preview?: boolean }) {
  const list = preview ? t.reviews.slice(0, 4) : t.reviews;
  return (
    <div>
      {preview && (
        <div className="mb-3 flex justify-end">
          <button className="text-[12px] font-semibold text-kamoo-blue-700 hover:underline">
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

function Trust({
  icon: Icon,
  tone,
  title,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  title: string;
  sub: string;
}) {
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
