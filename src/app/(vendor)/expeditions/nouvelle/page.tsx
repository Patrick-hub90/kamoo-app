"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  Copy,
  MapPin,
  Package,
  Plane,
  Plus,
  Ship,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { ProductSelector } from "@/components/kamoo/product-selector";
import { MOCK_TRANSITAIRES } from "@/lib/data/mock-transitaires";
import { useExpeditionsState } from "@/lib/hooks/use-expeditions-state";
import { useCurrentMarket } from "@/lib/hooks/use-current-market";
import { usePartners } from "@/lib/hooks/use-partners";
import { COUNTRIES } from "@/lib/data/countries";
import { TRANSPORT_MODE_LABELS, type TransportMode } from "@/lib/types/expedition";
import type { Transitaire } from "@/lib/types/transitaire";
import { cn } from "@/lib/utils";

/* ─── État local du wizard ─────────────────────────────────────────── */

type Photo = {
  url: string;
  fileName?: string;
};

type Colis = {
  id: number;
  name: string;
  productId?: string;
  weight: string;
  cartons: string;
  photos: (Photo | null)[]; // 5 slots
};

const STEP_LABELS = ["Colis", "Transport", "Confirmation"] as const;

const TRANSPORT_ICON: Record<TransportMode, typeof Ship> = {
  sea: Ship,
  air_standard: Plane,
  air_express: Zap,
};

const TRANSPORT_BG: Record<TransportMode, string> = {
  sea: "bg-blue-50",
  air_standard: "bg-kamoo-blue-50",
  air_express: "bg-kamoo-orange-50",
};

const TRANSPORT_FG: Record<TransportMode, string> = {
  sea: "text-blue-700",
  air_standard: "text-kamoo-blue-900",
  air_express: "text-kamoo-orange-600",
};

/* ─── Composant principal ──────────────────────────────────────────── */

