"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Search,
  Wallet,
} from "lucide-react";
import {
  DropdownItem,
  FilterDropdown,
} from "@/components/kamoo/filter-dropdown";
import {
  DateRangeFilter,
  type DateFilterValue,
} from "@/components/kamoo/date-range-filter";
import { MOCK_FINANCE_MOVEMENTS, MOCK_TODAY } from "@/lib/data/mock-finances";
import { MOCK_AD_CAMPAIGNS } from "@/lib/data/mock-ad-campaigns";
import { PLATFORM_LABELS } from "@/lib/types/ad-campaign";
import { useSessionStorageState } from "@/lib/hooks/use-session-storage-state";
import { useVersementsState } from "@/lib/hooks/use-versements-state";
import {
  dateFilterSubtitle,
  filterByDate,
  normalizeDateFilter,
} from "@/lib/utils/date-filter";
import {
  MOVEMENT_TYPE_LABELS,
  MOVEMENT_TYPE_TONE,
  MOVEMENT_TYPES_REQUIRING_PARTNER_CONFIRMATION,
  type FinanceMovement,
  type MovementType,
  type Versement,
} from "@/lib/types/finance";
import { formatXOF } from "@/lib/format";
import { cn } from "@/lib/utils";

type TypeFilter = MovementType | "versement" | "all";

/**
 * Le journal n'affiche que les transactions où **l'argent a réellement bougé** :
 *  - Mouvement sortant `paye` : le vendeur a effectué le virement
 *  - Versement `en_attente_validation` : le livreur a déclaré l'envoi → vendeur
 *    doit confirmer la réception
 *  - Versement `valide` : le vendeur a confirmé avoir reçu
 *
 * Sont exclus en amont :
 *  - `a_payer` (vendeur n'a pas encore payé) → c'est un dû, pas une transaction
 *  - `a_recevoir` (cash chez livreur) → devient une transaction quand le
 *    livreur déclare le versement
 *  - `vente_encaissee` (événement business, pas un transfert cash partenaire)
 *  - `cout_marchandise` (coût amorti dérivé par l'app)
 *  - Versements `en_litige` (vue dédiée Litiges)
 *
 * Statuts simplifiés affichés :
 *  - "a_confirmer" : versement en attente de validation par le vendeur
 *  - "confirme"    : transaction bouclée (vendeur a payé, ou versement validé)
 */
type StatusFilter = "all" | "a_confirmer" | "confirme";

/**
 * Types de mouvements qui correspondent à de vraies transactions partenaires.
 * Exclus :
 *  - `depense_pub` : Facebook agrège, on affiche 1 ligne agrégée synthétique
 *  - `frais_livreur` : auto-déduit par le livreur du cash avant versement,
 *    pas un transfert vendeur → livreur (donc pas un événement journal)
 */
const PARTNER_TRANSACTION_TYPES = new Set<MovementType>([
  "commission_closeuse",
  "frais_transit",
  "remboursement",
]);

/**
 * Construit la ligne agrégée "Paiement Facebook Ads" pour le journal.
 * Représente le total facturé par Meta pour toutes les campagnes Kamoo
 * marquées payées. Pas de proof / ID transaction — Facebook gère, Kamoo
 * lit juste l'événement de paiement via Meta Marketing API en V2.
 *
 * Renvoie null si aucune campagne payée → pas de ligne dans le journal.
 */
function buildMetaAggregateRow(today: Date): JournalItem | null {
  const paidCampaigns = MOCK_AD_CAMPAIGNS.filter(
    (c) => c.paymentStatus === "paid",
  );
  if (paidCampaigns.length === 0) return null;
  const total = paidCampaigns.reduce((s, c) => s + c.spentXof, 0);
  // Date du dernier billing Meta : on simule "il y a 5 jours"
  const billingDate = new Date(today);
  billingDate.setUTCDate(billingDate.getUTCDate() - 5);
  return {
    kind: "movement",
    date: billingDate.toISOString(),
    data: {
      id: "meta_aggregate",
      date: billingDate.toISOString(),
      type: "depense_pub",
      direction: "out",
      status: "paye",
      amountXof: total,
      description: `Paiement Facebook Ads · ${paidCampaigns.length} campagnes Kamoo`,
      partner: { type: "regie_pub", name: PLATFORM_LABELS.facebook },
      paidAt: billingDate.toISOString(),
      paymentMethod: "Carte bancaire (Meta)",
    },
  };
}

const TYPE_OPTIONS: { id: TypeFilter; label: string }[] = [
  { id: "all", label: "Tous les types" },
  { id: "versement", label: "Versements livreurs" },
  { id: "commission_closeuse", label: "Commissions closeuses" },
  { id: "frais_transit", label: "Frais expédition" },
  { id: "depense_pub", label: "Paiement Facebook Ads" },
  { id: "remboursement", label: "Dépenses" },
];

