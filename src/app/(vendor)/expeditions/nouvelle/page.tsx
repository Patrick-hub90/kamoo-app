"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Box,
  Camera,
  Check,
  ChevronDown,
  Clock,
  Copy,
  MapPin,
  Plane,
  Plus,
  Ship,
  Sparkles,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { ProductSelector } from "@/components/kamoo/product-selector";
import { MOCK_TRANSITAIRES } from "@/lib/data/mock-transitaires";
import { useExpeditionsState } from "@/lib/hooks/use-expeditions-state";
import { usePartners } from "@/lib/hooks/use-partners";
import { COUNTRIES } from "@/lib/data/countries";
import { TRANSPORT_MODES_DATA } from "@/lib/data/transport-modes";
import { PRODUCT_CATEGORIES, getCategoryById } from "@/lib/data/categories";
import { TRANSPORT_MODE_LABELS, type TransportMode } from "@/lib/types/expedition";
import type { Transitaire } from "@/lib/types/transitaire";
import { cn } from "@/lib/utils";

/* ─── État local du wizard ─────────────────────────────────────────── */

type Photo = {
  /** Data URL ou URL distante de l'image uploadée */
  url: string;
  /** Nom du fichier source (pour information) */
  fileName?: string;
};

type Colis = {
  id: number;
  /** Nom affiché. Si productId est set, vient du catalogue. Sinon saisi libre. */
  name: string;
  /** ID du produit dans la Boutique si lié au catalogue, undefined sinon */
  productId?: string;
  weight: string; // kg, optionnel
  cartons: string; // nombre, optionnel
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

  /* Une expédition Kamoo passe par VOTRE transitaire : sans partenariat
   * actif, le wizard est bloqué (workflow de connexion ci-dessous). Les
   * modes, tarifs, délais et catégories sont SYNCHRONISÉS avec lui. */
  const { partners } = usePartners();
  const tPartnership = partners.transitaire;
  const transitaire =
    tPartnership?.status === "active"
      ? MOCK_TRANSITAIRES.find((t) => t.slug === tPartnership.slug) ?? null
      : null;

  const { addExpedition } = useExpeditionsState();

  // Pays actif (à remplacer par un context global plus tard)
  const country = COUNTRIES[0]; // SN

  // Modes proposés par LE transitaire connecté
  const isModeAllowed = (m: TransportMode) =>
    transitaire ? transitaire.modes.some((tm) => tm.mode === m) : true;

  // Aligne le mode par défaut sur l'offre du transitaire
  useEffect(() => {
    if (transitaire && !isModeAllowed(mode)) {
      const fallback = transitaire.modes[0]?.mode;
      if (fallback) setMode(fallback);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transitaire?.slug]);

  const totalWeight = useMemo(
    () =>
      colis.reduce(
        (sum, c) => sum + (parseFloat(c.weight) || 0),
        0,
      ),
    [colis],
  );

  const totalPhotos = useMemo(
    () => colis.reduce((sum, c) => sum + c.photos.filter(Boolean).length, 0),
    [colis],
  );

  // Étape 1 valide si chaque colis a au moins 1 photo + un nom
  const canNext =
    step === 1
      ? colis.every(
          (c) => c.name.trim().length > 0 && c.photos.some(Boolean),
        )
      : true;

  // Étape 3 : la soumission requiert l'acceptation de responsabilité
  const canSubmit = step === 3 && responsibilityAccepted && !submitting;

  /**
   * Soumission du wizard. V1 mock : on flag la création en sessionStorage
   * pour qu'une bannière de succès s'affiche sur /expeditions, puis on
   * navigue. V2 : remplacer par un appel server action qui crée la ligne
   * en base + génère le shipping mark côté serveur.
   */
  const handleSubmit = () => {
    if (!canSubmit || !transitaire) return;
    setSubmitting(true);
    const first = colis[0];
    const tMode = transitaire.modes.find((m) => m.mode === mode);
    /* L'expédition est réellement créée (sessionStorage) : elle apparaît
     * immédiatement dans la liste, en « Attente devis ». */
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
      // sessionStorage indispo (mode privé) — pas bloquant, on navigue quand même
    }
    router.push("/expeditions");
  };

  // Mock shipping mark — sera généré côté serveur en vrai
  const shippingMark = `KMO-${country.code}-${String(78421 + colis.length)}`;

  /* ─── Handlers ──────────────────────────────────────────────── */

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
      {
        id: Date.now(),
        name: "",
        weight: "",
        cartons: "",
        photos: [null, null, null, null, null],
      },
    ]);
    setExpandedColis(colis.length);
  };

  /* ─── Render ─────────────────────────────────────────────────── */

  /* GATE : pas de transitaire connecté → on guide vers la marketplace.
   * Une expédition Kamoo est TOUJOURS portée par votre transitaire. */
  if (!transitaire) {
    const pending = tPartnership?.status === "pending";
    return (
      <div className="grid min-h-full place-items-center bg-paper px-6 py-16">
        <div className="w-full max-w-md rounded-2xl border border-line bg-white p-8 text-center shadow-kamoo-sm">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-kamoo-blue-50 text-kamoo-blue-700">
            <Ship className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-[19px] font-extrabold text-ink-900">
            {pending ? "Votre transitaire n'a pas encore accepté" : "Connectez d'abord un transitaire"}
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-500">
            {pending
              ? "Votre demande de partenariat est en attente de validation. Dès qu'elle est acceptée, vous pourrez créer vos expéditions avec ses tarifs et ses délais."
              : "Vos expéditions passent par VOTRE transitaire partenaire : ses modes, tarifs, délais et catégories acceptées s'appliquent automatiquement. Choisissez-en un dans la marketplace pour commencer."}
          </p>
          <Link
            href="/marketplace/transitaires"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-kamoo-orange-500 px-5 py-3 text-[14px] font-bold text-white transition hover:bg-kamoo-orange-600"
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
    <div className="flex h-full flex-col">
      {/* HERO HEADER */}
      <div className="border-b border-line bg-gradient-to-br from-white to-paper-2 px-10 py-7">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <Link
              href="/expeditions"
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-500 hover:text-ink-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Mes expéditions
            </Link>

            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-kamoo-orange-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-kamoo-orange-700">
              <Sparkles className="h-3 w-3" />
              Brouillon · auto-sauvegardé
            </div>

            <h1 className="font-display mt-3 text-3xl font-extrabold leading-tight text-ink-900">
              Nouvelle expédition{" "}
              <span className="whitespace-nowrap text-kamoo-orange-500">
                Chine → {country.name}
              </span>
            </h1>
            <p className="mt-1 text-[13px] text-ink-500">
              Étape {step} sur 3 · {colis.length} colis ·{" "}
              {totalWeight.toFixed(1)} kg estimés
            </p>
          </div>
        </div>

        {/* STEP INDICATOR */}
        <div className="mt-6">
          <StepIndicator step={step} />
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto px-10 py-7">
        {step === 1 && (
          <Step1Colis
            colis={colis}
            expandedIndex={expandedColis}
            onToggleExpand={(i) =>
              setExpandedColis((e) => (e === i ? -1 : i))
            }
            onChange={updateColis}
            onRemove={removeColis}
            onAdd={addColis}
          />
        )}
        {step === 2 && (
          <Step2Transport
            transitaire={transitaire}
            mode={mode}
            onModeChange={setMode}
            isModeAllowed={isModeAllowed}
            countryName={country.name}
          />
        )}
        {step === 3 && (
          <Step3Confirm
            colis={colis}
            mode={mode}
            transitaire={transitaire}
            country={country}
            shippingMark={shippingMark}
            totalWeight={totalWeight}
            totalPhotos={totalPhotos}
            responsibilityAccepted={responsibilityAccepted}
            onResponsibilityChange={setResponsibilityAccepted}
          />
        )}
      </div>

      {/* FOOTER NAV */}
      <div className="flex items-center gap-3 border-t border-line bg-white px-10 py-4">
        <button
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition",
            step === 1
              ? "cursor-not-allowed text-ink-400"
              : "text-ink-900 hover:bg-paper-2",
          )}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Précédent
        </button>

        <div className="flex-1 text-center text-[12px] text-ink-500">
          {step < 3 && canNext && "✓ Tout est rempli, vous pouvez continuer"}
          {step < 3 && !canNext &&
            "Complétez les champs requis pour continuer"}
          {step === 3 && canSubmit &&
            "Une fois validée, votre colis sera réceptionné en Chine sous 5–10 jours"}
          {step === 3 && !canSubmit &&
            "Cochez la case de responsabilité pour pouvoir valider"}
        </div>

        {step < 3 ? (
          <button
            onClick={() => canNext && setStep(step + 1)}
            disabled={!canNext}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl bg-kamoo-orange-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-kamoo-orange-600",
              !canNext && "cursor-not-allowed opacity-40",
            )}
          >
            Étape suivante
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl bg-kamoo-orange-500 px-6 py-3 text-sm font-extrabold text-white hover:bg-kamoo-orange-600",
              !canSubmit && "cursor-not-allowed opacity-40",
            )}
          >
            {submitting ? "Création…" : "Valider l'expédition"}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
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
                  "grid h-8 w-8 place-items-center rounded-full text-sm font-bold transition",
                  done
                    ? "bg-emerald-600 text-white"
                    : active
                      ? "bg-kamoo-orange-500 text-white"
                      : "bg-ink-200 text-ink-500",
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
                  done ? "bg-emerald-600" : "bg-ink-200",
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
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-ink-900">
            Vos colis
          </h2>
          <p className="mt-1 text-[13px] text-ink-500">
            Ajoutez chaque produit avec une photo et son nom. Vous pouvez
            grouper jusqu&apos;à 20 colis dans une expédition.
          </p>
        </div>
        <button
          onClick={onAdd}
          disabled={colis.length >= 20}
          className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-[13px] font-semibold text-ink-900 transition hover:bg-paper-2 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Ajouter un colis
        </button>
      </div>

      <div className="flex flex-col gap-3">
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
    <div className="rounded-2xl border border-line bg-white">
      {/* Header de la card */}
      <div
        onClick={onToggle}
        className="flex cursor-pointer items-center gap-3.5 rounded-t-2xl px-5 py-4"
      >
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-kamoo-blue-50 text-sm font-extrabold text-kamoo-blue-700">
          #{index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-bold text-ink-900">
            {colis.name || `Colis #${index + 1}`}
          </div>
          <div className="mt-0.5 text-[12px] text-ink-500">
            {!isComplete ? (
              <span className="text-kamoo-orange-600">
                {photoCount === 0
                  ? "Ajoutez au moins 1 photo"
                  : "Nommez le produit"}
              </span>
            ) : (
              <>
                {photoCount} photo{photoCount > 1 ? "s" : ""}
                {colis.weight && ` · ~${colis.weight} kg`}
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {removable && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="grid h-8 w-8 place-items-center rounded-md text-ink-500 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-ink-500 transition-transform",
              expanded && "rotate-180",
            )}
          />
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="border-t border-line px-5 pb-5 pt-4">
          <div className="grid grid-cols-[1.1fr_1fr] gap-6">
            {/* Photos */}
            <div>
              <div className="mb-2 flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-700">
                  Photos · jusqu&apos;à 5
                </span>
                <span className="rounded bg-kamoo-orange-50 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-kamoo-orange-700">
                  REQUIS
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
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
              <div className="mt-2.5 flex items-start gap-2 rounded-lg bg-kamoo-blue-50 p-2.5">
                <Camera className="mt-0.5 h-3.5 w-3.5 shrink-0 text-kamoo-blue-700" />
                <p className="text-[11.5px] leading-relaxed text-kamoo-blue-700">
                  Ajoutez la <b>photo commerciale</b> du produit + la{" "}
                  <b>photo du carton</b> de la commande pour faciliter la
                  réception.
                </p>
              </div>
            </div>

            {/* Champs */}
            <div className="flex flex-col gap-3.5">
              <Field label="Produit" required>
                <ProductSelector
                  value={colis.name}
                  productId={colis.productId}
                  onSelectExisting={(p) =>
                    onChange({
                      ...colis,
                      productId: p.id,
                      name: p.name,
                    })
                  }
                  onChangeNew={(name) =>
                    onChange({
                      ...colis,
                      productId: undefined,
                      name,
                    })
                  }
                />
              </Field>

              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Poids estimé (kg)">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={colis.weight}
                    onChange={(e) =>
                      onChange({ ...colis, weight: e.target.value })
                    }
                    className="w-full rounded-xl border border-input bg-white px-3.5 py-2.5 text-sm outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600 focus:ring-2 focus:ring-kamoo-blue-600/12"
                  />
                </Field>
                <Field label="Nombre de cartons">
                  <input
                    type="number"
                    placeholder="1"
                    value={colis.cartons}
                    onChange={(e) =>
                      onChange({ ...colis, cartons: e.target.value })
                    }
                    className="w-full rounded-xl border border-input bg-white px-3.5 py-2.5 text-sm outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600 focus:ring-2 focus:ring-kamoo-blue-600/12"
                  />
                </Field>
              </div>
              <p className="text-[11px] text-ink-500">
                Le poids exact sera mesuré à l&apos;entrepôt Guangzhou.
              </p>
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
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-700">
        {label}
        {required ? (
          <span className="rounded bg-kamoo-orange-50 px-1.5 py-0.5 text-[9px] font-bold text-kamoo-orange-700">
            REQUIS
          </span>
        ) : (
          <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[9px] font-semibold text-ink-500">
            OPTIONNEL
          </span>
        )}
      </label>
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
    // Reset le input pour permettre re-sélection du même fichier
    e.target.value = "";
  };

  if (photo) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-xl bg-ink-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt={photo.fileName ?? "Photo"}
          className="h-full w-full object-cover"
        />
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
        className="grid aspect-square cursor-pointer place-items-center rounded-xl border-2 border-dashed border-ink-300 bg-paper-2 text-ink-500 transition hover:border-kamoo-orange-500 hover:text-kamoo-orange-500"
      >
        <div className="flex flex-col items-center gap-1">
          <Plus className="h-4 w-4" />
          <span className="text-[10px] font-semibold">{label}</span>
        </div>
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </>
  );
}

