import type { Approvisionnement, Produit } from "@/lib/types/produit";

/**
 * Mocks Boutique — 10 produits avec mix volontaire :
 *  - 6 référencés dans les commandes (Crème, PowerBank, Sac, Lunettes, Casquette, Coque)
 *  - 4 nouveaux pour démo
 *  - Mix états : 7 actifs / 2 inactifs / 1 rupture
 *  - Mix stocks : full / bas / rupture
 */
export const MOCK_PRODUITS: Produit[] = [
  {
    id: "p_creme",
    sku: "SKU-CRM-001",
    name: "Crème éclaircissante naturelle",
    emoji: "🧴",
    bg: "linear-gradient(135deg,#FCE7F3,#F472B6)",
    description:
      "Crème naturelle à base de karité et de miel. Action progressive sans effet rebond. Convient peaux sensibles. 200ml.",
    priceXof: 18000,
    costPriceXof: 5500,
    stock: 47,
    lowStockThreshold: 10,
    isActive: true,
    soldThisMonth: 124,
    soldTotal: 1842,
    revenueThisMonthXof: 2232000,
    revenueTotalXof: 33156000,
    createdAt: "2024-09-15",
    lastSoldAt: "2026-05-02T11:30:00Z",
  },
  {
    id: "p_powerbank",
    sku: "SKU-PB-001",
    name: "Power Bank 10 000mAh",
    emoji: "🔋",
    bg: "linear-gradient(135deg,#DCFCE7,#22C55E)",
    description:
      "Batterie externe 10 000mAh 2 ports USB + USB-C, charge rapide 18W. Compatible iPhone/Samsung/Xiaomi. Garantie 6 mois.",
    priceXof: 12000,
    costPriceXof: 6800,
    stock: 23,
    lowStockThreshold: 10,
    isActive: true,
    soldThisMonth: 67,
    soldTotal: 489,
    revenueThisMonthXof: 804000,
    revenueTotalXof: 5868000,
    createdAt: "2025-01-20",
    lastSoldAt: "2026-05-02T10:45:00Z",
  },
  {
    id: "p_sac",
    sku: "SKU-SAC-001",
    name: "Sac à main cuir",
    emoji: "👜",
    bg: "linear-gradient(135deg,#DBEAFE,#3B82F6)",
    description:
      "Sac à main en cuir synthétique premium. 2 anses + bandoulière amovible. Multi-compartiments. Couleurs : noir, marron, rouge.",
    priceXof: 25000,
    costPriceXof: 8500,
    stock: 8,
    lowStockThreshold: 10,
    isActive: true,
    soldThisMonth: 18,
    soldTotal: 234,
    revenueThisMonthXof: 450000,
    revenueTotalXof: 5850000,
    createdAt: "2024-11-10",
    lastSoldAt: "2026-05-01T15:00:00Z",
  },
  {
    id: "p_lunettes",
    sku: "SKU-LUN-001",
    name: "Lunettes solaires aviateur",
    emoji: "🕶️",
    bg: "linear-gradient(135deg,#FEF3C7,#F59E0B)",
    description:
      "Lunettes aviateur monture métal, verres polarisés UV400. Étui rigide + chiffon microfibre inclus. 4 coloris disponibles.",
    priceXof: 11000,
    costPriceXof: 2800,
    stock: 65,
    lowStockThreshold: 15,
    isActive: true,
    soldThisMonth: 42,
    soldTotal: 612,
    revenueThisMonthXof: 462000,
    revenueTotalXof: 6732000,
    createdAt: "2025-03-08",
    lastSoldAt: "2026-05-02T07:30:00Z",
  },
  {
    id: "p_casquette",
    sku: "SKU-CAS-001",
    name: "Casquette brodée",
    emoji: "🧢",
    bg: "linear-gradient(135deg,#FED7AA,#F97316)",
    description:
      "Casquette ajustable avec broderie 3D. Coton brossé respirant. Taille unique 56-60cm. Logos personnalisables sur demande.",
    priceXof: 7000,
    costPriceXof: 1500,
    stock: 112,
    lowStockThreshold: 20,
    isActive: true,
    soldThisMonth: 89,
    soldTotal: 1234,
    revenueThisMonthXof: 623000,
    revenueTotalXof: 8638000,
    createdAt: "2025-02-15",
    lastSoldAt: "2026-04-26T16:00:00Z",
  },
  {
    id: "p_coque",
    sku: "SKU-COQ-001",
    name: "Coque téléphone silicone",
    emoji: "📱",
    bg: "linear-gradient(135deg,#E9D5FF,#A78BFA)",
    description:
      "Coque silicone souple anti-chocs. Compatible iPhone 12/13/14 et Samsung Galaxy S22/S23. 8 coloris.",
    priceXof: 8500,
    costPriceXof: 1200,
    stock: 0,
    lowStockThreshold: 15,
    isActive: true,
    soldThisMonth: 0,
    soldTotal: 287,
    revenueThisMonthXof: 0,
    revenueTotalXof: 2439500,
    createdAt: "2025-04-01",
    lastSoldAt: "2026-04-29T18:00:00Z",
  },
  {
    id: "p_montre",
    sku: "SKU-MTR-001",
    name: "Montre connectée sport",
    emoji: "⌚",
    bg: "linear-gradient(135deg,#CFFAFE,#06B6D4)",
    description:
      "Smartwatch avec capteur cardiaque, podomètre, notifications. Étanche IP67. Autonomie 7 jours. Bluetooth iOS/Android.",
    priceXof: 22000,
    // Vendeur n'a pas encore renseigné le prix d'achat — la marge ne sera pas calculée
    stock: 34,
    lowStockThreshold: 10,
    isActive: true,
    soldThisMonth: 15,
    soldTotal: 87,
    revenueThisMonthXof: 330000,
    revenueTotalXof: 1914000,
    createdAt: "2025-09-12",
    lastSoldAt: "2026-04-28T14:00:00Z",
  },
  {
    id: "p_parfum",
    sku: "SKU-PRF-001",
    name: "Parfum oud arabe 50ml",
    emoji: "🌸",
    bg: "linear-gradient(135deg,#FBCFE8,#EC4899)",
    description:
      "Eau de parfum oud arabe authentique. Tenue 12h. Notes : oud, ambre, vanille. Flacon 50ml + recharge 30ml offerte.",
    priceXof: 28000,
    costPriceXof: 9000,
    stock: 4,
    lowStockThreshold: 8,
    isActive: true,
    soldThisMonth: 9,
    soldTotal: 56,
    revenueThisMonthXof: 252000,
    revenueTotalXof: 1568000,
    createdAt: "2025-11-20",
    lastSoldAt: "2026-04-30T10:30:00Z",
  },
  {
    id: "p_robe",
    sku: "SKU-ROB-001",
    name: "Robe wax fluide",
    emoji: "👗",
    bg: "linear-gradient(135deg,#FED7AA,#FB923C)",
    description:
      "Robe wax authentique tissu sénégalais. Coupe ample fluide, ceinture incluse. Tailles 36 à 46. Saison à venir, pas encore lancée en vente.",
    priceXof: 15000,
    // costPriceXof non renseigné — pas encore importé, donc pas de coût connu
    stock: 50,
    lowStockThreshold: 10,
    isActive: false,
    soldThisMonth: 0,
    soldTotal: 0,
    revenueThisMonthXof: 0,
    revenueTotalXof: 0,
    createdAt: "2026-04-15",
  },
  {
    id: "p_sneakers",
    sku: "SKU-SNK-001",
    name: "Sneakers running",
    emoji: "👟",
    bg: "linear-gradient(135deg,#D1FAE5,#10B981)",
    description:
      "Sneakers running légères, semelle EVA + maille respirante. Tailles 38-46. Stock épuisé sur les pointures populaires, attente d'arrivage.",
    priceXof: 19000,
    costPriceXof: 6000,
    stock: 12,
    lowStockThreshold: 15,
    isActive: false,
    soldThisMonth: 0,
    soldTotal: 145,
    revenueThisMonthXof: 0,
    revenueTotalXof: 2755000,
    createdAt: "2025-06-10",
    lastSoldAt: "2026-03-15T16:00:00Z",
  },
];

