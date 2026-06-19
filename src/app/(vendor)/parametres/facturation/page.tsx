"use client";

import { ArrowRight, Check, Download, Receipt, Sparkles } from "lucide-react";
import { MOCK_VENDOR } from "@/lib/data/mock-vendor";
import { formatXOF } from "@/lib/format";
import {
  SettingsCard,
  SettingsSection,
  SettingsBody,
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
        caption="Votre formule Kamoo en cours, son tarif mensuel et la date du prochain prélèvement."
      >
        <SettingsBody>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-medium text-ink-900 sm:text-2xl">
                  Kamoo {currentPlan.name}
                </span>
                {currentPlan.highlight && (
                  <Sparkles className="h-4 w-4 text-kamoo-blue-900" />
                )}
              </div>
              <p className="mt-1 text-[13px] text-ink-500">
                {currentPlan.tagline}
              </p>
            </div>
            <div className="shrink-0 text-left sm:text-right">
              <div className="text-2xl font-medium text-ink-900 tabular-nums sm:text-3xl">
                {formatXOF(currentPlan.priceXof, false)}
              </div>
              <div className="mt-0.5 text-[11.5px] font-medium text-ink-500">
                F CFA / mois
              </div>
              <div className="mt-2 text-[11.5px] text-ink-500">
                Prochain prélèvement le{" "}
                <span className="font-medium text-ink-700">1 juin 2026</span>
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
        </SettingsBody>
      </SettingsSection>

      {/* CHANGER DE PLAN */}
      <SettingsSection
        title="Changer de plan"
        caption="Comparez les formules et passez à l'offre adaptée à votre croissance."
      >
        {PLANS.map((p) => (
          <PlanRow key={p.id} plan={p} isCurrent={p.id === currentPlan.id} />
        ))}
      </SettingsSection>

      {/* HISTORIQUE DES FACTURES */}
      <SettingsSection
        title="Factures et reçus"
        caption="Retrouvez et téléchargez vos factures payées des derniers mois."
      >
        {MOCK_INVOICES.map((inv) => (
          <InvoiceRow key={inv.id} invoice={inv} />
        ))}
      </SettingsSection>
    </SettingsCard>
  );
}

/** Ligne de plan : nom + tarif + features à gauche, action à droite. */
function PlanRow({ plan, isCurrent }: { plan: Plan; isCurrent: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-5",
        isCurrent && "bg-kamoo-blue-50/40",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[13.5px] font-medium text-ink-900">
            {plan.name}
          </span>
          {plan.highlight && (
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-kamoo-blue-900" />
          )}
          <span className="text-[13px] font-medium text-ink-700 tabular-nums">
            {formatXOF(plan.priceXof, false)}
            <span className="ml-1 text-[10.5px] font-medium text-ink-400">
              F / mois
            </span>
          </span>
        </div>
        <p className="mt-0.5 text-[11.5px] leading-snug text-ink-500">
          {plan.tagline}
        </p>
      </div>
      <button
        type="button"
        disabled={isCurrent}
        className={cn(
          "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition",
          isCurrent
            ? "cursor-not-allowed border border-line bg-paper-2 text-ink-500"
            : "border border-line bg-white text-ink-700 hover:border-kamoo-blue-600 hover:text-kamoo-blue-700",
        )}
      >
        {isCurrent ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Plan actuel
          </span>
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
    <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-paper-2 text-ink-500">
        <Receipt className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-mono-kamoo text-[12.5px] font-medium text-ink-900">
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
        <div className="text-[13.5px] font-medium text-ink-900 tabular-nums">
          {formatXOF(invoice.amountXof, false)}{" "}
          <span className="text-[10px] font-medium text-ink-400">F CFA</span>
        </div>
        <span
          className={cn(
            "mt-0.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-medium",
            invoice.status === "paid"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700",
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              invoice.status === "paid" ? "bg-emerald-500" : "bg-amber-500",
            )}
          />
          {invoice.status === "paid" ? "Payée" : "En attente"}
        </span>
      </div>
      {invoice.pdfUrl && (
        <button
          type="button"
          className="ml-1 inline-flex shrink-0 items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-ink-700 transition hover:border-kamoo-blue-600 hover:text-kamoo-blue-700"
          title="Télécharger la facture PDF"
        >
          <Download className="h-3 w-3" />
          PDF
        </button>
      )}
    </div>
  );
}
