"use client";

import {
  Building2,
  Check,
  Clock,
  IdCard,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { MOCK_VENDOR } from "@/lib/data/mock-vendor";
import { getCountryByCode } from "@/lib/data/countries";
import { cn } from "@/lib/utils";

/**
 * KYC & vérification — affiche l'état des vérifications du compte vendeur.
 *
 * Trois niveaux :
 *  1. Identité personnelle (CNI / passeport)
 *  2. Justificatif de domicile
 *  3. Vérification business (registre du commerce, optionnel)
 *
 * V1 : statuts mockés. V2 : upload Supabase Storage + revue admin manuelle
 * (puis automatique via Smile Identity en V3).
 */

type KycStep = {
  id: string;
  title: string;
  description: string;
  status: "verified" | "pending" | "missing";
  icon: typeof IdCard;
  /** Date de soumission (si pending/verified) — ISO */
  submittedAt?: string;
};

const KYC_STEPS: KycStep[] = [
  {
    id: "identity",
    title: "Pièce d'identité",
    description:
      "Carte nationale d'identité ou passeport. Photo recto + verso.",
    status: "verified",
    icon: IdCard,
    submittedAt: "2026-01-16T11:20:00Z",
  },
  {
    id: "address",
    title: "Justificatif de domicile",
    description:
      "Facture d'électricité, d'eau ou de téléphone de moins de 3 mois.",
    status: "pending",
    icon: ShieldCheck,
    submittedAt: "2026-05-08T09:15:00Z",
  },
  {
    id: "business",
    title: "Registre du commerce",
    description:
      "Optionnel — augmente tes limites de virement et débloque l'option « Compte société ».",
    status: "missing",
    icon: Building2,
  },
];

const STATUS_TONE: Record<
  KycStep["status"],
  { bg: string; fg: string; label: string }
> = {
  verified: {
    bg: "bg-emerald-50",
    fg: "text-emerald-700",
    label: "Vérifié",
  },
  pending: {
    bg: "bg-amber-50",
    fg: "text-amber-700",
    label: "En cours de revue",
  },
  missing: {
    bg: "bg-paper-2",
    fg: "text-ink-500",
    label: "Non fourni",
  },
};

export default function KycPage() {
  const country = getCountryByCode(MOCK_VENDOR.countryOfResidence);
  const verifiedCount = KYC_STEPS.filter(
    (s) => s.status === "verified",
  ).length;
  const totalRequired = KYC_STEPS.filter((s) => s.id !== "business").length;

  return (
    <div className="space-y-5">
      {/* Récap niveau de vérification */}
      <section className="rounded-2xl border border-line bg-white p-4 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-base font-extrabold text-ink-900">
              Niveau de vérification :{" "}
              <span className="text-emerald-700">
                {verifiedCount} / {totalRequired}
              </span>
            </h2>
            <p className="mt-1 text-[13px] text-ink-500">
              Compte enregistré au {country.flag} {country.name}. Complète
              chaque étape pour passer en niveau « Pro vérifié » et lever les
              limites de virement.
            </p>
          </div>
        </div>
      </section>

      {/* Étapes */}
      <section className="rounded-2xl border border-line bg-white p-4 sm:p-6">
        <h3 className="font-display text-base font-extrabold text-ink-900">
          Étapes
        </h3>
        <div className="mt-4 flex flex-col gap-2.5">
          {KYC_STEPS.map((s) => (
            <KycRow key={s.id} step={s} />
          ))}
        </div>
      </section>
    </div>
  );
}

function KycRow({ step }: { step: KycStep }) {
  const tone = STATUS_TONE[step.status];
  const Icon = step.icon;
  return (
    <div className="flex flex-wrap items-start gap-3 rounded-xl border border-line bg-paper-2/40 p-3.5 sm:flex-nowrap sm:gap-3.5">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-ink-700 ring-1 ring-line">
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-[13.5px] font-bold text-ink-900">{step.title}</h4>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold",
              tone.bg,
              tone.fg,
            )}
          >
            {step.status === "verified" && <Check className="h-3 w-3" />}
            {step.status === "pending" && <Clock className="h-3 w-3" />}
            {tone.label}
          </span>
        </div>
        <p className="mt-0.5 text-[11.5px] leading-snug text-ink-500">
          {step.description}
        </p>
        {step.submittedAt && step.status === "verified" && (
          <p className="mt-1 text-[10.5px] text-ink-400">
            Vérifié le{" "}
            {new Date(step.submittedAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}
        {step.submittedAt && step.status === "pending" && (
          <p className="mt-1 text-[10.5px] text-amber-700">
            Soumis le{" "}
            {new Date(step.submittedAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
            })}{" "}
            · Revue sous 24-48h
          </p>
        )}
      </div>

      {step.status === "missing" && (
        <button
          type="button"
          className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-kamoo-orange-500 px-3 py-1.5 text-[12px] font-bold text-white hover:bg-kamoo-orange-600 sm:ml-0"
        >
          <Upload className="h-3 w-3" />
          Téléverser
        </button>
      )}
    </div>
  );
}
