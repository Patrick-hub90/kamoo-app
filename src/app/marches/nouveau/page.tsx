"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  ExternalLink,
  Rocket,
  Search,
  ShoppingBag,
  Store,
} from "lucide-react";
import {
  ALL_AFRICAN_COUNTRIES,
  type Country,
} from "@/lib/data/countries";
import { MOCK_MARKETS } from "@/lib/data/mock-markets";
import { cn } from "@/lib/utils";

/**
 * Wizard 3 étapes pour créer un nouveau marché — accessible depuis le toggle
 * marché dans la topbar (bouton "+ Ajouter un nouveau marché").
 *
 * Étapes :
 *  1. Choisir le pays
 *  2. Connecter la boutique Shopify (ou skip pour plus tard)
 *  3. Confirmation + lancement → redirige dans le nouveau marché actif
 *
 * Mock V1 : pas de vraie persistance, on simule le flow et on redirige.
 * V2 : server actions Supabase + appel API Shopify OAuth.
 */

type Step = 1 | 2 | 3;

const STEP_LABELS: Record<Step, string> = {
  1: "Choisir le pays",
  2: "Connecter Shopify",
  3: "Confirmation",
};

export default function NouveauMarchePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  const usedCountryCodes = useMemo(
    () => new Set(MOCK_MARKETS.map((m) => m.country.code)),
    [],
  );

  const [country, setCountry] = useState<Country | null>(null);
  const [shopifyDomain, setShopifyDomain] = useState("");
  const [skipShopify, setSkipShopify] = useState(false);

  // On ne peut continuer que si le pays est supporté ET pas déjà ouvert
  const canNext1 =
    country !== null &&
    country.isSupported &&
    !usedCountryCodes.has(country.code);
  const canNext2 =
    skipShopify || /^[a-z0-9-]+\.myshopify\.com$/.test(shopifyDomain.trim());

  const goNext = () => setStep((s) => (s < 3 ? ((s + 1) as Step) : s));
  const goBack = () => setStep((s) => (s > 1 ? ((s - 1) as Step) : s));

  const handleLaunch = () => {
    // Mock : on simule la création + activation du nouveau marché
    alert(
      `[Mock V1] Marché ${country?.name} créé avec ${skipShopify ? "Shopify à connecter plus tard" : `boutique ${shopifyDomain}`}.\n\nEn V2 : appel API Supabase + activation auto du nouveau marché + redirection vers /(vendor).`,
    );
    router.push("/");
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div>
        <h1 className="font-display text-3xl font-extrabold text-ink-900">
          Nouveau marché
        </h1>
        <p className="mt-1 text-[14px] text-ink-500">
          Étendez votre activité Kamoo vers un nouveau pays en 3 étapes.
        </p>
      </div>

      <Stepper currentStep={step} />

      <div className="rounded-2xl border border-line bg-white p-8">
        {step === 1 && (
          <Step1Country
            allCountries={ALL_AFRICAN_COUNTRIES}
            usedCountryCodes={usedCountryCodes}
            selected={country}
            onSelect={setCountry}
          />
        )}
        {step === 2 && (
          <Step2Shopify
            domain={shopifyDomain}
            onChangeDomain={setShopifyDomain}
            skip={skipShopify}
            onToggleSkip={setSkipShopify}
          />
        )}
        {step === 3 && country && (
          <Step3Confirm
            country={country}
            shopifyDomain={skipShopify ? null : shopifyDomain}
          />
        )}
      </div>

      {/* Navigation wizard */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 1}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-semibold transition",
            step === 1
              ? "text-ink-300"
              : "text-ink-700 hover:bg-paper-2",
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          Précédent
        </button>

        {step < 3 ? (
          <button
            type="button"
            onClick={goNext}
            disabled={step === 1 ? !canNext1 : !canNext2}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-[13px] font-bold transition",
              (step === 1 ? canNext1 : canNext2)
                ? "bg-kamoo-blue-900 text-white hover:bg-kamoo-blue-800 active:translate-y-px"
                : "bg-paper-2 text-ink-400",
            )}
          >
            Continuer
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleLaunch}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-[13px] font-bold text-white transition hover:bg-emerald-700 active:translate-y-px"
          >
            <Rocket className="h-4 w-4" />
            Lancer le marché
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Stepper ─── */

