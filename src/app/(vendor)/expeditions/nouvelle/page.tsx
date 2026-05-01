"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
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
import { COUNTRIES } from "@/lib/data/countries";
import { TRANSPORT_MODES_DATA } from "@/lib/data/transport-modes";
import { PRODUCT_CATEGORIES, getCategoryById } from "@/lib/data/categories";
import type { TransportMode } from "@/lib/types/expedition";
import { cn } from "@/lib/utils";

/* ─── État local du wizard ─────────────────────────────────────────── */

type Photo = { emoji: string; bg: string };

type Colis = {
  id: number;
  name: string;
  weight: string; // kg, optionnel
  cartons: string; // nombre, optionnel
  photos: (Photo | null)[]; // 5 slots
};

const STEP_LABELS = ["Colis", "Transport", "Confirmation"] as const;

const DUMMY_PHOTOS: Photo[] = [
  { emoji: "👟", bg: "linear-gradient(135deg,#FFEDD5,#FB923C)" },
  { emoji: "👜", bg: "linear-gradient(135deg,#DBEAFE,#3B82F6)" },
  { emoji: "📱", bg: "linear-gradient(135deg,#F3F4F6,#9CA3AF)" },
  { emoji: "⌚", bg: "linear-gradient(135deg,#FEF3C7,#F59E0B)" },
  { emoji: "📦", bg: "linear-gradient(135deg,#E0E7FF,#6366F1)" },
];

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
  const [step, setStep] = useState(1);
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
  const [aiCategoryId, setAiCategoryId] = useState("cosmetique");
  const [mode, setMode] = useState<TransportMode>("air_standard");

  // Pays actif (à remplacer par un context global plus tard)
  const country = COUNTRIES[0]; // SN

  // Catégorie courante + helpers
  const currentCat = getCategoryById(aiCategoryId);
  const isModeAllowed = (m: TransportMode) =>
    !currentCat.incompatibleModes.includes(m);

  // Auto-switch si le mode sélectionné devient incompatible
  useEffect(() => {
    if (!isModeAllowed(mode)) {
      const fallback = TRANSPORT_MODES_DATA.find((m) =>
        isModeAllowed(m.id),
      );
      if (fallback) setMode(fallback.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiCategoryId]);

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

  // Mock shipping mark — sera généré côté serveur en vrai
  const shippingMark = `KMO-${country.code}-78421`;

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
            categoryId={aiCategoryId}
            onCategoryChange={setAiCategoryId}
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
            categoryId={aiCategoryId}
            country={country}
            shippingMark={shippingMark}
            totalWeight={totalWeight}
            totalPhotos={totalPhotos}
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
          {step < 3 && canNext && "✓ Tout est rempli, tu peux continuer"}
          {step < 3 && !canNext && "Complète les champs requis pour continuer"}
          {step === 3 &&
            "Une fois validée, ton colis sera réceptionné en Chine sous 5–10 jours"}
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
          <button className="inline-flex items-center gap-2 rounded-xl bg-kamoo-orange-500 px-6 py-3 text-sm font-extrabold text-white hover:bg-kamoo-orange-600">
            Valider l&apos;expédition
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
            Tes colis
          </h2>
          <p className="mt-1 text-[13px] text-ink-500">
            Ajoute chaque produit avec une photo et son nom. Tu peux grouper
            jusqu&apos;à 20 colis dans une expédition.
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

  const addPhoto = (slot: number) => {
    const photos = [...colis.photos];
    photos[slot] = DUMMY_PHOTOS[(index + slot) % DUMMY_PHOTOS.length];
    onChange({ ...colis, photos });
  };

  const removePhoto = (slot: number) => {
    const photos = [...colis.photos];
    photos[slot] = null;
    onChange({ ...colis, photos });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      {/* Header de la card */}
      <div
        onClick={onToggle}
        className="flex cursor-pointer items-center gap-3.5 px-5 py-4"
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
                  ? "Ajoute au moins 1 photo"
                  : "Nomme le produit"}
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
                    photo={photo}
                    onAdd={() => addPhoto(i)}
                    onRemove={() => removePhoto(i)}
                    label={i === 0 ? "Produit" : i === 1 ? "Carton" : "Photo"}
                  />
                ))}
              </div>
              <div className="mt-2.5 flex items-start gap-2 rounded-lg bg-kamoo-blue-50 p-2.5">
                <Camera className="mt-0.5 h-3.5 w-3.5 shrink-0 text-kamoo-blue-700" />
                <p className="text-[11.5px] leading-relaxed text-kamoo-blue-700">
                  Ajoute la <b>photo commerciale</b> du produit + la{" "}
                  <b>photo du carton</b> de la commande pour faciliter la
                  réception.
                </p>
              </div>
            </div>

            {/* Champs */}
            <div className="flex flex-col gap-3.5">
              <Field label="Nom du produit" required>
                <input
                  type="text"
                  placeholder="Ex: Baskets Nike Air Max"
                  value={colis.name}
                  onChange={(e) =>
                    onChange({ ...colis, name: e.target.value })
                  }
                  className="w-full rounded-xl border border-input bg-white px-3.5 py-2.5 text-sm outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600 focus:ring-2 focus:ring-kamoo-blue-600/12"
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
  photo,
  onAdd,
  onRemove,
  label,
}: {
  photo: Photo | null;
  onAdd: () => void;
  onRemove: () => void;
  label: string;
}) {
  if (photo) {
    return (
      <div
        className="relative grid aspect-square place-items-center overflow-hidden rounded-xl text-3xl"
        style={{ background: photo.bg }}
      >
        {photo.emoji}
        <button
          onClick={onRemove}
          className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }
  return (
    <button
      onClick={onAdd}
      className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-ink-300 bg-paper-2 text-ink-500 transition hover:border-kamoo-orange-500 hover:text-kamoo-orange-500"
    >
      <div className="flex flex-col items-center gap-1">
        <Plus className="h-4 w-4" />
        <span className="text-[10px] font-semibold">{label}</span>
      </div>
    </button>
  );
}

/* ─── STEP 2 — TRANSPORT ──────────────────────────────────────────── */

function Step2Transport({
  categoryId,
  onCategoryChange,
  mode,
  onModeChange,
  isModeAllowed,
  countryName,
}: {
  categoryId: string;
  onCategoryChange: (id: string) => void;
  mode: TransportMode;
  onModeChange: (m: TransportMode) => void;
  isModeAllowed: (m: TransportMode) => boolean;
  countryName: string;
}) {
  const [catOpen, setCatOpen] = useState(false);
  const currentCat = getCategoryById(categoryId);

  const recommendedRaw: TransportMode = "air_standard";
  const recommended = isModeAllowed(recommendedRaw)
    ? recommendedRaw
    : TRANSPORT_MODES_DATA.find((m) => isModeAllowed(m.id))?.id;

  return (
    <div>
      <h2 className="font-display text-2xl font-extrabold text-ink-900">
        Mode de transport
      </h2>
      <p className="mt-1 text-[13px] text-ink-500">
        Choisis comment ton colis voyagera depuis la Chine vers {countryName}.
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
                  🇨🇳 Guangzhou
                </div>
                <div className="text-[12px] text-ink-500">
                  Entrepôt Kamoo · GZ-04
                </div>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-kamoo-orange-500">
                <ArrowRight className="h-6 w-6" />
                <div className="text-[10px] font-bold uppercase tracking-wider">
                  {TRANSPORT_MODES_DATA.find((m) => m.id === mode)?.delay}
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

        {/* DROITE — IA + modes */}
        <div className="flex flex-col gap-3">
          {/* IA category chip */}
          <div className="relative">
            <div className="flex items-center gap-3 rounded-2xl border border-orange-200 bg-gradient-to-br from-kamoo-orange-100 to-kamoo-orange-50 p-3.5">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-kamoo-orange-500 to-kamoo-orange-600 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-kamoo-orange-700">
                  Catégorie détectée par IA
                </div>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="text-base">{currentCat.emoji}</span>
                  <span className="text-[15px] font-extrabold text-ink-900">
                    {currentCat.label}
                  </span>
                  <span className="ml-1 text-[10px] font-semibold text-ink-500">
                    · d&apos;après tes photos
                  </span>
                </div>
              </div>
              <button
                onClick={() => setCatOpen(!catOpen)}
                className="inline-flex items-center gap-1 rounded-lg border border-kamoo-orange-400 bg-white px-2.5 py-1.5 text-[11px] font-bold text-kamoo-orange-700 hover:bg-kamoo-orange-50"
              >
                Modifier
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>

            {catOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setCatOpen(false)}
                />
                <div className="absolute right-0 top-[calc(100%+6px)] z-20 max-h-80 w-72 overflow-y-auto rounded-xl border border-line bg-white p-1.5 shadow-[var(--shadow-kamoo-lg)]">
                  <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                    Choisir la catégorie
                  </div>
                  {PRODUCT_CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        onCategoryChange(c.id);
                        setCatOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] hover:bg-paper-2",
                        c.id === categoryId && "bg-kamoo-orange-50",
                      )}
                    >
                      <span className="text-base">{c.emoji}</span>
                      <span
                        className={cn(
                          "flex-1",
                          c.id === categoryId
                            ? "font-bold text-ink-900"
                            : "font-medium text-ink-900",
                        )}
                      >
                        {c.label}
                      </span>
                      {c.id === categoryId && (
                        <Check className="h-3.5 w-3.5 text-kamoo-orange-500" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="mt-2 text-[10px] font-bold uppercase tracking-wider text-ink-700">
            Choisis ton mode
          </div>

          {TRANSPORT_MODES_DATA.map((m) => (
            <TransportModeCard
              key={m.id}
              mode={m}
              selected={mode === m.id}
              allowed={isModeAllowed(m.id)}
              recommended={m.id === recommended}
              incompatibleReason={currentCat.reason}
              onClick={() => isModeAllowed(m.id) && onModeChange(m.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TransportModeCard({
  mode,
  selected,
  allowed,
  recommended,
  incompatibleReason,
  onClick,
}: {
  mode: (typeof TRANSPORT_MODES_DATA)[number];
  selected: boolean;
  allowed: boolean;
  recommended: boolean;
  incompatibleReason: string;
  onClick: () => void;
}) {
  const Icon = TRANSPORT_ICON[mode.id];

  return (
    <button
      onClick={onClick}
      disabled={!allowed}
      className={cn(
        "relative flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition",
        !allowed
          ? "cursor-not-allowed border-line bg-paper-2/50 opacity-60"
          : selected
            ? "border-kamoo-blue-700 bg-kamoo-blue-50"
            : "border-line bg-white hover:border-ink-300",
      )}
    >
      {/* Badge recommandé / indisponible */}
      {!allowed && (
        <div className="absolute -top-2.5 right-3 inline-flex items-center gap-1 rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
          ⚠ Indisponible
        </div>
      )}
      {recommended && allowed && !selected && (
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
          allowed ? TRANSPORT_BG[mode.id] : "bg-ink-100",
          allowed ? TRANSPORT_FG[mode.id] : "text-ink-400",
        )}
      >
        <Icon className="h-6 w-6" />
      </div>

      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-base font-extrabold text-ink-900">
            {mode.label}
          </span>
          <span
            className={cn(
              "text-xs font-semibold",
              allowed ? TRANSPORT_FG[mode.id] : "text-ink-400",
            )}
          >
            {mode.sub}
          </span>
        </div>
        {allowed ? (
          <div className="mt-1 flex items-center gap-3 text-[12px] text-ink-500">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {mode.delay}
            </span>
            <span>{mode.bestFor}</span>
          </div>
        ) : (
          <div className="mt-1 text-[12px] font-semibold leading-snug text-red-600">
            {incompatibleReason}
          </div>
        )}
      </div>
    </button>
  );
}

/* ─── STEP 3 — CONFIRMATION ───────────────────────────────────────── */

function Step3Confirm({
  colis,
  mode,
  categoryId,
  country,
  shippingMark,
  totalWeight,
  totalPhotos,
}: {
  colis: Colis[];
  mode: TransportMode;
  categoryId: string;
  country: (typeof COUNTRIES)[number];
  shippingMark: string;
  totalWeight: number;
  totalPhotos: number;
}) {
  const modeData = TRANSPORT_MODES_DATA.find((m) => m.id === mode)!;
  const ModeIcon = TRANSPORT_ICON[mode];
  const cat = getCategoryById(categoryId);

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
              <div className="text-[10px] font-bold">{modeData.delay}</div>
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
              <Sparkles className="h-3 w-3" />
              IA : {cat.label}
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            {colis.map((c, i) => {
              const photoCount = c.photos.filter(Boolean).length;
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-3 rounded-xl bg-paper-2 px-3 py-2.5"
                >
                  <div
                    className="grid h-10 w-10 place-items-center rounded-lg text-xl"
                    style={{
                      background: c.photos.find(Boolean)?.bg ?? "#E5E7EB",
                    }}
                  >
                    {c.photos.find(Boolean)?.emoji ?? "📦"}
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
                Une fois ton colis arrivé chez notre transitaire à{" "}
                <b>Guangzhou</b>, il sera <b>pesé</b> et{" "}
                <b>photographié</b>. Tu recevras alors le <b>devis exact</b>{" "}
                à valider avant l&apos;expédition.
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { label: "Poids réel", icon: Box, placeholder: "— kg" },
                  {
                    label: "Volume (CBM)",
                    icon: Plane,
                    placeholder: "— m³",
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
      </div>

      {/* DROITE — Shipping mark */}
      <div className="flex flex-col gap-4">
        <ShippingMarkCard
          shippingMark={shippingMark}
          country={country}
          totalPhotos={totalPhotos}
          colisCount={colis.length}
        />

        <NextStepsTimeline countryName={country.name} mode={modeData.id} />
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
              À copier-coller chez ton fournisseur
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
          Communique ce code à ton fournisseur en Chine.
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
