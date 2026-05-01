import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ExternalLink,
  Phone,
  Plane,
  Ship,
  Sparkles,
  Truck,
  User,
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
  const showActionBanner =
    exp.quote !== null && exp.paymentStatus === "unpaid";
  const progressPercent = (exp.progress / (PHASES.length - 1)) * 100;

  return (
    <div className="flex flex-col">
      {/* ─── HEADER COMPACT ──────────────────────────────────────── */}
      <div className="flex items-center gap-4 border-b border-line bg-white px-10 py-5">
        <Link
          href="/expeditions"
          className="grid h-9 w-9 place-items-center rounded-lg bg-paper-2 text-ink-500 hover:text-ink-700"
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
          <Phone className="h-3.5 w-3.5" />
          Contacter le support
        </button>
      </div>

      {/* ─── BODY 2-COLONNES ─────────────────────────────────────── */}
      <div className="grid grid-cols-[1.5fr_1fr] gap-5 px-10 py-6">
        {/* ═══ COLONNE GAUCHE ═══════════════════════════════════════ */}
        <div className="flex flex-col gap-4">
          {/* STATUS CARD ── gradient clair + decoration + progress + tracking */}
          <div className="relative overflow-hidden rounded-2xl border border-kamoo-blue-100 bg-gradient-to-br from-kamoo-blue-50 to-white p-6">
            {/* Décoration */}
            <div
              className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 70%)",
              }}
            />

            <div className="relative">
              <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
                Où en est ton colis ?
              </div>
              <div className="mt-3 flex items-center gap-4">
                <span className="text-5xl leading-none">
                  {exp.currentStage.emoji}
                </span>
                <div>
                  <h2 className="font-display text-2xl font-extrabold leading-tight text-ink-900">
                    {exp.currentStage.label}
                  </h2>
                  <p className="mt-1 text-[13px] text-ink-500">
                    {exp.currentStage.sub} ·{" "}
                    <b className="text-kamoo-orange-600">ETA · {exp.eta}</b>
                  </p>
                </div>
              </div>

              {/* Progress timeline 4 phases avec ligne dégradée */}
              <div className="relative mt-6">
                {/* Ligne fond */}
                <div className="absolute left-0 right-0 top-[11px] h-[2px] rounded bg-ink-200" />
                {/* Ligne progression dégradée */}
                <div
                  className="absolute left-0 top-[11px] h-[2px] rounded bg-gradient-to-r from-kamoo-blue-700 to-kamoo-orange-500 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
                <div className="relative flex justify-between">
                  {PHASES.map((phase, i) => {
                    const reached = i <= exp.progress;
                    const isCurrent = i === exp.progress;
                    return (
                      <div
                        key={phase}
                        className="flex w-[70px] flex-col items-center gap-2"
                      >
                        <div
                          className={`grid h-6 w-6 place-items-center rounded-full ${
                            reached
                              ? isCurrent
                                ? "bg-kamoo-orange-500 ring-4 ring-kamoo-orange-500/20"
                                : "bg-kamoo-blue-700"
                              : "border-2 border-ink-200 bg-white"
                          }`}
                        >
                          {reached && !isCurrent && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                          {isCurrent && (
                            <div className="h-1.5 w-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <span
                          className={`text-center text-[11px] ${
                            reached
                              ? "font-bold text-ink-900"
                              : "font-medium text-ink-500"
                          }`}
                        >
                          {phase}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tracking — dans le status card */}
              {exp.trackingNumber && (
                <div className="mt-5 flex items-center gap-3 rounded-xl border border-line bg-white p-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-50 text-cyan-600">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
                      Tracking · {exp.trackingCarrier}
                    </div>
                    <div className="font-mono-kamoo text-[13px] font-bold text-ink-900">
                      {exp.trackingNumber}
                    </div>
                  </div>
                  <a
                    href="#"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-bold text-white hover:bg-cyan-700"
                  >
                    Suivre sur {exp.trackingCarrier}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* ACTION BANNER (devis émis, paiement attendu) */}
          {showActionBanner && exp.quote && (
            <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-kamoo-orange-500 to-kamoo-orange-600 p-5 text-white">
              <div className="grid h-13 w-13 shrink-0 place-items-center rounded-xl bg-white/20">
                <Wallet className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="text-[11px] font-bold uppercase tracking-wider opacity-90">
                  Action requise
                </div>
                <div className="mt-0.5 text-[17px] font-extrabold">
                  Ton devis est prêt — paie pour libérer l&apos;expédition
                </div>
                <div className="mt-1 text-xs opacity-90">
                  Le paiement déclenche le départ depuis Guangzhou. Délai
                  habituel : 24h.
                </div>
              </div>
              <button className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-kamoo-orange-600 hover:bg-paper">
                Payer {formatXOF(exp.quote.totalXof)}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* INFOS CLÉS — 4 mini-cards 2×2 */}
          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="mb-4 text-[11px] font-bold uppercase tracking-wider text-ink-500">
              Informations clés
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* Shipping mark */}
              <div className="rounded-xl bg-paper-2 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
                  Shipping mark
                </div>
                <div className="mt-1 font-mono-kamoo text-sm font-extrabold text-ink-900">
                  {exp.publicCode}
                </div>
                <div className="mt-1">
                  <CopyButton value={exp.publicCode} />
                </div>
              </div>
              {/* Adresse Chine */}
              <div className="rounded-xl bg-paper-2 p-3">
                <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                  🇨🇳 Entrepôt Chine
                </div>
                <div className="mt-1 text-[12px] leading-tight text-ink-900">
                  {exp.warehouseAddress}
                </div>
                <div className="mt-1">
                  <CopyButton value={exp.warehouseAddress} />
                </div>
              </div>
              {/* Transitaire */}
              <div className="rounded-xl bg-paper-2 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
                  Transitaire assigné
                </div>
                <div className="mt-1.5 flex items-center gap-2.5">
                  <span
                    className="grid h-8 w-8 place-items-center rounded-full text-[11px] font-extrabold text-white"
                    style={{ background: exp.transitaire.avatarBg }}
                  >
                    {exp.transitaire.avatar}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-bold text-ink-900">
                      {exp.transitaire.name}
                    </div>
                    <div className="text-[11px] text-ink-500">
                      <span className="text-amber-500">★</span>{" "}
                      {exp.transitaire.rating} · {exp.transitaireReviews} avis
                    </div>
                  </div>
                  <Link
                    href={`/marketplace/transitaires/${exp.transitaire.avatar.toLowerCase()}`}
                    className="text-[11px] font-bold text-kamoo-blue-600"
                  >
                    Profil →
                  </Link>
                </div>
              </div>
              {/* Mode + dates */}
              <div className="rounded-xl bg-paper-2 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
                  Transport
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-cyan-50 text-cyan-600">
                    <TransportIcon className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-[13px] font-bold text-ink-900">
                    {TRANSPORT_MODE_LABELS[exp.transportMode]}
                  </span>
                </div>
                <div className="mt-2.5 flex justify-between text-[11px]">
                  <div>
                    <div className="text-ink-500">Soumis</div>
                    <div className="font-bold text-ink-900">
                      {exp.dateSubmitted}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-ink-500">ETA</div>
                    <div className="font-bold text-ink-900">{exp.eta}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* LE COLIS — header + AI chip + photos par produit */}
          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
                  Le colis
                </div>
                <div className="mt-0.5 text-base font-extrabold text-ink-900">
                  {exp.products.length} produit
                  {exp.products.length > 1 ? "s" : ""} ·{" "}
                  {exp.products.reduce((s, p) => s + p.cartons, 0)} cartons
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-kamoo-orange-50 px-3 py-1 text-[11px] font-bold text-kamoo-orange-700">
                <Sparkles className="h-3 w-3" />
                IA : {exp.aiCategory.label}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {exp.products.map((p, i) => (
                <div key={i}>
                  <div className="mb-2 flex items-baseline justify-between">
                    <div className="text-[14px] font-bold text-ink-900">
                      {p.name}
                    </div>
                    <div className="text-[11px] text-ink-500">
                      {p.cartons} carton{p.cartons > 1 ? "s" : ""} ·{" "}
                      <span className="text-ink-500">
                        déclaré{" "}
                        <b className="text-ink-900">{p.weightDeclared} kg</b>
                      </span>
                      {p.weightActual !== null && (
                        <span className="ml-2">
                          réel{" "}
                          <b className="text-kamoo-blue-600">
                            {p.weightActual} kg
                          </b>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Déclarées */}
                    <PhotoGrid
                      title="Photos déclarées · vendeur"
                      icon={<User className="h-2.5 w-2.5" />}
                      photos={p.photosDeclared}
                      tone="neutral"
                    />
                    {/* Reçues */}
                    <PhotoGrid
                      title="Photos à réception · transitaire"
                      icon={<Check className="h-2.5 w-2.5" />}
                      photos={p.photosReceived}
                      tone="success"
                      emptyText="En attente du transitaire"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ COLONNE DROITE ═══════════════════════════════════════ */}
        <div className="flex flex-col gap-4">
          {/* DEVIS — hero card dark navy avec total orange */}
          {exp.quote && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-kamoo-blue-900 to-kamoo-blue-700 p-6 text-white">
              {/* Décoration */}
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, rgba(249,115,22,0.4) 0%, transparent 70%)",
                }}
              />
              <div className="relative">
                <div className="text-[11px] font-bold uppercase tracking-[0.08em] opacity-70">
                  Devis · émis le {exp.quote.issuedAt.split(" ·")[0]}
                </div>
                <div className="mt-1 text-[13px] opacity-85">
                  Valable jusqu&apos;au {exp.quote.validUntil}
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  {exp.quote.lines.map((line) => (
                    <div
                      key={line.label}
                      className="flex items-start justify-between text-[12.5px] opacity-95"
                    >
                      <span className="pr-3">{line.label}</span>
                      <span className="whitespace-nowrap font-bold">
                        {formatXOF(line.amountXof, false)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="my-4 h-px bg-white/20" />

                <div className="flex items-baseline justify-between">
                  <span className="text-[13px] opacity-85">Total</span>
                  <div className="font-display flex items-baseline gap-1.5 whitespace-nowrap text-[26px] font-extrabold text-kamoo-orange-400">
                    <span>{formatXOF(exp.quote.totalXof, false)}</span>
                    <span className="text-xs font-bold opacity-85">F CFA</span>
                  </div>
                </div>

                {exp.paymentStatus === "unpaid" && (
                  <>
                    <button className="mt-4 flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-kamoo-orange-500 px-4 py-3.5 text-sm font-extrabold text-white hover:bg-kamoo-orange-600">
                      <Wallet className="h-4 w-4" />
                      Payer maintenant
                    </button>
                    <div className="mt-3 flex items-center justify-center gap-2 text-[11px] opacity-75">
                      <span>📱 Wave</span>
                      <span>·</span>
                      <span>📱 Orange Money</span>
                      <span>·</span>
                      <span>💳 Carte</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* HISTORIQUE — collapsible avec timeline verticale */}
          <ExpeditionHistory events={exp.history} />
        </div>
      </div>
    </div>
  );
}

/* ─── Photo grid (déclarées vs reçues) ──────────────────────────── */
function PhotoGrid({
  title,
  icon,
  photos,
  tone,
  emptyText,
}: {
  title: string;
  icon: React.ReactNode;
  photos: { emoji: string; bg: string }[];
  tone: "neutral" | "success";
  emptyText?: string;
}) {
  const slots = Math.max(3, photos.length);
  return (
    <div
      className={`rounded-xl border p-2.5 ${
        tone === "success"
          ? "border-emerald-200 bg-emerald-50"
          : "border-line bg-paper-2"
      }`}
    >
      <div
        className={`mb-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${
          tone === "success" ? "text-emerald-700" : "text-ink-500"
        }`}
      >
        {icon}
        {title}
      </div>
      {photos.length === 0 ? (
        <div className="grid h-16 place-items-center rounded-lg border border-dashed border-line text-[11px] text-ink-400">
          {emptyText ?? "Aucune photo"}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {Array.from({ length: slots }).map((_, j) => {
            const ph = photos[j];
            if (!ph) {
              return (
                <div
                  key={`e${j}`}
                  className="aspect-square rounded-lg border border-dashed border-line"
                />
              );
            }
            return (
              <div
                key={j}
                className="grid aspect-square place-items-center rounded-lg text-2xl"
                style={{ background: ph.bg }}
              >
                {ph.emoji}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