const STATUS_OPTIONS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "a_confirmer", label: "À confirmer" },
  { id: "confirme", label: "Confirmés" },
];

/**
 * Mouvement éligible au journal = transaction partenaire EFFECTIVEMENT payée.
 * Les `a_payer` n'apparaissent pas ici (l'argent n'a pas encore bougé) — ils
 * vivent dans la card "À régler bientôt" de l'Aperçu.
 */
function isMovementEligible(m: FinanceMovement): boolean {
  if (!PARTNER_TRANSACTION_TYPES.has(m.type)) return false;
  return m.status === "paye";
}

/** Versements éligibles : déclarés (en attente) ou validés. Litiges exclus. */
function isVersementEligible(v: Versement): boolean {
  return v.status === "en_attente_validation" || v.status === "valide";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
}

/**
 * Type d'item unifié dans le journal :
 *  - "movement" : un FinanceMovement classique (vente, coût, frais...)
 *  - "versement" : un transfert cash livreur → vendeur, avec son propre cycle
 *
 * Mélanger les 2 dans la même table donne au vendeur la vue chronologique
 * complète de tout ce qui s'est passé sur son compte.
 */
type JournalItem =
  | { kind: "movement"; date: string; data: FinanceMovement }
  | { kind: "versement"; date: string; data: Versement };

