import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Box,
  Camera,
  ExternalLink,
  HelpCircle,
  Plane,
  Ship,
  Sparkles,
  Wallet,
} from "lucide-react";
import { StatusPill } from "@/components/kamoo/status-pill";
import { CopyButton } from "@/components/kamoo/copy-button";
import { ExpeditionHistory } from "@/components/kamoo/expedition-history";
import { getMockExpeditionDetail } from "@/lib/data/mock-expedition-detail";
import {
  STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  TRANSPORT_MODE_LABELS,
} from "@/lib/types/expedition";
import { formatXOF } from "@/lib/format";

const PHASES = ["Soumis", "En Chine", "En transit", "Arrivé"] as const;

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ExpeditionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const exp = getMockExpeditionDetail(id);

  if (!exp) notFound();

  const TransportIcon = exp.transportMode === "sea" ? Ship : Plane;

  // Position dans la timeline 4 phases
  const phaseIndex =
    exp.status === "awaiting_quote"
      ? 0
      : exp.status === "received_china"
        ? 1
        : 3; // arrived_destination

  return (
    <div className="flex flex-col">
      {/* Header compact */}
      <div className="flex items-center gap-4 border-b border-line bg-white px-10 py-5">
        <Link
          href="/expeditions"
          className="grid h-9 w-9 place-items-center rounded-lg bg-paper-2 text-ink-500 hover:bg-paper-2/70 hover:text-ink-700"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
            Expédition
          </div>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="font-mono-kamoo text-xl font-bold text-ink-900">
              {exp.publicCode}
            </h1>
            <CopyButton value={exp.publicCode} />
            <div className="ml-2 flex gap-1.5">
              <StatusPill
                tone={
                  exp.status === "arrived_destination"
                    ? "green"
                    : exp.status === "received_china"
                      ? "blue"
                      : "gray"
                }
                label={STATUS_LABELS[exp.status]}
                icon={<Ship className="h-3 w-3" />}
              />
              <StatusPill
                tone={exp.paymentStatus === "paid" ? "green" : "orange"}
                label={PAYMENT_STATUS_LABELS[exp.paymentStatus]}
                icon={<Wallet className="h-3 w-3" />}
              />
            </div>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-[13px] font-semibold text-ink-900 hover:bg-paper-2">
          <HelpCircle className="h-3.5 w-3.5" />
          Contacter le support
        </button>
      </div>

      <div className="px-10 py-8">
        {/* Action requise (si applicable) */}
        {exp.action && (
          <div
            className={`mb-6 flex items-center justify-between gap-4 rounded-2xl px-5 py-4 ${
              exp.action.urgent
                ? "bg-gradient-to-r from-kamoo-orange-500 to-kamoo-orange-600 text-white"
                : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                  Action requise
                </div>
                <div className="text-sm font-bold">{exp.action.label}</div>
              </div>
            </div>
            <button className="rounded-xl bg-white/20 px-4 py-2 text-sm font-bold backdrop-blur hover:bg-white/30">
              Voir →
            </button>
          </div>
        )}

        {/* Bloc statut visuel */}
        <div className="rounded-2xl border border-line bg-white p-6">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
                Où en est ton colis ?
              </div>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-3xl">
                  {exp.status === "arrived_destination"
                    ? "📍"
                    : exp.status === "received_china"
                      ? "🚢"
                      : "⏳"}
                </span>
                <div>
                  <h2 className="font-display text-2xl font-extrabold text-ink-900">
                    {exp.status === "arrived_destination"
                      ? `Arrivé à ${exp.destinationCity}`
                      : exp.status === "received_china"
                        ? `En route vers ${exp.destinationCity}`
                        : "En attente de réception en Chine"}
                  </h2>
                  <p className="mt-1 text-sm text-ink-500">
                    {exp.status === "arrived_destination"
                      ? "Récupère ton colis à l'entrepôt local."
                      : exp.status === "received_china"
                        ? `ETA · ${exp.eta}`
                        : "Le transitaire t'enverra un devis dès réception."}
                  </p>
                </div>
              </div>
            </div>
            {exp.trackingNumber && (
              <div className="rounded-xl border border-line bg-paper p-4 text-right">
                <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
                  Tracking
                </div>
                <div className="mt-1 font-mono-kamoo text-sm font-bold text-ink-900">
                  {exp.trackingNumber}
                </div>
                <a
                  href="#"
                  className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-kamoo-blue-700 hover:underline"
                >
                  Suivre sur {exp.trackingCarrier}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>

          {/* Mini-progress 4 phases */}
          <div className="mt-6 flex items-center gap-2">
            {PHASES.map((phase, i) => (
              <div key={phase} className="flex flex-1 items-center gap-2">
                <div
                  className={`flex flex-1 flex-col items-center gap-1.5 ${
                    i <= phaseIndex ? "text-kamoo-blue-700" : "text-ink-400"
                  }`}
                >
                  <div
                    className={`h-2 w-full rounded-full ${
                      i <= phaseIndex
                        ? "bg-kamoo-blue-700"
                        : "bg-ink-200"
                    }`}
                  />
                  <span className="text-[11px] font-bold">{phase}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Infos clés en 2 colonnes */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          {/* Shipping mark + entrepôt */}
          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
              Shipping mark
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="font-mono-kamoo text-lg font-bold text-ink-900">
                {exp.publicCode}
              </span>
              <CopyButton value={exp.publicCode} />
            </div>
            <div className="mt-4 text-[11px] font-bold uppercase tracking-wider text-ink-500">
              Adresse entrepôt Chine
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-700">
              {exp.warehouseAddress}
            </p>
            <CopyButton
              value={`${exp.publicCode}\n${exp.warehouseAddress}`}
              label="Copier le tout"
              fullWidth
            />
          </div>

          {/* Transitaire + transport + dates */}
          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
              Transitaire
            </div>
            <div className="mt-2 flex items-center gap-2.5">
              <span
                className="grid h-9 w-9 place-items-center rounded-full text-xs font-extrabold text-white"
                style={{ background: exp.transitaire.avatarBg }}
              >
                {exp.transitaire.avatar}
              </span>
              <div>
                <div className="text-[14px] font-bold text-ink-900">
                  {exp.transitaire.name}
                </div>
                <div className="text-[11px] text-amber-500">
                  ★ {exp.transitaire.rating}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
                  Transport
                </div>
                <div className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-900">
                  <TransportIcon className="h-3.5 w-3.5" />
                  {TRANSPORT_MODE_LABELS[exp.transportMode]}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
                  ETA
                </div>
                <div className="mt-1 text-[13px] font-semibold text-ink-900">
                  {exp.eta}
                </div>
              </div>
            </div>

            <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-paper-2 px-2.5 py-1.5">
              <Sparkles className="h-3 w-3 text-kamoo-orange-600" />
              <span className="text-[11px] font-bold text-ink-700">
                Catégorie détectée :{" "}
                <span className="text-ink-900">{exp.aiCategory.label}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Produits + photos */}
        <div className="mt-6 rounded-2xl border border-line bg-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-ink-900">
              Le colis
            </h3>
            <span className="text-[11px] text-ink-500">
              {exp.products.length} produit{exp.products.length > 1 ? "s" : ""}
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-5">
            {exp.products.map((p, i) => (
              <div key={i} className="rounded-xl bg-paper-2 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[14px] font-bold text-ink-900">
                      {p.name}
                    </div>
                    <div className="mt-1 text-[11px] text-ink-500">
                      {p.cartons} carton{p.cartons > 1 ? "s" : ""} ·
                      Poids déclaré : {p.weightDeclared} kg
                      {p.weightActual !== null && (
                        <>
                          {" "}
                          · Réel :{" "}
                          <span className="font-bold text-ink-900">
                            {p.weightActual} kg
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <PhotoColumn
                    title="Photos déclarées"
                    icon={<Box className="h-3 w-3" />}
                    photos={p.photosDeclared}
                  />
                  <PhotoColumn
                    title="Photos à réception"
                    icon={<Camera className="h-3 w-3" />}
                    photos={p.photosReceived}
                    emptyText="En attente du transitaire"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Devis (si émis) */}
        {exp.quote && (
          <div className="mt-6 rounded-2xl border border-line bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-ink-900">
                  Devis
                </h3>
                <div className="mt-1 text-[11px] text-ink-500">
                  Émis le {exp.quote.issuedAt} · Valable jusqu'au{" "}
                  {exp.quote.validUntil}
                </div>
              </div>
              {exp.paymentStatus === "unpaid" && (
                <button className="rounded-xl bg-kamoo-orange-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-kamoo-orange-600">
                  Payer maintenant
                </button>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-2">
              {exp.quote.lines.map((line, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b border-line py-2 text-sm last:border-0"
                >
                  <span className="text-ink-700">{line.label}</span>
                  <span className="font-semibold text-ink-900">
                    {formatXOF(line.amountXof)}
                  </span>
                </div>
              ))}
              <div className="mt-2 flex items-center justify-between border-t border-ink-200 pt-3">
                <span className="text-base font-bold text-ink-900">
                  Total à payer
                </span>
                <span className="font-display text-2xl font-extrabold text-kamoo-orange-600">
                  {formatXOF(exp.quote.totalXof)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Historique */}
        <ExpeditionHistory events={exp.history} />
      </div>
    </div>
  );
}

/* ─── Sous-composant Photos ────────────────────────────────────────── */
function PhotoColumn({
  title,
  icon,
  photos,
  emptyText,
}: {
  title: string;
  icon: React.ReactNode;
  photos: { emoji: string; bg: string }[];
  emptyText?: string;
}) {
  return (
    <div>
      <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-500">
        {icon}
        {title}
      </div>
      {photos.length === 0 ? (
        <div className="mt-2 grid h-20 place-items-center rounded-lg border border-dashed border-line bg-white text-[11px] text-ink-400">
          {emptyText ?? "Aucune photo"}
        </div>
      ) : (
        <div className="mt-2 flex gap-2">
          {photos.map((ph, i) => (
            <div
              key={i}
              className="grid h-12 w-12 place-items-center rounded-lg text-xl"
              style={{ background: ph.bg }}
            >
              {ph.emoji}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

