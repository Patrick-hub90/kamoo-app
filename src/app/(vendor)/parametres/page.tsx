"use client";

import Link from "next/link";
import {
  ChevronRight,
  IdCard,
  KeyRound,
  Plug,
  Receipt,
  Store,
  UserCircle,
  Wallet,
} from "lucide-react";
import { MOCK_MARKETS } from "@/lib/data/mock-markets";
import { MOCK_VENDOR, MOCK_VENDOR_WALLETS } from "@/lib/data/mock-vendor";
import { getCountryByCode } from "@/lib/data/countries";
import { useShopify } from "@/lib/hooks/use-shopify";
import { cn } from "@/lib/utils";

const PLAN_LABEL: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  enterprise: "Enterprise",
};

/**
 * Hub Paramètres — page d'accueil des réglages.
 *
 * Remplace l'ancienne redirection aveugle vers /compte : on donne d'abord une
 * VUE D'ENSEMBLE (qui je suis + état réel de chaque réglage), puis on plonge
 * dans une section. Les cartes portent un statut réel (boutiques connectées,
 * wallets, plan) — pas un simple doublon du menu de gauche.
 */
export default function ParametresHubPage() {
  const { getConnection } = useShopify();
  const country = getCountryByCode(MOCK_VENDOR.countryOfResidence);

  const connectedStores = MOCK_MARKETS.filter(
    (m) => getConnection(m.id)?.isConnected === true,
  ).length;
  const walletCount = MOCK_VENDOR_WALLETS.length;
  const marketCount = MOCK_MARKETS.length;

  return (
    <div className="space-y-6">
      {/* RÉSUMÉ DU COMPTE — identité + faits clés en un coup d'œil */}
      <section className="rounded-2xl border border-line bg-white p-5 shadow-kamoo-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-kamoo-orange-500 to-kamoo-blue-700 text-base font-extrabold text-white shadow-kamoo-sm">
            {MOCK_VENDOR.initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-[17px] font-bold text-ink-900">
                {MOCK_VENDOR.firstName} {MOCK_VENDOR.lastName}
              </h2>
              <span className="inline-flex items-center rounded-full bg-kamoo-orange-50 px-2 py-0.5 text-[11px] font-extrabold text-kamoo-orange-700">
                Plan {PLAN_LABEL[MOCK_VENDOR.plan] ?? MOCK_VENDOR.plan}
              </span>
            </div>
            <p className="mt-0.5 truncate text-[12.5px] text-ink-500">
              {MOCK_VENDOR.businessName} · {country.flag} {country.name}
            </p>
          </div>

          {/* Faits clés — séparateurs sobres, pas de cards imbriquées */}
          <dl className="flex shrink-0 items-center divide-x divide-line text-center">
            <Fact label="Marchés" value={String(marketCount)} />
            <Fact label="Boutiques" value={String(connectedStores)} />
            <Fact label="Wallets" value={String(walletCount)} />
          </dl>
        </div>
      </section>

      {/* COMPTE */}
      <HubGroup title="Compte">
        <HubCard
          href="/parametres/compte"
          icon={UserCircle}
          title="Profil"
          desc="Identité, contact et informations du compte"
          chip={{ label: "À jour", tone: "info" }}
        />
        <HubCard
          href="/parametres/securite"
          icon={KeyRound}
          title="Sécurité"
          desc="Mot de passe, double authentification, sessions"
        />
        <HubCard
          href="/parametres/kyc"
          icon={IdCard}
          title="KYC & vérification"
          desc="Pièce d'identité, domicile, registre du commerce"
          chip={{ label: "À compléter", tone: "warn" }}
        />
      </HubGroup>

      {/* MON ACTIVITÉ */}
      <HubGroup title="Mon activité">
        <HubCard
          href="/parametres/marches"
          icon={Store}
          title="Marchés"
          desc="Pays, devise d'affichage et fuseau horaire"
          chip={{ label: `${marketCount} actif${marketCount > 1 ? "s" : ""}`, tone: "info" }}
        />
        <HubCard
          href="/parametres/connexions"
          icon={Plug}
          title="Connexions"
          desc="Boutiques Shopify et intégrations externes"
          chip={
            connectedStores > 0
              ? {
                  label: `${connectedStores} connectée${connectedStores > 1 ? "s" : ""}`,
                  tone: "ok",
                }
              : { label: "Aucune boutique", tone: "warn" }
          }
        />
      </HubGroup>

      {/* FACTURATION */}
      <HubGroup title="Facturation">
        <HubCard
          href="/parametres/wallets"
          icon={Wallet}
          title="Méthodes de paiement"
          desc="Numéros qui reçoivent le cash de vos livreurs"
          chip={
            walletCount > 0
              ? { label: `${walletCount} enregistré${walletCount > 1 ? "s" : ""}`, tone: "ok" }
              : { label: "Aucun wallet", tone: "warn" }
          }
        />
        <HubCard
          href="/parametres/facturation"
          icon={Receipt}
          title="Facturation"
          desc="Abonnement Kamoo et historique des factures"
          chip={{ label: `Plan ${PLAN_LABEL[MOCK_VENDOR.plan] ?? MOCK_VENDOR.plan}`, tone: "info" }}
        />
      </HubGroup>
    </div>
  );
}

/* ─── Sous-composants ─── */

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 first:pl-0 last:pr-0">
      <dd className="font-display text-xl font-extrabold tabular-nums text-ink-900">
        {value}
      </dd>
      <dt className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-400">
        {label}
      </dt>
    </div>
  );
}

function HubGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2.5 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-400">
        {title}
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

type ChipTone = "ok" | "warn" | "info";

const CHIP_TONE: Record<ChipTone, string> = {
  ok: "bg-emerald-50 text-emerald-700",
  warn: "bg-amber-50 text-amber-700",
  info: "bg-paper-2 text-ink-600",
};

function HubCard({
  href,
  icon: Icon,
  title,
  desc,
  chip,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  chip?: { label: string; tone: ChipTone };
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 shadow-kamoo-sm transition hover:border-kamoo-blue-200 hover:shadow-kamoo-md"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-kamoo-blue-50 text-kamoo-blue-700">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-[14px] font-bold text-ink-900">
            {title}
            <ChevronRight className="h-3.5 w-3.5 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-kamoo-blue-600" />
          </div>
          <p className="mt-0.5 text-[12px] leading-snug text-ink-500">{desc}</p>
        </div>
      </div>
      {chip && (
        <span
          className={cn(
            "inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
            CHIP_TONE[chip.tone],
          )}
        >
          {chip.label}
        </span>
      )}
    </Link>
  );
}
