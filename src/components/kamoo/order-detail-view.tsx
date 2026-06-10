"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Bike,
  CheckCircle2,
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
  Truck,
  User,
  XCircle,
} from "lucide-react";
import { CopyButton } from "@/components/kamoo/copy-button";
import { useChat } from "@/components/kamoo/chat";
import {
  buildClosingHistory,
  MOCK_ACTIVE_CLOSEUSE,
} from "@/lib/data/mock-closing";
import { getProduit } from "@/lib/data/mock-produits";
import {
  CANCELLATION_REASON_LABELS,
  CLOSING_STATUS_LABELS,
  orderTotalXof,
  type ClosingAssignment,
  type ClosingEventType,
  type ClosingStatus,
} from "@/lib/types/closing";
import { formatXOF } from "@/lib/format";
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

/* ─── Pastilles de statut ────────────────────────────────────────────── */

type Pill = { label: string; bg: string; text: string; dot: string };

function paymentPill(a: ClosingAssignment): Pill {
  if (a.status === "livre")
    return {
      label: "Encaissé",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    };
  if (a.status === "annule")
    return {
      label: "Non encaissé",
      bg: "bg-ink-100",
      text: "text-ink-500",
      dot: "bg-ink-400",
    };
  return {
    label: "Paiement en attente",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
  };
}

function statusPill(s: ClosingStatus): Pill {
  const tone: Record<ClosingStatus, Omit<Pill, "label">> = {
    nouvelle: { bg: "bg-yellow-100", text: "text-yellow-800", dot: "bg-yellow-500" },
    rappele: { bg: "bg-kamoo-orange-50", text: "text-kamoo-orange-600", dot: "bg-kamoo-orange-500" },
    injoignable: { bg: "bg-amber-50", text: "text-amber-800", dot: "bg-amber-700" },
    livraison_en_cours: { bg: "bg-cyan-50", text: "text-cyan-800", dot: "bg-cyan-500" },
    livre: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    annule: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
  };
  // Libellé EXACT défini par le système.
  return { label: CLOSING_STATUS_LABELS[s], ...tone[s] };
}

function StatusPill({ label, bg, text, dot }: Pill) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold",
        bg,
        text,
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", dot)} />
      {label}
    </span>
  );
}

/* ─── Entête commande ────────────────────────────────────────────────── */

