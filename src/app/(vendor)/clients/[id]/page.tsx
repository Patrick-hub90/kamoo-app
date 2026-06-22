"use client";

import Link from "next/link";
import { PageHeader } from "@/components/kamoo/page-header";
import { use, useState } from "react";
import {
  Calendar,
  ChevronRight,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Pencil,
  Phone,
  Star,
} from "lucide-react";
import { CopyButton } from "@/components/kamoo/copy-button";
import { useClientsState } from "@/lib/hooks/use-clients-state";
import { useClosingState } from "@/lib/hooks/use-closing-state";
import {
  CHANNEL_LABELS,
  daysSinceLastOrder,
  deliveryRate,
  getClientSegment,
  getInitials,
  getWhatsappLink,
  SEGMENT_LABELS,
  type Client,
} from "@/lib/types/client";
import {
  orderTotalQty,
  orderTotalXof,
  displayOrderNo,
  type ClosingAssignment,
  type ClosingStatus,
} from "@/lib/types/closing";
import { formatXOF } from "@/lib/format";
import { cn } from "@/lib/utils";

type PageProps = { params: Promise<{ id: string }> };

const COUNTRY_NAME: Record<Client["country"], string> = {
  SN: "Sénégal",
  CI: "Côte d'Ivoire",
  CM: "Cameroun",
};

/* Statut simplifié pour l'historique : En attente / Livré / Annulé */
type SimpleStatus = "en_attente" | "livre" | "annule";
function simplifyStatus(s: ClosingStatus): SimpleStatus {
  if (s === "livre") return "livre";
  if (s === "annule") return "annule";
  return "en_attente";
}
const SIMPLE_STATUS: Record<SimpleStatus, { label: string; bg: string; fg: string }> = {
  en_attente: { label: "En attente", bg: "bg-amber-50", fg: "text-amber-700" },
  livre: { label: "Livré", bg: "bg-emerald-50", fg: "text-emerald-700" },
  annule: { label: "Annulé", bg: "bg-paper-2", fg: "text-ink-500" },
};

/* Segment → teinte sobre */
const SEGMENT_TONE: Record<string, string> = {
  prospect: "bg-emerald-50 text-emerald-700",
  nouveau: "bg-kamoo-blue-50 text-kamoo-blue-700",
  fidele: "bg-kamoo-orange-50 text-kamoo-orange-700",
};

