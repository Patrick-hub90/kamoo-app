/**
 * Types pour le Module Clients (CRM consommateurs).
 *
 * V1 : un Client est un consommateur final qui a passé au moins 1 commande
 * chez le vendeur (livrée ou non). La fiche regroupe ses coordonnées + stats
 * agrégées + tout son historique de commandes.
 *
 * Segmentation économique (= ce qui rentre vraiment en caisse) :
 *  - "prospect" : 0 livraison. Commande en cours OU annulée — pas encore
 *                 un vrai client, à convertir.
 *  - "nouveau"  : 1 livraison. Premier achat encaissé, à transformer en fidèle.
 *  - "fidele"   : 2+ livraisons. Le client est revenu — vrai habitué.
 *
 * Cette hiérarchie reflète "l'état réel" du business : seul le payé compte.
 * Prospect = lead, Nouveau & Fidèle = vrais clients.
 */

export type ClientSegment = "prospect" | "nouveau" | "fidele";

export type AcquisitionChannel =
  | "whatsapp"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "appel"
  | "bouche_a_oreille";

export type ClientStatus = "actif";

export type Client = {
  /** Doit matcher les ClosingClient.id pour que le détail puisse cross-link */
  id: string;
  name: string;
  phone: string;
  /** Si différent du téléphone de commande (ex: ligne pro) */
  whatsapp?: string;
  city: string;
  /** Quartier / zone précise pour livraisons */
  zone?: string;
  /** Pays — utile en multi-pays */
  country: "SN" | "CI" | "CM";

  status: ClientStatus;
  acquisitionChannel: AcquisitionChannel;

  /* ─── Stats agrégées ─── */
  /** ISO date de la 1re commande (livrée OU non) */
  firstOrderDate: string;
  /** ISO date de la dernière commande (toute statut) */
  lastOrderDate: string;
  /** Nombre total de commandes (toute statut confondu) */
  totalOrders: number;
  /** Commandes effectivement livrées + payées — détermine le segment */
  totalDeliveredOrders: number;
  /** Commandes annulées (tous motifs) */
  totalCancelledOrders: number;
  /** Total dépensé en F CFA (somme des commandes livrées) */
  totalSpentXof: number;
  /** Panier moyen sur les commandes livrées */
  avgBasketXof: number;

  /** Top produit IDs achetés (max 3) — pour reco vente croisée */
  preferredProductIds: string[];

  /** Notes libres du vendeur (visible vendeur uniquement) */
  notes?: string;
  /** Tags arbitraires (ex: "VIP-fashion", "appelle-le-soir") */
  tags?: string[];

  /** Gradient CSS pour l'avatar (initiales générées dynamiquement) */
  avatarBg: string;
};

/* ─── Helpers ─── */

/**
 * Segment d'un client = dérivé de totalDeliveredOrders.
 *  - 0 livraison    → "prospect" (à convertir, pas encore vrai client)
 *  - 1 livraison    → "nouveau"  (1er achat encaissé, à fidéliser)
 *  - 2+ livraisons  → "fidele"   (habitude prouvée, vrai client)
 */
export function getClientSegment(c: Client): ClientSegment {
  if (c.totalDeliveredOrders === 0) return "prospect";
  if (c.totalDeliveredOrders === 1) return "nouveau";
  return "fidele";
}

/** Helper : ce client est-il un vrai payeur (≥1 livraison) ? */
export function isPayingClient(c: Client): boolean {
  return c.totalDeliveredOrders > 0;
}

export const SEGMENT_LABELS: Record<ClientSegment, string> = {
  prospect: "Prospect",
  nouveau: "Nouveau",
  fidele: "Fidèle",
};

/**
 * Tone Tailwind pour chaque segment — utilisé dans les badges.
 *  - prospect : vert (lead positif, opportunité à transformer)
 *  - nouveau  : bleu Kamoo (1er achat, à fidéliser)
 *  - fidele   : orange Kamoo (chaud, valorisé — client précieux)
 */
export const SEGMENT_TONE: Record<
  ClientSegment,
  { bg: string; fg: string; ring: string }
> = {
  prospect: {
    bg: "bg-emerald-50",
    fg: "text-emerald-700",
    ring: "ring-emerald-200",
  },
  nouveau: {
    bg: "bg-kamoo-blue-50",
    fg: "text-kamoo-blue-700",
    ring: "ring-kamoo-blue-100",
  },
  fidele: {
    bg: "bg-kamoo-orange-50",
    fg: "text-kamoo-orange-700",
    ring: "ring-orange-200",
  },
};

export const CHANNEL_LABELS: Record<AcquisitionChannel, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  appel: "Appel direct",
  bouche_a_oreille: "Bouche à oreille",
};

/** Initiales pour l'avatar (max 2 lettres) */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Lien WhatsApp `wa.me` à partir d'un numéro local (ex: "+221 77 999 12 34") */
export function getWhatsappLink(phone: string, message?: string): string {
  const cleaned = phone.replace(/[^\d]/g, "");
  const base = `https://wa.me/${cleaned}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

/** Jours écoulés depuis la dernière commande */
export function daysSinceLastOrder(c: Client, today: Date = new Date()): number {
  const last = new Date(c.lastOrderDate);
  const diff = today.getTime() - last.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Taux de conversion = livrées / total. 0 si aucune commande.
 * Indicateur d'engagement & de fiabilité du client.
 */
export function deliveryRate(c: Client): number {
  if (c.totalOrders === 0) return 0;
  return Math.round((c.totalDeliveredOrders / c.totalOrders) * 100);
}
