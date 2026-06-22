"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Bike,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  MessageCircle,
  MessageSquare,
  Package,
  Pencil,
  PhoneCall,
  PhoneOff,
  Plus,
  Star,
  ShoppingBag,
  Truck,
  User,
  X,
  XCircle,
} from "lucide-react";
import { AssignLivreurModal } from "@/components/kamoo/assign-livreur-modal";
import { OpenDisputeModal } from "@/components/kamoo/open-dispute-modal";
import { CopyButton } from "@/components/kamoo/copy-button";
import { useChat } from "@/components/kamoo/chat";
import { useCurrentMarket } from "@/lib/hooks/use-current-market";
import { useShopify } from "@/lib/hooks/use-shopify";
import { useClosingState } from "@/lib/hooks/use-closing-state";
import {
  buildClosingHistory,
  MOCK_ACTIVE_CLOSEUSE,
} from "@/lib/data/mock-closing";
import { getProduit } from "@/lib/data/mock-produits";
import {
  CANCELLATION_REASON_LABELS,
  CLOSING_STATUS_LABELS,
  displayOrderNo,
  orderTotalXof,
  type ClosingAssignment,
  type ClosingEventType,
  type ClosingStatus,
} from "@/lib/types/closing";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

const EVENT_ICON: Record<
  ClosingEventType,
  React.ComponentType<{ className?: string }>
> = {
  created: Plus,
  call_attempt: PhoneCall,
  callback_scheduled: Clock,
  confirmed: CheckCircle2,
  cancelled: XCircle,
  comment: MessageSquare,
  marked_unreachable: PhoneOff,
  delivery_scheduled: Truck,
};