function Stepper({ currentStep }: { currentStep: Step }) {
  return (
    <div className="flex items-center gap-2">
      {([1, 2, 3] as Step[]).map((s, i) => {
        const isCurrent = s === currentStep;
        const isDone = s < currentStep;
        return (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "grid h-8 w-8 shrink-0 place-items-center rounded-full text-[12px] font-extrabold transition",
                isDone
                  ? "bg-emerald-600 text-white"
                  : isCurrent
                    ? "bg-kamoo-orange-500 text-white"
                    : "bg-paper-2 text-ink-400 ring-1 ring-line",
              )}
            >
              {isDone ? <Check className="h-4 w-4" /> : s}
            </div>
            <div className="flex-1 leading-tight">
              <div
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  isDone || isCurrent ? "text-ink-900" : "text-ink-400",
                )}
              >
                Étape {s}
              </div>
              <div
                className={cn(
                  "text-[12.5px] font-semibold",
                  isCurrent ? "text-ink-900" : "text-ink-500",
                )}
              >
                {STEP_LABELS[s]}
              </div>
            </div>
            {i < 2 && (
              <div
                className={cn(
                  "h-px flex-1 transition",
                  s < currentStep ? "bg-emerald-300" : "bg-line",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Étape 1 — Pays (dropdown searchable) ─── */

function Step1Country({
  allCountries,
  usedCountryCodes,
  selected,
  onSelect,
}: {
  allCountries: Country[];
  usedCountryCodes: Set<string>;
  selected: Country | null;
  onSelect: (c: Country) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allCountries;
    return allCountries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q),
    );
  }, [allCountries, query]);

  const isAlreadyOpened =
    selected !== null && usedCountryCodes.has(selected.code);
  const isUnsupported = selected !== null && !selected.isSupported;

  return (
    <div>
      <h2 className="font-display text-xl font-extrabold text-ink-900">
        Sur quel pays souhaitez-vous vendre ?
      </h2>
      <p className="mt-1 text-[13px] text-ink-500">
        Sélectionnez un pays dans la liste. Vous pourrez ouvrir d&apos;autres
        marchés plus tard.
      </p>

      {/* Dropdown trigger */}
      <div className="relative mt-6">
        <button
          type="button"
          onClick={() => {
            setOpen(!open);
            // focus l'input recherche dès l'ouverture
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl border-2 bg-white px-4 py-3 text-left transition",
            open
              ? "border-kamoo-blue-600 ring-2 ring-kamoo-blue-100"
              : "border-line hover:border-kamoo-blue-300",
          )}
        >
          {selected ? (
            <>
              <span className="text-2xl">{selected.flag}</span>
              <div className="flex-1">
                <div className="font-bold text-ink-900">{selected.name}</div>
                <div className="mt-0.5 text-[11px] text-ink-500">
                  {selected.isSupported
                    ? `${selected.warehouseCity} · ${selected.currency}`
                    : "Marché à venir"}
                </div>
              </div>
            </>
          ) : (
            <>
              <span className="text-2xl">🌍</span>
              <div className="flex-1 text-[13px] text-ink-500">
                Choisissez un pays…
              </div>
            </>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-ink-400 transition-transform",
              open && "rotate-180",
            )}
          />
        </button>

        {open && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpen(false)}
            />
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 max-h-[400px] overflow-hidden rounded-xl border border-line bg-white shadow-[var(--shadow-kamoo-lg)]">
              {/* Search */}
              <div className="border-b border-line p-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
                  <input
                    ref={inputRef}
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher un pays…"
                    className="h-9 w-full rounded-lg bg-paper-2 pl-9 pr-3 text-[13px] outline-none placeholder:text-ink-400"
                  />
                </div>
              </div>

              {/* Liste */}
              <div
                className="max-h-[340px] overflow-y-auto p-1"
                style={{
                  scrollbarColor: "#D1D5DB #F5F5EE",
                  scrollbarWidth: "thin",
                }}
              >
                {filtered.length === 0 ? (
                  <div className="px-3 py-6 text-center text-[12.5px] text-ink-500">
                    Aucun pays ne correspond à « {query} »
                  </div>
                ) : (
                  filtered.map((c) => {
                    const used = usedCountryCodes.has(c.code);
                    const isCurrent = selected?.code === c.code;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          onSelect(c);
                          setOpen(false);
                          setQuery("");
                        }}
                        disabled={used}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition",
                          used
                            ? "cursor-not-allowed opacity-50"
                            : "hover:bg-paper-2",
                          isCurrent && "bg-kamoo-blue-50",
                        )}
                      >
                        <span className="text-xl">{c.flag}</span>
                        <div className="flex-1 leading-tight">
                          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-900">
                            {c.name}
                            {used && (
                              <span className="inline-flex items-center rounded-full bg-paper-2 px-1.5 py-0.5 text-[9.5px] font-bold text-ink-500 ring-1 ring-line">
                                Déjà ouvert
                              </span>
                            )}
                            {!c.isSupported && !used && (
                              <span className="inline-flex items-center rounded-full bg-amber-50 px-1.5 py-0.5 text-[9.5px] font-bold text-amber-800">
                                Bientôt
                              </span>
                            )}
                            {c.isSupported && !used && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9.5px] font-bold text-emerald-700">
                                <span className="h-1 w-1 rounded-full bg-emerald-500" />
                                Activé
                              </span>
                            )}
                          </div>
                          <div className="text-[10.5px] text-ink-500">
                            {c.isSupported
                              ? `${c.warehouseCity} · ${c.currency}`
                              : `Code ${c.code} · ${c.currency}`}
                          </div>
                        </div>
                        {isCurrent && (
                          <Check className="h-4 w-4 text-kamoo-blue-700" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Message si pays non supporté */}
      {isUnsupported && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/40 p-4">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-bold text-amber-900">
              Ce marché n&apos;est pas encore activé
            </p>
            <p className="mt-0.5 text-[12px] text-ink-700">
              Kamoo n&apos;est pas encore présent en {selected!.name}. Nous
              vous notifierons dès l&apos;ouverture pour que vous soyez parmi
              les premiers vendeurs.
            </p>
            <button
              type="button"
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-[12px] font-bold text-amber-700 hover:bg-amber-100"
            >
              <Bell className="h-3.5 w-3.5" />
              Me notifier du lancement
            </button>
          </div>
        </div>
      )}

      {/* Message si pays déjà ouvert */}
      {isAlreadyOpened && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-kamoo-blue-100 bg-kamoo-blue-50/40 p-4">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-kamoo-blue-700">
            ℹ
          </div>
          <div className="flex-1 text-[12.5px]">
            <p className="font-bold text-kamoo-blue-900">
              Vous avez déjà un marché {selected!.name}
            </p>
            <p className="mt-0.5 text-ink-700">
              Basculez sur ce marché depuis le toggle en haut à droite, ou
              choisissez un autre pays dans la liste.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Étape 2 — Shopify ─── */

function Step2Shopify({
  domain,
  onChangeDomain,
  skip,
  onToggleSkip,
}: {
  domain: string;
  onChangeDomain: (v: string) => void;
  skip: boolean;
  onToggleSkip: (v: boolean) => void;
}) {
  return (
    <div>
      <div className="flex items-start gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
          <ShoppingBag className="h-7 w-7" />
        </div>
        <div className="flex-1">
          <h2 className="font-display text-xl font-extrabold text-ink-900">
            Connectez votre boutique Shopify
          </h2>
          <p className="mt-1 text-[13px] text-ink-500">
            Kamoo lit vos commandes en temps réel depuis Shopify pour les
            envoyer à votre closeuse. Vous pourrez connecter Shopify plus
            tard.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-500">
            URL de votre boutique Shopify
          </label>
          <div className="flex items-stretch overflow-hidden rounded-lg border border-line bg-white focus-within:border-kamoo-blue-600 focus-within:ring-2 focus-within:ring-kamoo-blue-100">
            <span className="grid place-items-center bg-paper-2 px-3 text-[12px] font-mono text-ink-500">
              https://
            </span>
            <input
              type="text"
              value={domain}
              onChange={(e) => {
                onChangeDomain(e.target.value);
                if (skip) onToggleSkip(false);
              }}
              placeholder="ma-boutique.myshopify.com"
              disabled={skip}
              className="h-10 flex-1 bg-white px-3 text-[13px] outline-none disabled:opacity-50"
            />
          </div>
          <p className="mt-1.5 text-[10.5px] text-ink-500">
            Format attendu :{" "}
            <code className="font-mono">votre-boutique.myshopify.com</code>
          </p>
        </div>

        <button
          type="button"
          disabled={
            skip || !/^[a-z0-9-]+\.myshopify\.com$/.test(domain.trim())
          }
          className={cn(
            "inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-bold transition",
            !skip && /^[a-z0-9-]+\.myshopify\.com$/.test(domain.trim())
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-paper-2 text-ink-400",
          )}
        >
          <ExternalLink className="h-4 w-4" />
          Autoriser l&apos;accès Shopify
        </button>
        <p className="text-center text-[11px] text-ink-500">
          Vous serez redirigé vers Shopify pour autoriser Kamoo à lire vos
          commandes (V2)
        </p>

        <div className="my-3 flex items-center gap-3">
          <div className="h-px flex-1 bg-line" />
          <span className="text-[11px] uppercase tracking-wider text-ink-400">
            ou
          </span>
          <div className="h-px flex-1 bg-line" />
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line p-3 transition hover:bg-paper-2">
          <input
            type="checkbox"
            checked={skip}
            onChange={(e) => onToggleSkip(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-line text-kamoo-blue-600"
          />
          <div className="text-[12.5px]">
            <div className="font-bold text-ink-900">
              Connecter Shopify plus tard
            </div>
            <p className="mt-0.5 text-ink-500">
              Vous pourrez créer des commandes manuellement et brancher
              Shopify quand vous voulez depuis les paramètres du marché.
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}

/* ─── Étape 3 — Confirmation ─── */

function Step3Confirm({
  country,
  shopifyDomain,
}: {
  country: Country;
  shopifyDomain: string | null;
}) {
  return (
    <div>
      <div className="flex items-start gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-kamoo-orange-50 text-kamoo-orange-700">
          <Rocket className="h-7 w-7" />
        </div>
        <div className="flex-1">
          <h2 className="font-display text-xl font-extrabold text-ink-900">
            Tout est prêt !
          </h2>
          <p className="mt-1 text-[13px] text-ink-500">
            Vérifiez les informations et lancez votre nouveau marché. Vous
            serez directement placé dans son contexte.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <RecapRow
          icon={<span className="text-2xl">{country.flag}</span>}
          label="Pays"
          value={country.name}
          subline={`${country.warehouseCity} · ${country.currency}`}
        />
        <RecapRow
          icon={<ShoppingBag className="h-5 w-5 text-emerald-700" />}
          label="Boutique Shopify"
          value={shopifyDomain ? shopifyDomain : "À connecter plus tard"}
          subline={
            shopifyDomain
              ? "Connexion à effectuer après création"
              : "Vous pourrez la brancher depuis les paramètres du marché"
          }
        />
        <RecapRow
          icon={<Store className="h-5 w-5 text-kamoo-blue-700" />}
          label="Marché à créer"
          value={`Marché ${country.name}`}
          subline="Contexte indépendant : partenaires, stock, finances séparés"
        />
      </div>
    </div>
  );
}

function RecapRow({
  icon,
  label,
  value,
  subline,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subline: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-line bg-paper-2/30 p-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
          {label}
        </div>
        <div className="mt-0.5 font-bold text-ink-900">{value}</div>
        <div className="text-[11.5px] text-ink-500">{subline}</div>
      </div>
    </div>
  );
}