/* ─── STEP 2 — TRANSPORT ──────────────────────────────────────────── */

function Step2Transport({
  transitaire,
  mode,
  onModeChange,
  isModeAllowed,
  countryName,
}: {
  transitaire: Transitaire;
  mode: TransportMode;
  onModeChange: (m: TransportMode) => void;
  isModeAllowed: (m: TransportMode) => boolean;
  countryName: string;
}) {
  const recommendedRaw: TransportMode = "air_standard";
  const recommended = isModeAllowed(recommendedRaw)
    ? recommendedRaw
    : transitaire.modes[0]?.mode;
  const selectedTMode = transitaire.modes.find((m) => m.mode === mode);

  return (
    <div>
      <h2 className="font-display text-2xl font-extrabold text-ink-900">
        Mode de transport
      </h2>
      <p className="mt-1 text-[13px] text-ink-500">
        Modes, tarifs et délais de <b className="text-ink-700">{transitaire.name}</b>, votre
        transitaire — synchronisés avec son profil.
      </p>

      <div className="mt-6 grid grid-cols-[1fr_1.1fr] gap-6">
        {/* GAUCHE — Trajet visuel + récap */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-line bg-white p-6">
            <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
              Trajet
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="text-[11px] text-ink-500">Origine</div>
                <div className="text-lg font-extrabold text-ink-900">
                  🇨🇳 {transitaire.city}
                </div>
                <div className="text-[12px] text-ink-500">
                  Entrepôt {transitaire.name}
                </div>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-kamoo-orange-500">
                <ArrowRight className="h-6 w-6" />
                <div className="text-[10px] font-bold uppercase tracking-wider">
                  {selectedTMode?.delay}
                </div>
              </div>
              <div className="flex-1 text-right">
                <div className="text-[11px] text-ink-500">Destination</div>
                <div className="text-lg font-extrabold text-ink-900">
                  🇸🇳 Dakar
                </div>
                <div className="text-[12px] text-ink-500">{countryName}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-kamoo-blue-100 bg-kamoo-blue-50/50 p-4">
            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-kamoo-blue-700" />
              <p className="text-[12px] leading-relaxed text-kamoo-blue-700">
                Le pays de destination correspond au{" "}
                <b>pays actif sélectionné en haut</b>. Pour changer, modifie-le
                depuis le sélecteur du header.
              </p>
            </div>
          </div>
        </div>

        {/* DROITE — modes proposés par le transitaire connecté */}
        <div className="flex flex-col gap-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-ink-700">
            Les modes proposés par {transitaire.name}
          </div>

          {transitaire.modes.map((tm) => (
            <TransitaireModeCard
              key={tm.mode}
              tMode={tm}
              selected={mode === tm.mode}
              recommended={tm.mode === recommended}
              onClick={() => onModeChange(tm.mode)}
            />
          ))}

          <p className="mt-1 text-[11.5px] leading-relaxed text-ink-400">
            Les catégories acceptées / refusées par mode seront affichées à la
            confirmation — vous pourrez les relire avant de valider.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Carte de mode SYNCHRONISÉE avec l'offre du transitaire connecté. */
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
        "relative flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition",
        selected
          ? "border-kamoo-blue-700 bg-kamoo-blue-50"
          : "border-line bg-white hover:border-ink-300",
      )}
    >
      {recommended && !selected && (
        <div className="absolute -top-2.5 right-3 rounded-md bg-kamoo-orange-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
          ★ Recommandé
        </div>
      )}

      {selected && (
        <div className="absolute left-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-kamoo-blue-700 text-white">
          <Check className="h-3 w-3" />
        </div>
      )}

      <div
        className={cn(
          "grid h-14 w-14 shrink-0 place-items-center rounded-xl",
          TRANSPORT_BG[tMode.mode],
          TRANSPORT_FG[tMode.mode],
        )}
      >
        <Icon className="h-6 w-6" />
      </div>

      <div className="flex-1">
        <span className="text-base font-extrabold text-ink-900">
          {TRANSPORT_MODE_LABELS[tMode.mode]}
        </span>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-ink-500">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {tMode.delay}
          </span>
          {tMode.description && <span>{tMode.description}</span>}
        </div>
      </div>

      {/* Tarif du transitaire */}
      <div className="text-right">
        <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
          Tarif
        </div>
        <div className="font-display text-[15px] font-extrabold leading-tight text-ink-900">
          {tMode.fromXof.toLocaleString("fr-FR")} – {tMode.toXof.toLocaleString("fr-FR")}
        </div>
        <div className="text-[10px] font-semibold text-ink-500">
          F CFA / {tMode.unit === "kg" ? "kg" : "CBM"}
        </div>
      </div>
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
  totalWeight,
  totalPhotos,
  responsibilityAccepted,
  onResponsibilityChange,
}: {
  colis: Colis[];
  mode: TransportMode;
  transitaire: Transitaire;
  country: (typeof COUNTRIES)[number];
  shippingMark: string;
  totalWeight: number;
  totalPhotos: number;
  responsibilityAccepted: boolean;
  onResponsibilityChange: (v: boolean) => void;
}) {
  const tMode = transitaire.modes.find((m) => m.mode === mode)!;
  const ModeIcon = TRANSPORT_ICON[mode];

  return (
    <div className="grid grid-cols-[1.4fr_1fr] gap-6">
      {/* GAUCHE — Récap */}
      <div className="flex flex-col gap-4">
        {/* Trajet */}
        <div className="rounded-2xl border border-line bg-white p-5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
            Trajet
          </div>
          <div className="mt-3 flex items-center gap-4">
            <div className="flex-1">
              <div className="text-[11px] text-ink-500">Origine</div>
              <div className="text-lg font-extrabold text-ink-900">
                🇨🇳 Guangzhou
              </div>
              <div className="text-[12px] text-ink-500">
                Entrepôt Kamoo · GZ-04
              </div>
            </div>
            <div className={cn("flex flex-col items-center gap-1", TRANSPORT_FG[mode])}>
              <ModeIcon className="h-5 w-5" />
              <div className="text-[10px] font-bold">{tMode.delay}</div>
            </div>
            <div className="flex-1 text-right">
              <div className="text-[11px] text-ink-500">Destination</div>
              <div className="text-lg font-extrabold text-ink-900">
                {country.flag} {country.name}
              </div>
              <div className="text-[12px] text-ink-500">
                {country.warehouseCity}
              </div>
            </div>
          </div>
        </div>

        {/* Liste colis */}
        <div className="rounded-2xl border border-line bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
              {colis.length} colis · {totalWeight.toFixed(1)} kg estimés
            </div>
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-kamoo-blue-700">
              <ModeIcon className="h-3 w-3" />
              {TRANSPORT_MODE_LABELS[mode]} · {tMode.delay}
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            {colis.map((c, i) => {
              const photoCount = c.photos.filter(Boolean).length;
              const firstPhoto = c.photos.find(Boolean);
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-3 rounded-xl bg-paper-2 px-3 py-2.5"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-ink-100 text-xl">
                    {firstPhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={firstPhoto.url}
                        alt={firstPhoto.fileName ?? c.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      "📦"
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-bold text-ink-900">
                      {c.name || `Colis #${i + 1}`}
                    </div>
                    <div className="text-[11px] text-ink-500">
                      {photoCount} photo{photoCount > 1 ? "s" : ""}
                      {c.cartons &&
                        ` · ${c.cartons} carton${parseInt(c.cartons) > 1 ? "s" : ""}`}
                      {c.weight ? ` · ~${c.weight} kg` : " · poids à mesurer"}
                    </div>
                  </div>
                  <span className="rounded-md bg-kamoo-blue-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-kamoo-blue-700">
                    #{i + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Devis en attente */}
        <div className="rounded-2xl border border-dashed border-kamoo-orange-400 bg-gradient-to-br from-kamoo-orange-50 to-amber-50 p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-kamoo-orange-400 bg-white text-2xl">
              ⏳
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-kamoo-orange-700">
                Devis en attente
              </div>
              <div className="mt-1 text-base font-extrabold text-ink-900">
                En attente de réception en Chine
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-700">
                Une fois votre colis arrivé chez notre transitaire à{" "}
                <b>Guangzhou</b>, il sera <b>pesé</b> et{" "}
                <b>photographié</b>, puis vous recevrez le devis exact
                (poids, volume si besoin, coût unitaire et total).
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { label: "Poids réel", icon: Box, placeholder: "— kg" },
                  {
                    label: "Volume (CBM)",
                    icon: Plane,
                    placeholder: "— CBM",
                  },
                  {
                    label: "Cartons reçus",
                    icon: Ship,
                    placeholder: `— / ${colis.length}`,
                  },
                ].map((item) => {
                  const I = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="rounded-lg border border-line bg-white p-2.5"
                    >
                      <div className="flex items-center gap-1 text-ink-500">
                        <I className="h-3 w-3" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {item.label}
                        </span>
                      </div>
                      <div className="font-display mt-1 text-base font-extrabold text-ink-400">
                        {item.placeholder}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-ink-500">
                <Clock className="h-3 w-3" />
                Notification dès la réception · délai habituel 5–10 jours
                après envoi du fournisseur.
              </div>
            </div>
          </div>
        </div>

        {/* RELECTURE — catégories du transitaire pour le mode choisi.
            Synchronisé avec son profil : c'est SA politique qui s'applique. */}
        <div className="rounded-2xl border border-line bg-white p-5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
            À relire avant de valider — {TRANSPORT_MODE_LABELS[mode]} chez {transitaire.name}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
              <div className="text-[10.5px] font-bold uppercase tracking-wide text-emerald-700">
                ✓ Colis autorisés
              </div>
              <ul className="mt-1.5 flex flex-col gap-1 text-[12.5px] text-ink-700">
                {(tMode.accepted ?? ["Marchandises générales"]).map((a) => (
                  <li key={a}>· {a}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50/50 p-3">
              <div className="text-[10.5px] font-bold uppercase tracking-wide text-red-600">
                ✕ Colis refusés
              </div>
              <ul className="mt-1.5 flex flex-col gap-1 text-[12.5px] text-ink-700">
                {(tMode.forbidden ?? []).length > 0 ? (
                  (tMode.forbidden ?? []).map((fz) => <li key={fz}>· {fz}</li>)
                ) : (
                  <li className="italic text-ink-400">Aucune restriction déclarée</li>
                )}
              </ul>
            </div>
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-ink-400">
            Un doute sur votre produit ? Discutez-en avec {transitaire.name} via le chat
            avant de valider — vous pouvez lui envoyer les photos de vos colis.
          </p>
        </div>

        {/* GARDE-FOU + protection : l'adresse fournisseur et le shipping mark
            ne sont transmis au transitaire QU'APRÈS validation. */}
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="flex-1 text-[12.5px] leading-relaxed text-amber-900">
              <div className="font-bold">
                Que se passe-t-il si le contenu ne correspond pas ?
              </div>
              <p className="mt-1 text-amber-800">
                Si {transitaire.name} reçoit un colis d&apos;une catégorie refusée pour le
                mode choisi, il refusera l&apos;expédition : vous devrez fournir une adresse
                alternative en Chine et payer les frais de réacheminement. C&apos;est
                pourquoi l&apos;adresse de son entrepôt et votre shipping mark ne sont
                débloqués <b>qu&apos;après validation</b> de cette étape.
              </p>
            </div>
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-white p-4 transition hover:border-ink-300">
          <input
            type="checkbox"
            checked={responsibilityAccepted}
            onChange={(e) => onResponsibilityChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-kamoo-orange-500"
          />
          <span className="text-[13px] leading-relaxed text-ink-900">
            <b>J&apos;ai relu les colis autorisés / refusés</b> de {transitaire.name} et je
            confirme que mes colis les respectent. En cas de divergence constatée à la
            réception, j&apos;accepte de payer les frais de réacheminement.
          </span>
        </label>
      </div>

      {/* DROITE — Shipping mark */}
      <div className="flex flex-col gap-4">
        <ShippingMarkCard
          shippingMark={shippingMark}
          country={country}
          totalPhotos={totalPhotos}
          colisCount={colis.length}
        />

        <NextStepsTimeline countryName={country.name} mode={mode} />
      </div>
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
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-kamoo-blue-900 to-kamoo-blue-700 p-6 text-white">
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(249,115,22,0.4) 0%, transparent 70%)",
        }}
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.08em] opacity-70">
              Shipping mark
            </div>
            <div className="mt-1 text-[12px] opacity-85">
              À copier-coller chez votre fournisseur
            </div>
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
              KAMOO LOGISTICS — {country.flag}{" "}
              {country.name.toUpperCase()}
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
            copied
              ? "bg-emerald-600"
              : "bg-kamoo-orange-500 hover:bg-kamoo-orange-600",
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
          Communiquez ce code à votre fournisseur en Chine.
          <br />
          Il l&apos;inscrira sur chaque colis avant l&apos;envoi à
          l&apos;entrepôt.
        </p>
      </div>
    </div>
  );
}

function NextStepsTimeline({
  countryName,
  mode,
}: {
  countryName: string;
  mode: TransportMode;
}) {
  const modeData = TRANSPORT_MODES_DATA.find((m) => m.id === mode)!;

  const steps = [
    {
      label: "Réception entrepôt Guangzhou",
      sub: "Vérification + photos",
      active: true,
    },
    {
      label:
        mode === "sea"
          ? "Départ maritime"
          : mode === "air_express"
            ? "Départ express"
            : "Départ aérien",
      sub: modeData.delay,
      active: false,
    },
    {
      label: `Dédouanement ${countryName}`,
      sub: "Géré par Kamoo",
      active: false,
    },
    {
      label: "Livraison à domicile",
      sub: "Notification SMS",
      active: false,
    },
  ];

  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="mb-4 text-[11px] font-bold uppercase tracking-wider text-ink-500">
        Prochaines étapes
      </div>
      <div className="flex flex-col gap-3.5">
        {steps.map((s, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "grid h-[22px] w-[22px] place-items-center rounded-full",
                  s.active ? "bg-kamoo-orange-500" : "bg-ink-200",
                )}
              >
                {s.active && (
                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </div>
              {i < steps.length - 1 && (
                <div className="mt-1 h-5 w-[2px] bg-ink-200" />
              )}
            </div>
            <div className="pt-0.5">
              <div
                className={cn(
                  "text-[13px] font-bold",
                  s.active ? "text-ink-900" : "text-ink-700",
                )}
              >
                {s.label}
              </div>
              <div className="mt-0.5 text-[11px] text-ink-500">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
