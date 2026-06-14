"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Bike,
  CheckCircle2,
  Clock,
  Flag,
  MapPin,
  MessageSquare,
  Package,
  Pencil,
  PhoneCall,
  Star,
  Truck,
  User,
} from "lucide-react";
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
  CLOSING_STATUS_LABELS,
  displayOrderNo,
  orderTotalXof,
  type ClosingAssignment,
  type ClosingEventType,
  type ClosingStatus,
} from "@/lib/types/closing";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

/* ─── Format ──────────────────────────────────────────────────────── */
function fmtShort(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} · ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
}
function fmtDay(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const same = d.toDateString() === today.toDateString();
  const label = same
    ? "aujourd'hui"
    : d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  return `${label} · ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
}

/* ─── Pastilles ───────────────────────────────────────────────────── */
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
    nouvelle: { bg: "bg-yellow-100", text: "text-yellow-800", dot: "bg-yellow-500" },
    rappele: { bg: "bg-kamoo-orange-50", text: "text-kamoo-orange-600", dot: "bg-kamoo-orange-500" },
    injoignable: { bg: "bg-amber-50", text: "text-amber-800", dot: "bg-amber-700" },
    livraison_en_cours: { bg: "bg-cyan-50", text: "text-cyan-800", dot: "bg-cyan-500" },
    livre: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    annule: { bg: "bg-paper-2", text: "text-ink-500", dot: "bg-ink-400" },
  };
  return { label: CLOSING_STATUS_LABELS[s], ...tone[s] };
}

function StatusPill({ label, bg, text, dot }: Pill) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold", bg, text)}>
      <span className={cn("h-2 w-2 rounded-full", dot)} />
      {label}
    </span>
  );
}

const EVENT_ICON: Record<ClosingEventType, React.ComponentType<{ className?: string }>> = {
  created: Package,
  call_attempt: PhoneCall,
  callback_scheduled: Clock,
  confirmed: CheckCircle2,
  cancelled: AlertTriangle,
  comment: MessageSquare,
  marked_unreachable: PhoneCall,
  delivery_scheduled: Truck,
};

/* ─── Vue ─────────────────────────────────────────────────────────── */
type Props = {
  a: ClosingAssignment;
  backHref: string;
  closing: ReturnType<typeof useClosingState>;
};

export function DeliveryDetailView({ a, backHref, closing }: Props) {
  const { openChat } = useChat();
  const { currentMarket } = useCurrentMarket();
  const { currencyFor } = useShopify();
  const currency = currencyFor(currentMarket.id);
  const closeuse = MOCK_ACTIVE_CLOSEUSE;
  const history = buildClosingHistory(a, closeuse.name);
  const [disputeOpen, setDisputeOpen] = useState(false);

  const total = orderTotalXof(a);
  const d = a.delivery!;
  const delivered = a.status === "livre" || d.progress === "effectue";
  const alerte = d.progress === "alerte";
  const eta = d.scheduledAt ?? a.scheduledDeliveryAt;

  const contactCloseuse = () =>
    openChat({
      id: "closeuse:aminata-sene",
      name: closeuse.name,
      role: "closeuse",
      photoUrl: "/closeuses/aminata-sene.jpg",
    });
  const contactLivreur = () =>
    openChat({ id: `livreur:${d.id}`, name: d.name, role: "livreur", avatarBg: d.avatarBg });

  return (
    <div className="min-h-full bg-paper">
      <div className="mx-auto w-full max-w-6xl px-6 py-6">
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-kamoo-sm">
          {/* HEADER */}
          <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-6 py-4">
            <Link
              href={backHref}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-paper-2 text-ink-500 transition hover:text-ink-700"
              aria-label="Retour"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="font-mono-kamoo text-[22px] font-semibold tracking-tight text-ink-900">
              {displayOrderNo(a)}
            </h1>
            <CopyButton value={displayOrderNo(a)} />
            <StatusPill {...statusPill(a.status)} />
            <StatusPill {...paymentPill(a)} />

            <div className="ml-auto flex shrink-0 items-center gap-2">
              {a.status === "livraison_en_cours" && (
                <button
                  onClick={() => closing.markDelivered(a.id)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-kamoo-blue-900 px-3.5 text-[13px] font-semibold text-white transition hover:bg-kamoo-blue-800"
                >
                  <CheckCircle2 className="h-4 w-4" /> Marquer livrée
                </button>
              )}
              {alerte && (
                <button
                  onClick={() => closing.retryDelivery(a.id)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3.5 text-[13px] font-semibold text-amber-800 transition hover:bg-amber-100"
                >
                  Relancer la livraison
                </button>
              )}
              <button
                onClick={contactCloseuse}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 text-[13px] font-semibold text-ink-900 transition hover:bg-paper-2"
              >
                <MessageSquare className="h-3.5 w-3.5" /> Closeuse
              </button>
            </div>
          </header>

          <div className="p-6">
            {/* Alerte livreur */}
            {alerte && (
              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-100 text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10.5px] font-semibold uppercase tracking-wider text-red-700">
                    Alerte du livreur · {d.name}
                  </div>
                  <p className="mt-1 text-[13.5px] font-semibold leading-snug text-ink-900">
                    « {d.livreurNote || "Aucune note fournie"} »
                  </p>
                </div>
              </div>
            )}

            {/* HÉROS — COD + suivi de livraison */}
            <div className="rounded-2xl border border-line p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-400">
                    {delivered ? "Encaissé à la livraison" : "À encaisser à la livraison"}
                  </div>
                  <div className="mt-1 font-display text-[28px] font-semibold leading-none tracking-tight text-ink-900 tabular-nums">
                    {formatMoney(total, currency)}{" "}
                    <span className="text-[14px] font-semibold text-ink-400">
                      {currency === "XOF" ? "F CFA" : currency}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  {delivered ? (
                    <div className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      {d.deliveredAt ? `Livrée ${fmtDay(d.deliveredAt)}` : "Livrée & encaissée"}
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-amber-700">
                      <Clock className="h-4 w-4" />
                      {eta ? `Prévue ${fmtDay(eta)}` : "Créneau à planifier"}
                    </div>
                  )}
                  <div className="mt-1 inline-flex items-center gap-1.5 text-[12px] text-ink-500">
                    <MapPin className="h-3.5 w-3.5" />
                    {a.client.zone}, {a.client.city}
                  </div>
                </div>
              </div>

              {/* Tracker */}
              <div className="mt-5 flex items-center">
                <TrackStep state="done" icon={CheckCircle2} label="Confirmée" />
                <TrackLine done />
                <TrackStep
                  state={delivered ? "done" : alerte ? "alert" : "active"}
                  icon={alerte ? AlertTriangle : Truck}
                  label={alerte ? "Incident" : "En course"}
                />
                <TrackLine done={delivered} />
                <TrackStep
                  state={delivered ? "done" : "pending"}
                  icon={Flag}
                  label="Livrée & payée"
                />
              </div>
            </div>

            {/* CONTENU — 2 colonnes */}
            <div className="mt-5 grid grid-cols-[1.55fr_1fr] items-start gap-5">
              {/* GAUCHE */}
              <div className="flex flex-col gap-5">
                {/* Note pour le livreur */}
                <NoteCard a={a} closing={closing} />

                {/* Articles */}
                <Card title="Articles" icon={<Package className="h-3.5 w-3.5" />} count={a.items.length}>
                  <div className="flex flex-col gap-2">
                    {a.items.map((item, idx) => {
                      const p = getProduit(item.productId ?? "");
                      const lineTotal = item.quantity * item.unitPriceXof;
                      return (
                        <div key={idx} className="flex items-center gap-3 rounded-xl bg-paper-2/40 p-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-ink-400 ring-1 ring-line">
                            <Package className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[13.5px] font-semibold text-ink-900">{item.productName}</div>
                            <div className="font-mono-kamoo text-[11px] text-ink-400">{p?.sku ?? "—"}</div>
                          </div>
                          <span className="font-mono-kamoo text-[12.5px] text-ink-400">×{item.quantity}</span>
                          <div className="w-24 text-right font-display text-[14px] font-semibold text-ink-900">
                            {formatMoney(lineTotal, currency)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex items-baseline justify-between border-t-2 border-ink-200 pt-3">
                    <span className="text-[14px] font-semibold text-ink-900">Total à encaisser</span>
                    <span className="font-display text-[18px] font-semibold text-ink-900 tabular-nums">
                      {formatMoney(total, currency)}{" "}
                      <span className="text-[12px] font-semibold text-ink-400">
                        {currency === "XOF" ? "F" : currency}
                      </span>
                    </span>
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
                                  ? "bg-kamoo-blue-900 text-white"
                                  : "border border-line bg-paper-2 text-ink-500",
                              )}
                            >
                              <Icon className="h-3 w-3" />
                            </div>
                            {!isLast && <div className="min-h-[24px] w-px flex-1 bg-line" />}
                          </div>
                          <div className={cn("flex-1", !isLast && "pb-4")}>
                            <div className="flex items-baseline justify-between gap-3">
                              <span className="text-[13.5px] font-semibold text-ink-900">{e.label}</span>
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

              {/* DROITE */}
              <div className="flex flex-col gap-5">
                {/* Livreur */}
                <Card title="Livreur" icon={<Bike className="h-3.5 w-3.5" />}>
                  <div className="flex items-center gap-3">
                    <Avatar name={d.name} bg={d.avatarBg} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-semibold text-ink-900">{d.name}</div>
                      <div className="mt-0.5 flex items-center gap-1 text-[12px] text-ink-500">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="font-semibold text-ink-700">{d.rating}</span>
                        {d.deliveriesCount != null && <span>· {d.deliveriesCount} livraisons</span>}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                        alerte
                          ? "bg-red-50 text-red-600"
                          : delivered
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700",
                      )}
                    >
                      {alerte ? "Alerte" : delivered ? "Livré" : "En course"}
                    </span>
                  </div>
                  {d.vehicle && (
                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-paper-2/60 px-2.5 py-1.5 text-[11.5px] font-medium text-ink-600">
                      <Bike className="h-3.5 w-3.5" /> {d.vehicle}
                    </div>
                  )}
                  <button
                    onClick={contactLivreur}
                    className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-line bg-white py-2.5 text-[12.5px] font-semibold text-ink-900 transition hover:bg-paper-2"
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> Contacter {d.name.split(" ")[0]}
                  </button>
                  <button
                    onClick={() => setDisputeOpen(true)}
                    className="mt-2 w-full text-center text-[11.5px] font-semibold text-ink-400 transition hover:text-red-600"
                  >
                    Signaler un problème avec ce livreur
                  </button>
                  {disputeOpen && (
                    <OpenDisputeModal
                      againstRole="livreur"
                      againstSlug={d.id.replace(/^lv_/, "")}
                      againstName={d.name}
                      context={`Commande ${a.id}`}
                      onClose={() => setDisputeOpen(false)}
                    />
                  )}
                </Card>

                {/* Client & livraison */}
                <Card title="Client & livraison" icon={<User className="h-3.5 w-3.5" />}>
                  <div className="flex items-center gap-3">
                    <Avatar name={a.client.name} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-semibold text-ink-900">{a.client.name}</div>
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
                    <Field label="Adresse de livraison">
                      {a.client.zone}, {a.client.city}
                      {a.client.deliveryNotes ? ` — ${a.client.deliveryNotes}` : ""}
                    </Field>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2.5">
                    <Link
                      href={`/clients/${a.client.id}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-line bg-white py-2.5 text-[12.5px] font-semibold text-ink-900 transition hover:bg-paper-2"
                    >
                      <User className="h-3.5 w-3.5" /> Voir client
                    </Link>
                    {a.client.whatsapp ? (
                      <a
                        href={`https://wa.me/${a.client.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-[12.5px] font-semibold text-white transition hover:bg-emerald-700"
                      >
                        <PhoneCall className="h-3.5 w-3.5" /> WhatsApp
                      </a>
                    ) : (
                      <a
                        href={`tel:${a.client.phone.replace(/\s/g, "")}`}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-kamoo-blue-900 py-2.5 text-[12.5px] font-semibold text-white transition hover:bg-kamoo-blue-800"
                      >
                        <PhoneCall className="h-3.5 w-3.5" /> Appeler
                      </a>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Tracker ─────────────────────────────────────────────────────── */
function TrackStep({
  state,
  icon: Icon,
  label,
}: {
  state: "done" | "active" | "pending" | "alert";
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  const circle =
    state === "done"
      ? "bg-emerald-600 text-white"
      : state === "active"
        ? "bg-kamoo-blue-900 text-white"
        : state === "alert"
          ? "bg-red-500 text-white"
          : "bg-paper-2 text-ink-400 ring-1 ring-inset ring-line";
  return (
    <div className="flex w-24 shrink-0 flex-col items-center gap-1.5">
      <span className={cn("grid h-8 w-8 place-items-center rounded-full", circle)}>
        <Icon className="h-4 w-4" />
      </span>
      <span
        className={cn(
          "text-center text-[11.5px]",
          state === "pending" ? "text-ink-400" : "font-medium text-ink-900",
        )}
      >
        {label}
      </span>
    </div>
  );
}

function TrackLine({ done }: { done?: boolean }) {
  return <div className={cn("mb-5 h-0.5 flex-1 rounded", done ? "bg-emerald-600" : "bg-line")} />;
}

/* ─── Note pour le livreur ────────────────────────────────────────── */
function NoteCard({
  a,
  closing,
}: {
  a: ClosingAssignment;
  closing: ReturnType<typeof useClosingState>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(a.comment ?? "");

  const save = () => {
    closing.update(a.id, { comment: draft.trim() || undefined });
    setEditing(false);
  };

  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-400">
          <MessageSquare className="h-3.5 w-3.5" />
          Note pour le livreur
        </div>
        {!editing && (
          <button
            onClick={() => {
              setDraft(a.comment ?? "");
              setEditing(true);
            }}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-semibold text-ink-500 transition hover:bg-paper-2 hover:text-ink-900"
          >
            <Pencil className="h-3 w-3" /> {a.comment ? "Modifier" : "Ajouter"}
          </button>
        )}
      </div>
      <div>
        {editing ? (
          <div className="flex flex-col gap-2.5">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              autoFocus
              placeholder="Ex : appeler avant d'arriver · portail bleu · livrer après 17 h…"
              className="w-full resize-none rounded-xl border border-line bg-white px-3.5 py-2.5 text-[13px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600 focus:ring-2 focus:ring-kamoo-blue-600/12"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditing(false)}
                className="rounded-lg border border-line bg-white px-3 py-1.5 text-[12.5px] font-semibold text-ink-700 transition hover:bg-paper-2"
              >
                Annuler
              </button>
              <button
                onClick={save}
                className="rounded-lg bg-kamoo-blue-900 px-3.5 py-1.5 text-[12.5px] font-semibold text-white transition hover:bg-kamoo-blue-800"
              >
                Enregistrer
              </button>
            </div>
          </div>
        ) : a.comment ? (
          <p className="rounded-xl bg-amber-50/60 px-3.5 py-3 text-[13px] leading-relaxed text-ink-800">
            « {a.comment} »
          </p>
        ) : (
          <p className="text-[12.5px] italic text-ink-400">
            Aucune note. Ajoutez une consigne — elle sera visible par le livreur.
          </p>
        )}
      </div>
    </section>
  );
}

/* ─── Sous-composants ─────────────────────────────────────────────── */
function Card({
  title,
  icon,
  count,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <div className="mb-3.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-400">
        {icon}
        {title}
        {count != null && <span>· {count}</span>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">{label}</div>
      <div className="mt-0.5 text-[13.5px] font-semibold text-ink-800">{children}</div>
    </div>
  );
}

function Avatar({ name, bg }: { name: string; bg?: string }) {
  const initials = name
    .split(" ")
    .map((n) => n.charAt(0))
    .slice(0, 2)
    .join("");
  return (
    <div
      className={cn(
        "grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[13px] font-semibold",
        bg ? "text-white" : "bg-paper-2 text-ink-700",
      )}
      style={bg ? { background: bg } : undefined}
    >
      {initials}
    </div>
  );
}
