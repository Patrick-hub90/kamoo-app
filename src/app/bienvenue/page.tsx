"use client";

/**
 * Onboarding 1ʳᵉ connexion — wizard plein écran en 3 étapes :
 *   1. Choix du marché (pays d'opération)
 *   2. Choix d'une closeuse (suggérée, optionnel)
 *   3. Choix d'un transitaire (suggéré, optionnel)
 * puis récap et entrée dans la console. `localStorage.kamoo.onboarded`
 * évite de re-proposer le wizard aux visites suivantes.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  Headset,
  PartyPopper,
  Rocket,
  Ship,
  Star,
  Store,
} from "lucide-react";
import { MOCK_MARKETS } from "@/lib/data/mock-markets";
import { MOCK_CLOSEUSES, isTopPerformer } from "@/lib/data/mock-closeuses";
import { MOCK_TRANSITAIRES } from "@/lib/data/mock-transitaires";
import { useCurrentMarket } from "@/lib/hooks/use-current-market";
import { cn } from "@/lib/utils";

const fmt = (n: number) => n.toLocaleString("fr-FR");

const STEPS = [
  { id: 1, label: "Votre marché", icon: Store },
  { id: 2, label: "Votre closeuse", icon: Headset },
  { id: 3, label: "Votre transitaire", icon: Ship },
] as const;

export default function BienvenuePage() {
  const router = useRouter();
  const { switchToMarket } = useCurrentMarket();

  const [step, setStep] = useState(1);
  const [marketId, setMarketId] = useState<string>("mkt_sn");
  const [closeuseSlug, setCloseuseSlug] = useState<string | null>(null);
  const [transitaireSlug, setTransitaireSlug] = useState<string | null>(null);

  const topCloseuses = [...MOCK_CLOSEUSES]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);
  const topTransitaires = [...MOCK_TRANSITAIRES]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  const market = MOCK_MARKETS.find((m) => m.id === marketId);
  const closeuse = MOCK_CLOSEUSES.find((c) => c.slug === closeuseSlug);
  const transitaire = MOCK_TRANSITAIRES.find((t) => t.slug === transitaireSlug);

  function finish() {
    switchToMarket(marketId);
    try {
      localStorage.setItem("kamoo.onboarded", "1");
    } catch {}
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-kamoo-blue-900 via-kamoo-blue-900 to-[#13355F] px-4 py-10">
      <div className="mx-auto max-w-3xl">
        {/* Logo + skip */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[20px] font-extrabold text-white">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-[15px]">K°</span>
            Kamoo<span className="text-kamoo-orange-500">.</span>
          </div>
          <button onClick={finish} className="text-[12.5px] font-semibold text-white/50 transition hover:text-white">
            Passer pour l&apos;instant
          </button>
        </div>

        {/* Stepper */}
        {step <= 3 && (
          <div className="mb-6 flex items-center gap-2">
            {STEPS.map((s, i) => {
              const done = step > s.id;
              const active = step === s.id;
              return (
                <div key={s.id} className="flex flex-1 items-center gap-2">
                  <div
                    className={cn(
                      "flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold",
                      active ? "bg-kamoo-orange-500 text-white" : done ? "bg-white/15 text-white" : "bg-white/[0.06] text-white/40",
                    )}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : <s.icon className="h-3.5 w-3.5" />}
                    {s.label}
                  </div>
                  {i < STEPS.length - 1 && <div className="h-px flex-1 bg-white/10" />}
                </div>
              );
            })}
          </div>
        )}

        {/* Carte principale */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
          {/* ── Étape 1 : marché ── */}
          {step === 1 && (
            <div className="p-7">
              <h1 className="text-[22px] font-extrabold tracking-tight text-ink-900">
                Bienvenue ! Où vendez-vous ?
              </h1>
              <p className="mt-1.5 text-[13.5px] text-ink-500">
                Choisissez votre marché principal. Vos partenaires, votre stock et vos finances
                seront organisés par pays — vous pourrez en ajouter d&apos;autres plus tard.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {MOCK_MARKETS.map((m) => {
                  const active = marketId === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMarketId(m.id)}
                      className={cn(
                        "rounded-2xl border p-4 text-left transition",
                        active ? "border-kamoo-blue-400 bg-kamoo-blue-50 ring-2 ring-kamoo-blue-100" : "border-line hover:border-ink-300",
                      )}
                    >
                      <span className="grid h-11 w-11 place-items-center rounded-full bg-kamoo-blue-900 text-[13px] font-extrabold text-white">
                        {m.country.code}
                      </span>
                      <div className="mt-2 text-[14.5px] font-bold text-ink-900">{m.country.name}</div>
                      <div className="mt-0.5 text-[11px] text-ink-500">
                        {m.country.warehouseCity} · {m.country.currency}
                      </div>
                      {active && (
                        <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-kamoo-blue-700">
                          <Check className="h-3 w-3" /> Sélectionné
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Étape 2 : closeuse ── */}
          {step === 2 && (
            <div className="p-7">
              <h1 className="text-[22px] font-extrabold tracking-tight text-ink-900">
                Qui appellera vos clients ?
              </h1>
              <p className="mt-1.5 text-[13.5px] text-ink-500">
                Une closeuse confirme vos commandes par téléphone avant livraison — c&apos;est la clé
                du cash-on-delivery. Voici les mieux notées, payées uniquement à la commande livrée.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {topCloseuses.map((c) => {
                  const active = closeuseSlug === c.slug;
                  return (
                    <button
                      key={c.slug}
                      onClick={() => setCloseuseSlug(active ? null : c.slug)}
                      className={cn(
                        "rounded-2xl border p-4 text-left transition",
                        active ? "border-kamoo-blue-400 bg-kamoo-blue-50 ring-2 ring-kamoo-blue-100" : "border-line hover:border-ink-300",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.photoUrl} alt={c.name} className="h-14 w-14 rounded-xl object-cover" />
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="text-[13.5px] font-bold text-ink-900">{c.name}</span>
                        {isTopPerformer(c) && <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />}
                      </div>
                      <div className="text-[11px] text-ink-500">{c.city}</div>
                      <div className="mt-1.5 flex items-center gap-1 text-[11.5px]">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <b className="text-ink-900">{c.rating}</b>
                        <span className="text-ink-400">· {c.kpi.confirmationRate}% conf.</span>
                      </div>
                      <div className="mt-1 text-[11.5px] font-semibold text-ink-700">
                        {fmt(c.commissionXof)} F / commande livrée
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-[11.5px] text-ink-400">
                Optionnel — vous pourrez aussi choisir plus tard depuis la Marketplace.
              </p>
            </div>
          )}

          {/* ── Étape 3 : transitaire ── */}
          {step === 3 && (
            <div className="p-7">
              <h1 className="text-[22px] font-extrabold tracking-tight text-ink-900">
                Qui importera vos produits ?
              </h1>
              <p className="mt-1.5 text-[13.5px] text-ink-500">
                Le transitaire achemine vos commandes fournisseur depuis la Chine jusqu&apos;à votre
                entrepôt. Profils vérifiés, tarifs et délais transparents.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {topTransitaires.map((t) => {
                  const active = transitaireSlug === t.slug;
                  const min = Math.min(...t.modes.map((m) => m.fromXof));
                  return (
                    <button
                      key={t.slug}
                      onClick={() => setTransitaireSlug(active ? null : t.slug)}
                      className={cn(
                        "rounded-2xl border p-4 text-left transition",
                        active ? "border-kamoo-blue-400 bg-kamoo-blue-50 ring-2 ring-kamoo-blue-100" : "border-line hover:border-ink-300",
                      )}
                    >
                      <span className="grid h-12 w-12 place-items-center rounded-full text-[13px] font-extrabold text-white" style={{ background: t.avatarBg }}>
                        {t.avatar}
                      </span>
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="text-[13.5px] font-bold leading-tight text-ink-900">{t.name}</span>
                      </div>
                      <div className="text-[11px] text-ink-500">{t.countryCode} {t.city}</div>
                      <div className="mt-1.5 flex items-center gap-1 text-[11.5px]">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <b className="text-ink-900">{t.rating}</b>
                        <span className="text-ink-400">· {t.onTimePct}% à temps</span>
                      </div>
                      <div className="mt-1 text-[11.5px] font-semibold text-ink-700">dès {fmt(min)} F / kg</div>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-[11.5px] text-ink-400">
                Optionnel — vous pourrez comparer tous les transitaires dans la Marketplace.
              </p>
            </div>
          )}

          {/* ── Étape 4 : récap ── */}
          {step === 4 && (
            <div className="p-7 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-kamoo-orange-50 text-kamoo-orange-500">
                <PartyPopper className="h-7 w-7" />
              </span>
              <h1 className="mt-3 text-[22px] font-extrabold tracking-tight text-ink-900">
                Votre console est prête !
              </h1>
              <p className="mx-auto mt-1.5 max-w-md text-[13.5px] text-ink-500">
                Voici votre configuration de départ. Vous pourrez tout ajuster à tout moment.
              </p>
              <div className="mx-auto mt-5 grid max-w-md gap-2.5 text-left">
                <RecapRow icon={Store} label="Marché" value={market ? `${market.country.name} · ${market.country.warehouseCity}` : "—"} />
                <RecapRow icon={Headset} label="Closeuse" value={closeuse ? `${closeuse.name} · ${fmt(closeuse.commissionXof)} F / commande` : "À choisir dans la Marketplace"} muted={!closeuse} />
                <RecapRow icon={Ship} label="Transitaire" value={transitaire ? `${transitaire.name} · ${transitaire.city}` : "À choisir dans la Marketplace"} muted={!transitaire} />
              </div>
            </div>
          )}

          {/* ── Pied ── */}
          <div className="flex items-center justify-between border-t border-line bg-paper-2/40 px-7 py-4">
            {step > 1 ? (
              <button onClick={() => setStep(step - 1)} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-500 transition hover:text-ink-900">
                <ArrowLeft className="h-4 w-4" />
                Retour
              </button>
            ) : (
              <span />
            )}
            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="inline-flex items-center gap-2 rounded-xl bg-kamoo-blue-900 px-5 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-kamoo-blue-800"
              >
                Continuer
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={finish}
                className="inline-flex items-center gap-2 rounded-xl bg-kamoo-blue-900 px-5 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-kamoo-blue-800"
              >
                <Rocket className="h-4 w-4" />
                Entrer dans ma console
              </button>
            )}
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] text-white/35">
          Kamoo — Vends. On s&apos;occupe du reste.
        </p>
      </div>
    </div>
  );
}

function RecapRow({
  icon: Icon,
  label,
  value,
  muted,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-white px-3.5 py-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-kamoo-blue-50 text-kamoo-blue-700">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-[10.5px] font-semibold uppercase tracking-wide text-ink-400">{label}</span>
        <span className={cn("block truncate text-[13px] font-semibold", muted ? "text-ink-400" : "text-ink-900")}>{value}</span>
      </span>
    </div>
  );
}
