"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bike,
  CornerDownLeft,
  Headset,
  LayoutGrid,
  Package,
  Phone,
  Search,
  Ship,
  Truck,
  User,
  Users,
} from "lucide-react";
import { MOCK_PRODUITS } from "@/lib/data/mock-produits";
import { MOCK_CLIENTS } from "@/lib/data/mock-clients";
import { MOCK_CLOSING_ASSIGNMENTS } from "@/lib/data/mock-closing";
import { MOCK_EXPEDITIONS } from "@/lib/data/mock-expeditions";
import { MOCK_TRANSITAIRES } from "@/lib/data/mock-transitaires";
import { MOCK_CLOSEUSES } from "@/lib/data/mock-closeuses";
import { MOCK_LIVREURS } from "@/lib/data/mock-livreurs";
import { cn } from "@/lib/utils";

/** Événement global pour ouvrir la recherche depuis n'importe où (sidebar…). */
export const OPEN_SEARCH_EVENT = "kamoo:open-search";

type Item = {
  id: string;
  group: string;
  label: string;
  sub?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Texte indexé pour le matching */
  haystack: string;
};

const PAGES: { label: string; href: string }[] = [
  { label: "Vue d'ensemble", href: "/dashboard" },
  { label: "Catalogue", href: "/boutique" },
  { label: "Clients", href: "/clients" },
  { label: "Closing", href: "/closing" },
  { label: "Livraisons", href: "/livraisons" },
  { label: "Expéditions", href: "/expeditions" },
  { label: "Finances", href: "/finances" },
  { label: "Marketplace · Transitaires", href: "/marketplace/transitaires" },
  { label: "Marketplace · Closeuses", href: "/marketplace/closeurs" },
  { label: "Marketplace · Livreurs", href: "/marketplace/livreurs" },
  { label: "Paramètres", href: "/parametres/compte" },
];

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  /* Index complet — construit une fois. */
  const index = useMemo<Item[]>(() => {
    const items: Item[] = [];
    for (const p of PAGES) {
      items.push({
        id: `page:${p.href}`,
        group: "Pages",
        label: p.label,
        href: p.href,
        icon: LayoutGrid,
        haystack: norm(p.label),
      });
    }
    for (const p of MOCK_PRODUITS) {
      items.push({
        id: `prod:${p.id}`,
        group: "Produits",
        label: p.name,
        sub: `${p.priceXof.toLocaleString("fr-FR")} F CFA`,
        href: `/boutique/${p.id}`,
        icon: Package,
        haystack: norm(`${p.name} ${p.sku ?? ""}`),
      });
    }
    for (const c of MOCK_CLIENTS) {
      items.push({
        id: `cli:${c.id}`,
        group: "Clients",
        label: c.name,
        sub: `${c.phone} · ${c.city}`,
        href: `/clients/${c.id}`,
        icon: User,
        haystack: norm(`${c.name} ${c.phone.replace(/\s/g, "")} ${c.city}`),
      });
    }
    for (const a of MOCK_CLOSING_ASSIGNMENTS) {
      items.push({
        id: `ord:${a.id}`,
        group: "Commandes",
        label: a.id,
        sub: `${a.client.name} · ${a.items[0]?.productName ?? ""}`,
        href: `/closing/${a.id}`,
        icon: Phone,
        haystack: norm(`${a.id} ${a.client.name} ${a.items.map((i) => i.productName).join(" ")}`),
      });
    }
    for (const e of MOCK_EXPEDITIONS) {
      items.push({
        id: `exp:${e.id}`,
        group: "Expéditions",
        label: e.publicCode,
        sub: `${e.productName} · ${e.transitaire.name}`,
        href: `/expeditions/${e.id}`,
        icon: Ship,
        haystack: norm(`${e.publicCode} ${e.productName} ${e.transitaire.name}`),
      });
    }
    for (const t of MOCK_TRANSITAIRES) {
      items.push({
        id: `tr:${t.slug}`,
        group: "Transitaires",
        label: t.name,
        sub: t.city,
        href: `/marketplace/transitaires/${t.slug}`,
        icon: Truck,
        haystack: norm(`${t.name} ${t.city}`),
      });
    }
    for (const c of MOCK_CLOSEUSES) {
      items.push({
        id: `clz:${c.slug}`,
        group: "Closeuses",
        label: c.name,
        sub: c.city,
        href: `/marketplace/closeurs/${c.slug}`,
        icon: Headset,
        haystack: norm(`${c.name} ${c.city}`),
      });
    }
    for (const l of MOCK_LIVREURS) {
      items.push({
        id: `liv:${l.slug}`,
        group: "Livreurs",
        label: l.name,
        sub: l.city,
        href: `/marketplace/livreurs/${l.slug}`,
        icon: Bike,
        haystack: norm(`${l.name} ${l.city}`),
      });
    }
    return items;
  }, []);

  const results = useMemo<Item[]>(() => {
    const q = norm(query.trim());
    if (!q) {
      // Sans requête : accès rapide aux pages
      return index.filter((i) => i.group === "Pages").slice(0, 8);
    }
    const words = q.split(/\s+/);
    return index
      .filter((i) => words.every((w) => i.haystack.includes(w)))
      .slice(0, 12);
  }, [index, query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setCursor(0);
  }, []);

  const go = useCallback(
    (item: Item) => {
      close();
      router.push(item.href);
    },
    [router, close],
  );

  /* Raccourci clavier + événement global */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_SEARCH_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_SEARCH_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  useEffect(() => setCursor(0), [query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center bg-kamoo-blue-900/30 p-4 pt-[12vh] backdrop-blur-[2px]"
      onClick={close}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-2.5 border-b border-line px-4">
          <Search className="h-4 w-4 shrink-0 text-ink-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") close();
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setCursor((c) => Math.min(c + 1, results.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setCursor((c) => Math.max(c - 1, 0));
              }
              if (e.key === "Enter" && results[cursor]) go(results[cursor]);
            }}
            placeholder="Rechercher une commande, un client, un produit, une expédition…"
            className="h-12 w-full bg-transparent text-[13.5px] text-ink-900 outline-none placeholder:text-ink-400"
          />
          <kbd className="shrink-0 rounded border border-line bg-paper-2 px-1.5 py-0.5 text-[10px] font-semibold text-ink-500">
            Échap
          </kbd>
        </div>

        {/* Résultats */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="px-3 py-8 text-center text-[13px] text-ink-400">
              Aucun résultat pour « {query} »
            </div>
          ) : (
            results.map((item, i) => {
              const isFirstOfGroup = i === 0 || results[i - 1].group !== item.group;
              return (
                <div key={item.id}>
                  {isFirstOfGroup && (
                    <div className="px-2.5 pb-1 pt-2.5 text-[10.5px] font-bold uppercase tracking-wide text-ink-400">
                      {item.group}
                    </div>
                  )}
                  <button
                    onClick={() => go(item)}
                    onMouseEnter={() => setCursor(i)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition",
                      i === cursor ? "bg-kamoo-blue-50" : "hover:bg-paper-2",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-7 w-7 shrink-0 place-items-center rounded-lg",
                        i === cursor ? "bg-white text-kamoo-blue-700" : "bg-paper-2 text-ink-500",
                      )}
                    >
                      <item.icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-ink-900">{item.label}</span>
                      {item.sub && <span className="block truncate text-[11px] text-ink-500">{item.sub}</span>}
                    </span>
                    {i === cursor && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-ink-400" />}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Pied */}
        <div className="flex items-center gap-3 border-t border-line bg-paper-2/50 px-4 py-2 text-[10.5px] text-ink-400">
          <span><kbd className="rounded border border-line bg-white px-1">↑↓</kbd> naviguer</span>
          <span><kbd className="rounded border border-line bg-white px-1">Entrée</kbd> ouvrir</span>
          <span className="ml-auto inline-flex items-center gap-1"><Users className="h-3 w-3" /> Kamoo</span>
        </div>
      </div>
    </div>
  );
}
