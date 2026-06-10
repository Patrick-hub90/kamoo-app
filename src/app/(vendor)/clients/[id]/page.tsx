"use client";

import Link from "next/link";
import { use } from "react";
import { useClientsState } from "@/lib/hooks/use-clients-state";
import {
  ArrowLeft,
  Calendar,
  Hash,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { CopyButton } from "@/components/kamoo/copy-button";
import { getClient } from "@/lib/data/mock-clients";
import { MOCK_CLOSING_ASSIGNMENTS } from "@/lib/data/mock-closing";
import {
  CHANNEL_LABELS,
  daysSinceLastOrder,
  deliveryRate,
  getClientSegment,
  getInitials,
  getWhatsappLink,
  SEGMENT_LABELS,
  SEGMENT_TONE,
  type Client,
} from "@/lib/types/client";
import {
  orderTotalQty,
  orderTotalXof,
  type ClosingAssignment,
  type ClosingStatus,
} from "@/lib/types/closing";
import { formatXOF } from "@/lib/format";
import { cn } from "@/lib/utils";

type PageProps = {
  params: Promise<{ id: string }>;
};

const COUNTRY_NAME: Record<Client["country"], string> = {
  SN: "Sénégal",
  CI: "Côte d'Ivoire",
  CM: "Cameroun",
};

/**
 * Statut simplifié pour la fiche client (vue vendeur).
 * Toutes les étapes intermédiaires (rappele, injoignable, livraison en cours)
 * roulent en "En attente" — pas pertinent dans l'historique d'un client.
 */
type SimpleStatus = "en_attente" | "livre" | "echoue";

function simplifyStatus(s: ClosingStatus): SimpleStatus {
  if (s === "livre") return "livre";
  if (s === "annule") return "echoue";
  return "en_attente";
}

const SIMPLE_STATUS_LABELS: Record<SimpleStatus, string> = {
  en_attente: "En attente",
  livre: "Livré",
  echoue: "Échoué",
};

const SIMPLE_STATUS_TONE: Record<SimpleStatus, { bg: string; fg: string }> = {
  en_attente: { bg: "bg-amber-50", fg: "text-amber-700" },
  livre: { bg: "bg-emerald-50", fg: "text-emerald-700" },
  echoue: { bg: "bg-red-50", fg: "text-red-700" },
};

function formatLongDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
}

