"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ImagePlus,
  Info,
  Package,
  Save,
  Sparkles,
  X,
} from "lucide-react";
import { toStoredDataUrl } from "@/components/kamoo/product-image-manager";
import { useProductsState } from "@/lib/hooks/use-products-state";
import { cn } from "@/lib/utils";

export type ProductFormInitial = {
  /** Présent en édition uniquement */
  id?: string;
  /** SKU — généré côté serveur en création (placeholder), figé en édition */
  sku: string;
  /** Indique si le SKU est modifiable (false en édition pour cohérence) */
  skuLocked: boolean;
  name: string;
  emoji: string;
  bg: string;
  description: string;
  priceXof: number;
  costPriceXof?: number;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
};

type Props = {
  mode: "create" | "edit";
  initial: ProductFormInitial;
  /** URL de retour pour le bouton « Annuler » et le « ← » */
  cancelHref: string;
  /** URL de redirection après sauvegarde réussie */
  successHref: string;
};

/**
 * Formulaire produit — partagé entre création (/boutique/nouveau) et
 * édition (/boutique/[id]/edit). En V1 mock : pas de persistence,
 * juste un toast « Enregistré » avant redirect.
 */
export function ProductForm({
  mode,
  initial,
  cancelHref,
  successHref,
}: Props) {
  const router = useRouter();
  const { addProduct, updateProduct } = useProductsState();

  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [emoji, setEmoji] = useState(initial.emoji);
  const [priceXof, setPriceXof] = useState(
    initial.priceXof > 0 ? String(initial.priceXof) : "",
  );
  const [costPriceXof, setCostPriceXof] = useState(
    initial.costPriceXof !== undefined ? String(initial.costPriceXof) : "",
  );
  const [stock, setStock] = useState(String(initial.stock));
  const [lowStockThreshold, setLowStockThreshold] = useState(
    String(initial.lowStockThreshold),
  );
  const [isActive, setIsActive] = useState(initial.isActive);

  /* Photos (max 5) — sélectionnées depuis l'explorateur de fichiers.
   * La 1ʳᵉ est la couverture (catalogue + expéditions via useSavedCovers). */
  const [photos, setPhotos] = useState<string[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!initial.id) return;
    try {
      const raw = localStorage.getItem(`boutique.photos.${initial.id}`);
      if (raw) {
        const arr = JSON.parse(raw) as string[];
        if (Array.isArray(arr)) setPhotos(arr.slice(0, 5));
      }
    } catch {
      /* ignore */
    }
  }, [initial.id]);

  const addPhotoFiles = (files: FileList | null) => {
    if (!files) return;
    const urls = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => URL.createObjectURL(f));
    if (urls.length) setPhotos((prev) => [...prev, ...urls].slice(0, 5));
  };

  const [saved, setSaved] = useState(false);

  const priceNum = parseInt(priceXof, 10) || 0;
  const costNum = costPriceXof ? parseInt(costPriceXof, 10) : null;
  const stockNum = parseInt(stock, 10) || 0;
  const thresholdNum = parseInt(lowStockThreshold, 10) || 0;

  const isDirty = useMemo(() => {
    if (mode === "create") {
      // En création, n'importe quel champ rempli compte
      return (
        name.trim().length > 0 ||
        description.trim().length > 0 ||
        emoji !== initial.emoji ||
        priceNum > 0 ||
        costNum !== null ||
        stockNum !== initial.stock ||
        thresholdNum !== initial.lowStockThreshold ||
        isActive !== initial.isActive
      );
    }
    return (
      name !== initial.name ||
      description !== initial.description ||
      emoji !== initial.emoji ||
      priceNum !== initial.priceXof ||
      costNum !== (initial.costPriceXof ?? null) ||
      stockNum !== initial.stock ||
      thresholdNum !== initial.lowStockThreshold ||
      isActive !== initial.isActive
    );
  }, [
    mode,
    name,
    description,
    emoji,
    priceNum,
    costNum,
    stockNum,
    thresholdNum,
    isActive,
    initial,
  ]);

  const isValid =
    name.trim().length > 0 &&
    priceNum > 0 &&
    stockNum >= 0 &&
    thresholdNum >= 0;

  const margePct =
    costNum !== null && priceNum > 0
      ? Math.round(((priceNum - costNum) / priceNum) * 100)
      : null;

  const handleSave = async () => {
    if (!isValid) return;
    // V1 mock : persistance réelle via le store produits (sessionStorage).
    // V2 : server action createProduct() / updateProduct() (Supabase).
    const persistPhotos = async (productId: string) => {
      if (photos.length === 0) return;
      try {
        const stored = await Promise.all(photos.map((u) => toStoredDataUrl(u)));
        localStorage.setItem(`boutique.photos.${productId}`, JSON.stringify(stored));
        window.dispatchEvent(new Event("storage")); // rafraîchit les couvertures
      } catch {
        /* stockage plein — non bloquant */
      }
    };
    if (mode === "create") {
      const id = `p_new_${Date.now().toString(36)}`;
      await persistPhotos(id);
      addProduct({
        id,
        sku: initial.sku,
        name: name.trim(),
        emoji,
        bg: initial.bg,
        description: description.trim(),
        priceXof: priceNum,
        costPriceXof: costNum ?? undefined,
        stock: stockNum,
        lowStockThreshold: thresholdNum,
        isActive,
        soldThisMonth: 0,
        soldTotal: 0,
        revenueThisMonthXof: 0,
        revenueTotalXof: 0,
        createdAt: new Date().toISOString(),
      });
    } else if (initial.id) {
      await persistPhotos(initial.id);
      updateProduct(initial.id, {
        name: name.trim(),
        description: description.trim(),
        emoji,
        priceXof: priceNum,
        costPriceXof: costNum ?? undefined,
        stock: stockNum,
        lowStockThreshold: thresholdNum,
        isActive,
      });
    }
    setSaved(true);
    setTimeout(() => {
      router.push(successHref);
    }, 800);
  };

  const headerLabel =
    mode === "create" ? "Boutique · Nouveau produit" : "Boutique · Modifier le produit";
  const titleFallback = mode === "create" ? "Nouveau produit" : initial.name;

  return (
    <div className="flex min-h-full flex-col">
      {/* HEADER */}
      <div className="flex items-center gap-4 border-b border-line bg-white px-10 py-5">
        <Link
          href={cancelHref}
          className="grid h-9 w-9 place-items-center rounded-lg bg-paper-2 text-ink-500 hover:text-ink-700"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
            {headerLabel}
          </div>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="font-display text-xl font-extrabold text-ink-900">
              {name || titleFallback}
            </h1>
            {initial.skuLocked && (
              <span className="font-mono-kamoo text-[12px] text-ink-500">
                {initial.sku}
              </span>
            )}
          </div>
        </div>

        <Link
          href={cancelHref}
          className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-[13px] font-semibold text-ink-900 hover:bg-paper-2"
        >
          <X className="h-3.5 w-3.5" />
          Annuler
        </Link>
        <button
          type="button"
          onClick={handleSave}
          disabled={!isValid || !isDirty || saved}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold text-white transition",
            saved
              ? "bg-emerald-600"
              : "bg-kamoo-orange-500 hover:bg-kamoo-orange-600",
            (!isValid || !isDirty) && !saved && "cursor-not-allowed opacity-40",
          )}
        >
          {saved ? (
            <>
              <Check className="h-3.5 w-3.5" />
              {mode === "create" ? "Produit créé" : "Enregistré"}
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5" />
              {mode === "create" ? "Créer le produit" : "Enregistrer"}
            </>
          )}
        </button>
      </div>

      {/* BODY */}
      <div className="grid flex-1 grid-cols-[1.5fr_1fr] gap-5 px-10 py-6">
        {/* ─── COLONNE GAUCHE — formulaire ─── */}
        <div className="flex flex-col gap-4">
          {/* IDENTITÉ */}
          <Section title="Identité du produit">
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center gap-2">
                <div
                  className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl text-4xl shadow-sm"
                  style={{ background: initial.bg }}
                >
                  {emoji}
                </div>
                <input
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  maxLength={2}
                  className="w-20 rounded-lg border border-input bg-white px-2 py-1.5 text-center text-base outline-none focus:border-kamoo-blue-600 focus:ring-2 focus:ring-kamoo-blue-600/12"
                />
              </div>
              <div className="flex flex-1 flex-col gap-3">
                <Field label="Nom du produit" required>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex : Crème éclaircissante naturelle"
                    className="w-full rounded-xl border border-input bg-white px-3.5 py-2.5 text-sm outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600 focus:ring-2 focus:ring-kamoo-blue-600/12"
                  />
                </Field>
                <Field label="SKU (référence)">
                  <div className="flex items-center gap-2 rounded-xl border border-line bg-paper-2/40 px-3.5 py-2.5 text-sm font-mono-kamoo font-bold text-ink-700">
                    {initial.sku}
                    <span className="ml-auto text-[10px] font-sans font-semibold uppercase tracking-wider text-ink-500">
                      {initial.skuLocked
                        ? "Non modifiable"
                        : "Généré automatiquement"}
                    </span>
                  </div>
                </Field>
              </div>
            </div>
            <Field label="Description" className="mt-3">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Décrivez votre produit (matière, dimensions, usage)..."
                className="w-full resize-none rounded-xl border border-input bg-white px-3.5 py-2.5 text-sm outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600 focus:ring-2 focus:ring-kamoo-blue-600/12"
              />
            </Field>
          </Section>

          {/* PHOTOS — depuis l'explorateur de fichiers, 1ʳᵉ = couverture */}
          <Section title="Photos du produit">
            <p className="-mt-1 mb-3 text-[12px] text-ink-500">
              Jusqu&apos;à 5 photos. La première est la <b>couverture</b> — visible au
              catalogue et dans vos expéditions.
            </p>
            <div className="flex flex-wrap gap-2.5">
              {photos.map((url, i) => (
                <div key={i} className="group relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Photo ${i + 1}`}
                    className={cn(
                      "h-20 w-20 rounded-xl border-2 object-cover",
                      i === 0 ? "border-kamoo-blue-600" : "border-line",
                    )}
                  />
                  {i === 0 && (
                    <span className="absolute -left-1.5 -top-1.5 rounded-full bg-kamoo-blue-600 px-1.5 py-0.5 text-[8.5px] font-bold uppercase text-white shadow-sm">
                      Couv.
                    </span>
                  )}
                  {i !== 0 && (
                    <button
                      type="button"
                      title="Définir en couverture"
                      onClick={() =>
                        setPhotos((prev) => [prev[i], ...prev.filter((_, j) => j !== i)])
                      }
                      className="absolute inset-x-0 bottom-0 rounded-b-[10px] bg-ink-900/70 py-0.5 text-[9px] font-bold text-white opacity-0 transition group-hover:opacity-100"
                    >
                      Couverture
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-red-600 text-white opacity-0 shadow-sm transition group-hover:opacity-100"
                    aria-label="Retirer cette photo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {photos.length < 5 && (
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="grid h-20 w-20 place-items-center rounded-xl border-2 border-dashed border-line text-ink-400 transition hover:border-kamoo-blue-600 hover:text-kamoo-blue-700"
                >
                  <span className="flex flex-col items-center gap-1 text-[10px] font-semibold">
                    <ImagePlus className="h-5 w-5" />
                    Parcourir
                  </span>
                </button>
              )}
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                addPhotoFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </Section>

          {/* PRICING */}
          <Section title="Prix & marge">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prix de vente (F CFA)" required>
                <input
                  type="number"
                  min={0}
                  value={priceXof}
                  onChange={(e) => setPriceXof(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-input bg-white px-3.5 py-2.5 text-sm outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600 focus:ring-2 focus:ring-kamoo-blue-600/12"
                />
              </Field>
              <Field label="Prix d'achat moyen (F CFA)">
                <input
                  type="number"
                  min={0}
                  value={costPriceXof}
                  onChange={(e) => setCostPriceXof(e.target.value)}
                  placeholder="Optionnel"
                  className="w-full rounded-xl border border-input bg-white px-3.5 py-2.5 text-sm outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600 focus:ring-2 focus:ring-kamoo-blue-600/12"
                />
              </Field>
            </div>
            {costNum === null ? (
              <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-dashed border-amber-300 bg-amber-50/60 p-2.5 text-[12px] leading-relaxed text-amber-900">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />
                <div>
                  <span className="font-bold">Prix d&apos;achat optionnel.</span>{" "}
                  Si renseigné, on calcule automatiquement votre marge. Sinon,
                  Kamoo se basera sur le coût d&apos;acquisition réel dérivé de
                  vos expéditions arrivées.
                </div>
              </div>
            ) : (
              <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-[12px] text-emerald-900">
                <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
                <span>
                  Marge estimée :{" "}
                  <b>
                    {priceNum - costNum} F CFA ({margePct}%)
                  </b>{" "}
                  par unité.
                </span>
              </div>
            )}
          </Section>

          {/* STOCK */}
          <Section title="Stock & disponibilité">
            <div className="grid grid-cols-2 gap-3">
              <Field
                label={
                  mode === "create"
                    ? "Stock initial (unités)"
                    : "Stock actuel (unités)"
                }
                required
              >
                <input
                  type="number"
                  min={0}
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full rounded-xl border border-input bg-white px-3.5 py-2.5 text-sm outline-none focus:border-kamoo-blue-600 focus:ring-2 focus:ring-kamoo-blue-600/12"
                />
              </Field>
              <Field label="Seuil d'alerte stock bas">
                <input
                  type="number"
                  min={0}
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  className="w-full rounded-xl border border-input bg-white px-3.5 py-2.5 text-sm outline-none focus:border-kamoo-blue-600 focus:ring-2 focus:ring-kamoo-blue-600/12"
                />
              </Field>
            </div>
            <p className="mt-2 flex items-start gap-1.5 text-[11.5px] text-ink-500">
              <Info className="mt-0.5 h-3 w-3 shrink-0" />
              En dessous du seuil, vous recevez une alerte « stock bas » sur
              votre tableau de bord.
            </p>
          </Section>
        </div>

        {/* ─── COLONNE DROITE — état + aperçu ─── */}
        <div className="flex flex-col gap-4">
          <Section title="État de mise en vente">
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition",
                isActive
                  ? "border-emerald-300 bg-emerald-50/60"
                  : "border-line bg-paper-2/40",
              )}
            >
              <div
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
                  isActive
                    ? "bg-emerald-600 text-white"
                    : "bg-ink-200 text-ink-500",
                )}
              >
                <Package className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold text-ink-900">
                  {isActive ? "● En vente" : "○ Inactif"}
                </div>
                <div className="mt-0.5 text-[11.5px] text-ink-500">
                  {isActive
                    ? "Visible dans vos campagnes et chez vos closeuses."
                    : "Caché — ne sera proposé à aucun client."}
                </div>
              </div>
              <div
                className={cn(
                  "relative h-6 w-11 shrink-0 rounded-full transition",
                  isActive ? "bg-emerald-500" : "bg-ink-300",
                )}
              >
                <div
                  className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all",
                    isActive ? "left-[22px]" : "left-0.5",
                  )}
                />
              </div>
            </button>
          </Section>

          <Section title="Aperçu rapide">
            <div className="flex flex-col gap-2 text-[13px]">
              <Row
                label="Prix de vente"
                value={`${priceNum.toLocaleString("fr-FR")} F`}
              />
              <Row
                label="Coût d'achat manuel"
                value={
                  costNum !== null
                    ? `${costNum.toLocaleString("fr-FR")} F`
                    : "—"
                }
              />
              <Row
                label="Marge / unité"
                value={
                  costNum !== null && priceNum > 0
                    ? `${(priceNum - costNum).toLocaleString("fr-FR")} F (${margePct}%)`
                    : "—"
                }
              />
              <Row label="Stock" value={`${stockNum} unités`} />
              <Row label="Seuil bas" value={`${thresholdNum} unités`} />
            </div>
          </Section>

          {isDirty && !saved && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-[12px] text-amber-900">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />
              <span>
                {mode === "create" ? (
                  <>
                    <b>Brouillon non enregistré.</b> Cliquez sur
                    «&nbsp;Créer le produit&nbsp;» pour l&apos;ajouter à votre
                    boutique.
                  </>
                ) : (
                  <>
                    <b>Modifications non enregistrées.</b> Cliquez sur
                    «&nbsp;Enregistrer&nbsp;» pour valider, ou
                    «&nbsp;Annuler&nbsp;» pour revenir.
                  </>
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────────────────── */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-ink-500">
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-500">{label}</span>
      <span className="font-bold text-ink-900">{value}</span>
    </div>
  );
}
