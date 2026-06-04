"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { StatCard } from "@/components/kamoo/stat-card";
import {
  DateRangeFilter,
  type DateFilterValue,
} from "@/components/kamoo/date-range-filter";
import { CashflowChart } from "@/components/finance/cashflow-chart";
import { PendingVersementRow } from "@/components/finance/pending-versement-row";
import { RefuseVersementDialog } from "@/components/finance/refuse-versement-dialog";
import {
  MOCK_FINANCE_MOVEMENTS,
  MOCK_TODAY,
} from "@/lib/data/mock-finances";
import { computeProductsProfitabilityForPeriod } from "@/lib/data/product-profitability";
import {
  computeCashflowTimeline,
  computeCostBreakdown,
  computeFinanceStats,
  computePartnerBalances,
  computePorterDebts,
  DISPUTE_TYPE_LABELS,
  MOVEMENT_TYPE_TONE,
  PARTNER_TYPE_LABELS,
  type Dispute,
  type Partner,
  type PartnerBalance,
  type PorterDebt,
  type TimelinePeriod,
  type Versement,
} from "@/lib/types/finance";
import { useSessionStorageState } from "@/lib/hooks/use-session-storage-state";
import { useVersementsState } from "@/lib/hooks/use-versements-state";
import {
  bucketingForDateFilter,
  chartEndDateForFilter,
  dateFilterSubtitle,
  filterByDate,
  normalizeDateFilter,
} from "@/lib/utils/date-filter";
import { dateFilterToSearchParams } from "@/lib/utils/date-filter-url";
import { formatXOF } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function FinancesOverviewPage() {
  const allMovements = MOCK_FINANCE_MOVEMENTS;

  // État partagé Aperçu ↔ Journal (sessionStorage)
  const { versements, disputes, validateVersement, refuseVersement } =
    useVersementsState();

  // Versement en cours d'invalidation (pour la modale "Pas reçu")
  const [refusing, setRefusing] = useState<Versement | null>(null);

  // Période partagée avec /dashboard (graphe Évolution) — sync auto
  const [dateFilter, setDateFilter] = useSessionStorageState<DateFilterValue>(
    "kamoo.financePeriod",
    { preset: "today" },
  );

  const normalizedFilter = useMemo(
    () => normalizeDateFilter(dateFilter),
    [dateFilter],
  );

  const movements = useMemo(
    () => filterByDate(allMovements, normalizedFilter, MOCK_TODAY),
    [allMovements, normalizedFilter],
  );

  const periodStats = useMemo(
    () => computeFinanceStats(movements),
    [movements],
  );
  const lifetimeStats = useMemo(
    () => computeFinanceStats(allMovements),
    [allMovements],
  );

  const safeMarginDisplay: { value: string; isMissing: boolean } = useMemo(() => {
    if (periodStats.caTotal === 0) {
      return { value: "—", isMissing: true };
    }
    const pct = periodStats.margePct;
    if (pct < -999) return { value: "< −999%", isMissing: false };
    if (pct > 999) return { value: "> +999%", isMissing: false };
    return { value: `${pct}%`, isMissing: false };
  }, [periodStats.caTotal, periodStats.margePct]);

  const breakdown = useMemo(
    () => computeCostBreakdown(movements),
    [movements],
  );
  const partnerBalances = useMemo(
    () => computePartnerBalances(allMovements),
    [allMovements],
  );

  // Dette par livreur recalculée à chaque changement de versements
  const porterDebts = useMemo(
    () => computePorterDebts(allMovements, versements),
    [allMovements, versements],
  );
  const totalAtPorters = useMemo(
    () => porterDebts.reduce((s, d) => s + d.dueNet, 0),
    [porterDebts],
  );

  const pendingVersements = useMemo(
    () =>
      versements
        .filter((v) => v.status === "en_attente_validation")
        .sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [versements],
  );
  const totalPending = useMemo(
    () => pendingVersements.reduce((s, v) => s + v.amountXof, 0),
    [pendingVersements],
  );

  const activeDisputes = useMemo(
    () =>
      disputes.filter(
        (d) => d.status === "ouvert" || d.status === "en_resolution",
      ),
    [disputes],
  );

  // Total à recevoir (KPI) = cash chez les livreurs.
  // Les versements en attente sont DÉJÀ inclus dedans tant que le vendeur n'a
  // pas validé (un versement déclaré mais pas confirmé reste considéré comme
  // chez le livreur). C'est ce qui garantit la cohérence visuelle :
  //   KPI "À recevoir" === total "Argent chez les livreurs"
  const totalReceivable = totalAtPorters;

  const productsProfitability = useMemo(
    () => computeProductsProfitabilityForPeriod(movements),
    [movements],
  );

  const { granularity, count } = useMemo(
    () => bucketingForDateFilter(normalizedFilter),
    [normalizedFilter],
  );
  const chartEndDate = useMemo(
    () => chartEndDateForFilter(normalizedFilter, MOCK_TODAY),
    [normalizedFilter],
  );
  const timeline = useMemo(
    () =>
      computeCashflowTimeline(allMovements, granularity, count, chartEndDate),
    [allMovements, granularity, count, chartEndDate],
  );

  const topPartnersDue = partnerBalances
    .filter((b) => b.amountDue > 0 && b.partner.type !== "livreur")
    .slice(0, 3);

  const profitableProducts = productsProfitability.filter(
    (p) => p.netGrossProfitXof > 0,
  );
  const topProductsByMargin = profitableProducts.slice(0, 5);
  const remainingProfitableCount = Math.max(
    0,
    profitableProducts.length - topProductsByMargin.length,
  );

  const boutiqueWithPeriodHref = useMemo(
    () => `/boutique?${dateFilterToSearchParams(normalizedFilter)}`,
    [normalizedFilter],
  );

  const handleRefuseAction = (versement: Versement) => {
    refuseVersement(versement);
    setRefusing(null);
  };

  return (
    <div className="flex h-full flex-col">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-line bg-white px-10 py-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink-900">
            Finances · Aperçu
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            La photo financière de votre business ·{" "}
            {dateFilterSubtitle(normalizedFilter)}
          </p>
        </div>
        <DateRangeFilter value={dateFilter} onChange={setDateFilter} />
      </div>

      <div className="flex-1 overflow-auto px-10 py-6">
        {/* ─── BLOC 1 — KPIs ─── */}
        <div className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-ink-500">
          Les chiffres qui comptent
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard
            label="CA total vendu"
            value={formatXOF(periodStats.caTotal, false)}
            unit="F CFA"
            icon={<TrendingUp className="h-4 w-4" />}
            tone="green"
            highlight={periodStats.caTotal > 0}
          />
          <StatCard
            label="Bénéfice brut"
            value={formatXOF(periodStats.beneficeBrut, false)}
            unit="F CFA"
            icon={
              periodStats.beneficeBrut >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )
            }
            tone={periodStats.beneficeBrut >= 0 ? "green" : "orange"}
            highlight={periodStats.beneficeBrut > 0}
          />
          <StatCard
            label="Marge brute"
            value={safeMarginDisplay.value}
            unit={safeMarginDisplay.isMissing ? "—" : "sur le CA"}
            icon={<TrendingUp className="h-4 w-4" />}
            tone={
              safeMarginDisplay.isMissing
                ? "blue"
                : periodStats.margePct >= 30
                  ? "green"
                  : "orange"
            }
            highlight={
              !safeMarginDisplay.isMissing && periodStats.margePct >= 30
            }
          />
          <StatCard
            label="À recevoir"
            value={formatXOF(totalReceivable, false)}
            unit="F CFA"
            icon={<ArrowUpRight className="h-4 w-4" />}
            tone="blue"
            highlight={totalReceivable > 0}
            badge={pendingVersements.length > 0}
          />
          <StatCard
            label="À payer"
            value={formatXOF(lifetimeStats.soldeDu, false)}
            unit="F CFA"
            icon={<ArrowDownRight className="h-4 w-4" />}
            tone="orange"
            highlight={lifetimeStats.soldeDu > 0}
            badge
          />
        </div>

        {/* ─── BLOC 2 — Évolution trésorerie ─── */}
        <div className="mt-6 rounded-2xl border border-line bg-white p-6">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="font-display text-lg font-extrabold text-ink-900">
                Chiffre d&apos;affaire
              </h2>
              <p className="mt-0.5 text-[12.5px] text-ink-500">
                {bucketingSubtitle(granularity, count)}
              </p>
            </div>
            <div className="flex items-center gap-5 text-[12px]">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
                <span className="font-semibold text-ink-700">Rentré</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-amber-100" />
                <span className="font-semibold text-ink-700">Sorti</span>
              </div>
            </div>
          </div>

          <CashflowChart timeline={timeline} />
        </div>

        {/* ─── BLOC 3 — Recettes / Charges ─── */}
        <div className="mt-6 grid grid-cols-[1fr_1.2fr] gap-5">
          <div className="rounded-2xl border border-line bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-extrabold text-ink-900">
                  Recettes
                </h2>
                <p className="mt-0.5 text-[12.5px] text-ink-500">
                  Vos meilleurs produits par bénéfice net
                </p>
              </div>
              <Link
                href={boutiqueWithPeriodHref}
                className="text-[12px] font-bold text-kamoo-blue-700 hover:underline"
              >
                Tout voir →
              </Link>
            </div>

            {topProductsByMargin.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line bg-paper-2/30 px-3 py-6 text-center text-[12.5px] text-ink-500">
                Aucune vente livrée pour le moment.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {topProductsByMargin.map((p) => (
                  <Link
                    key={p.product.id}
                    href={`/boutique/${p.product.id}`}
                    className="group flex items-center gap-3 rounded-xl border border-line p-2.5 transition hover:border-kamoo-blue-600 hover:bg-paper-2"
                  >
                    <div
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-lg"
                      style={{ background: p.product.bg }}
                    >
                      {p.product.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12.5px] font-bold text-ink-900 group-hover:text-kamoo-blue-700">
                        {p.product.name}
                      </div>
                      <div className="mt-0.5 text-[10.5px] text-ink-500">
                        × {p.qtyDelivered} livrées · marge {p.marginPct}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display font-extrabold text-emerald-700 tabular-nums">
                        +{formatXOF(p.netGrossProfitXof, false)}
                        <span className="ml-0.5 text-[10px] font-bold">F</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {remainingProfitableCount > 0 && (
              <Link
                href={boutiqueWithPeriodHref}
                className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-line py-2 text-[12px] font-bold text-kamoo-blue-700 transition hover:border-kamoo-blue-600 hover:bg-kamoo-blue-50"
              >
                + {remainingProfitableCount} autre
                {remainingProfitableCount > 1 ? "s" : ""} produit
                {remainingProfitableCount > 1 ? "s" : ""} rentable
                {remainingProfitableCount > 1 ? "s" : ""}
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          <div className="rounded-2xl border border-line bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-extrabold text-ink-900">
                  Charges
                </h2>
                <p className="mt-0.5 text-[12.5px] text-ink-500">
                  Ventilation par poste de dépense
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {breakdown.map((b) => {
                const tone = MOVEMENT_TYPE_TONE[b.type];
                const isZero = b.amount === 0;
                return (
                  <div
                    key={b.type}
                    className={cn(
                      "flex flex-col gap-1.5 transition",
                      isZero && "opacity-50",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold",
                            tone.bg,
                            tone.fg,
                          )}
                        >
                          {b.label}
                        </span>
                      </div>
                      <div className="text-right">
                        {isZero ? (
                          <span className="text-[12px] font-semibold text-ink-400">
                            —
                          </span>
                        ) : (
                          <>
                            <span className="font-display font-extrabold text-ink-900">
                              {formatXOF(b.amount, false)}
                            </span>
                            <span className="ml-1 text-[11px] font-semibold text-ink-500">
                              F · {b.pct}%
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-paper-2">
                      <div
                        className={cn(
                          "h-full rounded-full transition-[width]",
                          b.type === "cout_marchandise" && "bg-rose-500",
                          b.type === "commission_closeuse" &&
                            "bg-kamoo-blue-600",
                          b.type === "frais_livreur" && "bg-cyan-500",
                          b.type === "frais_transit" && "bg-amber-500",
                          b.type === "depense_pub" && "bg-purple-500",
                          b.type === "remboursement" && "bg-red-500",
                          b.type === "vente_encaissee" && "bg-emerald-500",
                        )}
                        style={{ width: `${b.pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── BLOC 4 — Argent à recevoir (le cœur du nouveau flow) ─── */}
        <div className="mt-6 grid grid-cols-2 gap-5">
          {/* Argent chez les livreurs */}
          <div className="rounded-2xl border border-line bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-cyan-700" />
                <h2 className="font-display text-base font-extrabold text-ink-900">
                  Argent chez les livreurs
                </h2>
              </div>
              <div className="font-display text-lg font-extrabold text-cyan-700 tabular-nums">
                {formatXOF(totalAtPorters, false)}
                <span className="ml-0.5 text-[10px] font-bold text-ink-500">
                  F
                </span>
              </div>
            </div>

            {porterDebts.length === 0 ? (
              <div className="rounded-xl bg-emerald-50/60 px-3 py-4 text-center text-[12.5px] text-emerald-800">
                <Check className="mx-auto h-5 w-5 text-emerald-600" />
                <p className="mt-1.5 font-semibold">
                  Aucun livreur ne détient votre cash
                </p>
              </div>
            ) : (
              <div
                className="flex max-h-[320px] flex-col gap-2 overflow-y-auto pr-1"
                style={{
                  scrollbarColor: "#D1D5DB #F5F5EE",
                  scrollbarWidth: "thin",
                }}
              >
                {porterDebts.map((d) => (
                  <PorterDebtRow key={d.porter.ref} debt={d} />
                ))}
              </div>
            )}
          </div>

          {/* Versements à valider */}
          <div className="rounded-2xl border border-line bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-amber-700" />
                <h2 className="font-display text-base font-extrabold text-ink-900">
                  Versements à valider
                </h2>
                {pendingVersements.length > 0 && (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10.5px] font-bold text-amber-800">
                    {pendingVersements.length}
                  </span>
                )}
              </div>
              {pendingVersements.length > 0 && (
                <div className="font-display text-lg font-extrabold text-amber-700 tabular-nums">
                  {formatXOF(totalPending, false)}
                  <span className="ml-0.5 text-[10px] font-bold text-ink-500">
                    F
                  </span>
                </div>
              )}
            </div>

            {pendingVersements.length === 0 ? (
              <div className="rounded-xl bg-emerald-50/60 px-3 py-4 text-center text-[12.5px] text-emerald-800">
                <Check className="mx-auto h-5 w-5 text-emerald-600" />
                <p className="mt-1.5 font-semibold">
                  Aucun versement en attente
                </p>
              </div>
            ) : (
              <div
                className="flex max-h-[320px] flex-col gap-2 overflow-y-auto pr-1"
                style={{
                  scrollbarColor: "#D1D5DB #F5F5EE",
                  scrollbarWidth: "thin",
                }}
              >
                {pendingVersements.map((v) => (
                  <PendingVersementRow
                    key={v.id}
                    versement={v}
                    onValidate={() => validateVersement(v.id)}
                    onRefuse={() => setRefusing(v)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── BLOC 5 — À régler bientôt + Litiges ─── */}
        <div className="mt-6 grid grid-cols-2 gap-5">
          {/* À payer */}
          <div className="rounded-2xl border border-line bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-700" />
                <h2 className="font-display text-base font-extrabold text-ink-900">
                  À régler bientôt
                </h2>
              </div>
              <Link
                href="/finances/journal"
                className="text-[12px] font-bold text-kamoo-blue-700 hover:underline"
              >
                Tout voir →
              </Link>
            </div>

            {topPartnersDue.length === 0 ? (
              <div className="rounded-xl bg-emerald-50/60 px-3 py-4 text-center text-[12.5px] text-emerald-800">
                <Check className="mx-auto h-5 w-5 text-emerald-600" />
                <p className="mt-1.5 font-semibold">
                  Tous vos partenaires sont à jour
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {topPartnersDue.map((b) => (
                  <PartnerDueRow
                    key={`${b.partner.type}:${b.partner.name}`}
                    balance={b}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Litiges en cours */}
          <div className="rounded-2xl border border-line bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <h2 className="font-display text-base font-extrabold text-ink-900">
                  Litiges en cours
                </h2>
                {activeDisputes.length > 0 && (
                  <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10.5px] font-bold text-red-700">
                    {activeDisputes.length}
                  </span>
                )}
              </div>
            </div>

            {activeDisputes.length === 0 ? (
              <div className="rounded-xl bg-emerald-50/60 px-3 py-4 text-center text-[12.5px] text-emerald-800">
                <Check className="mx-auto h-5 w-5 text-emerald-600" />
                <p className="mt-1.5 font-semibold">Aucun litige ouvert</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {activeDisputes.map((d) => (
                  <DisputeRow key={d.id} dispute={d} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Modal "Pas reçu" ─── */}
      <RefuseVersementDialog
        versement={refusing}
        onClose={() => setRefusing(null)}
        onCreateDispute={handleRefuseAction}
      />
    </div>
  );
}

/* ─── Sub-components ─── */

function bucketingSubtitle(
  granularity: TimelinePeriod,
  count: number,
): string {
  const grain =
    granularity === "day"
      ? "jour"
      : granularity === "week"
        ? "semaine"
        : granularity === "month"
          ? "mois"
          : "année";
  const grainPlural =
    granularity === "day"
      ? "jours"
      : granularity === "week"
        ? "semaines"
        : granularity === "month"
          ? "mois"
          : "années";
  return `Par ${grain} · ${count} derniers ${grainPlural}`;
}

const PARTNER_TYPE_BG: Record<Partner["type"], string> = {
  closeuse: "bg-kamoo-blue-50 text-kamoo-blue-700",
  livreur: "bg-cyan-50 text-cyan-700",
  transitaire: "bg-amber-50 text-amber-700",
  regie_pub: "bg-purple-50 text-purple-700",
  client: "bg-paper-2 text-ink-500",
};

function PartnerDueRow({ balance }: { balance: PartnerBalance }) {
  const initials = balance.partner.name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line p-2.5">
      <div
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-full text-[12px] font-bold",
          PARTNER_TYPE_BG[balance.partner.type],
        )}
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12.5px] font-bold text-ink-900">
          {balance.partner.name}
        </div>
        <div className="text-[10.5px] uppercase tracking-wider text-ink-500">
          {PARTNER_TYPE_LABELS[balance.partner.type]}
        </div>
      </div>
      <div className="text-right">
        <div className="font-display font-extrabold text-amber-700 tabular-nums">
          {formatXOF(balance.amountDue, false)}
          <span className="ml-0.5 text-[10px] font-bold">F</span>
        </div>
      </div>
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diffMs = MOCK_TODAY.getTime() - d.getTime();
  const diffH = Math.round(diffMs / 3600000);
  if (diffH < 1) return "à l'instant";
  if (diffH < 24) return `il y a ${diffH}h`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 7) return `il y a ${diffD} j`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function PorterDebtRow({ debt }: { debt: PorterDebt }) {
  const initials = getInitials(debt.porter.name);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-paper-2/30 p-2.5">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cyan-50 text-[12px] font-bold text-cyan-700">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12.5px] font-bold text-ink-900">
          {debt.porter.name}
        </div>
        {debt.pendingPaid > 0 && (
          <div className="text-[10.5px] text-amber-700">
            dont {formatXOF(debt.pendingPaid, false)} F en attente de validation
          </div>
        )}
      </div>
      <div className="text-right">
        <div className="font-display font-extrabold text-cyan-700 tabular-nums">
          {formatXOF(debt.dueNet, false)}
          <span className="ml-0.5 text-[10px] font-bold text-ink-500">F</span>
        </div>
      </div>
    </div>
  );
}

function DisputeRow({ dispute: d }: { dispute: Dispute }) {
  const hasFinancials =
    d.expectedXof !== undefined && d.actualXof !== undefined;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-white p-2.5">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-red-100 text-red-700">
        <AlertTriangle className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[12px]">
          <span className="font-bold text-red-900">
            {DISPUTE_TYPE_LABELS[d.type]}
          </span>
          <span className="text-ink-500">· {d.against.name}</span>
          <span className="text-ink-400">· {formatRelative(d.createdAt)}</span>
        </div>
        {hasFinancials && (
          <div className="mt-0.5 text-[11px] font-semibold text-ink-700 tabular-nums">
            Attendu {formatXOF(d.expectedXof!, false)} F · reçu{" "}
            {formatXOF(d.actualXof!, false)} F · écart{" "}
            <span className="text-red-700">
              {formatXOF(d.expectedXof! - d.actualXof!, false)} F
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