export default function ClientDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { getById } = useClientsState();
  const client = getById(id);
  if (!client) {
    return (
      <div className="grid min-h-[60vh] place-items-center bg-paper px-6 text-center">
        <div>
          <p className="text-[15px] font-semibold text-ink-900">Client introuvable</p>
          <Link href="/clients" className="mt-4 inline-flex rounded-lg bg-kamoo-blue-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-kamoo-blue-800">Retour aux clients</Link>
        </div>
      </div>
    );
  }

  const orders = MOCK_CLOSING_ASSIGNMENTS.filter(
    (o) => o.client.id === client.id,
  ).sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const segment = getClientSegment(client);
  const tone = SEGMENT_TONE[segment];
  const daysSince = daysSinceLastOrder(client);
  const delivRate = deliveryRate(client);

  const whatsappPhone = client.whatsapp ?? client.phone;
  const whatsappLink = getWhatsappLink(
    whatsappPhone,
    `Bonjour ${client.name.split(" ")[0]}, c'est Kamoo. `,
  );

  return (
    <div className="flex flex-col">
      {/* HEADER */}
      <div className="flex items-center gap-4 border-b border-line bg-white px-10 py-5">
        <Link
          href="/clients"
          className="grid h-9 w-9 place-items-center rounded-lg bg-paper-2 text-ink-500 hover:text-ink-700"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
            Clients · Fiche client
          </div>
          <div className="mt-1 flex items-center gap-3">
            <div
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[13px] font-bold text-white shadow-sm"
              style={{ background: client.avatarBg }}
            >
              {getInitials(client.name)}
            </div>
            <h1 className="font-display text-xl font-extrabold text-ink-900">
              {client.name}
            </h1>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset",
                tone.bg,
                tone.fg,
                tone.ring,
              )}
            >
              {SEGMENT_LABELS[segment]}
            </span>
          </div>
        </div>

        <a
          href={`tel:${client.phone.replace(/\s/g, "")}`}
          className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-[13px] font-semibold text-ink-900 hover:bg-paper-2"
        >
          <Phone className="h-3.5 w-3.5" />
          Appeler
        </a>
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-[13px] font-bold text-white transition hover:bg-emerald-700"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          WhatsApp
        </a>
      </div>

      {/* BODY 2 colonnes */}
      <div className="grid grid-cols-[1.5fr_1fr] gap-5 px-10 py-6">
        {/* ═══ COLONNE GAUCHE ═══ */}
        <div className="flex flex-col gap-4">
          {/* STATS */}
          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-ink-500">
              Performance client
            </div>
            <div className="grid grid-cols-4 gap-3">
              <KpiCell
                icon={<Package className="h-3.5 w-3.5" />}
                label="Commandes"
                value={String(client.totalOrders)}
                sub={`${client.totalDeliveredOrders} livrées`}
                tone="blue"
              />
              <KpiCell
                icon={<Wallet className="h-3.5 w-3.5" />}
                label="Valeur client"
                value={`${formatXOF(client.totalSpentXof, false)} F`}
                sub={
                  client.totalDeliveredOrders > 0
                    ? `${formatXOF(client.avgBasketXof, false)} F / panier`
                    : undefined
                }
                tone="green"
                highlight={client.totalSpentXof > 0}
              />
              <KpiCell
                icon={<TrendingUp className="h-3.5 w-3.5" />}
                label="Taux livraison"
                value={`${delivRate}%`}
                sub={
                  client.totalCancelledOrders > 0
                    ? `${client.totalCancelledOrders} annulée${client.totalCancelledOrders > 1 ? "s" : ""}`
                    : undefined
                }
                tone={
                  delivRate >= 80
                    ? "green"
                    : delivRate >= 50
                      ? "orange"
                      : "red"
                }
              />
              <KpiCell
                icon={<Calendar className="h-3.5 w-3.5" />}
                label="Dernière cmd"
                value={
                  daysSince === 0
                    ? "Auj."
                    : daysSince < 7
                      ? `${daysSince}j`
                      : daysSince < 60
                        ? `${Math.floor(daysSince / 7)}sem`
                        : `${Math.floor(daysSince / 30)}m`
                }
                sub={formatShortDate(client.lastOrderDate)}
                tone={daysSince > 60 ? "orange" : "blue"}
              />
            </div>
          </div>

          {/* HISTORIQUE COMMANDES — détaillé */}
          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
                Historique commandes · {orders.length}
              </h2>
            </div>

            {orders.length === 0 ? (
              <EmptyOrders />
            ) : (
              <div className="flex flex-col gap-2.5">
                {orders.map((o) => (
                  <OrderCard key={o.id} order={o} clientId={client.id} />
                ))}
              </div>
            )}
          </div>

          {/* NOTES VENDEUR */}
          {client.notes && (
            <div className="rounded-2xl border border-line bg-white p-5">
              <div className="mb-2 flex items-center gap-2">
                <Hash className="h-3.5 w-3.5 text-ink-500" />
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
                  Vos notes
                </h2>
              </div>
              <p className="text-[13.5px] leading-relaxed text-ink-700">
                {client.notes}
              </p>
            </div>
          )}
        </div>

        {/* ═══ COLONNE DROITE ═══ */}
        <div className="flex flex-col gap-4">
          {/* IDENTITÉ */}
          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-ink-500">
              Coordonnées
            </div>
            <div className="flex flex-col gap-3">
              <Row
                label="Téléphone"
                icon={<Phone className="h-3.5 w-3.5" />}
                value={
                  <span className="flex items-center gap-1.5">
                    <span className="font-mono-kamoo font-bold">
                      {client.phone}
                    </span>
                    <CopyButton value={client.phone} />
                  </span>
                }
              />
              {client.whatsapp && client.whatsapp !== client.phone && (
                <Row
                  label="WhatsApp"
                  icon={<MessageCircle className="h-3.5 w-3.5" />}
                  value={
                    <span className="font-mono-kamoo font-bold">
                      {client.whatsapp}
                    </span>
                  }
                />
              )}
              <Row
                label="Adresse"
                icon={<MapPin className="h-3.5 w-3.5" />}
                value={
                  <div className="text-right">
                    <div className="font-bold text-ink-900">{client.city}</div>
                    {client.zone && (
                      <div className="text-[11px] text-ink-500">
                        {client.zone}
                      </div>
                    )}
                    <div className="text-[10.5px] text-ink-500">
                      {COUNTRY_NAME[client.country]}
                    </div>
                  </div>
                }
              />
            </div>
          </div>

          {/* SOURCE & FIDÉLITÉ */}
          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-ink-500">
              Acquisition & fidélité
            </div>
            <div className="flex flex-col gap-3 text-[13px]">
              <Row
                label="Canal d'acquisition"
                value={
                  <span className="inline-flex items-center rounded-full bg-paper-2 px-2 py-0.5 text-[12px] font-semibold text-ink-700">
                    {CHANNEL_LABELS[client.acquisitionChannel]}
                  </span>
                }
              />
              <Row
                label="1re commande"
                value={
                  <span className="font-bold text-ink-900">
                    {formatLongDate(client.firstOrderDate)}
                  </span>
                }
              />
              <Row
                label="Dernière commande"
                value={
                  <span
                    className={cn(
                      "font-bold",
                      daysSince > 60 ? "text-amber-700" : "text-ink-900",
                    )}
                  >
                    {formatLongDate(client.lastOrderDate)}
                  </span>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function KpiCell({
  icon,
  label,
  value,
  sub,
  tone,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone: "blue" | "green" | "orange" | "red";
  highlight?: boolean;
}) {
  const toneClass = {
    blue: { bg: "bg-kamoo-blue-50", fg: "text-kamoo-blue-700" },
    green: { bg: "bg-emerald-50", fg: "text-emerald-700" },
    orange: { bg: "bg-kamoo-orange-50", fg: "text-kamoo-orange-700" },
    red: { bg: "bg-red-50", fg: "text-red-700" },
  }[tone];

  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-3.5",
        highlight ? "border-emerald-200 ring-1 ring-emerald-100" : "border-line",
      )}
    >
      <div
        className={cn(
          "mb-2 grid h-7 w-7 place-items-center rounded-lg",
          toneClass.bg,
          toneClass.fg,
        )}
      >
        {icon}
      </div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
        {label}
      </div>
      <div
        className={cn(
          "font-display mt-1 text-lg font-extrabold leading-none",
          tone === "green" && highlight ? "text-emerald-700" : "text-ink-900",
        )}
      >
        {value}
      </div>
      {sub && (
        <div className="mt-1 text-[10.5px] font-semibold text-ink-500">
          {sub}
        </div>
      )}
    </div>
  );
}