function fmtShort(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} · ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
}
function fmtFull(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ─── Pastilles de statut (couleur = sens, palette cohérente) ──────────── */

type Pill = { label: string; bg: string; text: string; dot: string };

function paymentPill(a: ClosingAssignment): Pill {
  if (a.status === "livre")
    return { label: "Encaissé", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" };
  if (a.status === "annule")
    return { label: "Non encaissé", bg: "bg-paper-2", text: "text-ink-500", dot: "bg-ink-400" };
  return { label: "Paiement en attente", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" };
}

function statusPill(s: ClosingStatus): Pill {
  const tone: Record<ClosingStatus, Omit<Pill, "label">> = {
    nouvelle: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
    rappele: { bg: "bg-kamoo-blue-50", text: "text-kamoo-blue-700", dot: "bg-kamoo-blue-500" },
    injoignable: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
    livraison_en_cours: { bg: "bg-kamoo-blue-50", text: "text-kamoo-blue-700", dot: "bg-kamoo-blue-500" },
    livre: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    annule: { bg: "bg-paper-2", text: "text-ink-500", dot: "bg-ink-400" },
  };
  return { label: CLOSING_STATUS_LABELS[s], ...tone[s] };
}

function StatusPill({ label, bg, text, dot }: Pill) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium",
        bg,
        text,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {label}
    </span>
  );
}

/* ─── Sélecteur de statut (changement manuel → synchro Shopify réversible) ─ */

function StatusSelect({
  a,
  closing,
}: {
  a: ClosingAssignment;
  closing: ReturnType<typeof useClosingState>;
}) {
  const [open, setOpen] = useState(false);
  const STATUSES: ClosingStatus[] = [
    "nouvelle",
    "rappele",
    "livraison_en_cours",
    "livre",
    "injoignable",
    "annule",
  ];
  const current = statusPill(a.status);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 text-[13px] font-medium text-ink-900 transition hover:bg-paper-2"
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", current.dot)} />
        Statut · {current.label}
        <ChevronDown className="h-3.5 w-3.5 text-ink-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-[calc(100%+4px)] z-20 w-64 rounded-xl border border-line bg-white p-1 shadow-[var(--shadow-kamoo-lg)]">
            <div className="px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-ink-400">
              Changer le statut
            </div>
            {STATUSES.map((s) => {
              const p = statusPill(s);
              const active = a.status === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    if (!active) closing.update(a.id, { status: s });
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[12.5px] transition hover:bg-paper-2",
                    active ? "font-medium text-ink-900" : "text-ink-700",
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", p.dot)} />
                  <span className="flex-1">{p.label}</span>
                  {active && <Check className="h-3.5 w-3.5 text-kamoo-blue-700" />}
                </button>
              );
            })}
            <div className="border-t border-line px-2.5 pb-1 pt-1.5 text-[10.5px] leading-snug text-ink-400">
              « Livré » honore la commande sur Shopify ; un autre statut la
              dé-honore (réversible).
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Entête commande ────────────────────────────────────────────────── */

function OrderHeader({
  a,
  backHref,
  closing,
}: {
  a: ClosingAssignment;
  backHref: string;
  closing?: ReturnType<typeof useClosingState>;
}) {
  const { openChat } = useChat();
  const [editOpen, setEditOpen] = useState(false);
  return (
    <header className="flex flex-wrap items-center gap-x-3 gap-y-3 border-b border-line px-5 py-4 sm:px-6">
      <Link
        href={backHref}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-paper-2 text-ink-500 transition hover:text-ink-700"
        aria-label="Retour"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <h1 className="font-mono-kamoo text-[18px] font-medium tracking-tight text-ink-900 md:text-[20px]">
            {displayOrderNo(a)}
          </h1>
          <CopyButton value={displayOrderNo(a)} />
          <StatusPill {...statusPill(a.status)} />
          <StatusPill {...paymentPill(a)} />
        </div>
        <p className="mt-1 text-[12px] text-ink-400">
          Créée le {fmtFull(a.createdAt)} à {fmtTime(a.createdAt)}
        </p>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        {closing && <StatusSelect a={a} closing={closing} />}
        {a.status === "livraison_en_cours" && a.delivery && closing && (
          <button
            onClick={() => closing.markDelivered(a.id)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-kamoo-blue-900 px-3.5 text-[13px] font-medium text-white transition hover:bg-kamoo-blue-800"
          >
            <CheckCircle2 className="h-4 w-4" />
            Marquer livrée
          </button>
        )}
        {a.delivery?.progress === "alerte" && closing && (
          <button
            onClick={() => closing.retryDelivery(a.id)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3.5 text-[13px] font-medium text-amber-800 transition hover:bg-amber-100"
          >
            Relancer la livraison
          </button>
        )}
        <button
          onClick={() =>
            openChat({
              id: "closeuse:aminata-sene",
              name: MOCK_ACTIVE_CLOSEUSE.name,
              role: "closeuse",
              photoUrl: "/closeuses/aminata-sene.jpg",
            })
          }
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 text-[13px] font-medium text-ink-900 transition hover:bg-paper-2"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Contacter la closeuse
        </button>
        {closing && (
          <button
            onClick={() => setEditOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 text-[13px] font-medium text-ink-900 transition hover:bg-paper-2"
          >
            <Pencil className="h-3.5 w-3.5" />
            Modifier
          </button>
        )}
      </div>

      {editOpen && closing && (
        <EditOrderModal a={a} closing={closing} onClose={() => setEditOpen(false)} />
      )}
    </header>
  );
}

/* ─── Modale « Modifier » : créneau de livraison + commentaire ──────── */

function EditOrderModal({
  a,
  closing,
  onClose,
}: {
  a: ClosingAssignment;
  closing: ReturnType<typeof useClosingState>;
  onClose: () => void;
}) {
  const initialSlot = (() => {
    if (!a.delivery?.scheduledAt) return "";
    const d = new Date(a.delivery.scheduledAt);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  })();
  const [slot, setSlot] = useState(initialSlot);
  const [comment, setComment] = useState(a.comment ?? "");

  function save() {
    closing.update(a.id, {
      comment: comment.trim() || undefined,
      ...(a.delivery && slot
        ? { delivery: { ...a.delivery, scheduledAt: new Date(slot).toISOString() } }
        : {}),
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-kamoo-blue-900/30 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div className="w-full max-w-sm overflow-hidden rounded-xl border border-line bg-white shadow-[var(--shadow-kamoo-lg)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h3 className="text-[15px] font-medium text-ink-900">Modifier la commande</h3>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-lg text-ink-400 transition hover:bg-paper-2 hover:text-ink-900" aria-label="Fermer">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col gap-3.5 px-5 py-4">
          {a.delivery && (
            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-ink-600">Créneau de livraison prévu</label>
              <input
                type="datetime-local"
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
                className="h-10 w-full rounded-lg border border-line bg-white px-3 text-[13px] text-ink-900 outline-none focus:border-kamoo-blue-600"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink-600">Commentaire interne</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Ex : client préfère être livré après 17 h…"
              className="w-full resize-none rounded-lg border border-line bg-white px-3 py-2 text-[13px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600"
            />
          </div>
        </div>
        <div className="flex gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="flex-1 rounded-lg border border-line bg-white py-2.5 text-[13px] font-medium text-ink-700 transition hover:bg-paper-2">
            Annuler
          </button>
          <button onClick={save} className="flex-1 rounded-lg bg-kamoo-blue-900 py-2.5 text-[13px] font-medium text-white transition hover:bg-kamoo-blue-800">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Vue ────────────────────────────────────────────────────────────── */

type Props = {
  a: ClosingAssignment;
  backHref: string;
  breadcrumbLabel: string;
  /** Mise en page pleine largeur, une seule colonne (pas de panneau latéral) */
  fullWidth?: boolean;
  /** Machine d'états closing (actions réelles). Fourni par les pages [id]. */
  closing?: ReturnType<typeof useClosingState>;
};

export function OrderDetailView({ a, backHref, fullWidth = false, closing }: Props) {
  const { openChat } = useChat();
  const { currentMarket } = useCurrentMarket();
  const { currencyFor } = useShopify();
  const currency = currencyFor(currentMarket.id);
  const closeuse = MOCK_ACTIVE_CLOSEUSE;
  const history = buildClosingHistory(a, closeuse.name);
  const [assignOpen, setAssignOpen] = useState(false);
  const [livreurDisputeOpen, setLivreurDisputeOpen] = useState(false);

  const total = orderTotalXof(a);

  const cogsKnown = a.items.every(
    (it) => getProduit(it.productId ?? "")?.costPriceXof != null,
  );
  const cogs = a.items.reduce(
    (s, it) =>
      s + (getProduit(it.productId ?? "")?.costPriceXof ?? 0) * it.quantity,
    0,
  );
  const margin = total - cogs;
  const marginPct = total > 0 ? Math.round((margin / total) * 100) : 0;

  const isLivreurAlert = a.delivery?.progress === "alerte";

  // Toutes les infos du formulaire COD Shopify : attributs de commande +
  // propriétés de ligne + note. Affichées telles quelles dans Kamoo.
  const lineItemAttrs = a.items.flatMap((it) =>
    (it.customAttributes ?? []).map((attr) => ({ ...attr, product: it.productName })),
  );
  const hasFormInfo =
    (a.customAttributes?.length ?? 0) > 0 || !!a.note || lineItemAttrs.length > 0;

  const isOpenStatus = ["nouvelle", "rappele", "injoignable"].includes(a.status);
  const isConfirmed = a.status === "livraison_en_cours";
  const isClosed = a.status === "livre" || a.status === "annule";

  return (
    <div className="min-h-full bg-paper">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <div className="overflow-hidden rounded-xl border border-line bg-white shadow-kamoo-sm">
          <OrderHeader a={a} backHref={backHref} closing={closing} />

          <div className="flex flex-col gap-5 p-5 sm:p-6">
            {/* Bandeau Shopify */}
            {a.shopifyOrderId && (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-emerald-700">
                    Commande Shopify {a.shopifyName ?? ""}
                  </div>
                  <p className="mt-0.5 text-[12.5px] text-ink-700">
                    {a.status === "livre"
                      ? "Honorée & payée sur Shopify ✓ — statut synchronisé automatiquement."
                      : a.status === "annule"
                        ? "Commande annulée — non honorée sur Shopify."
                        : "Sera marquée « honorée & payée » sur Shopify dès la livraison encaissée."}
                  </p>
                </div>
              </div>
            )}

            {/* Barre d'actions closing */}
            {closing && !isClosed && (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-paper-2/40 p-3">
                <a
                  href={`tel:${a.client.phone.replace(/\s/g, "")}`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-kamoo-blue-900 px-3.5 text-[12.5px] font-medium text-white transition hover:bg-kamoo-blue-800"
                >
                  <PhoneCall className="h-3.5 w-3.5" /> Appeler
                </a>
                <a
                  href={`https://wa.me/${(a.client.whatsapp ?? a.client.phone).replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 text-[12.5px] font-medium text-emerald-700 transition hover:bg-emerald-50"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </a>
                <span className="mx-1 h-5 w-px bg-line" />
                {isOpenStatus && (
                  <>
                    <button
                      onClick={() => closing.confirm(a.id)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3.5 text-[12.5px] font-medium text-emerald-700 transition hover:bg-emerald-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Confirmer
                    </button>
                    <button
                      onClick={() => closing.postpone(a.id)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3.5 text-[12.5px] font-medium text-amber-700 transition hover:bg-amber-50"
                    >
                      <Clock className="h-3.5 w-3.5" /> Reporter demain
                    </button>
                    {a.status !== "injoignable" && (
                      <button
                        onClick={() => closing.markUnreachable(a.id)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 text-[12.5px] font-medium text-ink-600 transition hover:bg-paper-2"
                      >
                        <PhoneOff className="h-3.5 w-3.5" /> Injoignable
                      </button>
                    )}
                  </>
                )}
                {isConfirmed && !a.delivery && (
                  <button
                    onClick={() => setAssignOpen(true)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-kamoo-blue-900 px-3.5 text-[12.5px] font-medium text-white transition hover:bg-kamoo-blue-800"
                  >
                    <Truck className="h-3.5 w-3.5" /> Assigner un livreur
                  </button>
                )}
                <button
                  onClick={() => {
                    if (window.confirm(`Annuler définitivement la commande ${a.id} ?`)) closing.cancel(a.id);
                  }}
                  className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3.5 text-[12.5px] font-medium text-red-600 transition hover:bg-red-50"
                >
                  <XCircle className="h-3.5 w-3.5" /> Annuler la commande
                </button>
              </div>
            )}

            {assignOpen && closing && (
              <AssignLivreurModal
                onClose={() => setAssignOpen(false)}
                onAssign={(d) => {
                  closing.assignLivreur(a.id, d);
                  setAssignOpen(false);
                }}
              />
            )}

            {/* Alerte livreur */}
            {isLivreurAlert && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-red-100 text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-red-700">
                    Alerte du livreur · {a.delivery?.name}
                  </div>
                  <p className="mt-1 text-[13px] font-medium leading-snug text-ink-900">
                    « {a.delivery?.livreurNote || "Aucune note fournie"} »
                  </p>
                </div>
              </div>
            )}

            {/* 2 colonnes (closing) OU pleine largeur 1 colonne. */}
            <div className={cn("gap-5", fullWidth ? "flex flex-col" : "grid grid-cols-1 items-start lg:grid-cols-[1.55fr_1fr]")}>
              {/* ── COLONNE GAUCHE : Articles + Activité ── */}
              <div className="flex flex-col gap-5">
                {hasFormInfo && (
                  <Card title="Informations du formulaire" icon={<MessageSquare className="h-3.5 w-3.5" />}>
                    <div className="flex flex-col gap-2.5">
                      {a.customAttributes?.map((attr, i) => (
                        <AttrRow key={`o-${i}`} label={attr.key} value={attr.value} />
                      ))}
                      {lineItemAttrs.map((attr, i) => (
                        <AttrRow key={`l-${i}`} label={`${attr.product} · ${attr.key}`} value={attr.value} />
                      ))}
                      {a.note && (
                        <div className="rounded-lg bg-paper-2/60 px-3 py-2 text-[12.5px] italic leading-relaxed text-ink-700">
                          « {a.note} »
                        </div>
                      )}
                    </div>
                  </Card>
                )}
                <Card title="Articles commandés">
                  <div className="flex flex-col gap-2">
                    {a.items.map((item, idx) => {
                      const p = getProduit(item.productId ?? "");
                      const lineTotal = item.quantity * item.unitPriceXof;
                      const inner = (
                        <>
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-paper-2 text-ink-400">
                            <Package className="h-4.5 w-4.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div
                              className={cn(
                                "truncate text-[13.5px] font-medium text-ink-900",
                                item.productId && "group-hover:text-kamoo-blue-700",
                              )}
                            >
                              {item.productName}
                            </div>
                            <div className="mt-0.5 font-mono-kamoo text-[11.5px] text-ink-400">
                              {p?.sku ?? "—"}
                            </div>
                          </div>
                          <span className="font-mono-kamoo text-[12.5px] text-ink-400">
                            ×{item.quantity}
                          </span>
                          <div className="w-24 text-right text-[14px] font-medium tabular-nums text-ink-900">
                            {formatMoney(lineTotal, currency)}
                          </div>
                          {item.productId && (
                            <ChevronRight className="h-4 w-4 shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-kamoo-blue-700" />
                          )}
                        </>
                      );
                      return item.productId ? (
                        <Link
                          key={idx}
                          href={`/boutique/${item.productId}`}
                          className="group flex items-center gap-3 rounded-lg border border-line bg-paper-2/40 p-3 transition hover:border-kamoo-blue-200 hover:bg-white"
                        >
                          {inner}
                        </Link>
                      ) : (
                        <div
                          key={idx}
                          className="flex items-center gap-3 rounded-lg border border-line bg-paper-2/40 p-3"
                        >
                          {inner}
                        </div>
                      );
                    })}
                  </div>

                  {/* Récapitulatif financier */}
                  <div className="mt-5 border-t border-line pt-4">
                    <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.06em] text-ink-400">
                      Récapitulatif financier
                    </div>

                    <div className="flex flex-col gap-2 text-[13.5px]">
                      <FinRow label="Sous-total articles" value={formatMoney(total, currency)} />
                      <FinRow label="Frais de livraison" value="0 F" muted />
                    </div>

                    <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-line pt-3">
                      <span className="text-[14px] font-medium text-ink-900">Total à encaisser</span>
                      <span className="text-[20px] font-medium leading-none tabular-nums text-ink-900">
                        {formatMoney(total, currency)}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-col gap-2 border-t border-dashed border-line pt-4 text-[13px]">
                      {cogsKnown && (
                        <FinRow
                          label="Coût marchandise (COGS)"
                          value={`− ${formatMoney(cogs, currency)}`}
                          muted
                        />
                      )}
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-medium text-ink-900">Marge nette</span>
                        <span className="font-medium tabular-nums text-emerald-700">
                          {cogsKnown
                            ? `${formatMoney(margin, currency)} · ${marginPct}%`
                            : "Non calculée"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Activité de la commande */}
                <Card title="Activité de la commande" icon={<Clock className="h-3.5 w-3.5" />}>
                  <div className="flex flex-col">
                    {[...history].reverse().map((e, i, arr) => {
                      const Icon = EVENT_ICON[e.type];
                      const isFirst = i === 0;
                      const isLast = i === arr.length - 1;
                      return (
                        <div key={i} className="flex gap-3">
                          <div className="flex shrink-0 flex-col items-center">
                            <div
                              className={cn(
                                "grid h-[26px] w-[26px] place-items-center rounded-full",
                                isFirst
                                  ? "bg-kamoo-blue-900 text-white ring-4 ring-kamoo-blue-900/12"
                                  : "border border-line bg-paper-2 text-ink-500",
                              )}
                            >
                              <Icon className="h-3 w-3" />
                            </div>
                            {!isLast && <div className="min-h-[24px] w-px flex-1 bg-line" />}
                          </div>
                          <div className={cn("flex-1", !isLast && "pb-4")}>
                            <div className="flex items-baseline justify-between gap-3">
                              <span className="text-[13.5px] font-medium text-ink-900">{e.label}</span>
                              <span className="shrink-0 whitespace-nowrap font-mono-kamoo text-[11px] text-ink-400">
                                {fmtShort(e.at)}
                              </span>
                            </div>
                            <div className="mt-0.5 text-[12px] text-ink-500">{e.authorName}</div>
                            {e.detail && (
                              <div
                                className={cn(
                                  "mt-1.5 text-[12px]",
                                  e.type === "comment"
                                    ? "rounded-lg bg-paper-2/60 px-3 py-2 italic text-ink-700"
                                    : "italic text-ink-700",
                                )}
                              >
                                {e.detail}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>

              {/* ── Client + Livreur ── */}
              <div className={cn("gap-5", fullWidth ? "grid items-start md:grid-cols-2" : "flex flex-col")}>
                {/* Client */}
                <Card title="Client" icon={<User className="h-3.5 w-3.5" />}>
                  <div className="flex items-center gap-3">
                    <Avatar name={a.client.name} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[14.5px] font-medium text-ink-900">{a.client.name}</div>
                      <div className="text-[12px] text-ink-500">
                        {a.client.isReturning ? "Client régulier" : "Nouveau client"}
                        {a.client.orderCount ? ` · ${a.client.orderCount}ᵉ commande` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
                    <Field label="Téléphone">
                      <span className="font-mono-kamoo">{a.client.phone}</span>
                    </Field>
                    <Field label="WhatsApp">
                      {a.client.whatsapp ? (
                        <span className="font-mono-kamoo">{a.client.whatsapp}</span>
                      ) : (
                        <span className="text-ink-400">Non renseigné</span>
                      )}
                    </Field>
                    {a.client.email && (
                      <Field label="Email">
                        <span className="break-all">{a.client.email}</span>
                      </Field>
                    )}
                    <Field label="Adresse">
                      {a.client.address ?? `${a.client.zone}, ${a.client.city}`}
                    </Field>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2.5">
                    <Link
                      href={`/clients/${a.client.id}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-line bg-white py-2.5 text-[12.5px] font-medium text-ink-900 transition hover:bg-paper-2"
                    >
                      <User className="h-3.5 w-3.5" />
                      Voir client
                    </Link>
                    {a.client.whatsapp ? (
                      <a
                        href={`https://wa.me/${a.client.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-line bg-white py-2.5 text-[12.5px] font-medium text-emerald-700 transition hover:bg-emerald-50"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp
                      </a>
                    ) : (
                      <span className="inline-flex items-center justify-center rounded-lg border border-dashed border-line py-2.5 text-[12px] text-ink-400">
                        Pas de WhatsApp
                      </span>
                    )}
                  </div>
                </Card>

                {/* Livreur */}
                <Card title="Livreur" icon={<Bike className="h-3.5 w-3.5" />}>
                  {a.delivery ? (
                    <>
                      <div className="flex items-center gap-3">
                        <Avatar name={a.delivery.name} />
                        <div className="min-w-0 flex-1">
                          <div className="text-[14.5px] font-medium text-ink-900">{a.delivery.name}</div>
                          <div className="mt-0.5 flex items-center gap-1 text-[12px] text-ink-500">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span className="font-medium text-ink-700">{a.delivery.rating}</span>
                            {a.delivery.deliveriesCount != null && (
                              <span>· {a.delivery.deliveriesCount} livraisons</span>
                            )}
                          </div>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-medium",
                            a.delivery.progress === "alerte"
                              ? "bg-red-50 text-red-600"
                              : a.delivery.progress === "effectue"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-kamoo-blue-50 text-kamoo-blue-700",
                          )}
                        >
                          {a.delivery.progress === "alerte"
                            ? "Alerte"
                            : a.delivery.progress === "effectue"
                              ? "Livré"
                              : "En course"}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          a.delivery &&
                          openChat({
                            id: `livreur:${a.delivery.id}`,
                            name: a.delivery.name,
                            role: "livreur",
                            avatarBg: a.delivery.avatarBg,
                          })
                        }
                        className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-line bg-white py-2.5 text-[12.5px] font-medium text-ink-900 transition hover:bg-paper-2"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Contacter {a.delivery.name.split(" ")[0]}
                      </button>
                      <button
                        onClick={() => setLivreurDisputeOpen(true)}
                        className="mt-2 w-full text-center text-[11.5px] font-medium text-ink-400 transition hover:text-red-600"
                      >
                        Signaler un problème avec ce livreur
                      </button>
                      {livreurDisputeOpen && a.delivery && (
                        <OpenDisputeModal
                          againstRole="livreur"
                          againstSlug={a.delivery.id.replace(/^lv_/, "")}
                          againstName={a.delivery.name}
                          context={`Commande ${a.id}`}
                          onClose={() => setLivreurDisputeOpen(false)}
                        />
                      )}
                    </>
                  ) : (
                    <div className="rounded-lg border border-dashed border-line bg-paper-2/30 px-3 py-6 text-center">
                      <Truck className="mx-auto h-6 w-6 text-ink-400" />
                      <p className="mt-2 text-[12.5px] font-medium text-ink-700">Aucun livreur assigné</p>
                      <p className="mt-0.5 text-[11px] text-ink-400">
                        Sera assigné une fois la commande confirmée.
                      </p>
                    </div>
                  )}
                </Card>

                {/* Annulation */}
                {a.status === "annule" && a.cancellationReason && (
                  <div className="rounded-xl border border-red-200 bg-red-50/60 p-5">
                    <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-red-700">
                      Commande annulée
                    </div>
                    <div className="mt-1 text-[13.5px] font-medium text-ink-900">
                      {CANCELLATION_REASON_LABELS[a.cancellationReason]}
                    </div>
                    {a.comment && (
                      <p className="mt-3 rounded-lg bg-white px-3 py-2 text-[12px] italic text-ink-700">
                        « {a.comment} »
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Sous-composants ────────────────────────────────────────────────── */

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-line bg-white">
      <div className="flex items-center gap-1.5 border-b border-line px-5 py-3 text-[11px] font-medium uppercase tracking-[0.06em] text-ink-400">
        {icon && <span className="text-ink-400">{icon}</span>}
        {title}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function FinRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-500">{label}</span>
      <span
        className={cn(
          "font-mono-kamoo font-medium tabular-nums",
          muted ? "text-ink-700" : "text-ink-900",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function AttrRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 border-b border-line/60 pb-2 last:border-0 last:pb-0">
      <span className="text-[11.5px] font-medium uppercase tracking-[0.04em] text-ink-400">
        {label}
      </span>
      <span className="text-right text-[13.5px] text-ink-900">{value}</span>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-ink-400">{label}</div>
      <div className="mt-0.5 text-[13.5px] text-ink-800">{children}</div>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-paper-2 text-[13px] font-medium text-ink-700">
      {name
        .split(" ")
        .map((n) => n.charAt(0))
        .slice(0, 2)
        .join("")}
    </div>
  );
}
