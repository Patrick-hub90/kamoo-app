"use client";

import { useCallback } from "react";
import { useShopify } from "@/lib/hooks/use-shopify";
import { useClosingState } from "@/lib/hooks/use-closing-state";
import { useClientsState } from "@/lib/hooks/use-clients-state";
import { MOCK_PRODUITS } from "@/lib/data/mock-produits";
import type { ClosingAssignment, ClosingStatus } from "@/lib/types/closing";
import type { Client } from "@/lib/types/client";

/**
 * Synchronisation Shopify → Kamoo (commandes + clients), AUTOMATIQUE.
 *
 *  - Mode DÉMO : génère 1-3 nouvelles commandes Shopify plausibles → elles
 *    tombent dans Closing (statut « nouvelle », source « Shopify ») et créent
 *    /mettent à jour la fiche client.
 *  - Mode LIVE : pull réel via /api/shopify/sync (Admin API), puis même
 *    injection. Les commandes déjà importées (shopifyOrderId connu) sont
 *    ignorées (dédup).
 *
 * C'est la boucle « comme DSers » côté commandes : aucune action manuelle, la
 * commande de la boutique arrive directement dans le pipeline d'appels.
 */

/* Personas pour les commandes de démo (clients finaux ouest-africains). */
const DEMO_CUSTOMERS = [
  { name: "Khadija Bâ", phone: "+221 77 412 89 33", city: "Dakar", zone: "Liberté 6" },
  { name: "Oumar Sy", phone: "+221 78 901 22 14", city: "Dakar", zone: "Grand Yoff" },
  { name: "Bineta Diouf", phone: "+221 76 233 47 008", city: "Thiès", zone: "Centre" },
  { name: "Modou Gueye", phone: "+221 77 654 11 90", city: "Dakar", zone: "Parcelles U15" },
  { name: "Rama Cissé", phone: "+221 70 118 76 42", city: "Rufisque", zone: "Gendarmerie" },
  { name: "Alioune Ndour", phone: "+221 78 442 09 67", city: "Dakar", zone: "Ouakam" },
];

const AVATARS = [
  "linear-gradient(135deg,#0EA5E9,#0284C7)",
  "linear-gradient(135deg,#22C55E,#16A34A)",
  "linear-gradient(135deg,#A855F7,#7E22CE)",
  "linear-gradient(135deg,#F59E0B,#B45309)",
  "linear-gradient(135deg,#EC4899,#DB2777)",
];

type Attribute = { key: string; value: string };

type LiveOrder = {
  shopifyOrderId: string;
  name: string;
  createdAt: string;
  currencyCode?: string;
  /** Statuts Shopify (mode live) — servent à refléter le bon statut Kamoo. */
  fulfillmentStatus?: string;
  financialStatus?: string;
  cancelledAt?: string | null;
  /** Note de commande + champs personnalisés (formulaire COD) + tags. */
  note?: string;
  tags?: string[];
  customAttributes?: Attribute[];
  customer: { name: string; phone: string; email?: string; city: string; zone: string; address?: string; countryCode?: string };
  items: { productName: string; quantity: number; unitPriceXof: number; customAttributes?: Attribute[] }[];
};

/**
 * Mappe le statut Shopify (exécution + financier) vers le statut closing Kamoo.
 * COD : FULFILLED = livré/encaissé. Annulé/remboursé = annulé. Sinon « nouvelle »
 * (la commande entre dans le pipeline d'appels). Les commandes démo n'ont pas
 * ces champs → « nouvelle » par défaut.
 */
function mapShopifyStatus(
  fulfillment?: string | null,
  financial?: string | null,
  cancelledAt?: string | null,
): ClosingStatus {
  if (cancelledAt) return "annule";
  const ful = (fulfillment ?? "").toUpperCase();
  const fin = (financial ?? "").toUpperCase();
  if (fin === "REFUNDED" || fin === "VOIDED") return "annule";
  if (ful === "FULFILLED") return "livre";
  if (["PARTIALLY_FULFILLED", "IN_PROGRESS", "ON_HOLD", "SCHEDULED"].includes(ful)) {
    return "livraison_en_cours";
  }
  return "nouvelle";
}

export function useShopifySync() {
  const { getConnection, recordSync, liveMode } = useShopify();
  const closing = useClosingState();
  const clients = useClientsState();

  /**
   * Lance une synchro pour un marché. Retourne le nombre de commandes
   * importées. Mode auto-détecté (live si la connexion est en mode live).
   */
  const syncNow = useCallback(
    async (marketId: string): Promise<{ imported: number; fetched: number; error?: string }> => {
      const conn = getConnection(marketId);
      if (!conn?.isConnected) return { imported: 0, fetched: 0, error: "non_connecte" };

      let orders: LiveOrder[] = [];

      if (conn.mode === "live") {
        try {
          const res = await fetch("/api/shopify/sync", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ shop: conn.domain }),
          });
          const data = (await res.json()) as { orders?: LiveOrder[]; error?: string };
          if (!res.ok) return { imported: 0, fetched: 0, error: data.error ?? "echec_pull" };
          orders = data.orders ?? [];
        } catch {
          return { imported: 0, fetched: 0, error: "reseau" };
        }
      } else {
        orders = generateDemoOrders();
      }
      const fetched = orders.length;

      // Commandes déjà présentes (par shopifyOrderId) → pour distinguer
      // nouvelles vs mises à jour, et n'upserter le client que pour les nouvelles.
      const existing = new Set(
        closing.all.map((a) => a.shopifyOrderId).filter(Boolean) as string[],
      );

      let n = 0;
      for (const o of orders) {
        const isNew = !existing.has(o.shopifyOrderId);
        // Upsert : on (ré)injecte les faits Shopify (statut mappé, note, champs
        // du formulaire, client, articles). Les overrides — le travail manuel
        // de la closeuse (statut confirmé, commentaire, livreur…) — restent
        // appliqués par-dessus, donc rien n'est écrasé.
        closing.upsertOrder(toClosingAssignment(o));
        if (isNew) {
          upsertClient(o, clients);
          n++;
        }
      }

      // Devise détectée depuis les commandes réelles → stockée sur la connexion
      const detectedCurrency = orders.find((o) => o.currencyCode)?.currencyCode;
      recordSync(marketId, n, detectedCurrency);
      return { imported: n, fetched };
    },
    [getConnection, recordSync, closing, clients],
  );

  return { syncNow, liveMode };
}

