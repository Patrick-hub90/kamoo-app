import Link from "next/link";
import { AlertTriangle, Check, Plus, Ship, Wallet } from "lucide-react";
import { ShipmentCard } from "@/components/kamoo/shipment-card";
import { StatCard } from "@/components/kamoo/stat-card";
import { MOCK_EXPEDITIONS, computeListStats } from "@/lib/data/mock-expeditions";
import { formatXOF } from "@/lib/format";

export default function ExpeditionsListPage() {
  const expeditions = MOCK_EXPEDITIONS;
  const stats = computeListStats(expeditions);

  return (
    <div className="flex h-full flex-col">
      {/* Header de page */}
      <div className="flex items-center justify-between border-b border-line bg-white px-10 py-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink-900">
            Mes expéditions
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Suis tes colis Chine → Sénégal en temps réel.
          </p>
        </div>
        <Link
          href="/expeditions/nouvelle"
          className="inline-flex items-center gap-2 rounded-xl bg-kamoo-orange-500 px-5 py-3 text-sm font-bold text-white shadow-[var(--shadow-glow-orange)] transition hover:bg-kamoo-orange-600 hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" />
          Nouvelle expédition
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-10 py-8">
        {/* Stats rapides */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard
            label="En cours"
            value={stats.enCours}
            icon={<Ship className="h-4 w-4" />}
            tone="blue"
          />
          <StatCard
            label="En attente d'action"
            value={stats.enAttenteAction}
            icon={<AlertTriangle className="h-4 w-4" />}
            tone="orange"
            badge
          />
          <StatCard
            label="Arrivées ce mois"
            value={stats.arriveesCeMois}
            icon={<Check className="h-4 w-4" />}
            tone="green"
          />
          <StatCard
            label="Total à payer"
            value={formatXOF(stats.totalAPayer, false)}
            unit="F CFA"
            icon={<Wallet className="h-4 w-4" />}
            tone="orange"
            highlight={stats.totalAPayer > 0}
          />
        </div>

        {/* Onglets */}
        <div className="mt-8 inline-flex gap-1 rounded-xl border border-line bg-white p-1">
          <button className="inline-flex items-center gap-2 rounded-lg bg-kamoo-blue-700 px-4 py-2 text-[13px] font-bold text-white">
            En cours
            <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">
              {expeditions.filter((e) => e.status !== "arrived_destination").length}
            </span>
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-bold text-ink-500 hover:bg-paper-2">
            Historique
            <span className="rounded-full bg-paper-2 px-1.5 py-0.5 text-[10px] font-bold text-ink-500">
              {expeditions.filter((e) => e.status === "arrived_destination").length}
            </span>
          </button>
        </div>

        {/* Filtres (simplifiés pour V1) */}
        <div className="mt-3 flex items-center gap-2 text-xs text-ink-500">
          <span className="font-semibold">{expeditions.length} expéditions</span>
        </div>

        {/* Liste */}
        <div className="mt-4 flex flex-col gap-3">
          {expeditions.map((e) => (
            <ShipmentCard key={e.id} expedition={e} />
          ))}
        </div>
      </div>
    </div>
  );
}