/**
 * Approvisionnements liés à un produit donné.
 * V1 : mock direct (en V2, dérivé des Expéditions via productId).
 */
export const MOCK_APPROVISIONNEMENTS: Record<string, Approvisionnement[]> = {
  p_creme: [
    {
      expeditionId: "exp_01",
      expeditionCode: "KMO-SN-78421",
      quantity: 200,
      arrivalDate: "2026-05-14",
      status: "en_route",
      // Devis Kamoo déjà émis : on connaît la part d'expédition
      purchasePriceXof: 4200,
      shippingCostXof: 1100,
    },
    {
      expeditionId: "exp_03",
      expeditionCode: "KMO-SN-78366",
      quantity: 150,
      arrivalDate: "2026-04-28",
      status: "arrive",
      purchasePriceXof: 4500,
      shippingCostXof: 1300,
    },
  ],
  p_powerbank: [
    {
      expeditionId: "exp_02",
      expeditionCode: "KMO-SN-78395",
      quantity: 100,
      arrivalDate: "2026-05-17",
      status: "en_route",
      purchasePriceXof: 3000,
      shippingCostXof: 800,
    },
  ],
  p_sac: [
    {
      expeditionId: "exp_04",
      expeditionCode: "KMO-SN-78290",
      quantity: 50,
      arrivalDate: "2026-04-20",
      status: "arrive",
      purchasePriceXof: 7500,
      shippingCostXof: 2200,
    },
  ],
  p_lunettes: [
    {
      expeditionId: "exp_01",
      expeditionCode: "KMO-SN-78421",
      quantity: 80,
      arrivalDate: "2026-05-14",
      status: "en_route",
      purchasePriceXof: 2400,
      shippingCostXof: 600,
    },
  ],
  p_casquette: [
    {
      expeditionId: "exp_05",
      expeditionCode: "KMO-SN-78201",
      quantity: 200,
      arrivalDate: "2026-04-15",
      status: "arrive",
      purchasePriceXof: 1300,
      shippingCostXof: 350,
    },
  ],
  p_coque: [
    {
      expeditionId: "exp_06",
      expeditionCode: "KMO-SN-78104",
      quantity: 0,
      arrivalDate: "2026-05-25",
      status: "en_attente_devis",
      // Devis pas encore émis — coûts inconnus
    },
  ],
  p_montre: [],
  p_parfum: [],
  p_robe: [],
  p_sneakers: [],
};

export function getProduit(id: string): Produit | undefined {
  return MOCK_PRODUITS.find((p) => p.id === id);
}

export function getApprovisionnements(productId: string): Approvisionnement[] {
  return MOCK_APPROVISIONNEMENTS[productId] ?? [];
}

/** Stats globales pour le header de la page Boutique */
export function computeBoutiqueStats(produits: Produit[]) {
  const total = produits.length;
  const actifs = produits.filter((p) => p.isActive).length;
  const stockTotal = produits.reduce((sum, p) => sum + p.stock, 0);
  // Stock vendable = uniquement les produits actifs
  const stockActif = produits
    .filter((p) => p.isActive)
    .reduce((sum, p) => sum + p.stock, 0);
  const ventesTotal = produits.reduce((sum, p) => sum + p.soldTotal, 0);
  const caTotal = produits.reduce(
    (sum, p) => sum + p.revenueTotalXof,
    0,
  );

  return {
    total,
    actifs,
    stockTotal,
    stockActif,
    ventesTotal,
    caTotal,
  };
}