/**
 * Carte d'historique d'une commande — vue client.
 * Statut simplifié à 3 états : En attente / Livré / Échoué.
 * Liste tous les produits avec leur quantité.
 */
function OrderCard({
  order,
  clientId,
}: {
  order: ClosingAssignment;
  clientId: string;
}) {
  const total = orderTotalXof(order);
  const qty = orderTotalQty(order);
  const status = simplifyStatus(order.status);
  const statusTone = SIMPLE_STATUS_TONE[status];

  return (
    <Link
      href={`/closing/${order.id}?from=client&clientId=${clientId}`}
      className="group flex items-start gap-3 rounded-xl border border-line bg-paper-2/30 p-3.5 transition hover:border-kamoo-blue-600 hover:bg-white"
    >
      {/* Stack d'icônes produits — max 3 visibles */}
      <div className="flex shrink-0 -space-x-2">
        {order.items.slice(0, 3).map((it, i) => (
          <div
            key={i}
            className="grid h-10 w-10 place-items-center rounded-lg border-2 border-white text-lg"
            style={{ background: it.productBg }}
          >
            {it.productEmoji}
          </div>
        ))}
        {order.items.length > 3 && (
          <div className="grid h-10 w-10 place-items-center rounded-lg border-2 border-white bg-ink-100 text-[10px] font-bold text-ink-700">
            +{order.items.length - 3}
          </div>
        )}
      </div>

      {/* Corps */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono-kamoo text-[12px] font-bold text-ink-900 group-hover:text-kamoo-blue-700">
            {order.id}
          </span>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-bold",
              statusTone.bg,
              statusTone.fg,
            )}
          >
            {SIMPLE_STATUS_LABELS[status]}
          </span>
        </div>

        {/* Liste détaillée produits */}
        <ul className="mt-1.5 flex flex-col gap-0.5 text-[12.5px] text-ink-700">
          {order.items.map((it, i) => (
            <li key={i} className="flex items-baseline gap-1.5">
              <span className="text-ink-300">·</span>
              <span className="truncate">{it.productName}</span>
              <span className="font-bold text-ink-900">× {it.quantity}</span>
            </li>
          ))}
        </ul>

        <div className="mt-1.5 text-[10.5px] text-ink-500">
          {formatLongDate(order.createdAt)} · {qty} article
          {qty > 1 ? "s" : ""}
        </div>
      </div>

      {/* Total */}
      <div className="shrink-0 text-right">
        <div
          className={cn(
            "font-display text-[15px] font-extrabold",
            status === "livre"
              ? "text-emerald-700"
              : status === "echoue"
                ? "text-ink-400 line-through"
                : "text-ink-900",
          )}
        >
          {formatXOF(total, false)}
          <span className="ml-0.5 text-[10px] font-bold">F</span>
        </div>
      </div>
    </Link>
  );
}

function Row({
  label,
  icon,
  value,
}: {
  label: string;
  icon?: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="flex items-center gap-1.5 text-[12px] text-ink-500">
        {icon}
        {label}
      </span>
      <div className="min-w-0 text-right text-[13px]">{value}</div>
    </div>
  );
}

function EmptyOrders() {
  return (
    <div className="rounded-xl border border-dashed border-line bg-paper-2/30 px-3 py-6 text-center">
      <Package className="mx-auto h-6 w-6 text-ink-400" />
      <p className="mt-2 text-[12px] font-semibold text-ink-700">
        Aucune commande enregistrée
      </p>
      <p className="mt-1 text-[11px] text-ink-500">
        Les commandes liées à ce client apparaîtront ici
      </p>
    </div>
  );
}