function fmtLong(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}
function fmtShort(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
function recency(days: number): string {
  if (days === 0) return "aujourd'hui";
  if (days < 7) return `il y a ${days} j`;
  if (days < 60) return `il y a ${Math.floor(days / 7)} sem`;
  return `il y a ${Math.floor(days / 30)} mois`;
}

export default function ClientDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { getById, update } = useClientsState();
  const allOrders = useClosingState().all;
  const client = getById(id);

  if (!client) {
    return (
      <div className="grid min-h-[60vh] place-items-center bg-paper px-6 text-center">
        <div>
          <p className="text-[15px] font-medium text-ink-900">Client introuvable</p>
          <Link
            href="/clients"
            className="mt-4 inline-flex rounded-lg bg-kamoo-blue-900 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-kamoo-blue-800"
          >
            Retour aux clients
          </Link>
        </div>
      </div>
    );
  }

  const orders = allOrders
    .filter((o) => o.client.id === client.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const segment = getClientSegment(client);
  const daysSince = daysSinceLastOrder(client);
  const delivRate = deliveryRate(client);

  const whatsappPhone = client.whatsapp ?? client.phone;
  const whatsappLink = getWhatsappLink(
    whatsappPhone,
    `Bonjour ${client.name.split(" ")[0]}, c'est Kamoo. `,
  );

  /* Signal de relance / risque (insight) */
  const insight =
    delivRate > 0 && delivRate < 50
      ? { label: "Fiabilité à surveiller", tone: "amber" as const }
      : daysSince > 45
        ? { label: `À relancer · ${recency(daysSince)}`, tone: "amber" as const }
        : segment === "fidele"
          ? { label: "Cliente fidèle", tone: "emerald" as const }
          : null;

  const m = (n: number) => formatXOF(n);

  return (
    <div className="min-h-full bg-paper">
      <PageHeader kicker="Mon activité" title={client.name} backHref="/clients" hideTitle />
      <div className="mx-auto w-full max-w-6xl px-6 py-6">
        <div className="overflow-hidden rounded-xl border border-line bg-white shadow-kamoo-sm">
          {/* En-tête de la carte — le retour vit dans le PageHeader commun. */}
          <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-6 py-4">
            <span
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[13px] font-medium text-white"
              style={{ background: client.avatarBg }}
            >
              {getInitials(client.name)}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[18px] font-medium tracking-tight text-ink-900">{client.name}</h1>
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", SEGMENT_TONE[segment])}>
                  {SEGMENT_LABELS[segment]}
                </span>
                {(client.tags ?? []).slice(0, 2).map((t) => (
                  <span key={t} className="rounded-full bg-paper-2 px-2 py-0.5 text-[11px] font-medium text-ink-600">
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-0.5 text-[12px] text-ink-400">
                Client depuis {fmtLong(client.firstOrderDate)}
              </div>
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-2">
              <a
                href={`tel:${client.phone.replace(/\s/g, "")}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 text-[13px] font-medium text-ink-900 transition hover:bg-paper-2"
              >
                <Phone className="h-3.5 w-3.5" /> Appeler
              </a>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-kamoo-blue-900 px-3.5 text-[13px] font-medium text-white transition hover:bg-kamoo-blue-800"
              >
                <MessageCircle className="h-3.5 w-3.5" /> Message WhatsApp
              </a>
            </div>
          </header>

          <div className="p-6">
            {/* HÉROS — valeur client + signaux clés */}
            <div className="rounded-xl border border-line p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-ink-400">
                    Valeur client (encaissée)
                  </div>
                  <div className="mt-1 font-display text-[26px] font-medium leading-none tracking-tight text-ink-900 tabular-nums">
                    {m(client.totalSpentXof)}
                  </div>
                  {client.totalDeliveredOrders > 0 && (
                    <div className="mt-1.5 text-[12px] text-ink-500">
                      Panier moyen{" "}
                      <span className="font-medium text-ink-700">{m(client.avgBasketXof)}</span>
                    </div>
                  )}
                </div>
                {insight && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium",
                      insight.tone === "emerald"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700",
                    )}
                  >
                    {insight.tone === "emerald" ? <Star className="h-3.5 w-3.5" /> : <Calendar className="h-3.5 w-3.5" />}
                    {insight.label}
                  </span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-y-3 border-t border-line pt-3 sm:grid-cols-4">
                <Stat label="Commandes" value={String(client.totalOrders)} />
                <Stat label="Livrées" value={String(client.totalDeliveredOrders)} divider />
                <Stat
                  label="Taux de livraison"
                  value={`${delivRate}%`}
                  tone={delivRate >= 80 ? "emerald" : delivRate >= 50 ? "amber" : "ink"}
                  divider
                />
                <Stat
                  label="Annulées"
                  value={String(client.totalCancelledOrders)}
                  divider
                />
              </div>
            </div>

            {/* CONTENU — 2 colonnes */}
            <div className="mt-5 grid grid-cols-[1.55fr_1fr] items-start gap-5">
              {/* GAUCHE */}
              <div className="flex flex-col gap-5">
                <Card title="Historique des commandes" count={orders.length}>
                  {orders.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-line bg-paper-2/30 px-3 py-8 text-center">
                      <Package className="mx-auto h-6 w-6 text-ink-400" />
                      <p className="mt-2 text-[12.5px] font-medium text-ink-700">Aucune commande</p>
                      <p className="mt-0.5 text-[11.5px] text-ink-400">
                        Les commandes de ce client apparaîtront ici.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {orders.map((o) => (
                        <OrderRow key={o.id} order={o} clientId={client.id} fmt={m} />
                      ))}
                    </div>
                  )}
                </Card>

              </div>

              {/* DROITE */}
              <div className="flex flex-col gap-5">
                <Card title="Coordonnées">
                  <div className="flex flex-col gap-3">
                    <Row label="Téléphone" icon={<Phone className="h-3.5 w-3.5" />}>
                      <span className="flex items-center gap-1.5">
                        <span className="font-mono-kamoo">{client.phone}</span>
                        <CopyButton value={client.phone} />
                      </span>
                    </Row>
                    {client.whatsapp && client.whatsapp !== client.phone && (
                      <Row label="WhatsApp" icon={<MessageCircle className="h-3.5 w-3.5" />}>
                        <span className="font-mono-kamoo">{client.whatsapp}</span>
                      </Row>
                    )}
                    {client.email && (
                      <Row label="Email" icon={<Mail className="h-3.5 w-3.5" />}>
                        <span className="flex items-center gap-1.5">
                          <span className="break-all">{client.email}</span>
                          <CopyButton value={client.email} />
                        </span>
                      </Row>
                    )}
                    <Row label="Adresse" icon={<MapPin className="h-3.5 w-3.5" />}>
                      <div className="text-right">
                        {client.address ? (
                          <div className="text-ink-900">{client.address}</div>
                        ) : (
                          <>
                            <div className="text-ink-900">{client.city}</div>
                            {client.zone && (
                              <div className="text-[11.5px] text-ink-500">{client.zone}</div>
                            )}
                          </>
                        )}
                        <div className="text-[11px] text-ink-400">{COUNTRY_NAME[client.country]}</div>
                      </div>
                    </Row>
                  </div>
                </Card>

                <Card title="Acquisition & fidélité">
                  <div className="flex flex-col gap-3">
                    <Row label="Canal">
                      <span className="rounded-full bg-paper-2 px-2 py-0.5 text-[12px] font-medium text-ink-700">
                        {CHANNEL_LABELS[client.acquisitionChannel]}
                      </span>
                    </Row>
                    <Row label="1ʳᵉ commande">
                      <span className="text-ink-900">{fmtLong(client.firstOrderDate)}</span>
                    </Row>
                    <Row label="Dernière commande">
                      <span className="text-ink-900">
                        {fmtLong(client.lastOrderDate)}{" "}
                        <span className="text-ink-400">· {recency(daysSince)}</span>
                      </span>
                    </Row>
                  </div>
                </Card>

                <NoteCard client={client} onSave={(notes) => update(client.id, { notes })} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Sous-composants ─── */

function Stat({
  label,
  value,
  tone = "ink",
  divider,
}: {
  label: string;
  value: string;
  tone?: "ink" | "emerald" | "amber";
  divider?: boolean;
}) {
  const color =
    tone === "emerald" ? "text-emerald-700" : tone === "amber" ? "text-amber-700" : "text-ink-900";
  return (
    <div className={cn("px-3 first:pl-0", divider && "sm:border-l sm:border-line")}>
      <div className="text-[12px] text-ink-500">{label}</div>
      <div className={cn("mt-0.5 text-[17px] font-medium tabular-nums", color)}>{value}</div>
    </div>
  );
}

function OrderRow({
  order,
  clientId,
  fmt,
}: {
  order: ClosingAssignment;
  clientId: string;
  fmt: (n: number) => string;
}) {
  const total = orderTotalXof(order);
  const qty = orderTotalQty(order);
  const status = simplifyStatus(order.status);
  const tone = SIMPLE_STATUS[status];
  const summary = order.items
    .map((it) => `${it.productName} ×${it.quantity}`)
    .join(", ");

  return (
    <Link
      href={`/closing/${order.id}?from=client&clientId=${clientId}`}
      className="group flex items-center gap-3 rounded-lg border border-line bg-paper-2/40 p-3 transition hover:border-kamoo-blue-200 hover:bg-white"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-ink-400 ring-1 ring-line">
        <Package className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono-kamoo text-[12.5px] font-medium text-ink-900 group-hover:text-kamoo-blue-700">
            {displayOrderNo(order)}
          </span>
          <span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-medium", tone.bg, tone.fg)}>
            {tone.label}
          </span>
        </div>
        <div className="mt-0.5 truncate text-[11.5px] text-ink-500">
          {summary} · {fmtShort(order.createdAt)} · {qty} article{qty > 1 ? "s" : ""}
        </div>
      </div>
      <div
        className={cn(
          "shrink-0 text-right font-display text-[14px] font-medium tabular-nums",
          status === "annule" ? "text-ink-400 line-through" : "text-ink-900",
        )}
      >
        {fmt(total)}
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-kamoo-blue-700" />
    </Link>
  );
}

function Card({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-white p-5">
      <div className="mb-3.5 text-[11px] font-medium uppercase tracking-[0.06em] text-ink-400">
        {title}
        {count != null && <span> · {count}</span>}
      </div>
      {children}
    </section>
  );
}

function Row({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-[13px]">
      <span className="flex items-center gap-1.5 text-ink-500">
        {icon}
        {label}
      </span>
      <div className="min-w-0 text-right text-ink-900">{children}</div>
    </div>
  );
}

function NoteCard({
  client,
  onSave,
}: {
  client: Client;
  onSave: (notes: string | undefined) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(client.notes ?? "");

  const save = () => {
    onSave(draft.trim() || undefined);
    setEditing(false);
  };

  return (
    <section className="rounded-xl border border-line bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-ink-400">Note</div>
        {!editing && (
          <button
            onClick={() => {
              setDraft(client.notes ?? "");
              setEditing(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-paper-2 px-2.5 py-1.5 text-[12px] font-medium text-ink-700 transition hover:bg-ink-100 hover:text-ink-900"
          >
            <Pencil className="h-3 w-3" /> {client.notes ? "Modifier" : "Ajouter"}
          </button>
        )}
      </div>
      {editing ? (
        <div className="flex flex-col gap-2.5">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            autoFocus
            placeholder="Ex : préfère être livrée le week-end · bonne payeuse…"
            className="w-full resize-none rounded-lg border border-line bg-white px-3.5 py-2.5 text-[13px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600 focus:ring-2 focus:ring-kamoo-blue-600/12"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg border border-line bg-white px-3 py-1.5 text-[12.5px] font-medium text-ink-700 transition hover:bg-paper-2"
            >
              Annuler
            </button>
            <button
              onClick={save}
              className="rounded-lg bg-kamoo-blue-900 px-3.5 py-1.5 text-[12.5px] font-medium text-white transition hover:bg-kamoo-blue-800"
            >
              Enregistrer
            </button>
          </div>
        </div>
      ) : client.notes ? (
        <p className="rounded-lg bg-amber-50/60 px-3.5 py-3 text-[13px] leading-relaxed text-ink-800">
          {client.notes}
        </p>
      ) : (
        <p className="text-[12.5px] italic text-ink-400">
          Aucune note. Ajoutez un rappel sur ce client (préférences, fiabilité…).
        </p>
      )}
    </section>
  );
}