/* ─── Génération démo ─────────────────────────────────────────────── */

function generateDemoOrders(): LiveOrder[] {
  const count = 1 + Math.floor(Math.random() * 3); // 1..3
  const out: LiveOrder[] = [];
  const activeProducts = MOCK_PRODUITS.filter((p) => p.isActive);
  for (let i = 0; i < count; i++) {
    const cust = DEMO_CUSTOMERS[Math.floor(Math.random() * DEMO_CUSTOMERS.length)];
    const prod = activeProducts[Math.floor(Math.random() * activeProducts.length)];
    const qty = 1 + Math.floor(Math.random() * 2);
    const num = 1000 + Math.floor(Math.random() * 9000);
    out.push({
      shopifyOrderId: `gid://shopify/Order/demo-${Date.now()}-${i}`,
      name: `#${num}`,
      createdAt: new Date().toISOString(),
      customer: cust,
      items: [{ productName: prod.name, quantity: qty, unitPriceXof: prod.priceXof }],
    });
  }
  return out;
}

/* ─── Mapping Shopify → Kamoo ──────────────────────────────────────── */

function toClosingAssignment(o: LiveOrder): ClosingAssignment {
  // Le numéro Kamoo MIROIR du numéro Shopify : id URL-safe dérivé du nom
  // (« #1002 » → « SH-1002 »), affichage = le nom Shopify exact (#1002).
  const safeId = `SH-${o.name.replace(/[^0-9A-Za-z]/g, "")}`;
  return {
    id: safeId,
    items: o.items.map((it) => {
      const p = MOCK_PRODUITS.find((x) => x.name === it.productName);
      return {
        productId: p?.id,
        productName: it.productName,
        productEmoji: p?.emoji ?? "🛍️",
        productBg: p?.bg ?? "linear-gradient(135deg,#E2E8F0,#94A3B8)",
        quantity: it.quantity,
        unitPriceXof: it.unitPriceXof,
        customAttributes: it.customAttributes,
      };
    }),
    client: {
      id: clientIdFor(o.customer.name),
      name: o.customer.name,
      phone: o.customer.phone,
      email: o.customer.email,
      city: o.customer.city,
      zone: o.customer.zone,
      address: o.customer.address,
      countryCode: o.customer.countryCode,
      isReturning: false,
    },
    status: mapShopifyStatus(o.fulfillmentStatus, o.financialStatus, o.cancelledAt),
    // createdAt = la VRAIE date de la commande Shopify (pas l'heure d'import)
    lastActivityAt: o.createdAt,
    createdAt: o.createdAt,
    callAttempts: 0,
    source: "Shopify",
    /** Note + champs personnalisés du formulaire COD (toutes les infos Shopify). */
    note: o.note,
    customAttributes: o.customAttributes,
    /** Lien vers la commande Shopify (pour le push de statut + dédup) */
    shopifyOrderId: o.shopifyOrderId,
    shopifyName: o.name,
    currencyCode: o.currencyCode,
  };
}

function clientIdFor(name: string): string {
  return `cu_sh_${name.toLowerCase().replace(/[^a-z]/g, "").slice(0, 12)}`;
}

function upsertClient(o: LiveOrder, clients: ReturnType<typeof useClientsState>) {
  const id = clientIdFor(o.customer.name);
  if (clients.getById(id)) return; // déjà présent
  const today = new Date().toISOString().slice(0, 10);
  const c: Client = {
    id,
    name: o.customer.name,
    phone: o.customer.phone,
    email: o.customer.email,
    city: o.customer.city,
    zone: o.customer.zone,
    address: o.customer.address,
    country: "SN",
    countryCode: o.customer.countryCode,
    status: "actif",
    acquisitionChannel: "boutique",
    firstOrderDate: today,
    lastOrderDate: today,
    totalOrders: 1,
    totalDeliveredOrders: 0,
    totalCancelledOrders: 0,
    totalSpentXof: 0,
    avgBasketXof: o.items.reduce((s, i) => s + i.unitPriceXof * i.quantity, 0),
    preferredProductIds: [],
    avatarBg: AVATARS[o.customer.name.length % AVATARS.length],
  };
  clients.addClient(c);
}
