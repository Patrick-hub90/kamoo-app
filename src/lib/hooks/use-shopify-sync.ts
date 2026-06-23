"use client";

import { useCallback } from "react";
import { useShopify } from "@/lib/hooks/use-shopify";
import { useClosingState } from "@/lib/hooks/use-closing-state";
import { useClientsState } from "@/lib/hooks/use-clients-state";
import { useProductsState, getProductsSnapshot } from "@/lib/hooks/use-products-state";
import { useShopifyPublish, getPublishSnapshot } from "@/lib/hooks/use-shopify-publish";
import type { ClosingAssignment, ClosingStatus } from "@/lib/types/closing";
import type { Client } from "@/lib/types/client";
import type { Produit } from "@/lib/types/produit";

/**
 * Synchronisation Shopify → Kamoo (commandes + clients + PRODUITS), AUTOMATIQUE.
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
 *
 * Réconciliation produits : chaque ligne de commande est rattachée à un produit
 * du catalogue (par gid Shopify → SKU → nom). Si le produit n'existe pas encore
 * côté Kamoo, on crée AUTOMATIQUEMENT un brouillon (origin "shopify_order",
 * prix d'achat vide) — le catalogue se remplit tout seul et la marge devient
 * calculable dès que le vendeur renseigne le prix d'achat (cf. bandeau de
 * réconciliation au catalogue). Opération idempotente : un produit déjà présent
 * (lien gid / SKU / nom) n'est jamais recréé.
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

/* Produits de repli pour la démo quand le catalogue est encore vide. */
const DEMO_FALLBACK_PRODUCTS: { name: string; priceXof: number }[] = [
  { name: "Crème éclaircissante naturelle", priceXof: 18000 },
  { name: "Power Bank 10 000mAh", priceXof: 12000 },
  { name: "Montre connectée sport", priceXof: 22000 },
  { name: "Lunettes solaires aviateur", priceXof: 11000 },
];

const AVATARS = [
  "linear-gradient(135deg,#0EA5E9,#0284C7)",
  "linear-gradient(135deg,#22C55E,#16A34A)",
  "linear-gradient(135deg,#A855F7,#7E22CE)",
  "linear-gradient(135deg,#F59E0B,#B45309)",
  "linear-gradient(135deg,#EC4899,#DB2777)",
];

/* Dégradés de couverture pour les brouillons auto-créés (sans image Shopify). */
const IMPORT_BG = [
  "linear-gradient(135deg,#FCE7F3,#F472B6)",
  "linear-gradient(135deg,#DBEAFE,#3B82F6)",
  "linear-gradient(135deg,#DCFCE7,#22C55E)",
  "linear-gradient(135deg,#FEF3C7,#F59E0B)",
  "linear-gradient(135deg,#E9D5FF,#A78BFA)",
  "linear-gradient(135deg,#FED7AA,#F97316)",
];
const FALLBACK_BG = "linear-gradient(135deg,#E2E8F0,#94A3B8)";

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
  items: {
    productName: string;
    quantity: number;
    unitPriceXof: number;
    customAttributes?: Attribute[];
    /** Clés de réconciliation catalogue (mode live). */
    shopifyProductId?: string;
    sku?: string;
    imageUrl?: string;
  }[];
};

type LiveLineItem = LiveOrder["items"][number];

