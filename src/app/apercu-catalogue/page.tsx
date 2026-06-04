"use client";

/**
 * /apercu-catalogue — prototype d'identité (écran 2 : Catalogue).
 * Même shell navy + Poppins que /apercu. Teste la densité & les tableaux.
 */

import { useMemo, useState } from "react";
import { LayoutGrid, List, MoreHorizontal, Plus, Search } from "lucide-react";
import { PreviewShell, Header, CARD, LABEL } from "@/components/apercu/preview-shell";
import { MOCK_PRODUITS } from "@/lib/data/mock-produits";
import { formatXOF } from "@/lib/format";

const POPPINS = "'Poppins', sans-serif";

type StockLevel = "ok" | "bas" | "rupture";
function stockLevel(stock: number, threshold: number): StockLevel {
  if (stock <= 0) return "rupture";
  if (stock <= threshold) return "bas";
  return "ok";
}

type TabKey = "tous" | "actifs" | "bas" | "rupture" | "inactifs";

export default function ApercuCataloguePage() {
  const [tab, setTab] = useState<TabKey>("tous");
  const [view, setView] = useState<"table" | "cards">("table");
  const [query, setQuery] = useState("");

  const products = MOCK_PRODUITS;

  /* KPIs */
  const kpis = useMemo(() => {
    const actifs = products.filter((p) => p.isActive);
    const valeurStock = products.reduce((s, p) => s + p.stock * (p.costPriceXof ?? 0), 0);
    const unitesActives = actifs.reduce((s, p) => s + p.stock, 0);
    const alertes = actifs.filter((p) => stockLevel(p.stock, p.lowStockThreshold ?? 10) !== "ok").length;
    return { actifs: actifs.length, total: products.length, valeurStock, unitesActives, alertes };
  }, [products]);

  /* Filtres */
  const counts = useMemo(
    () => ({
      tous: products.length,
      actifs: products.filter((p) => p.isActive).length,
      bas: products.filter((p) => p.isActive && stockLevel(p.stock, p.lowStockThreshold ?? 10) === "bas").length,
      rupture: products.filter((p) => stockLevel(p.stock, p.lowStockThreshold ?? 10) === "rupture").length,
      inactifs: products.filter((p) => !p.isActive).length,
    }),
    [products],
  );

  const rows = useMemo(() => {
    let r = products;
    if (tab === "actifs") r = r.filter((p) => p.isActive);
    else if (tab === "bas") r = r.filter((p) => p.isActive && stockLevel(p.stock, p.lowStockThreshold ?? 10) === "bas");
    else if (tab === "rupture") r = r.filter((p) => stockLevel(p.stock, p.lowStockThreshold ?? 10) === "rupture");
    else if (tab === "inactifs") r = r.filter((p) => !p.isActive);
    const q = query.trim().toLowerCase();
    if (q) r = r.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    return r;
  }, [products, tab, query]);

  const TABS: { key: TabKey; label: string }[] = [
    { key: "tous", label: "Tous" },
    { key: "actifs", label: "Actifs" },
    { key: "bas", label: "Stock bas" },
    { key: "rupture", label: "Rupture" },
    { key: "inactifs", label: "Inactifs" },
  ];

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap"
      />

      <PreviewShell
        variant="navy"
        fontFamily={POPPINS}
        activeHref="/apercu-catalogue"
        header={
          <Header
            eyebrow="Mon activité"
            title="Catalogue"
            right={
              <button className="flex h-9 items-center gap-1.5 rounded-lg bg-kamoo-blue-900 px-3.5 text-[13px] font-semibold text-white transition hover:bg-kamoo-blue-800">
                <Plus className="h-4 w-4" />
                Nouveau produit
              </button>
            }
          />
        }
      >
        <div className="mx-auto flex max-w-[1320px] flex-col gap-4 px-6 py-6">
          {/* KPI strip */}
          <div className="grid grid-cols-4 gap-4">
            <Stat label="Produits actifs" value={`${kpis.actifs}`} suffix={`/ ${kpis.total}`} />
            <Stat label="Valeur du stock" value={formatXOF(kpis.valeurStock, false)} suffix="F" />
            <Stat label="Unités en stock" value={formatXOF(kpis.unitesActives, false)} suffix="u" />
            <Stat label="Alertes stock" value={`${kpis.alertes}`} suffix="produits" tone={kpis.alertes > 0 ? "warn" : undefined} />
          </div>

          {/* Barre filtres */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-lg bg-[#EEF0F3] p-1">
              {TABS.map((tb) => (
                <button
                  key={tb.key}
                  onClick={() => setTab(tb.key)}
                  className={[
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-semibold transition",
                    tab === tb.key ? "bg-white text-ink-900 shadow-[0_1px_2px_rgba(16,24,40,0.08)]" : "text-[#6B7280] hover:text-ink-900",
                  ].join(" ")}
                >
                  {tb.label}
                  <span className={tab === tb.key ? "text-[#9AA1AD]" : "text-[#B4BAC4]"}>{counts[tb.key]}</span>
                </button>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <div className="flex h-9 items-center gap-2 rounded-lg border border-[#E4E7EC] bg-white px-3">
                <Search className="h-3.5 w-3.5 text-[#98A0AC]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher un produit…"
                  className="w-44 bg-transparent text-[12.5px] text-ink-900 outline-none placeholder:text-[#A7AEBA]"
                />
              </div>
              <div className="flex items-center gap-0.5 rounded-lg border border-[#E4E7EC] bg-white p-0.5">
                <ViewBtn active={view === "table"} onClick={() => setView("table")}>
                  <List className="h-4 w-4" />
                </ViewBtn>
                <ViewBtn active={view === "cards"} onClick={() => setView("cards")}>
                  <LayoutGrid className="h-4 w-4" />
                </ViewBtn>
              </div>
            </div>
          </div>

          {/* Contenu */}
          {view === "table" ? <ProductTable rows={rows} /> : <ProductCards rows={rows} />}

          <div className="py-2 text-center text-[11px] text-[#A7AEBA]">
            Prototype d'identité · écran 2 (Catalogue) — /boutique réel intact
          </div>
        </div>
      </PreviewShell>
    </>
  );
}

/* ── KPI ── */
function Stat({
  label,
  value,
  suffix,
  tone,
}: {
  label: string;
  value: string;
  suffix?: string;
  tone?: "warn";
}) {
  return (
    <div className={`${CARD} flex flex-col gap-1.5 p-4`}>
      <div className={LABEL}>{label}</div>
      <div className="flex items-baseline gap-1">
        <span className={`text-[22px] font-bold tracking-tight tabular-nums ${tone === "warn" ? "text-amber-600" : "text-ink-900"}`}>
          {value}
        </span>
        {suffix && <span className="text-[12px] font-medium text-[#A7AEBA]">{suffix}</span>}
      </div>
    </div>
  );
}

function ViewBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={[
        "grid h-7 w-7 place-items-center rounded-md transition",
        active ? "bg-kamoo-blue-900 text-white" : "text-[#98A0AC] hover:bg-[#F2F4F7]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/* ── Stock cell ── */
function StockCell({ stock, threshold }: { stock: number; threshold: number }) {
  const lvl = stockLevel(stock, threshold);
  const dot = lvl === "ok" ? "#16A34A" : lvl === "bas" ? "#D97706" : "#DC2626";
  const label = lvl === "ok" ? "" : lvl === "bas" ? "Bas" : "Rupture";
  return (
    <div className="flex items-center justify-end gap-2">
      {label && (
        <span
          className={[
            "rounded px-1.5 py-0.5 text-[10px] font-semibold",
            lvl === "bas" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600",
          ].join(" ")}
        >
          {label}
        </span>
      )}
      <span className="inline-flex items-center gap-1.5 tabular-nums">
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dot }} />
        {stock}
      </span>
    </div>
  );
}

/* ── Table ── */
function ProductTable({ rows }: { rows: typeof MOCK_PRODUITS }) {
  return (
    <div className={`${CARD} overflow-hidden`}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#F1F2F4] text-[10.5px] uppercase tracking-[0.05em] text-[#A7AEBA]">
            <th className="px-5 py-3 text-left font-semibold">Produit</th>
            <th className="px-3 py-3 text-right font-semibold">Prix</th>
            <th className="px-3 py-3 text-right font-semibold">Bénéfice / u</th>
            <th className="px-3 py-3 text-right font-semibold">Stock</th>
            <th className="px-3 py-3 text-right font-semibold">Vendus (mois)</th>
            <th className="px-3 py-3 text-right font-semibold">CA (mois)</th>
            <th className="px-3 py-3 text-center font-semibold">Statut</th>
            <th className="px-5 py-3 text-right font-semibold"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F4F5F6]">
          {rows.map((p) => {
            const benefice = p.priceXof - (p.costPriceXof ?? 0);
            return (
              <tr key={p.id} className="transition hover:bg-[#FAFBFC]">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[17px]"
                      style={{ background: p.bg }}
                    >
                      {p.emoji}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-[12.5px] font-semibold text-ink-900">{p.name}</div>
                      <div className="text-[11px] text-[#A7AEBA]">{p.sku}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-right text-[12.5px] tabular-nums text-ink-700">{formatXOF(p.priceXof, false)}</td>
                <td className="px-3 py-3 text-right text-[12.5px] font-semibold tabular-nums text-emerald-600">
                  +{formatXOF(benefice, false)}
                </td>
                <td className="px-3 py-3 text-right text-[12.5px] text-ink-700">
                  <StockCell stock={p.stock} threshold={p.lowStockThreshold ?? 10} />
                </td>
                <td className="px-3 py-3 text-right text-[12.5px] tabular-nums text-ink-700">{p.soldThisMonth ?? 0}</td>
                <td className="px-3 py-3 text-right text-[12.5px] font-semibold tabular-nums text-ink-900">
                  {formatXOF(p.revenueThisMonthXof ?? 0, false)}
                </td>
                <td className="px-3 py-3 text-center">
                  <span
                    className={[
                      "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                      p.isActive ? "bg-emerald-50 text-emerald-700" : "bg-ink-100 text-ink-500",
                    ].join(" ")}
                  >
                    {p.isActive ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button className="grid h-7 w-7 place-items-center rounded-md text-[#98A0AC] transition hover:bg-[#F2F4F7] hover:text-ink-700">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div className="px-5 py-10 text-center text-[13px] text-[#A7AEBA]">Aucun produit dans ce filtre.</div>
      )}
    </div>
  );
}

/* ── Cards ── */
function ProductCards({ rows }: { rows: typeof MOCK_PRODUITS }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {rows.map((p) => {
        const benefice = p.priceXof - (p.costPriceXof ?? 0);
        return (
          <div key={p.id} className={`${CARD} flex flex-col overflow-hidden`}>
            <div className="relative h-24" style={{ background: p.bg }}>
              <span className="absolute inset-0 grid place-items-center text-[34px]">{p.emoji}</span>
              <span
                className={[
                  "absolute right-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-semibold",
                  p.isActive ? "bg-white/90 text-emerald-700" : "bg-white/90 text-ink-500",
                ].join(" ")}
              >
                {p.isActive ? "Actif" : "Inactif"}
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-3 p-3.5">
              <div>
                <div className="truncate text-[13px] font-semibold text-ink-900">{p.name}</div>
                <div className="text-[11px] text-[#A7AEBA]">{p.sku}</div>
              </div>
              <div className="grid grid-cols-3 gap-2 border-t border-[#F4F5F6] pt-3 text-center">
                <MiniStat label="Prix" value={formatXOF(p.priceXof, false)} />
                <MiniStat label="Bénéf/u" value={`+${formatXOF(benefice, false)}`} tone="pos" />
                <MiniStat label="Stock" value={`${p.stock}`} tone={stockLevel(p.stock, p.lowStockThreshold ?? 10) !== "ok" ? "warn" : undefined} />
              </div>
              <button className="mt-auto flex h-8 items-center justify-center rounded-lg border border-[#E4E7EC] text-[12px] font-semibold text-ink-700 transition hover:bg-[#F7F8FA]">
                Gérer →
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: "pos" | "warn" }) {
  const color = tone === "pos" ? "text-emerald-600" : tone === "warn" ? "text-amber-600" : "text-ink-900";
  return (
    <div>
      <div className={`text-[12px] font-semibold tabular-nums ${color}`}>{value}</div>
      <div className="text-[10px] text-[#A7AEBA]">{label}</div>
    </div>
  );
}