function OrderHeader({
  a,
  backHref,
}: {
  a: ClosingAssignment;
  backHref: string;
}) {
  const { openChat } = useChat();
  return (
    <header className="mb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* Gauche : fil d'ariane + N° + statuts */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
            <Link
              href={backHref}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-paper-2 text-ink-500 transition hover:text-ink-700"
              aria-label="Retour"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="font-mono-kamoo text-[24px] font-extrabold tracking-tight text-ink-900">
              {a.id}
            </h1>
            <CopyButton value={a.id} />
            <StatusPill {...paymentPill(a)} />
            <StatusPill {...statusPill(a.status)} />
          </div>
          <p className="mt-1.5 pl-[2px] text-[13px] text-ink-500">
            Créée le {fmtFull(a.createdAt)} à {fmtTime(a.createdAt)}
          </p>
        </div>

        {/* Droite : actions + navigation */}
        <div className="flex shrink-0 items-center gap-2">
          {a.status === "livraison_en_cours" && (
            <button className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-kamoo-blue-900 px-3.5 text-[13px] font-bold text-white transition hover:bg-kamoo-blue-800">
              <CheckCircle2 className="h-4 w-4" />
              Marquer livrée
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
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 text-[13px] font-semibold text-ink-900 transition hover:bg-paper-2"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Contacter la closeuse
          </button>
          <button className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 text-[13px] font-semibold text-ink-900 transition hover:bg-paper-2">
            <Pencil className="h-3.5 w-3.5" />
            Modifier
          </button>
        </div>
      </div>
    </header>
  );
}

/* ─── Vue ────────────────────────────────────────────────────────────── */

type Props = {
  a: ClosingAssignment;
  backHref: string;
  breadcrumbLabel: string;
  /** Mise en page pleine largeur, une seule colonne (pas de panneau latéral) */
  fullWidth?: boolean;
};

export function OrderDetailView({ a, backHref, fullWidth = false }: Props) {
  const { openChat } = useChat();
  const closeuse = MOCK_ACTIVE_CLOSEUSE;
  const history = buildClosingHistory(a, closeuse.name);

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

  return (
    <div className="px-8 py-6">
      <OrderHeader a={a} backHref={backHref} />

      {/* Alerte livreur */}
      {isLivreurAlert && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-100 text-red-700">
            <AlertTriangle className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-red-700">
              Alerte du livreur · {a.delivery?.name}
            </div>
            <p className="mt-1 text-[13.5px] font-bold leading-snug text-ink-900">
              « {a.delivery?.livreurNote || "Aucune note fournie"} »
            </p>
          </div>
        </div>
      )}

      {/* 2 colonnes (closing) OU pleine largeur 1 colonne (livraisons). */}
      <div className={cn("gap-5", fullWidth ? "flex flex-col" : "grid grid-cols-[1.55fr_1fr] items-start")}>
        {/* ── COLONNE GAUCHE : Articles + Activité ── */}
        <div className="flex flex-col gap-5">
          {/* Articles + finance */}
          <Card title="Articles commandés">
            <div className="flex flex-col gap-2">
              {a.items.map((item, idx) => {
                const p = getProduit(item.productId ?? "");
                const lineTotal = item.quantity * item.unitPriceXof;
                const inner = (
                  <>
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-paper-2 text-ink-400">
                      <Package className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className={cn(
                          "truncate text-[14.5px] font-bold text-ink-900",
                          item.productId && "group-hover:text-kamoo-blue-700",
                        )}
                      >
                        {item.productName}
                      </div>
                      <div className="mt-0.5 font-mono-kamoo text-[11.5px] text-ink-400">
                        {p?.sku ?? "—"}
                      </div>
                    </div>
                    <span className="font-mono-kamoo text-[13px] text-ink-400">
                      ×{item.quantity}
                    </span>
                    <div className="w-24 text-right font-display text-[15px] font-extrabold text-ink-900">
                      {formatXOF(lineTotal, false)} F
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
                    className="group flex items-center gap-3 rounded-xl border border-line bg-paper-2/40 p-3 transition hover:border-kamoo-blue-300 hover:bg-white"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div
                    key={idx}
                    className="flex items-center gap-3 rounded-xl bg-paper-2/40 p-3"
                  >
                    {inner}
                  </div>
                );
              })}
            </div>

            {/* Récapitulatif financier — présentation facture */}
            <div className="mt-5 border-t border-line pt-4">
              <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-ink-500">
                Récapitulatif financier
              </div>

              {/* Lignes */}
              <div className="flex flex-col gap-2 text-[13.5px]">
                <FinRow
                  label="Sous-total articles"
                  value={`${formatXOF(total, false)} F`}
                />
                <FinRow label="Frais de livraison" value="0 F" muted />
              </div>

              {/* Séparation + Total à encaisser */}
              <div className="mt-3 flex items-baseline justify-between gap-3 border-t-2 border-ink-200 pt-3">
                <span className="text-[15px] font-extrabold text-ink-900">
                  Total à encaisser
                </span>
                <span className="font-display text-[20px] font-extrabold leading-none text-ink-900">
                  {formatXOF(total, false)}
                  <span className="ml-1 text-[13px] font-bold text-ink-400">
                    F
                  </span>
                </span>
              </div>

              {/* Marge — économie interne, bloc séparé */}
              <div className="mt-4 flex flex-col gap-2 border-t border-dashed border-line pt-4 text-[13px]">
                {cogsKnown && (
                  <FinRow
                    label="Coût marchandise (COGS)"
                    value={`− ${formatXOF(cogs, false)} F`}
                    muted
                  />
                )}
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-bold text-ink-900">Marge nette</span>
                  <span className="font-display font-extrabold text-emerald-700">
                    {cogsKnown
                      ? `${formatXOF(margin, false)} F · ${marginPct}%`
                      : "Non calculée"}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Activité de la commande */}
          <Card
            title="Activité de la commande"
            icon={<Clock className="h-3.5 w-3.5" />}
          >
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
                            ? "bg-kamoo-orange-500 text-white ring-4 ring-kamoo-orange-500/15"
                            : "border border-line bg-paper-2 text-ink-500",
                        )}
                      >
                        <Icon className="h-3 w-3" />
                      </div>
                      {!isLast && (
                        <div className="min-h-[24px] w-px flex-1 bg-line" />
                      )}
                    </div>
                    <div className={cn("flex-1", !isLast && "pb-4")}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[14px] font-bold text-ink-900">
                          {e.label}
                        </span>
                        <span className="shrink-0 whitespace-nowrap font-mono-kamoo text-[11px] text-ink-400">
                          {fmtShort(e.at)}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[12px] text-ink-500">
                        {e.authorName}
                      </div>
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
                <div className="text-[15px] font-extrabold text-ink-900">
                  {a.client.name}
                </div>
                <div className="text-[12px] text-ink-500">
                  {a.client.isReturning ? "Client régulier" : "Nouveau client"}
                  {a.client.orderCount
                    ? ` · ${a.client.orderCount}ᵉ commande`
                    : ""}
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
              <Field label="Adresse">
                {a.client.zone}, {a.client.city}
              </Field>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <Link
                href={`/clients/${a.client.id}`}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-line bg-white py-2.5 text-[12.5px] font-bold text-ink-900 transition hover:bg-paper-2"
              >
                <User className="h-3.5 w-3.5" />
                Voir client
              </Link>
              {a.client.whatsapp ? (
                <a
                  href={`https://wa.me/${a.client.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-[12.5px] font-bold text-white transition hover:bg-emerald-700"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Contacter WhatsApp
                </a>
              ) : (
                <span className="inline-flex items-center justify-center rounded-xl border border-dashed border-line py-2.5 text-[12px] text-ink-400">
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
                    <div className="text-[15px] font-extrabold text-ink-900">
                      {a.delivery.name}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-[12px] text-ink-500">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-ink-700">
                        {a.delivery.rating}
                      </span>
                      {a.delivery.deliveriesCount != null && (
                        <span>· {a.delivery.deliveriesCount} livraisons</span>
                      )}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider",
                      a.delivery.progress === "alerte"
                        ? "bg-red-50 text-red-600"
                        : a.delivery.progress === "effectue"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-kamoo-orange-50 text-kamoo-orange-600",
                    )}
                  >
                    {a.delivery.progress === "alerte"
                      ? "Alerte"
                      : a.delivery.progress === "effectue"
                        ? "Livré"
                        : "En course"}
                  </span>
                </div>
                {/* Pas de téléphone : les partenaires Kamoo se contactent
                    exclusivement via le chat in-app. */}
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
                  className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-line bg-white py-2.5 text-[12.5px] font-bold text-ink-900 transition hover:bg-paper-2"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Contacter {a.delivery.name.split(" ")[0]}
                </button>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-line bg-paper-2/30 px-3 py-5 text-center">
                <div className="text-xl">🚚</div>
                <p className="mt-1.5 text-[12px] font-semibold text-ink-700">
                  Aucun livreur assigné
                </p>
                <p className="mt-0.5 text-[10.5px] text-ink-500">
                  Sera assigné une fois la commande confirmée.
                </p>
              </div>
            )}
          </Card>

          {/* Annulation */}
          {a.status === "annule" && a.cancellationReason && (
            <div className="rounded-[18px] border border-red-100 bg-red-50/60 p-5">
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-red-700">
                Commande annulée
              </div>
              <div className="mt-1 text-[13.5px] font-bold text-ink-900">
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
    <section className="overflow-hidden rounded-[18px] border border-line bg-white">
      <div className="flex items-center gap-2 border-b border-line px-5 py-3.5 text-[15px] font-extrabold text-ink-900">
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
          "font-mono-kamoo font-semibold tabular-nums",
          muted ? "text-ink-700" : "text-ink-900",
        )}
      >
        {value}
      </span>
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
      <div className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
        {label}
      </div>
      <div className="mt-0.5 text-[13.5px] font-semibold text-ink-800">
        {children}
      </div>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-paper-2 text-[13px] font-extrabold text-ink-700">
      {name
        .split(" ")
        .map((n) => n.charAt(0))
        .slice(0, 2)
        .join("")}
    </div>
  );
}
