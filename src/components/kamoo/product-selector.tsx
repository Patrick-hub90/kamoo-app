"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Check, Plus, Search, Sparkles, X } from "lucide-react";
import { MOCK_PRODUITS } from "@/lib/data/mock-produits";
import type { Produit } from "@/lib/types/produit";
import { cn } from "@/lib/utils";

type Props = {
  /** Valeur actuelle (nom du produit, vient du state du parent) */
  value: string;
  /** ID du produit du catalogue si lié, vide sinon */
  productId?: string;
  /** Callback quand l'utilisateur sélectionne un produit existant */
  onSelectExisting: (p: Produit) => void;
  /** Callback quand l'utilisateur saisit un nouveau nom (produit pas dans le catalogue) */
  onChangeNew: (name: string) => void;
};

type Position = {
  top: number;
  left: number;
  width: number;
  flipUp: boolean;
};

const DROPDOWN_HEIGHT = 360;

/**
 * Sélecteur de produit — pattern combobox moderne :
 *   - L'input EST le trigger (pas de bouton séparé qui ouvre un dropdown
 *     avec une autre recherche dedans).
 *   - Au focus / dans la frappe, la liste filtrée du catalogue s'affiche.
 *   - Si aucun résultat → message « Aucun produit trouvé pour « xxx » »
 *     + bouton bleu doux « Créer ce produit (Entrée) ».
 *   - Touche Entrée crée le produit avec le texte saisi (hors catalogue).
 *   - Rendu en Portal pour échapper aux conteneurs `overflow:auto`.
 */