/** Ce qu'un résolveur renvoie pour une ligne : produit catalogue + visuel. */
type ResolvedLine = { productId: string; emoji: string; bg: string };

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
  // Actions stables seulement : la LECTURE du catalogue/des liens se fait via
  // snapshot impératif au moment de la synchro (cf. getProductsSnapshot /
  // getPublishSnapshot), pour voir les écritures les plus récentes — y compris
  // celles d'un marché précédent dans la même passe multi-boutiques.
  const { addProduct } = useProductsState();
  const { link } = useShopifyPublish();

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
        orders = generateDemoOrders(getProductsSnapshot().filter((p) => p.isActive));
      }
      const fetched = orders.length;

      // Commandes déjà présentes (par shopifyOrderId) → pour distinguer
      // nouvelles vs mises à jour, et n'upserter le client que pour les nouvelles.
      const existing = new Set(
        closing.all.map((a) => a.shopifyOrderId).filter(Boolean) as string[],
      );

      // ── Résolveur de produit (réconciliation catalogue) ──
      // Snapshots LIVE lus au moment de la synchro (pas de closure figée) : un
      // brouillon créé par un marché précédent du même tick est visible ici.
      const catalog = getProductsSnapshot();
      const publishAll = getPublishSnapshot();
      // Index des liens Shopify→Kamoo + cache des brouillons créés dans cet appel
      // (le state React n'est pas re-render pendant la boucle, on évite ainsi les
      // doublons quand 2 lignes citent le même produit absent).
      const linkByGid = new Map<string, string>();
      for (const [kamooId, v] of Object.entries(publishAll)) {
        if (v.shopifyProductId) linkByGid.set(v.shopifyProductId, kamooId);
      }
      const createdThisTick = new Map<string, ResolvedLine>();
      let createdCount = 0;

      const resolveLine = (line: LiveLineItem): ResolvedLine => {
        const gidKey = line.shopifyProductId ? `gid:${line.shopifyProductId}` : null;
        const sku = line.sku?.toLowerCase().trim();
        const skuKey = sku ? `sku:${sku}` : null;
        const name = line.productName.toLowerCase().trim();
        const nameKey = `name:${name}`;

        // Déjà créé/résolu dans cet appel ? On respecte la précédence d'identité
        // gid > sku > nom : une clé faible (nom) ne doit jamais court-circuiter
        // un gid distinct (sinon deux produits homonymes fusionnent à tort).
        if (gidKey && createdThisTick.has(gidKey)) return createdThisTick.get(gidKey)!;
        if (skuKey && createdThisTick.has(skuKey)) return createdThisTick.get(skuKey)!;
        if (!gidKey && !skuKey && createdThisTick.has(nameKey)) return createdThisTick.get(nameKey)!;

        // 1. gid Shopify → lien existant
        if (line.shopifyProductId) {
          const id = linkByGid.get(line.shopifyProductId);
          if (id) {
            const p = catalog.find((x) => x.id === id);
            return { productId: id, emoji: p?.emoji ?? "🛍️", bg: p?.bg ?? FALLBACK_BG };
          }
        }
        // 2. SKU
        if (sku) {
          const p = catalog.find((x) => x.sku && x.sku.toLowerCase().trim() === sku);
          if (p) return { productId: p.id, emoji: p.emoji, bg: p.bg };
        }
        // 3. nom exact — UNIQUEMENT sans gid : un gid non lié = nouveau produit
        // Shopify, pas un homonyme du catalogue à réutiliser.
        if (!line.shopifyProductId) {
          const byName = catalog.find((x) => x.name.toLowerCase().trim() === name);
          if (byName) return { productId: byName.id, emoji: byName.emoji, bg: byName.bg };
        }

        // → introuvable : brouillon auto (origin shopify_order, prix achat vide)
        const bg = IMPORT_BG[createdCount % IMPORT_BG.length];
        const id = `p_auto_${slugify(line.productName)}_${createdCount}_${Date.now().toString(36)}`;
        const draft: Produit = {
          id,
          sku:
            line.sku ||
            `SH-${(line.shopifyProductId ?? "").replace(/\D/g, "").slice(-6) ||
              slugify(line.productName).slice(0, 6).toUpperCase()}`,
          name: line.productName,
          emoji: "🛍️",
          bg,
          description: "",
          priceXof: Math.round(line.unitPriceXof),
          stock: 0,
          lowStockThreshold: 5,
          isActive: true,
          soldThisMonth: 0,
          soldTotal: 0,
          revenueThisMonthXof: 0,
          revenueTotalXof: 0,
          createdAt: new Date().toISOString(),
          origin: "shopify_order",
        };
        addProduct(draft);
        if (line.shopifyProductId) link(id, line.shopifyProductId, "imported");
        if (line.imageUrl) saveCover(id, line.imageUrl);

        const out: ResolvedLine = { productId: id, emoji: "🛍️", bg };
        if (gidKey) createdThisTick.set(gidKey, out);
        if (skuKey) createdThisTick.set(skuKey, out);
        // La clé nom ne sert de pont QUE pour les lignes sans identité forte ;
        // sinon elle ferait fusionner deux gids distincts mais homonymes.
        if (!gidKey && !skuKey) createdThisTick.set(nameKey, out);
        createdCount++;
        return out;
      };

      let n = 0;
      for (const o of orders) {
        const isNew = !existing.has(o.shopifyOrderId);
        // Upsert : on (ré)injecte les faits Shopify (statut mappé, note, champs
        // du formulaire, client, articles). Les overrides — le travail manuel
        // de la closeuse (statut confirmé, commentaire, livreur…) — restent
        // appliqués par-dessus, donc rien n'est écrasé.
        closing.upsertOrder(toClosingAssignment(o, resolveLine));
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
    [getConnection, recordSync, closing, clients, addProduct, link],
  );

  return { syncNow, liveMode };
}

/* ─── Génération démo ─────────────────────────────────────────────── */

function generateDemoOrders(activeProducts: Produit[]): LiveOrder[] {
  const count = 1 + Math.floor(Math.random() * 3); // 1..3
  const out: LiveOrder[] = [];
  // Tire dans le catalogue actif ; à défaut (catalogue encore vide), repli.
  const pool: { name: string; priceXof: number }[] = activeProducts.length
    ? activeProducts.map((p) => ({ name: p.name, priceXof: p.priceXof }))
    : DEMO_FALLBACK_PRODUCTS;
  for (let i = 0; i < count; i++) {
    const cust = DEMO_CUSTOMERS[Math.floor(Math.random() * DEMO_CUSTOMERS.length)];
    const prod = pool[Math.floor(Math.random() * pool.length)];
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

function toClosingAssignment(
  o: LiveOrder,
  resolve: (line: LiveLineItem) => ResolvedLine,
): ClosingAssignment {
  // Le numéro Kamoo MIROIR du numéro Shopify : id URL-safe dérivé du nom
  // (« #1002 » → « SH-1002 »), affichage = le nom Shopify exact (#1002).
  const safeId = `SH-${o.name.replace(/[^0-9A-Za-z]/g, "")}`;
  return {
    id: safeId,
    items: o.items.map((it) => {
      const r = resolve(it);
      return {
        productId: r.productId,
        productName: it.productName,
        productEmoji: r.emoji,
        productBg: r.bg,
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

/* ─── Helpers ──────────────────────────────────────────────────────── */

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "") // retire les diacritiques combinants
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24) || "produit"
  );
}

/** Enregistre l'image Shopify comme couverture du produit (même canal que
 *  l'import manuel) puis notifie les vues qui affichent les couvertures. */
function saveCover(productId: string, url: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`boutique.photos.${productId}`, JSON.stringify([url]));
    window.dispatchEvent(new Event("storage"));
  } catch {
    /* stockage plein — non bloquant */
  }
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
