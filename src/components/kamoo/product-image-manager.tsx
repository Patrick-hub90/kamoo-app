"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Check, ImagePlus, Loader2, Save, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────
   Gestion des images produit (aperçu + enregistrement définitif).

   L'état vit dans un contexte partagé : le `ProductImageManager` (dans le
   hero) lit/écrit les images, et le `ProductSaveButton` (dans le header)
   apparaît dès qu'il y a une modification non enregistrée.

   Persistance V1 : localStorage (images converties en data-URL compressées
   pour survivre au rechargement). En V2, `save()` branchera l'upload réel
   (S3/Cloudinary) + persistance serveur du champ `photos`.
   ────────────────────────────────────────────────────────────────── */

type Img = { id: string; url: string };

type Ctx = {
  images: Img[];
  mainIdx: number;
  dirty: boolean;
  saving: boolean;
  justSaved: boolean;
  addFiles: (files: FileList | null) => void;
  removeAt: (i: number) => void;
  setMain: (i: number) => void;
  save: () => void;
};

const ImagesCtx = createContext<Ctx | null>(null);

const PHOTO_PREFIX = "boutique.photos.";

function storageKey(productId: string) {
  return `${PHOTO_PREFIX}${productId}`;
}

/**
 * Lit la photo de couverture (1ʳᵉ image enregistrée) de chaque produit depuis
 * le localStorage. Utilisé par le catalogue (cartes + tableau) pour afficher
 * la vraie photo à la place de l'emoji. Recharge au montage + sur `storage`.
 */
export function useSavedCovers(): Record<string, string> {
  const [covers, setCovers] = useState<Record<string, string>>({});
  useEffect(() => {
    const read = () => {
      const map: Record<string, string> = {};
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k || !k.startsWith(PHOTO_PREFIX)) continue;
          const arr = JSON.parse(localStorage.getItem(k) || "[]");
          if (Array.isArray(arr) && arr.length && typeof arr[0] === "string") {
            map[k.slice(PHOTO_PREFIX.length)] = arr[0] as string;
          }
        }
      } catch {
        /* ignore */
      }
      setCovers(map);
    };
    read();
    window.addEventListener("storage", read);
    return () => window.removeEventListener("storage", read);
  }, []);
  return covers;
}

/** Redimensionne (max 900px) + convertit une url (blob/data) en data-URL
 *  JPEG compacte, pour un stockage localStorage raisonnable. */
function toStoredDataUrl(url: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 900;
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;
      if (w > MAX || h > MAX) {
        const r = Math.min(MAX / w, MAX / h);
        w = Math.round(w * r);
        h = Math.round(h * r);
      }
      const cv = document.createElement("canvas");
      cv.width = w;
      cv.height = h;
      const ctx = cv.getContext("2d");
      if (!ctx) return resolve(url);
      ctx.drawImage(img, 0, 0, w, h);
      try {
        resolve(cv.toDataURL("image/jpeg", 0.82));
      } catch {
        resolve(url);
      }
    };
    img.onerror = () => resolve(url);
    img.src = url;
  });
}

export function ProductImageEditProvider({
  productId,
  initialPhotos = [],
  children,
}: {
  productId: string;
  initialPhotos?: string[];
  children: ReactNode;
}) {
  const idc = useRef(0);
  const [images, setImages] = useState<Img[]>(
    initialPhotos.map((url) => ({ id: `init-${idc.current++}`, url })),
  );
  const [mainIdx, setMainIdx] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Charge les images déjà enregistrées (sans marquer « modifié »)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(productId));
      if (raw) {
        const urls = JSON.parse(raw) as string[];
        if (Array.isArray(urls) && urls.length) {
          setImages(urls.map((url) => ({ id: `saved-${idc.current++}`, url })));
          setMainIdx(0);
        }
      }
    } catch {
      /* ignore */
    }
  }, [productId]);

  // Le badge « Enregistré » se masque tout seul après quelques secondes
  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setJustSaved(false), 2600);
    return () => clearTimeout(t);
  }, [justSaved]);

  const addFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const next: Img[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue;
      next.push({ id: `up-${idc.current++}`, url: URL.createObjectURL(f) });
    }
    if (!next.length) return;
    setImages((prev) => {
      setMainIdx(prev.length); // sélectionne la 1ʳᵉ nouvelle image
      return [...prev, ...next];
    });
    setDirty(true);
    setJustSaved(false);
  }, []);

  const removeAt = useCallback((i: number) => {
    setImages((prev) => {
      const im = prev[i];
      if (im && im.url.startsWith("blob:")) URL.revokeObjectURL(im.url);
      return prev.filter((_, j) => j !== i);
    });
    setMainIdx((idx) => (i < idx ? idx - 1 : i === idx ? 0 : idx));
    setDirty(true);
    setJustSaved(false);
  }, []);

  const setMain = useCallback((i: number) => {
    setMainIdx(i);
    setDirty(true);
    setJustSaved(false);
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      // La couverture (mainIdx) est stockée en premier → reste la couverture
      // au rechargement.
      const ordered = [
        images[mainIdx],
        ...images.filter((_, j) => j !== mainIdx),
      ].filter(Boolean) as Img[];
      const stored = await Promise.all(
        ordered.map((im) => toStoredDataUrl(im.url)),
      );
      localStorage.setItem(storageKey(productId), JSON.stringify(stored));
      setImages(stored.map((url) => ({ id: `saved-${idc.current++}`, url })));
      setMainIdx(0);
      setDirty(false);
      setJustSaved(true);
    } catch {
      // eslint-disable-next-line no-alert
      alert(
        "Impossible d'enregistrer les images (espace de stockage insuffisant). Réduisez le nombre ou la taille des photos.",
      );
    } finally {
      setSaving(false);
    }
  }, [images, mainIdx, productId]);

  return (
    <ImagesCtx.Provider
      value={{
        images,
        mainIdx,
        dirty,
        saving,
        justSaved,
        addFiles,
        removeAt,
        setMain,
        save,
      }}
    >
      {children}
    </ImagesCtx.Provider>
  );
}