export function ProductSelector({
  value,
  productId,
  onSelectExisting,
  onChangeNew,
}: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [pos, setPos] = useState<Position | null>(null);
  const [mounted, setMounted] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync : si la valeur externe change (ex : reset wizard), refléter dans l'input
  useEffect(() => {
    setDraft(value);
  }, [value]);

  // Portal SSR guard
  useEffect(() => {
    setMounted(true);
  }, []);

  const isCatalog = !!productId;
  const selectedProduit = isCatalog
    ? MOCK_PRODUITS.find((p) => p.id === productId)
    : null;

  // Filtrage catalogue par nom ou SKU
  const filtered = useMemo(() => {
    const q = draft.trim().toLowerCase();
    if (!q) return MOCK_PRODUITS;
    return MOCK_PRODUITS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
    );
  }, [draft]);

  // Quand on tape un nouveau texte qui ne match pas : on prépare le mode
  // "nouveau produit" en propageant immédiatement au parent. L'utilisateur
  // n'a pas besoin de cliquer Créer — le wizard sait déjà que c'est libre.
  // (Mais on attend Entrée / clic Créer pour fermer le dropdown.)
  const isNewProductMode = filtered.length === 0 && draft.trim().length > 0;

  // Calcule la position (flip up si pas assez de place en bas)
  const computePosition = () => {
    const input = inputRef.current;
    if (!input) return;
    const rect = input.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const flipUp = spaceBelow < DROPDOWN_HEIGHT && spaceAbove > spaceBelow;
    setPos({
      top: flipUp ? rect.top - 4 : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      flipUp,
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    computePosition();
    const handler = () => computePosition();
    window.addEventListener("scroll", handler, true);
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("scroll", handler, true);
      window.removeEventListener("resize", handler);
    };
  }, [open]);

  // Click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        inputRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }
      // Sortie : on commit ce que l'utilisateur a tapé comme nouveau produit
      // si différent de la valeur courante et hors catalogue
      commitOnBlur();
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, draft]);

  // Esc pour fermer / annuler
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDraft(value); // restaure
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, value]);

  const handleSelectExisting = (p: Produit) => {
    onSelectExisting(p);
    setDraft(p.name);
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleCreate = () => {
    const name = draft.trim();
    if (!name) return;
    onChangeNew(name);
    setOpen(false);
    inputRef.current?.blur();
  };

  const commitOnBlur = () => {
    const name = draft.trim();
    if (!name) {
      // Vide → on reset au catalogue précédent OU on garde vide
      if (selectedProduit) setDraft(selectedProduit.name);
      return;
    }
    // Si exact match catalogue → sélectionne
    const exact = MOCK_PRODUITS.find(
      (p) => p.name.toLowerCase() === name.toLowerCase(),
    );
    if (exact) {
      onSelectExisting(exact);
      return;
    }
    // Sinon → propage comme nouveau (off-catalog) si différent
    if (name !== value) {
      onChangeNew(name);
    }
  };

  const handleClear = () => {
    setDraft("");
    onChangeNew("");
    setOpen(true);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (isNewProductMode) {
        handleCreate();
      } else if (filtered.length === 1) {
        handleSelectExisting(filtered[0]);
      }
    }
  };

  return (
    <>
      {/* INPUT — c'est le trigger ET la zone de saisie */}
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border bg-white px-3 transition focus-within:border-kamoo-blue-600 focus-within:ring-2 focus-within:ring-kamoo-blue-600/12",
          open ? "border-kamoo-blue-600" : "border-input",
        )}
      >
        {selectedProduit ? (
          <div
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-sm"
            style={{ background: selectedProduit.bg }}
          >
            {selectedProduit.emoji}
          </div>
        ) : (
          <Search className="h-4 w-4 shrink-0 text-ink-400" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Rechercher ou ajouter un produit…"
          className="flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-ink-400"
        />
        {draft && (
          <button
            type="button"
            onClick={handleClear}
            className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-ink-400 hover:bg-paper-2 hover:text-ink-700"
            aria-label="Effacer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Badge Catalogue / Nouveau produit — sous l'input */}
      {value && !open && (
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
          {isCatalog ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 font-bold text-emerald-700">
              <Check className="h-2.5 w-2.5" />
              Catalogue
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-kamoo-orange-50 px-1.5 py-0.5 font-bold text-kamoo-orange-700">
              <Sparkles className="h-2.5 w-2.5" />
              Nouveau produit
            </span>
          )}
          {selectedProduit && (
            <span className="font-mono-kamoo text-ink-500">
              {selectedProduit.sku}
            </span>
          )}
        </div>
      )}

      {/* DROPDOWN via Portal */}
      {mounted &&
        open &&
        pos &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: "fixed",
              top: pos.flipUp ? undefined : pos.top,
              bottom: pos.flipUp
                ? window.innerHeight - pos.top
                : undefined,
              left: pos.left,
              width: pos.width,
              maxHeight: DROPDOWN_HEIGHT,
            }}
            className="z-[100] flex flex-col overflow-hidden rounded-xl border border-line bg-white shadow-[var(--shadow-kamoo-lg)]"
          >
            {isNewProductMode ? (
              /* État vide : aucun match → proposer la création */
              <div className="p-3">
                <p className="px-1 py-2 text-[12.5px] text-ink-700">
                  Aucun produit trouvé pour{" "}
                  <b className="text-ink-900">«&nbsp;{draft.trim()}&nbsp;»</b>
                </p>
                <button
                  type="button"
                  onClick={handleCreate}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-kamoo-blue-50 px-3 py-2.5 text-[13px] font-bold text-kamoo-blue-700 transition hover:bg-kamoo-blue-100"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Créer ce produit{" "}
                  <span className="text-[11px] font-semibold opacity-70">
                    (Entrée)
                  </span>
                </button>
              </div>
            ) : (
              /* Liste catalogue — « Créer un nouveau produit » TOUJOURS en premier */
              <div className="min-h-0 flex-1 overflow-y-auto p-1">
                <button
                  type="button"
                  onClick={() =>
                    draft.trim() ? handleCreate() : inputRef.current?.focus()
                  }
                  className="flex w-full items-center gap-3 rounded-lg bg-kamoo-blue-50/60 px-2.5 py-2.5 text-left text-[13px] font-bold text-kamoo-blue-700 transition hover:bg-kamoo-blue-100"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-dashed border-kamoo-blue-300 bg-white">
                    <Plus className="h-4 w-4" />
                  </span>
                  {draft.trim()
                    ? `Créer le produit « ${draft.trim()} »`
                    : "Créer un nouveau produit"}
                  {!draft.trim() && (
                    <span className="ml-auto text-[10.5px] font-semibold text-kamoo-blue-400">
                      tapez son nom
                    </span>
                  )}
                </button>
                <div className="my-1 h-px bg-line" />
                {filtered.map((p) => {
                  const isSelected = productId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectExisting(p)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition hover:bg-paper-2",
                        isSelected && "bg-kamoo-blue-50",
                      )}
                    >
                      <div
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-lg"
                        style={{ background: p.bg }}
                      >
                        {p.emoji}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-[13px] font-bold text-ink-900">
                            {p.name}
                          </span>
                          {!p.isActive && (
                            <span className="shrink-0 rounded-full bg-paper-2 px-1.5 py-0.5 text-[9px] font-bold text-ink-500">
                              Inactif
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-ink-500">
                          <span className="font-mono-kamoo">{p.sku}</span>
                          <span className="text-ink-300">·</span>
                          <span>Stock {p.stock}</span>
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 shrink-0 text-kamoo-blue-700" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
