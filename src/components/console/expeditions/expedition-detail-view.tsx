"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  ChevronRight,
  Headphones,
  ImageUp,
  MapPin,
  MessageSquare,
  Package,
  Plane,
  Ship,
  Star,
  Truck,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import { CopyButton } from "@/components/kamoo/copy-button";
import { STATUS_LABELS, TRANSPORT_MODE_LABELS } from "@/lib/types/expedition";
import type { ExpeditionDetail } from "@/lib/types/expedition-detail";
import { formatXOF } from "@/lib/format";
import { cn } from "@/lib/utils";

const CARD = "rounded-2xl border border-line bg-white shadow-kamoo-sm";
const PHASE_ICONS = [Check, Package, Truck, MapPin];
const PHASE_LABELS = ["Soumis", "Reçu en Chine", "En transit", "Arrivé à destination"];

type TabKey = "vue" | "description" | "devis";

export function ExpeditionDetailView({ exp }: { exp: ExpeditionDetail }) {
  const [tab, setTab] = useState<TabKey>("vue");
  const [modal, setModal] = useState<"none" | "pay" | "proof" | "proofSent">("none");
  const [proofSubmitted, setProofSubmitted] = useState(false);

  const isUnpaid = exp.paymentStatus === "unpaid";
  const hasQuote = exp.quote !== null;

  const activeStep = exp.status === "arrived_destination" ? 3 : exp.progress;
  const receivedDate = exp.history.find((h) => h.icon === "box")?.date.split(" · ")[0];
  const arrivedDate = exp.history.find((h) => h.icon === "check")?.date.split(" · ")[0] ?? exp.eta;
  const phaseDates = [
    exp.dateSubmitted,
    activeStep >= 1 ? receivedDate ?? "—" : "À venir",
    activeStep >= 2 ? "En cours" : "À venir",
    activeStep >= 3 ? arrivedDate : "À venir",
  ];
  const TransportIcon = exp.transportMode === "sea" ? Ship : Plane;

  const TABS: { key: TabKey; label: string; disabled?: boolean }[] = [
    { key: "vue", label: "Vue d'ensemble" },
    { key: "description", label: "Description" },
    { key: "devis", label: "Devis", disabled: !hasQuote },
  ];

  return (
    <div className="min-h-full bg-paper">
      {/* HEADER — sobre : retour + titre */}
      <header className="sticky top-0 z-20 border-b border-line bg-white">
        <div className="mx-auto flex h-[68px] max-w-[1320px] items-center gap-4 px-6">
          <Link
            href="/expeditions"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-white text-ink-500 transition hover:bg-paper-2 hover:text-ink-900"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-[18px] font-bold tracking-tight text-ink-900">
              Expédition {exp.publicCode}
            </h1>
            <p className="mt-0.5 text-[12px] text-ink-500">Suivi complet, documents et actions</p>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1320px] grid-cols-[1.6fr_1fr] gap-5 px-6 py-6">
        {/* ═══ GAUCHE ═══ */}
        <div className="flex flex-col gap-4">
          {/* Stepper */}
          <div className={CARD + " p-5"}>
            <div className="text-[13.5px] font-semibold text-ink-900">Où en est votre colis ?</div>
            <div className="relative mt-5 px-2">
              <div className="absolute left-[28px] right-[28px] top-[18px] h-[2px] rounded bg-ink-200" />
              <div
                className="absolute left-[28px] top-[18px] h-[2px] rounded bg-gradient-to-r from-kamoo-blue-700 to-kamoo-orange-500 transition-all"
                style={{ width: `calc((100% - 56px) * ${activeStep / 3})` }}
              />
              <div className="relative flex justify-between">
                {PHASE_LABELS.map((label, i) => {
                  const Icon = PHASE_ICONS[i];
                  const reached = i <= activeStep;
                  const isCurrent = i === activeStep;
                  return (
                    <div key={label} className="flex w-[110px] flex-col items-center gap-2 text-center">
                      <div
                        className={cn(
                          "grid h-9 w-9 place-items-center rounded-full",
                          isCurrent
                            ? "bg-kamoo-orange-500 text-white ring-4 ring-kamoo-orange-500/15"
                            : reached
                              ? "bg-kamoo-blue-900 text-white"
                              : "border-2 border-ink-200 bg-white text-ink-300",
                        )}
                      >
                        {reached && !isCurrent ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </div>
                      <div className={cn("text-[12px]", reached ? "font-semibold text-ink-900" : "font-medium text-ink-400")}>
                        {label}
                      </div>
                      <div className="text-[11px] tabular-nums text-ink-400">{phaseDates[i]}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-xl bg-paper-2/70 px-4 py-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-[17px] shadow-kamoo-sm">
                {exp.currentStage.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-semibold text-ink-900">{exp.currentStage.label}</div>
                <div className="truncate text-[11.5px] text-ink-500">{exp.currentStage.sub}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">ETA</div>
                <div className="flex items-center gap-1 text-[12.5px] font-semibold tabular-nums text-ink-900">
                  <Calendar className="h-3 w-3 text-ink-400" />
                  {exp.eta}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-end gap-5 border-b border-line">
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => !t.disabled && setTab(t.key)}
                  disabled={t.disabled}
                  className={cn(
                    "relative pb-2.5 text-[13px] font-semibold transition",
                    t.disabled
                      ? "cursor-not-allowed text-ink-300"
                      : active
                        ? "text-ink-900"
                        : "text-ink-500 hover:text-ink-900",
                  )}
                  title={t.disabled ? "Disponible une fois le devis émis" : undefined}
                >
                  {t.label}
                  {active && !t.disabled && (
                    <span className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-kamoo-blue-900" />
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Vue d'ensemble ── */}
          {tab === "vue" && (
            <>
              <div className={CARD + " p-5"}>
                <div className="mb-3 text-[13.5px] font-semibold text-ink-900">Informations essentielles</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                  <Info label="Shipping mark">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-semibold tabular-nums text-ink-900">{exp.publicCode}</span>
                      <CopyButton value={exp.publicCode} />
                    </div>
                  </Info>
                  <Info label="Entrepôt Chine">
                    <div className="flex items-start gap-1.5">
                      <span className="text-[12px] leading-snug text-ink-900">{exp.warehouseAddress}</span>
                      <CopyButton value={exp.warehouseAddress} />
                    </div>
                  </Info>
                  {/* Transitaire — au-dessus de Transport, cliquable */}
                  <Info label="Transitaire">
                    <Link
                      href="/marketplace/transitaires"
                      className="group/tr flex items-center gap-2 rounded-lg -mx-1 px-1 py-0.5 transition hover:bg-paper-2"
                    >
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink-100 text-[10px] font-bold text-ink-700">
                        {exp.transitaire.avatar}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1 truncate text-[12.5px] font-semibold text-ink-900">
                          {exp.transitaire.name}
                          <ChevronRight className="h-3.5 w-3.5 text-ink-300 transition group-hover/tr:translate-x-0.5 group-hover/tr:text-kamoo-blue-700" />
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-ink-500">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {exp.transitaire.rating} / {exp.transitaireReviews} avis
                        </div>
                      </div>
                    </Link>
                  </Info>
                  <Info label="Transport">
                    <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-900">
                      <TransportIcon className="h-3.5 w-3.5 text-ink-400" />
                      {TRANSPORT_MODE_LABELS[exp.transportMode]}
                    </div>
                  </Info>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Produits déclarés — nom + lien catalogue */}
                <div className={CARD + " p-5"}>
                  <div className="mb-3 text-[13.5px] font-semibold text-ink-900">Produits déclarés</div>
                  <div className="flex flex-col gap-2">
                    {exp.products.map((p, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5">
                        <div
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-[18px]"
                          style={{ background: p.photosDeclared[0]?.bg }}
                        >
                          {p.photosDeclared[0]?.emoji}
                        </div>
                        <div className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink-900">{p.name}</div>
                        <Link
                          href="/boutique"
                          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-700 transition hover:bg-paper-2"
                        >
                          Voir produit
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>

                <HistoriqueRecent history={exp.history} />
              </div>
            </>
          )}

          {/* ── Description ── */}
          {tab === "description" && (
            <div className={CARD + " p-5"}>
              <div className="mb-1 text-[13.5px] font-semibold text-ink-900">Description des produits</div>
              <p className="mb-4 text-[12px] text-ink-500">Informations déclarées par le vendeur à la création.</p>
              <div className="flex flex-col gap-4">
                {exp.products.map((p, i) => (
                  <div key={i} className="rounded-xl border border-line p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[14px] font-semibold text-ink-900">{p.name}</div>
                        <div className="mt-1 flex flex-wrap gap-2">
                          <Meta label="Catégorie" value={`${exp.aiCategory.emoji} ${exp.aiCategory.label}`} />
                          <Meta label="Cartons" value={String(p.cartons)} />
                          <Meta label="Poids déclaré" value={`${p.weightDeclared} kg`} />
                        </div>
                      </div>
                      <Link
                        href="/boutique"
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-700 transition hover:bg-paper-2"
                      >
                        Voir produit
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                    <div className="mt-3 flex gap-2">
                      {p.photosDeclared.map((ph, j) => (
                        <div
                          key={j}
                          className="grid h-16 w-16 place-items-center rounded-lg text-2xl"
                          style={{ background: ph.bg }}
                        >
                          {ph.emoji}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Devis ── */}
          {tab === "devis" && exp.quote && (
            <div className={CARD + " p-5"}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[13.5px] font-semibold text-ink-900">Devis du transitaire</div>
                  <div className="mt-0.5 text-[11.5px] text-ink-500">
                    Émis le {exp.quote.issuedAt} · valable jusqu&apos;au {exp.quote.validUntil}
                  </div>
                </div>
                <div
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-2xl"
                  style={{ background: exp.quote.photo.bg }}
                >
                  {exp.quote.photo.emoji}
                </div>
              </div>

              <p className="mt-3 rounded-xl bg-paper-2/70 p-3 text-[12.5px] leading-relaxed text-ink-700">
                {exp.quote.description}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
                <Meta label="Cartons" value={String(exp.quote.cartons)} />
                <Meta label="Poids" value={`${exp.quote.weightKg} kg`} />
                {exp.quote.volumeCbm !== undefined && <Meta label="Volume" value={`${exp.quote.volumeCbm} CBM`} />}
                <Meta
                  label={`Coût / ${exp.quote.unitCost.unit === "kg" ? "kg" : "CBM"}`}
                  value={`${formatXOF(exp.quote.unitCost.amountXof, false)} F`}
                />
              </div>

              <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
                <span className="text-[13px] font-medium text-ink-500">Total à payer</span>
                <span className="text-[20px] font-bold tabular-nums text-kamoo-orange-600">
                  {formatXOF(exp.quote.totalXof, false)} <span className="text-[12px] text-ink-400">F CFA</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ═══ DROITE ═══ */}
        <div className="flex flex-col gap-4">
          {/* Résumé financier — uniquement si devis émis */}
          {hasQuote && exp.quote && (
            <div className="relative overflow-hidden rounded-2xl bg-kamoo-blue-900 p-6 text-white shadow-kamoo-md">
              <div
                className="pointer-events-none absolute right-0 top-0 h-24 w-28 opacity-20"
                style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "11px 11px" }}
              />
              <div className="relative">
                <div className="flex items-center gap-2 text-[13.5px] font-semibold">
                  <Wallet className="h-4 w-4 text-white/70" />
                  Résumé financier
                </div>

                <div className="mt-4 flex flex-col gap-2.5 text-[13px]">
                  <FinRow label="Poids" value={`${exp.quote.weightKg} kg`} />
                  {exp.quote.volumeCbm !== undefined && <FinRow label="Volume" value={`${exp.quote.volumeCbm} CBM`} />}
                  <FinRow
                    label={`Coût / ${exp.quote.unitCost.unit === "kg" ? "kg" : "CBM"}`}
                    value={`${formatXOF(exp.quote.unitCost.amountXof, false)} F CFA`}
                  />
                </div>

                <div className="my-4 h-px bg-white/15" />

                <div className="flex items-baseline justify-between">
                  <span className="text-[13px] text-white/80">Total à payer</span>
                  <div className="flex items-baseline gap-1.5 whitespace-nowrap">
                    <span className="text-[26px] font-bold tabular-nums text-kamoo-orange-400">
                      {formatXOF(exp.quote.totalXof, false)}
                    </span>
                    <span className="text-[12px] font-semibold text-white/70">F CFA</span>
                  </div>
                </div>

                {!isUnpaid ? (
                  <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-emerald-500/15 py-3 text-[13px] font-semibold text-emerald-300">
                    <Check className="h-4 w-4" />
                    Paiement effectué
                  </div>
                ) : proofSubmitted ? (
                  <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-white/10 py-3 text-[13px] font-semibold text-white/90">
                    <Check className="h-4 w-4" />
                    Preuve envoyée · en vérification
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setModal("pay")}
                      className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-kamoo-orange-500 text-[14px] font-semibold text-white transition hover:bg-kamoo-orange-600"
                    >
                      <Wallet className="h-4 w-4" />
                      Payer maintenant
                    </button>
                    <button
                      onClick={() => setModal("proof")}
                      className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white/10 text-[14px] font-semibold text-white transition hover:bg-white/15"
                    >
                      <Upload className="h-4 w-4" />
                      Envoyer preuve de paiement
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Contacts utiles — in-Kamoo uniquement, aucun contact externe */}
          <div className={CARD + " p-4"}>
            <div className="mb-3 text-[13.5px] font-semibold text-ink-900">Contacts utiles</div>
            <div className="flex flex-col gap-2.5">
              <ContactRow
                avatar={<Headphones className="h-4 w-4 text-kamoo-blue-700" />}
                avatarClass="bg-kamoo-blue-50"
                name="Support KAMOO"
                line="Lun. – Ven. 08h – 18h"
                action="Ouvrir le chat"
              />
              <ContactRow
                avatar={<span className="text-[10px] font-bold text-ink-700">{exp.transitaire.avatar}</span>}
                avatarClass="bg-ink-100"
                name={exp.transitaire.name}
                line="Transitaire assigné"
                action="Contacter"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MODALES ═══ */}
      {modal === "pay" && (
        <Modal onClose={() => setModal("none")} title="Confirmer le paiement">
          <p className="text-[13px] leading-relaxed text-ink-700">
            Vous allez régler{" "}
            <b className="text-ink-900">{exp.quote ? formatXOF(exp.quote.totalXof, false) : "—"} F CFA</b> à{" "}
            <b className="text-ink-900">{exp.transitaire.name}</b> pour libérer l&apos;expédition{" "}
            {exp.publicCode}. Le transitaire expédie dès réception de votre preuve de paiement.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setModal("none")}
              className="h-10 rounded-lg border border-line bg-white px-4 text-[13px] font-semibold text-ink-700 transition hover:bg-paper-2"
            >
              Annuler
            </button>
            <button
              onClick={() => setModal("proof")}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-kamoo-orange-500 px-4 text-[13px] font-semibold text-white transition hover:bg-kamoo-orange-600"
            >
              J&apos;ai payé — envoyer la preuve
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </Modal>
      )}

      {modal === "proof" && (
        <Modal onClose={() => setModal("none")} title="Envoyer une preuve de paiement">
          <p className="text-[12.5px] text-ink-500">
            Ajoutez la capture du virement / paiement mobile. Kamoo vérifie et libère l&apos;expédition.
          </p>
          <label className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-paper-2/40 px-4 py-8 text-center transition hover:border-kamoo-blue-300 hover:bg-paper-2">
            <ImageUp className="h-7 w-7 text-ink-400" />
            <div className="text-[13px] font-semibold text-ink-900">Glissez une image ou cliquez pour téléverser</div>
            <div className="text-[11px] text-ink-400">PNG, JPG · 10 Mo max</div>
            <input type="file" accept="image/*" className="hidden" />
          </label>
          <div className="mt-3">
            <label className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-400">
              Référence de transaction (optionnel)
            </label>
            <input
              type="text"
              placeholder="Ex. Wave · TXN-48213"
              className="mt-1 h-10 w-full rounded-lg border border-line bg-white px-3 text-[13px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600"
            />
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setModal("none")}
              className="h-10 rounded-lg border border-line bg-white px-4 text-[13px] font-semibold text-ink-700 transition hover:bg-paper-2"
            >
              Annuler
            </button>
            <button
              onClick={() => {
                setProofSubmitted(true);
                setModal("proofSent");
              }}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-kamoo-blue-900 px-4 text-[13px] font-semibold text-white transition hover:bg-kamoo-blue-800"
            >
              <Upload className="h-3.5 w-3.5" />
              Envoyer la preuve
            </button>
          </div>
        </Modal>
      )}

      {modal === "proofSent" && (
        <Modal onClose={() => setModal("none")} title="">
          <div className="flex flex-col items-center py-2 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
              <Check className="h-7 w-7" />
            </div>
            <div className="mt-4 text-[16px] font-bold text-ink-900">Preuve envoyée</div>
            <p className="mt-1 max-w-xs text-[13px] text-ink-500">
              Kamoo vérifie votre paiement (sous 24h ouvrées) puis libère l&apos;expédition. Vous serez notifié.
            </p>
            <button
              onClick={() => setModal("none")}
              className="mt-5 h-10 rounded-lg bg-kamoo-blue-900 px-5 text-[13px] font-semibold text-white transition hover:bg-kamoo-blue-800"
            >
              Fermer
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ─── Sous-composants ──────────────────────────────────────────── */

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-[0_24px_60px_rgba(16,24,40,0.22)]">
        <div className="flex items-start justify-between gap-4">
          {title ? <h2 className="text-[16px] font-bold tracking-tight text-ink-900">{title}</h2> : <span />}
          <button
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-400 transition hover:bg-paper-2 hover:text-ink-900"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className={title ? "mt-4" : "mt-1"}>{children}</div>
      </div>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.05em] text-ink-400">{label}</div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-paper-2/70 px-2.5 py-1.5">
      <div className="text-[10px] font-medium uppercase tracking-[0.04em] text-ink-400">{label}</div>
      <div className="mt-0.5 text-[12.5px] font-semibold tabular-nums text-ink-900">{value}</div>
    </div>
  );
}

function FinRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-white/70">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function ContactRow({
  avatar,
  avatarClass,
  name,
  line,
  action,
}: {
  avatar: React.ReactNode;
  avatarClass: string;
  name: string;
  line: string;
  action: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5">
      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full", avatarClass)}>{avatar}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12.5px] font-semibold text-ink-900">{name}</div>
        <div className="truncate text-[11px] text-ink-500">{line}</div>
      </div>
      <button className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 text-[12px] font-semibold text-ink-700 transition hover:bg-paper-2">
        <MessageSquare className="h-3.5 w-3.5" />
        {action}
      </button>
    </div>
  );
}

function HistoriqueRecent({ history }: { history: ExpeditionDetail["history"] }) {
  const events = [...history].reverse().slice(0, 3);
  return (
    <div className={CARD + " p-5"}>
      <div className="mb-3 text-[13.5px] font-semibold text-ink-900">Historique récent</div>
      <ol className="flex flex-col gap-3">
        {events.map((e, i) => {
          const [date, time] = e.date.split(" · ");
          return (
            <li key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-kamoo-blue-700" />
                {i < events.length - 1 && <span className="mt-1 w-px flex-1 bg-line" />}
              </div>
              <div className="min-w-0 pb-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-[11px] tabular-nums text-ink-400">{date}</span>
                  {time && <span className="text-[11px] tabular-nums text-ink-300">{time}</span>}
                </div>
                <div className="text-[12.5px] font-semibold text-ink-900">{e.label}</div>
                {e.detail && <div className="truncate text-[11.5px] text-ink-500">{e.detail}</div>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