function useProductImages(): Ctx {
  const c = useContext(ImagesCtx);
  if (!c)
    throw new Error(
      "useProductImages doit être utilisé dans <ProductImageEditProvider>",
    );
  return c;
}

/* ─── Bouton Enregistrer (header) — visible uniquement si modifié ─── */

export function ProductSaveButton() {
  const { dirty, saving, justSaved, save } = useProductImages();

  if (saving) {
    return (
      <span className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-kamoo-blue-900 px-4 text-[13px] font-bold text-white opacity-90">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Enregistrement…
      </span>
    );
  }

  if (dirty) {
    return (
      <button
        type="button"
        onClick={save}
        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-kamoo-blue-900 px-4 text-[13px] font-bold text-white shadow-sm transition hover:-translate-y-px hover:bg-kamoo-blue-800"
      >
        <Save className="h-3.5 w-3.5" />
        Enregistrer
      </button>
    );
  }

  if (justSaved) {
    return (
      <span className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-50 px-3.5 text-[13px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
        <Check className="h-3.5 w-3.5" />
        Enregistré
      </span>
    );
  }

  return null;
}

/* ─── Gestionnaire d'images (hero produit) ─── */

export function ProductImageManager({
  emoji,
  bg,
  name,
}: {
  emoji: string;
  bg: string;
  name: string;
}) {
  const { images, mainIdx, dirty, addFiles, removeAt, setMain } =
    useProductImages();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const hasImages = images.length > 0;
  const safeMain = Math.min(mainIdx, Math.max(0, images.length - 1));
  const mainImage = images[safeMain];

  return (
    <div className="w-36 shrink-0">
      {/* Aperçu principal */}
      <div
        className={cn(
          "group relative aspect-square w-full overflow-hidden rounded-2xl border shadow-sm transition",
          dragOver
            ? "border-kamoo-blue-600 ring-2 ring-kamoo-blue-100"
            : "border-line",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
      >
        {hasImages ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mainImage.url}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="grid h-full w-full place-items-center text-6xl"
            style={{ background: bg }}
          >
            {emoji}
          </div>
        )}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-ink-900/70 py-1.5 text-[11px] font-bold text-white backdrop-blur-sm transition",
            hasImages ? "opacity-0 group-hover:opacity-100" : "opacity-100",
          )}
        >
          <ImagePlus className="h-3.5 w-3.5" />
          {hasImages ? "Changer" : "Ajouter une photo"}
        </button>
      </div>

      {/* Miniatures */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {images.map((img, i) => (
          <div key={img.id} className="group/thumb relative">
            <button
              type="button"
              onClick={() => setMain(i)}
              className={cn(
                "block h-10 w-10 overflow-hidden rounded-lg border-2 transition",
                i === safeMain
                  ? "border-kamoo-blue-600"
                  : "border-line hover:border-ink-300",
              )}
              title={
                i === safeMain ? "Image de couverture" : "Définir en couverture"
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
            {i === safeMain && (
              <span className="absolute -left-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-kamoo-blue-600 text-white shadow-sm">
                <Star className="h-2.5 w-2.5 fill-white" />
              </span>
            )}
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-red-600 text-white opacity-0 shadow-sm transition group-hover/thumb:opacity-100"
              aria-label="Retirer cette image"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="grid h-10 w-10 place-items-center rounded-lg border-2 border-dashed border-line text-ink-400 transition hover:border-kamoo-blue-600 hover:text-kamoo-blue-700"
          aria-label="Ajouter une image"
          title="Ajouter une image"
        >
          <ImagePlus className="h-4 w-4" />
        </button>
      </div>

      {dirty && (
        <p className="mt-2 text-[10px] font-semibold leading-tight text-kamoo-orange-600">
          Modifications non enregistrées
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