export default function NewExpeditionPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [expandedColis, setExpandedColis] = useState(0);
  const [colis, setColis] = useState<Colis[]>([
    {
      id: 1,
      name: "",
      weight: "",
      cartons: "",
      photos: [null, null, null, null, null],
    },
  ]);
  const [mode, setMode] = useState<TransportMode>("air_standard");
  const [responsibilityAccepted, setResponsibilityAccepted] = useState(false);

  const { partners } = usePartners();
  const activeTransitaires = partners.transitaires
    .filter((p) => p.status === "active")
    .map((p) => MOCK_TRANSITAIRES.find((t) => t.slug === p.slug))
    .filter((t): t is NonNullable<ReturnType<typeof MOCK_TRANSITAIRES.find>> => !!t);
  const [selectedTransitaireSlug, setSelectedTransitaireSlug] = useState<string | null>(null);
  const transitaire =
    activeTransitaires.find((t) => t.slug === selectedTransitaireSlug) ??
    activeTransitaires[0] ??
    null;
  const tPartnership = partners.transitaires.find((p) => p.status === "pending");

  const { addExpedition } = useExpeditionsState();

  const { currentMarket } = useCurrentMarket();
  const country = currentMarket.country;

  const isModeAllowed = (m: TransportMode) =>
    transitaire ? transitaire.modes.some((tm) => tm.mode === m) : true;

  useEffect(() => {
    if (transitaire && !isModeAllowed(mode)) {
      const fallback = transitaire.modes[0]?.mode;
      if (fallback) setMode(fallback);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transitaire?.slug]);

  const totalWeight = useMemo(
    () => colis.reduce((sum, c) => sum + (parseFloat(c.weight) || 0), 0),
    [colis],
  );

  const totalPhotos = useMemo(
    () => colis.reduce((sum, c) => sum + c.photos.filter(Boolean).length, 0),
    [colis],
  );

  const canNext =
    step === 1
      ? colis.every((c) => c.name.trim().length > 0 && c.photos.some(Boolean))
      : true;

  const canSubmit = step === 3 && responsibilityAccepted && !submitting;

  const shippingMark = `KMO-${country.code}-${String(78421 + colis.length)}`;

  const handleSubmit = () => {
    if (!canSubmit || !transitaire) return;
    setSubmitting(true);
    const first = colis[0];
    const tMode = transitaire.modes.find((m) => m.mode === mode);
    addExpedition({
      id: `exp_new_${Date.now().toString(36)}`,
      publicCode: shippingMark,
      vendorId: "v_aicha",
      destinationCountry: country.code,
      status: "awaiting_quote",
      paymentStatus: "unpaid",
      productId: first?.productId,
      productName: first?.name || "Colis sans nom",
      otherProductsCount: Math.max(0, colis.length - 1),
      thumb: { emoji: "📦", bg: "linear-gradient(135deg,#E2E8F0,#94A3B8)" },
      transitaire: {
        name: transitaire.name,
        avatar: transitaire.avatar,
        avatarBg: transitaire.avatarBg,
        rating: transitaire.rating,
        paymentPolicy: transitaire.paymentPolicy,
        refusedCategories: tMode?.forbidden ?? [],
      },
      transportMode: mode,
      eta: tMode ? `~${tMode.delay}` : "—",
      createdAt: new Date().toISOString(),
      amountXof: null,
      action: null,
    });
    try {
      sessionStorage.setItem(
        "expedition.justCreated",
        JSON.stringify({ colis: colis.length, mode, at: new Date().toISOString() }),
      );
    } catch {
      /* sessionStorage indispo — pas bloquant */
    }
    router.push("/expeditions");
  };

  /* ─── Handlers colis ──────────────────────────────────────────── */
  const updateColis = (idx: number, next: Colis) => {
    setColis((prev) => prev.map((c, i) => (i === idx ? next : c)));
  };
  const removeColis = (idx: number) => {
    setColis((prev) => prev.filter((_, i) => i !== idx));
    setExpandedColis((e) => Math.max(0, Math.min(e, colis.length - 2)));
  };
  const addColis = () => {
    setColis((prev) => [
      ...prev,
      { id: Date.now(), name: "", weight: "", cartons: "", photos: [null, null, null, null, null] },
    ]);
    setExpandedColis(colis.length);
  };

  /* ─── GATE : aucun transitaire connecté ───────────────────────── */
  if (!transitaire) {
    const pending = tPartnership?.status === "pending";
    return (
      <div className="grid min-h-full place-items-center bg-paper px-6 py-16">
        <div className="w-full max-w-md rounded-2xl border border-line bg-white p-8 text-center shadow-kamoo-sm">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-kamoo-blue-50 text-kamoo-blue-700">
            <Ship className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-[19px] font-bold text-ink-900">
            {pending ? "Votre transitaire n'a pas encore accepté" : "Connectez d'abord un transitaire"}
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-500">
            {pending
              ? "Votre demande de partenariat est en attente de validation. Dès qu'elle est acceptée, vous pourrez créer vos expéditions avec ses tarifs et ses délais."
              : "Vos expéditions passent par VOTRE transitaire partenaire : ses modes, tarifs, délais et catégories acceptées s'appliquent automatiquement. Choisissez-en un dans la marketplace pour commencer."}
          </p>
          <Link
            href="/marketplace/transitaires"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-kamoo-blue-900 px-5 py-3 text-[14px] font-bold text-white transition hover:bg-kamoo-blue-800"
          >
            {pending ? "Voir ma demande" : "Choisir un transitaire"}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="mt-3">
            <Link href="/expeditions" className="text-[12px] font-semibold text-ink-400 hover:text-ink-700">
              Retour aux expéditions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-paper">
      <div className="mx-auto w-full max-w-6xl px-6 py-6">
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-kamoo-sm">
          {/* HEADER (dans la carte) */}
          <div className="border-b border-line px-6 pb-4 pt-5">
            <Link
              href="/expeditions"
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-500 transition hover:text-ink-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Mes expéditions
            </Link>
            <h1 className="mt-1.5 text-[20px] font-bold tracking-tight text-ink-900">
              Nouvelle expédition{" "}
              <span className="font-semibold text-ink-400">· Chine → {country.name}</span>
            </h1>
            <div className="mt-4">
              <StepIndicator step={step} />
            </div>
          </div>

          {/* DEUX PANNEAUX dans la carte */}
          <div className="grid grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
            {/* GAUCHE — étape active */}
            <div className="min-w-0 border-r border-line p-6">
            {step === 1 && (
              <Step1Colis
                colis={colis}
                expandedIndex={expandedColis}
                onToggleExpand={(i) => setExpandedColis((e) => (e === i ? -1 : i))}
                onChange={updateColis}
                onRemove={removeColis}
                onAdd={addColis}
              />
            )}
            {step === 2 && (
              <Step2Transport
                transitaire={transitaire}
                transitaires={activeTransitaires}
                onTransitaireChange={setSelectedTransitaireSlug}
                mode={mode}
                onModeChange={setMode}
                isModeAllowed={isModeAllowed}
              />
            )}
            {step === 3 && (
              <Step3Confirm
                colis={colis}
                mode={mode}
                transitaire={transitaire}
                country={country}
                shippingMark={shippingMark}
                totalPhotos={totalPhotos}
                responsibilityAccepted={responsibilityAccepted}
                onResponsibilityChange={setResponsibilityAccepted}
              />
            )}
            </div>

            {/* DROITE — récapitulatif vivant (panneau teinté) */}
            <div className="bg-paper-2/40 p-6">
              <div className="sticky top-6">
                <SummaryRail
                  step={step}
                  colisCount={colis.length}
                  totalWeight={totalWeight}
                  transitaire={transitaire}
                  mode={mode}
                  country={country}
                  canNext={canNext}
                  canSubmit={canSubmit}
                  submitting={submitting}
                  onPrev={() => setStep((s) => Math.max(1, s - 1))}
                  onNext={() => canNext && setStep((s) => Math.min(3, s + 1))}
                  onSubmit={handleSubmit}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── RÉCAPITULATIF VIVANT (panneau droit, partagé) ───────────────── */

function SummaryRail({
  step,
  colisCount,
  totalWeight,
  transitaire,
  mode,
  country,
  canNext,
  canSubmit,
  submitting,
  onPrev,
  onNext,
  onSubmit,
}: {
  step: number;
  colisCount: number;
  totalWeight: number;
  transitaire: Transitaire;
  mode: TransportMode;
  country: (typeof COUNTRIES)[number];
  canNext: boolean;
  canSubmit: boolean;
  submitting: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
}) {
  const tMode = transitaire.modes.find((m) => m.mode === mode);
  const ModeIcon = TRANSPORT_ICON[mode];
  const proceedDisabled = step < 3 ? !canNext : !canSubmit;

  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-400">
        Récapitulatif
      </div>

      <div>
        {/* Trajet */}
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-line bg-white p-3">
          <div className="min-w-0 flex-1 text-center">
            <div className="text-[10.5px] text-ink-500">Origine</div>
            <div className="truncate text-[13px] font-bold text-ink-900">Guangzhou</div>
          </div>
          <div className="flex flex-col items-center text-kamoo-orange-500">
            {step >= 2 ? <ModeIcon className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
            {step >= 2 && tMode && (
              <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wide">{tMode.delay}</span>
            )}
          </div>
          <div className="min-w-0 flex-1 text-center">
            <div className="text-[10.5px] text-ink-500">Destination</div>
            <div className="truncate text-[13px] font-bold text-ink-900">
              {country.warehouseCity}
            </div>
          </div>
        </div>

        {/* Lignes récap */}
        <div className="mt-4 flex flex-col divide-y divide-line">
          <SummaryRow label="Colis" value={String(colisCount)} />
          <SummaryRow
            label="Poids estimé"
            value={totalWeight > 0 ? `${totalWeight.toFixed(1)} kg` : "—"}
          />
          <SummaryRow
            label="Transitaire"
            value={step >= 2 ? transitaire.name : null}
            pending={step < 2 ? "à l'étape 2" : undefined}
          />
          <SummaryRow
            label="Mode"
            value={step >= 2 && tMode ? TRANSPORT_MODE_LABELS[mode] : null}
            pending={step < 2 ? "à l'étape 2" : undefined}
          />
          {step >= 2 && tMode && (
            <SummaryRow
              label="Tarif indicatif"
              value={`${tMode.fromXof.toLocaleString("fr-FR")}–${tMode.toXof.toLocaleString("fr-FR")} F/${tMode.unit === "kg" ? "kg" : "CBM"}`}
            />
          )}
        </div>

        <div className="mt-4 flex items-start gap-2 border-t border-line pt-3 text-[11.5px] leading-relaxed text-ink-500">
          <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>Le devis exact arrive après réception &amp; pesée de vos colis en Chine.</span>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={step < 3 ? onNext : onSubmit}
          disabled={proceedDisabled}
          className={cn(
            "mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-kamoo-blue-900 px-5 py-3 text-[14px] font-bold text-white transition hover:bg-kamoo-blue-800",
            proceedDisabled && "cursor-not-allowed opacity-40",
          )}
        >
          {step < 3 ? "Étape suivante" : submitting ? "Création…" : "Valider l'expédition"}
          <ArrowRight className="h-4 w-4" />
        </button>

        {step > 1 && (
          <button
            type="button"
            onClick={onPrev}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold text-ink-500 transition hover:bg-paper-2 hover:text-ink-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Précédent
          </button>
        )}

        {step < 3 && !canNext && (
          <p className="mt-2 text-center text-[11px] text-ink-400">
            Complétez les champs requis pour continuer.
          </p>
        )}
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  pending,
}: {
  label: string;
  value: string | null;
  pending?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-[13px]">
      <span className="text-ink-500">{label}</span>
      {value ? (
        <span className="truncate font-semibold text-ink-900">{value}</span>
      ) : (
        <span className="text-[12px] italic text-ink-300">{pending ?? "—"}</span>
      )}
    </div>
  );
}

/* ─── STEP INDICATOR ──────────────────────────────────────────────── */

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-3">
      {STEP_LABELS.map((label, i) => {
        const idx = i + 1;
        const done = idx < step;
        const active = idx === step;
        return (
          <div key={label} className="flex flex-1 items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "grid h-7 w-7 place-items-center rounded-full text-[13px] font-bold transition",
                  done
                    ? "bg-emerald-600 text-white"
                    : active
                      ? "bg-kamoo-blue-900 text-white"
                      : "bg-paper-2 text-ink-400 ring-1 ring-inset ring-line",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : idx}
              </div>
              <span
                className={cn(
                  "text-[13px] font-semibold",
                  active ? "text-ink-900" : "text-ink-500",
                )}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 rounded transition",
                  done ? "bg-emerald-600" : "bg-line",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── STEP 1 — COLIS ──────────────────────────────────────────────── */

function Step1Colis({
  colis,
  expandedIndex,
  onToggleExpand,
  onChange,
  onRemove,
  onAdd,
}: {
  colis: Colis[];
  expandedIndex: number;
  onToggleExpand: (i: number) => void;
  onChange: (i: number, c: Colis) => void;
  onRemove: (i: number) => void;
  onAdd: () => void;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-bold text-ink-900">Vos colis</h2>
          <p className="mt-0.5 text-[12.5px] text-ink-500">
            Chaque produit avec une photo et son nom. Jusqu&apos;à 20 colis par expédition.
          </p>
        </div>
        <button
          onClick={onAdd}
          disabled={colis.length >= 20}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2 text-[13px] font-semibold text-ink-900 transition hover:bg-paper-2 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Ajouter
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        {colis.map((c, i) => (
          <ColisCard
            key={c.id}
            colis={c}
            index={i}
            expanded={expandedIndex === i}
            onToggle={() => onToggleExpand(i)}
            onChange={(next) => onChange(i, next)}
            onRemove={() => onRemove(i)}
            removable={colis.length > 1}
          />
        ))}
      </div>
    </div>
  );
}

function ColisCard({
  colis,
  index,
  expanded,
  onToggle,
  onChange,
  onRemove,
  removable,
}: {
  colis: Colis;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onChange: (c: Colis) => void;
  onRemove: () => void;
  removable: boolean;
}) {
  const photoCount = colis.photos.filter(Boolean).length;
  const cover = colis.photos.find(Boolean);
  const isComplete = colis.name && photoCount > 0;

  const addPhoto = (slot: number, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      const photos = [...colis.photos];
      photos[slot] = { url: reader.result, fileName: file.name };
      onChange({ ...colis, photos });
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (slot: number) => {
    const photos = [...colis.photos];
    photos[slot] = null;
    onChange({ ...colis, photos });
  };

  return (
    <div className={cn("rounded-2xl border bg-white transition", expanded ? "border-ink-300" : "border-line")}>
      {/* Ligne — façon ligne de commande */}
      <div onClick={onToggle} className="flex cursor-pointer items-center gap-3 px-4 py-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-paper-2 text-ink-400">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover.url} alt={cover.fileName ?? colis.name} className="h-full w-full object-cover" />
          ) : (
            <Package className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-bold text-ink-900">
            {colis.name || `Colis #${index + 1}`}
          </div>
          <div className="mt-0.5 truncate text-[12px]">
            {!isComplete ? (
              <span className="text-kamoo-orange-600">
                {photoCount === 0 ? "Ajoutez au moins 1 photo" : "Nommez le produit"}
              </span>
            ) : (
              <span className="text-ink-500">
                {photoCount} photo{photoCount > 1 ? "s" : ""}
                {colis.weight && ` · ~${colis.weight} kg`}
                {colis.cartons && ` · ${colis.cartons} carton${parseInt(colis.cartons) > 1 ? "s" : ""}`}
              </span>
            )}
          </div>
        </div>
        {isComplete && !expanded && (
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600">
            <Check className="h-3 w-3" />
          </span>
        )}
        {removable && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-ink-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-ink-400 transition-transform", expanded && "rotate-180")} />
      </div>

      {/* Éditeur */}
      {expanded && (
        <div className="border-t border-line px-4 pb-4 pt-4">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-6">
            {/* Photos */}
            <Field label="Photos" hint="produit + carton · requis">
              <div className="flex flex-wrap gap-2">
                {colis.photos.map((photo, i) => (
                  <PhotoSlot
                    key={i}
                    slotKey={`colis-${colis.id}-photo-${i}`}
                    photo={photo}
                    onSelect={(file) => addPhoto(i, file)}
                    onRemove={() => removePhoto(i)}
                    label={i === 0 ? "Produit" : i === 1 ? "Carton" : "Photo"}
                  />
                ))}
              </div>
            </Field>

            {/* Détails */}
            <div className="flex flex-col gap-3">
              <Field label="Produit" required>
                <ProductSelector
                  value={colis.name}
                  productId={colis.productId}
                  onSelectExisting={(p) => onChange({ ...colis, productId: p.id, name: p.name })}
                  onChangeNew={(name) => onChange({ ...colis, productId: undefined, name })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Poids (kg)" hint="optionnel">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={colis.weight}
                    onChange={(e) => onChange({ ...colis, weight: e.target.value })}
                    className="h-10 w-full rounded-xl border border-line bg-white px-3.5 text-sm outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600 focus:ring-2 focus:ring-kamoo-blue-600/12"
                  />
                </Field>
                <Field label="Cartons" hint="optionnel">
                  <input
                    type="number"
                    placeholder="1"
                    value={colis.cartons}
                    onChange={(e) => onChange({ ...colis, cartons: e.target.value })}
                    className="h-10 w-full rounded-xl border border-line bg-white px-3.5 text-sm outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600 focus:ring-2 focus:ring-kamoo-blue-600/12"
                  />
                </Field>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  const suffix = hint ?? (required ? "requis" : undefined);
  return (
    <div>
      <div className="mb-1.5 flex items-baseline gap-1.5">
        <span className="text-[11.5px] font-semibold text-ink-800">{label}</span>
        {suffix && <span className="text-[10.5px] text-ink-400">· {suffix}</span>}
      </div>
      {children}
    </div>
  );
}

function PhotoSlot({
  slotKey,
  photo,
  onSelect,
  onRemove,
  label,
}: {
  slotKey: string;
  photo: Photo | null;
  onSelect: (file: File) => void;
  onRemove: () => void;
  label: string;
}) {
  const inputId = `photo-input-${slotKey}`;

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (file) onSelect(file);
    e.target.value = "";
  };

  if (photo) {
    return (
      <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-paper-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.url} alt={photo.fileName ?? "Photo"} className="h-full w-full object-cover" />
        <button
          onClick={onRemove}
          className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
          type="button"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <>
      <label
        htmlFor={inputId}
        className="grid h-16 w-16 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-line bg-paper-2 text-ink-500 transition hover:border-kamoo-blue-900 hover:text-kamoo-blue-900"
      >
        <div className="flex flex-col items-center gap-0.5">
          <Plus className="h-3.5 w-3.5" />
          <span className="text-[9px] font-semibold">{label}</span>
        </div>
      </label>
      <input id={inputId} type="file" accept="image/*" className="hidden" onChange={handleChange} />
    </>
  );
}

/* ─── STEP 2 — TRANSPORT ──────────────────────────────────────────── */

function Step2Transport({
  transitaire,
  transitaires,
  onTransitaireChange,
  mode,
  onModeChange,
  isModeAllowed,
}: {
  transitaire: Transitaire;
  transitaires: Transitaire[];
  onTransitaireChange: (slug: string) => void;
  mode: TransportMode;
  onModeChange: (m: TransportMode) => void;
  isModeAllowed: (m: TransportMode) => boolean;
}) {
  const recommendedRaw: TransportMode = "air_standard";
  const recommended = isModeAllowed(recommendedRaw) ? recommendedRaw : transitaire.modes[0]?.mode;

  return (
    <div>
      <h2 className="text-[17px] font-bold text-ink-900">Transitaire &amp; mode de transport</h2>
      <p className="mt-0.5 text-[12.5px] text-ink-500">
        Choisissez le transitaire — ses modes, tarifs et délais s&apos;appliquent automatiquement.
      </p>

      {/* Sélecteur de transitaire (multi-connexions) */}
      {transitaires.length > 1 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {transitaires.map((t) => {
            const isSel = t.slug === transitaire.slug;
            return (
              <button
                key={t.slug}
                onClick={() => onTransitaireChange(t.slug)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition",
                  isSel ? "border-kamoo-blue-700 bg-kamoo-blue-50" : "border-line bg-white hover:border-ink-300",
                )}
              >
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white"
                  style={{ background: t.avatarBg }}
                >
                  {t.avatar}
                </span>
                <span className="leading-tight">
                  <span className="block text-[12.5px] font-bold text-ink-900">{t.name}</span>
                  <span className="block text-[10.5px] text-ink-500">
                    ★ {t.rating} · {t.modes.length} mode{t.modes.length > 1 ? "s" : ""}
                  </span>
                </span>
                {isSel && <Check className="ml-1 h-4 w-4 shrink-0 text-kamoo-blue-700" />}
              </button>
            );
          })}
          <Link
            href="/marketplace/transitaires"
            className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-line px-3 py-2.5 text-[12px] font-semibold text-ink-500 transition hover:border-kamoo-blue-300 hover:text-kamoo-blue-700"
          >
            <Plus className="h-3.5 w-3.5" /> Autre
          </Link>
        </div>
      )}

      {/* En-tête transitaire sélectionné */}
      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-line bg-white p-4">
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[13px] font-bold text-white"
          style={{ background: transitaire.avatarBg }}
        >
          {transitaire.avatar}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-bold text-ink-900">{transitaire.name}</div>
          <div className="text-[12px] text-ink-500">
            {transitaire.city}, Chine · ★ {transitaire.rating}
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
          <Check className="h-3 w-3" /> Connecté
        </span>
      </div>

      {/* Modes proposés */}
      <div className="mt-5 text-[10px] font-bold uppercase tracking-wider text-ink-700">
        Modes proposés par {transitaire.name}
      </div>
      <div className="mt-2.5 flex flex-col gap-2.5">
        {transitaire.modes.map((tm) => (
          <TransitaireModeCard
            key={tm.mode}
            tMode={tm}
            selected={mode === tm.mode}
            recommended={tm.mode === recommended}
            onClick={() => onModeChange(tm.mode)}
          />
        ))}
      </div>
      <p className="mt-3 text-[11.5px] leading-relaxed text-ink-400">
        Les catégories acceptées / refusées par mode seront affichées à la confirmation — vous
        pourrez les relire avant de valider.
      </p>
    </div>
  );
}

function TransitaireModeCard({
  tMode,
  selected,
  recommended,
  onClick,
}: {
  tMode: Transitaire["modes"][number];
  selected: boolean;
  recommended: boolean;
  onClick: () => void;
}) {
  const Icon = TRANSPORT_ICON[tMode.mode];

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition",
        selected ? "border-kamoo-blue-700 bg-kamoo-blue-50" : "border-line bg-white hover:border-ink-300",
      )}
    >
      {recommended && !selected && (
        <div className="absolute -top-2.5 right-3 rounded-md bg-kamoo-blue-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
          Recommandé
        </div>
      )}
      <div
        className={cn(
          "grid h-12 w-12 shrink-0 place-items-center rounded-xl",
          TRANSPORT_BG[tMode.mode],
          TRANSPORT_FG[tMode.mode],
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-[15px] font-bold text-ink-900">{TRANSPORT_MODE_LABELS[tMode.mode]}</span>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-ink-500">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {tMode.delay}
          </span>
          {tMode.description && <span>{tMode.description}</span>}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-[14px] font-extrabold leading-tight text-ink-900 tabular-nums">
          {tMode.fromXof.toLocaleString("fr-FR")}–{tMode.toXof.toLocaleString("fr-FR")}
        </div>
        <div className="text-[10px] font-semibold text-ink-500">
          F CFA / {tMode.unit === "kg" ? "kg" : "CBM"}
        </div>
      </div>
      {selected && (
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-kamoo-blue-700 text-white">
          <Check className="h-3 w-3" />
        </span>
      )}
    </button>
  );
}

/* ─── STEP 3 — CONFIRMATION ───────────────────────────────────────── */

function Step3Confirm({
  colis,
  mode,
  transitaire,
  country,
  shippingMark,
  totalPhotos,
  responsibilityAccepted,
  onResponsibilityChange,
}: {
  colis: Colis[];
  mode: TransportMode;
  transitaire: Transitaire;
  country: (typeof COUNTRIES)[number];
  shippingMark: string;
  totalPhotos: number;
  responsibilityAccepted: boolean;
  onResponsibilityChange: (v: boolean) => void;
}) {
  const tMode = transitaire.modes.find((m) => m.mode === mode)!;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[17px] font-bold text-ink-900">Vérifiez &amp; validez</h2>
        <p className="mt-0.5 text-[12.5px] text-ink-500">
          Relisez votre expédition, copiez le shipping mark, puis validez.
        </p>
      </div>

      {/* Shipping mark — le livrable clé (seul élément distinct) */}
      <ShippingMarkCard
        shippingMark={shippingMark}
        country={country}
        totalPhotos={totalPhotos}
        colisCount={colis.length}
      />

      {/* Ce que vous expédiez */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
          Ce que vous expédiez
        </div>
        <div className="mt-2 overflow-hidden rounded-xl border border-line">
          {colis.map((c, i) => {
            const cover = c.photos.find(Boolean);
            const photoCount = c.photos.filter(Boolean).length;
            return (
              <div
                key={c.id}
                className={cn("flex items-center gap-3 px-3 py-2.5", i > 0 && "border-t border-line")}
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-paper-2 text-ink-400">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover.url} alt={c.name} className="h-full w-full object-cover" />
                  ) : (
                    <Package className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold text-ink-900">
                    {c.name || `Colis #${i + 1}`}
                  </div>
                  <div className="truncate text-[11.5px] text-ink-500">
                    {photoCount} photo{photoCount > 1 ? "s" : ""}
                    {c.weight ? ` · ~${c.weight} kg` : " · poids à mesurer"}
                    {c.cartons && ` · ${c.cartons} carton${parseInt(c.cartons) > 1 ? "s" : ""}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Conditions du transitaire */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
          Conditions · {TRANSPORT_MODE_LABELS[mode]} chez {transitaire.name}
        </div>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-line p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
              <Check className="h-3.5 w-3.5" /> Autorisés
            </div>
            <ul className="mt-1.5 flex flex-col gap-1 text-[12.5px] text-ink-700">
              {(tMode.accepted ?? ["Marchandises générales"]).map((a) => (
                <li key={a} className="flex gap-1.5">
                  <span className="text-emerald-500">·</span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-line p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-600">
              <X className="h-3.5 w-3.5" /> Refusés
            </div>
            <ul className="mt-1.5 flex flex-col gap-1 text-[12.5px] text-ink-700">
              {(tMode.forbidden ?? []).length > 0 ? (
                (tMode.forbidden ?? []).map((fz) => (
                  <li key={fz} className="flex gap-1.5">
                    <span className="text-red-400">·</span>
                    {fz}
                  </li>
                ))
              ) : (
                <li className="italic text-ink-400">Aucune restriction déclarée</li>
              )}
            </ul>
          </div>
        </div>
        <p className="mt-2 text-[11.5px] text-ink-400">
          Un doute ? Discutez-en avec {transitaire.name} via le chat avant de valider.
        </p>
      </div>

      {/* Responsabilité — avertissement + confirmation fusionnés */}
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
        <input
          type="checkbox"
          checked={responsibilityAccepted}
          onChange={(e) => onResponsibilityChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-kamoo-orange-500"
        />
        <div className="text-[12.5px] leading-relaxed">
          <span className="font-bold text-ink-900">
            Je confirme que mes colis respectent les conditions de {transitaire.name}.
          </span>
          <p className="mt-1 text-amber-800">
            En cas de catégorie refusée constatée à la réception, j&apos;accepte de payer le
            réacheminement. L&apos;adresse de l&apos;entrepôt et le shipping mark sont débloqués
            après validation.
          </p>
        </div>
      </label>
    </div>
  );
}

function ShippingMarkCard({
  shippingMark,
  country,
  totalPhotos,
  colisCount,
}: {
  shippingMark: string;
  country: (typeof COUNTRIES)[number];
  totalPhotos: number;
  colisCount: number;
}) {
  const [copied, setCopied] = useState(false);

  const fullText = `${shippingMark}\n\nKAMOO LOGISTICS — ${country.flag} ${country.name.toUpperCase()}\nRéf: ${shippingMark}\nClient: Aïcha Diop\n${colisCount} colis · ${totalPhotos} photos déclarées`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl bg-kamoo-blue-900 p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] opacity-70">
            Shipping mark
          </div>
          <div className="mt-1 text-[12px] opacity-85">À copier-coller chez votre fournisseur</div>
        </div>
        <MapPin className="h-5 w-5" />
      </div>

      <div className="mt-4 rounded-xl border border-dashed border-white/30 bg-white/8 p-4">
        <div className="font-mono-kamoo text-center text-2xl font-extrabold tracking-wider text-kamoo-orange-400">
          {shippingMark}
        </div>
        <div className="my-3 h-px bg-white/15" />
        <div className="font-mono-kamoo text-[11px] leading-relaxed opacity-90">
          <div>
            KAMOO LOGISTICS — {country.flag} {country.name.toUpperCase()}
          </div>
          <div>Réf: {shippingMark}</div>
          <div>Client: AÏCHA DIOP</div>
          <div>
            {colisCount} colis · {totalPhotos} photos déclarées
          </div>
        </div>
      </div>

      <button
        onClick={handleCopy}
        className={cn(
          "mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition",
          copied ? "bg-emerald-600" : "bg-kamoo-blue-900 hover:bg-kamoo-blue-800",
        )}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" /> Copié !
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" /> Copier le shipping mark
          </>
        )}
      </button>

      <p className="mt-3 text-center text-[11px] leading-relaxed opacity-70">
        Communiquez ce code à votre fournisseur. Il l&apos;inscrira sur chaque colis avant l&apos;envoi.
      </p>
    </div>
  );
}