export default function FinancesJournalPage() {
  const movements = MOCK_FINANCE_MOVEMENTS;
  const { versements } = useVersementsState();

  const [search, setSearch] = useSessionStorageState("fin.journal.search", "");
  const [typeFilter, setTypeFilter] = useSessionStorageState<TypeFilter>(
    "fin.journal.type",
    "all",
  );
  const [statusFilter, setStatusFilter] = useSessionStorageState<StatusFilter>(
    "fin.journal.status",
    "all",
  );
  const [dateFilter, setDateFilter] = useSessionStorageState<DateFilterValue>(
    "fin.journal.dateFilter",
    { preset: "all" },
  );
  const [typeOpen, setTypeOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const normalizedDateFilter = useMemo(
    () => normalizeDateFilter(dateFilter),
    [dateFilter],
  );

  /**
   * Liste unifiée { movements + versements } triée par date desc, après
   * application des filtres date / type / statut / recherche.
   */
  const filtered = useMemo<JournalItem[]>(() => {
    const q = search.trim().toLowerCase();

    const filterMovements = movements.filter((m) => {
      // Source de vérité : seulement les paiements effectifs
      if (!isMovementEligible(m)) return false;
      if (typeFilter === "versement") return false;
      if (typeFilter !== "all" && m.type !== typeFilter) return false;
      // Statut "à confirmer" = type qui requiert confirmation + pas encore confirmé
      const requiresConfirmation =
        MOVEMENT_TYPES_REQUIRING_PARTNER_CONFIRMATION.has(m.type);
      const awaitingPartner = requiresConfirmation && !m.partnerConfirmedAt;
      if (statusFilter === "a_confirmer" && !awaitingPartner) return false;
      if (statusFilter === "confirme" && awaitingPartner) return false;
      if (q) {
        if (
          !m.description.toLowerCase().includes(q) &&
          !(m.partner?.name.toLowerCase().includes(q) ?? false) &&
          !(m.orderId?.toLowerCase().includes(q) ?? false)
        ) {
          return false;
        }
      }
      return true;
    });

    const filterVersements = versements.filter((v) => {
      if (!isVersementEligible(v)) return false;
      if (typeFilter !== "all" && typeFilter !== "versement") return false;
      if (statusFilter === "a_confirmer" && v.status !== "en_attente_validation")
        return false;
      if (statusFilter === "confirme" && v.status !== "valide") return false;
      if (q) {
        if (
          !v.versedBy.name.toLowerCase().includes(q) &&
          !(v.transactionId?.toLowerCase().includes(q) ?? false)
        ) {
          return false;
        }
      }
      return true;
    });

    const all: JournalItem[] = [
      ...filterMovements.map((m) => ({
        kind: "movement" as const,
        date: m.date,
        data: m,
      })),
      ...filterVersements.map((v) => ({
        kind: "versement" as const,
        date: v.date,
        data: v,
      })),
    ];

    // Ligne agrégée Meta — apparaît si aucun filtre type ne l'exclut
    const includesPub = typeFilter === "all" || typeFilter === "depense_pub";
    const includesPaid = statusFilter === "all" || statusFilter === "confirme";
    if (includesPub && includesPaid) {
      const meta = buildMetaAggregateRow(MOCK_TODAY);
      if (meta && meta.kind === "movement") {
        const matchesSearch =
          !q ||
          meta.data.description.toLowerCase().includes(q) ||
          (meta.data.partner?.name.toLowerCase().includes(q) ?? false);
        if (matchesSearch) all.push(meta);
      }
    }

    // Filtre date appliqué uniformément
    const dated = filterByDate(all, normalizedDateFilter, MOCK_TODAY);

    return dated.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [movements, versements, search, typeFilter, statusFilter, normalizedDateFilter]);

  const hasPaidPubs = MOCK_AD_CAMPAIGNS.some(
    (c) => c.paymentStatus === "paid",
  );
  const totalRows =
    movements.filter(isMovementEligible).length +
    versements.filter(isVersementEligible).length +
    (hasPaidPubs ? 1 : 0);

  const filtersActive =
    search.length > 0 ||
    typeFilter !== "all" ||
    statusFilter !== "all" ||
    dateFilter.preset !== "all";

  return (
    <div className="flex h-full flex-col">
      {/* HEADER */}
      <div className="flex items-center gap-4 border-b border-line bg-white px-10 py-4">
        <Link
          href="/finances"
          className="grid h-9 w-9 place-items-center rounded-lg bg-paper-2 text-ink-500 hover:text-ink-700"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
            Finances · Journal
          </div>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-ink-900">
            Tous les mouvements
          </h1>
        </div>
        <DateRangeFilter value={dateFilter} onChange={setDateFilter} />
      </div>

      {/* FILTRES */}
      <div className="border-b border-line bg-paper-2/60 px-10 py-3">
        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              placeholder="Description, partenaire, transaction…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-[13px] outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600"
            />
          </div>

          <FilterDropdown
            label="Type"
            value={
              TYPE_OPTIONS.find((o) => o.id === typeFilter)?.label ?? "Tous"
            }
            isActive={typeFilter !== "all"}
            isOpen={typeOpen}
            onToggle={() => setTypeOpen(!typeOpen)}
            onClose={() => setTypeOpen(false)}
            width="w-64"
          >
            {TYPE_OPTIONS.map((o) => (
              <DropdownItem
                key={o.id}
                active={typeFilter === o.id}
                onClick={() => {
                  setTypeFilter(o.id);
                  setTypeOpen(false);
                }}
              >
                {o.label}
              </DropdownItem>
            ))}
          </FilterDropdown>

          <FilterDropdown
            label="Statut"
            value={
              STATUS_OPTIONS.find((o) => o.id === statusFilter)?.label ?? "Tous"
            }
            isActive={statusFilter !== "all"}
            isOpen={statusOpen}
            onToggle={() => setStatusOpen(!statusOpen)}
            onClose={() => setStatusOpen(false)}
            width="w-64"
          >
            {STATUS_OPTIONS.map((o) => (
              <DropdownItem
                key={o.id}
                active={statusFilter === o.id}
                onClick={() => {
                  setStatusFilter(o.id);
                  setStatusOpen(false);
                }}
              >
                {o.label}
              </DropdownItem>
            ))}
          </FilterDropdown>

          {filtersActive && (
            <button
              onClick={() => {
                setSearch("");
                setTypeFilter("all");
                setStatusFilter("all");
                setDateFilter({ preset: "all" });
              }}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-bold text-kamoo-orange-600 hover:bg-kamoo-orange-50"
            >
              Effacer
            </button>
          )}

          <div className="flex-1" />
          <div className="whitespace-nowrap text-[12px] font-semibold text-ink-500">
            {filtered.length} sur {totalRows} ·{" "}
            {dateFilterSubtitle(normalizedDateFilter)}
          </div>
        </div>
      </div>

      {/* TABLEAU */}
      <div className="flex-1 overflow-auto px-10 py-4">
        {filtered.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-line bg-white py-20 text-center">
            <Wallet className="h-8 w-8 text-ink-400" />
            <p className="mt-3 text-sm font-semibold text-ink-700">
              Aucun mouvement ne correspond à vos filtres
            </p>
          </div>
        ) : (
          <JournalTable items={filtered} />
        )}
      </div>

    </div>
  );
}

function JournalTable({ items }: { items: JournalItem[] }) {
  return (
    <div className="rounded-2xl border border-line bg-white">
      <div
        className="overflow-x-auto rounded-2xl"
        style={{
          scrollbarColor: "#D1D5DB #F5F5EE",
          scrollbarWidth: "thin",
        }}
      >
        <table className="w-full min-w-[900px] table-fixed text-[13px]">
          <colgroup>
            <col style={{ width: "110px" }} />
            <col style={{ width: "180px" }} />
            <col style={{ width: "auto" }} />
            <col style={{ width: "150px" }} />
            <col style={{ width: "150px" }} />
          </colgroup>
          <thead>
            <tr className="border-b border-line bg-paper-2/40 text-left">
              <Th>Date</Th>
              <Th>Type</Th>
              <Th>Description</Th>
              <Th align="right">Montant</Th>
              <Th align="center">Statut</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) =>
              item.kind === "movement" ? (
                <MovementRow key={`m_${item.data.id}`} movement={item.data} />
              ) : (
                <VersementRow key={`v_${item.data.id}`} versement={item.data} />
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MovementRow({ movement: m }: { movement: FinanceMovement }) {
  const typeTone = MOVEMENT_TYPE_TONE[m.type];
  const isIncoming = m.direction === "in";
  const router = useRouter();
  // Cas spécial : la ligne agrégée Meta n'a pas de page détail dédiée,
  // elle pointe directement vers la liste des campagnes pubs.
  const goToDetail = () => {
    if (m.id === "meta_aggregate") {
      router.push("/finances/pubs");
    } else {
      router.push(`/finances/movements/${m.id}?from=journal`);
    }
  };
  const requiresConfirmation =
    MOVEMENT_TYPES_REQUIRING_PARTNER_CONFIRMATION.has(m.type);
  const awaitingPartner = requiresConfirmation && !m.partnerConfirmedAt;
  const variant: "paye" | "a_confirmer" = awaitingPartner ? "a_confirmer" : "paye";

  return (
    <tr
      onClick={goToDetail}
      className="cursor-pointer border-b border-line last:border-0 transition hover:bg-paper-2/30"
    >
      <Td>
        <div className="text-[12.5px] font-semibold text-ink-700">
          {formatDate(m.date)}
        </div>
      </Td>
      <Td>
        <span
          className={cn(
            "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold",
            typeTone.bg,
            typeTone.fg,
          )}
        >
          {MOVEMENT_TYPE_LABELS[m.type]}
        </span>
      </Td>
      <Td>
        <div className="truncate text-[12.5px] text-ink-700">
          {m.description}
        </div>
      </Td>
      <Td align="right">
        <span
          className={cn(
            "font-display font-extrabold tabular-nums",
            isIncoming ? "text-emerald-700" : "text-ink-900",
          )}
        >
          {isIncoming ? "+" : "−"}
          {formatXOF(m.amountXof)}
        </span>
      </Td>
      <Td align="center">
        <StatusBadge variant={variant} />
      </Td>
    </tr>
  );
}

function VersementRow({ versement: v }: { versement: Versement }) {
  const router = useRouter();
  const goToDetail = () =>
    router.push(`/finances/versements/${v.id}?from=journal`);

  return (
    <tr
      onClick={goToDetail}
      className="cursor-pointer border-b border-line last:border-0 transition hover:bg-paper-2/30"
    >
      <Td>
        <div className="text-[12.5px] font-semibold text-ink-700">
          {formatDate(v.date)}
        </div>
      </Td>
      <Td>
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800">
          <ArrowUpRight className="h-3 w-3" />
          Versement
        </span>
      </Td>
      <Td>
        <span className="truncate text-[12.5px] text-ink-700">
          Paiement livreur{" "}
          <span className="font-semibold text-ink-900">
            {v.versedBy.name}
          </span>
        </span>
      </Td>
      <Td align="right">
        <span className="font-display font-extrabold tabular-nums text-emerald-700">
          +{formatXOF(v.amountXof)}
        </span>
      </Td>
      <Td align="center">
        <StatusBadge
          variant={
            v.status === "en_attente_validation" ? "a_confirmer" : "recu"
          }
        />
      </Td>
    </tr>
  );
}

/**
 * Badge du journal — 3 variantes :
 *  - "paye"       : vendeur a payé un partenaire (sortie confirmée)
 *  - "a_confirmer": livreur a déclaré un versement, vendeur doit confirmer
 *  - "recu"       : vendeur a confirmé avoir reçu le versement
 */
function StatusBadge({ variant }: { variant: "paye" | "a_confirmer" | "recu" }) {
  if (variant === "a_confirmer") {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800">
        À confirmer
      </span>
    );
  }
  if (variant === "paye") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
        <Check className="h-3 w-3" />
        Payé
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
      <Check className="h-3 w-3" />
      Reçu
    </span>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
}) {
  return (
    <th
      className={cn(
        "px-3 py-2.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-500",
        align === "right" && "text-right",
        align === "center" && "text-center",
      )}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
}) {
  return (
    <td
      className={cn(
        "px-3 py-3 align-middle text-[13px]",
        align === "right" && "text-right",
        align === "center" && "text-center",
      )}
    >
      {children}
    </td>
  );
}
