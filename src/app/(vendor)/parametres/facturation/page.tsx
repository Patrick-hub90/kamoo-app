"use client";

import { ArrowRight, Check, Download, Receipt, Sparkles } from "lucide-react";
import { MOCK_VENDOR } from "@/lib/data/mock-vendor";
import { formatXOF } from "@/lib/format";
import {
  SettingsCard,
  SettingsSection,
} from "@/components/parametres/settings-ui";
import { cn } from "@/lib/utils";

/**
 * Facturation — abonnement Kamoo + historique des factures.
 *
 * V1 : 3 plans en dur. V2 : prélèvement automatique via Moneroo ou
 * directement déduit du cash flow (option « payer Kamoo sur tes recettes »).
 */

type Plan = {
  id: "free" | "pro" | "enterprise";
  name: string;
  priceXof: number;
  /** Description courte */
  tagline: string;
  features: string[];
  highlight?: boolean;
};

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    priceXof: 0,
    tagline: "Pour démarrer — limité à 1 marché.",
    features: [
      "1 marché",
      "10 commandes / mois",
      "Support communauté",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    priceXof: 15_000,
    tagline: "Pour les vendeuses en croissance — marchés illimités.",
    features: [
      "Marchés illimités",
      "Commandes illimitées",
      "Marketplace transitaires/closeuses/livreurs",
      "WhatsApp Business + alertes",
      "Support prioritaire",
    ],
    highlight: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceXof: 50_000,
    tagline: "Équipes 5+ utilisateurs, SLA, account manager dédié.",
    features: [
      "Tout du plan Pro",
      "Utilisateurs illimités",
      "SLA 99,9% + support 24/7",
      "Account manager dédié",
      "Onboarding partenaires personnalisé",
    ],
  },
];

type Invoice = {
  id: string;
  date: string;
  amountXof: number;
  status: "paid" | "pending";
  pdfUrl?: string;
};

const MOCK_INVOICES: Invoice[] = [
  {
    id: "INV-2026-05",
    date: "2026-05-01",
    amountXof: 15_000,
    status: "paid",
    pdfUrl: "/mock-invoices/INV-2026-05.pdf",
  },
  {
    id: "INV-2026-04",
    date: "2026-04-01",
    amountXof: 15_000,
    status: "paid",
    pdfUrl: "/mock-invoices/INV-2026-04.pdf",
  },
  {
    id: "INV-2026-03",
    date: "2026-03-01",
    amountXof: 15_000,
    status: "paid",
    pdfUrl: "/mock-invoices/INV-2026-03.pdf",
  },
];

export default function FacturationPage() {
  const currentPlan = PLANS.find((p) => p.id === MOCK_VENDOR.plan)!;

  return (
    <SettingsCard>
      {/* ABONNEMENT ACTUEL */}
      <SettingsSection
        title="Abonnement actuel"
        description="Votre formule Kamoo en cours, son tarif mensuel et la date du prochain prélèvement."
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-xl font-extrabold text-ink-900 sm:text-2xl">
                Kamoo {currentPlan.name}
              </span>
              {currentPlan.highlight && (
                <Sparkles className="h-4 w-4 text-kamoo-orange-500" />
              )}
            </div>
            <p className="mt-1 text-[13px] text-ink-500">
              {currentPlan.tagline}
            </p>
          </div>
          <div className="shrink-0 text-left sm:text-right">
            <div className="font-display text-2xl font-extrabold text-ink-900 tabular-nums sm:text-3xl">
              {formatXOF(currentPlan.priceXof, false)}
            </div>
            <div className="mt-0.5 text-[11.5px] font-semibold text-ink-500">
              F CFA / mois
            </div>
            <div className="mt-2 text-[11.5px] text-ink-500">
              Prochain prélèvement le{" "}
              <span className="font-semibold text-ink-700">1 juin 2026</span>
            </div>
          </div>
        </div>

        <ul className="mt-4 grid grid-cols-1 gap-y-1.5 text-[12.5px] text-ink-700 sm:grid-cols-2">
          {currentPlan.features.map((f) => (
            <li key={f} className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
              {f}
            </li>
          ))}
        </ul>
      </SettingsSection>

      {/* CHANGER DE PLAN */}
      <SettingsSection
        title="Changer de plan"
        description="Comparez les formules et passez à l'offre adaptée à votre croissance."
        wide
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PLANS.map((p) => (
            <PlanCard key={p.id} plan={p} isCurrent={p.id === currentPlan.id} />
          ))}
        </div>
      </SettingsSection>

      {/* HISTORIQUE DES FACTURES */}
      <SettingsSection
        title="Historique des factures"
        description="Retrouvez et téléchargez vos factures payées des derniers mois."
        wide
      >
        <div className="flex flex-col gap-2">
          {MOCK_INVOICES.map((inv) => (
            <InvoiceRow key={inv.id} invoice={inv} />
          ))}
        </div>
      </SettingsSection>
    </SettingsCard>
  );
}

function PlanCard({ plan, isCurrent }: { plan: Plan; isCurrent: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border p-4",
        isCurrent
          ? "border-kamoo-orange-300 bg-kamoo-orange-50/30"
          : "border-line bg-white",
      )}
    >
      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-bold text-ink-900">{plan.name}</span>
          {plan.highlight && (
            <Sparkles className="h-3.5 w-3.5 text-kamoo-orange-500" />
          )}
        </div>
        <div className="mt-1 font-display text-xl font-extrabold text-ink-900 tabular-nums">
          {formatXOF(plan.priceXof, false)}
          <span className="ml-1 text-[10.5px] font-semibold text-ink-500">
            F / mois
          </span>
        </div>
      </div>
      <p className="text-[11.5px] leading-snug text-ink-500">{plan.tagline}</p>
      <button
        type="button"
        disabled={isCurrent}
        className={cn(
          "mt-auto inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-bold transition",
          isCurrent
            ? "cursor-not-allowed border border-line bg-paper-2 text-ink-500"
            : "border border-line bg-white text-ink-700 hover:border-kamoo-blue-600 hover:text-kamoo-blue-700",
        )}
      >
        {isCurrent ? (
          "Plan actuel"
        ) : (
          <>
            Passer à {plan.name}
            <ArrowRight className="h-3 w-3" />
          </>
        )}
      </button>
    </div>
  );
}

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-paper-2/40 p-3 sm:flex-nowrap">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-ink-500 ring-1 ring-line">
        <Receipt className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-mono-kamoo text-[12px] font-bold text-ink-900">
          {invoice.id}
        </div>
        <div className="text-[11px] text-ink-500">
          {new Date(invoice.date).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
      </div>
      <div className="text-right">
        <div className="font-display text-[14px] font-extrabold text-ink-900 tabular-nums">
          {formatXOF(invoice.amountXof, false)}{" "}
          <span className="text-[10px] font-bold text-ink-500">F CFA</span>
        </div>
        <div className="text-[10.5px] font-semibold text-emerald-700">
          {invoice.status === "paid" ? "Payée" : "En attente"}
        </div>
      </div>
      {invoice.pdfUrl && (
        <button
          type="button"
          className="ml-1 inline-flex shrink-0 items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[11.5px] font-bold text-ink-700 hover:border-kamoo-blue-600 hover:text-kamoo-blue-700"
          title="Télécharger la facture PDF"
        >
          <Download className="h-3 w-3" />
          PDF
        </button>
      )}
    </div>
  );
}
