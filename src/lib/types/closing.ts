/**
 * Types pour le Module Closing (côté vendeur).
 */

export type ClosingStatus =
  | "nouvelle" // À appeler (par défaut quand commande arrive)
  | "rappele" // Appelée + rappel planifié OU client demande à être rappelé
  | "livraison_en_cours" // Confirmée par closeuse, en route vers le client
  | "livre" // Livrée + paiement COD reçu (état terminal de succès)
  | "annule" // Annulée
  | "injoignable"; // Plusieurs tentatives sans réponse

export type CancellationReason =
  | "wrong_number"
  | "no_money"
  | "client_traveling"
  | "refused_product"
  | "negotiation_failed"
  | "other";

/** Champ personnalisé clé/valeur (issu d'un formulaire COD Shopify, etc.). */
export type CustomAttribute = { key: string; value: string };

export type LineItem = {
  productId?: string; // ref vers catalogue, optionnel pour les "manuelles"
  productName: string;
  productEmoji: string;
  productBg: string;
  quantity: number;
  unitPriceXof: number;
  /** Propriétés de ligne (line item properties du formulaire Shopify). */
  customAttributes?: CustomAttribute[];
};

export type ClosingClient = {
  id: string; // utilisé pour le lien vers /clients/[id]
  name: string;
  phone: string;
  whatsapp?: string;
  /** Email (souvent renseigné par le formulaire COD / Shopify) */
  email?: string;
  /** Ville (Dakar, Abidjan, Douala, …) */
  city: string;
  /** Quartier / zone de livraison */
  zone: string;
  /** Adresse complète formatée (rue, ville, pays) — issue de Shopify */
  address?: string;
  /** Notes d'adresse (point de repère, étage, etc.) */
  deliveryNotes?: string;
  isReturning: boolean;
  /** Nb total de commandes passées par ce client (ex: 2 → « 2ᵉ commande ») */
  orderCount?: number;
};

/**
 * Avancement de la livraison côté LIVREUR — 3 états seulement.
 * Le livreur n'a pas à connaître le CRM : il marque uniquement son progrès.
 *
 *  - en_attente : la commande est dans sa file (en route, pas encore conclu)
 *  - effectue   : livré + payé, tout est OK
 *  - alerte     : il a un problème → la closeuse reprend la main
 *                 (client absent, refuse, demande plus tard, etc. — la note
 *                 du livreur explique)
 *
 * NB : le statut COMMANDE reste défini par la closeuse (ClosingStatus).
 * Quand le livreur passe en "alerte", la closeuse doit décider du nouveau
 * statut commande après lecture de la note.
 */
export type DeliveryProgress = "en_attente" | "effectue" | "alerte";

export const DELIVERY_PROGRESS_LABELS: Record<DeliveryProgress, string> = {
  en_attente: "En attente",
  effectue: "Effectué",
  alerte: "Alerte",
};

export type AssignedDelivery = {
  id: string;
  name: string;
  phone: string;
  avatarBg: string;
  rating: number;
  /** Avancement vu par le vendeur */
  progress: DeliveryProgress;
  /** ETA livraison (ISO) */
  scheduledAt?: string;
  /** Quand le livreur a récupéré le colis */
  pickedUpAt?: string;
  /** Quand la livraison a été effectuée (succès — progress = effectue) */
  deliveredAt?: string;
  /** Montant cash réellement encaissé (si effectué) */
  amountCollected?: number;
  /**
   * Note libre du livreur. Sert de contexte pour la closeuse en cas d'Alerte.
   * Ex: "Client refuse", "Pas de réponse, 3 tentatives", "Demande de repasser demain".
   */
  livreurNote?: string;
  /** Quand l'alerte a été levée (pour afficher "il y a Xmin") */
  alertRaisedAt?: string;
  /** Nombre total de livraisons effectuées (réputation livreur) */
  deliveriesCount?: number;
  /** Véhicule du livreur (ex: "Moto · Yamaha") */
  vehicle?: string;
};

export type ClosingAssignment = {
  /**
   * Identifiant unique de la commande, tel qu'affiché au client/vendeur.
   * Ex : "ORD-SN-00128". Sert aussi de slug d'URL (/closing/ORD-SN-00128).
   * Pas de "id technique" séparé : le code commande EST l'identifiant.
   */
  id: string;
  /** Produits commandés (1 ou plusieurs lignes) */
  items: LineItem[];
  client: ClosingClient;
  status: ClosingStatus;
  /** Si rappele, quand ? */
  callbackAt?: string;
  /** Si livraison_en_cours, ETA livraison */
  scheduledDeliveryAt?: string;
  /** Si annule, motif */
  cancellationReason?: CancellationReason;
  /** Commentaire libre laissé par la closeuse */
  comment?: string;
  /** Note de commande Shopify (texte libre côté boutique). */
  note?: string;
  /** Champs personnalisés de la commande (formulaire COD / note_attributes). */
  customAttributes?: CustomAttribute[];
  /** Livreur assigné (optionnel — sera rempli quand module Livraisons sera là) */
  delivery?: AssignedDelivery;
  /** Date dernière activité */
  lastActivityAt: string;
  /** Date de création de la commande */
  createdAt: string;
  /** Nombre de tentatives d'appel déjà faites */
  callAttempts: number;
  /** Origine de la commande (ex: "Instagram", "WhatsApp", "Site", "Shopify") */
  source?: string;
  /** ID de la commande Shopify d'origine (import auto + dédup + push statut) */
  shopifyOrderId?: string;
  /** Numéro lisible Shopify, ex "#1042" — devient le numéro affiché */
  shopifyName?: string;
  /** Devise réelle de la commande (auto-détectée depuis Shopify, ex "USD") */
  currencyCode?: string;
};

/** Numéro à AFFICHER : celui de Shopify si présent, sinon l'id Kamoo. */
export function displayOrderNo(a: ClosingAssignment): string {
  return a.shopifyName ?? a.id;
}

/** Helper : montant total d'une commande (somme des lignes) */
export function orderTotalXof(a: ClosingAssignment): number {
  return a.items.reduce((sum, i) => sum + i.quantity * i.unitPriceXof, 0);
}

/** Helper : quantité totale (somme des lignes) */
export function orderTotalQty(a: ClosingAssignment): number {
  return a.items.reduce((sum, i) => sum + i.quantity, 0);
}

export const CLOSING_STATUS_LABELS: Record<ClosingStatus, string> = {
  nouvelle: "Nouvelle",
  rappele: "Rappelé",
  livraison_en_cours: "Livraison en cours",
  livre: "Livré",
  annule: "Annulé",
  injoignable: "Injoignable",
};

export const CANCELLATION_REASON_LABELS: Record<CancellationReason, string> = {
  wrong_number: "Faux numéro",
  no_money: "Pas d'argent",
  client_traveling: "Client en voyage",
  refused_product: "Refus du produit",
  negotiation_failed: "Négociation échouée",
  other: "Autre",
};

export type ActiveCloseuse = {
  id: string;
  name: string;
  phone: string;
  avatarBg: string;
  rating: number;
  reviewsCount: number;
  startedAt: string;
  /** Dernière activité de la closeuse (ISO) — pour « Dernière connexion ». */
  lastSeenAt: string;
};

/* ─── Historique d'une commande Closing ─── */

export type ClosingEventType =
  | "created"
  | "call_attempt"
  | "callback_scheduled"
  | "confirmed"
  | "cancelled"
  | "comment"
  | "marked_unreachable"
  | "delivery_scheduled";

export type ClosingHistoryEvent = {
  type: ClosingEventType;
  at: string; // ISO
  authorName: string;
  authorRole: "system" | "closeuse" | "vendor" | "livreur";
  label: string;
  detail?: string;
};
