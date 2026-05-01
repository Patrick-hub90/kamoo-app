import type { ExpeditionDetail } from "@/lib/types/expedition-detail";
import { MOCK_EXPEDITIONS } from "./mock-expeditions";

/**
 * Mock détaillé pour une expédition.
 * On enrichit la version "liste" avec produits, photos, devis, historique.
 */
function buildDetail(id: string): ExpeditionDetail | null {
  const base = MOCK_EXPEDITIONS.find((e) => e.id === id);
  if (!base) return null;

  // Données dérivées du statut pour l'affichage
  const currentStage =
    base.status === "arrived_destination"
      ? {
          emoji: "📍",
          label: "Arrivé à Dakar",
          sub: "Récupère ton colis à l'entrepôt local",
        }
      : base.status === "received_china"
        ? {
            emoji: "🚢",
            label: "En route vers Dakar",
            sub: "Prochaine étape : dédouanement Port de Dakar",
          }
        : {
            emoji: "⏳",
            label: "En attente de réception en Chine",
            sub: "Le transitaire t'enverra un devis dès réception",
          };

  const progress =
    base.status === "arrived_destination"
      ? 3
      : base.status === "received_china"
        ? 2
        : 0;

  return {
    ...base,
    warehouseAddress:
      "KAMOO Logistics, n°12 Pazhou Avenue, Haizhu District, Guangzhou 510308, China",
    destinationCity: "Dakar",
    destinationCityFlag: "🇸🇳",
    trackingNumber: base.status !== "awaiting_quote" ? "CMA-9482-0027-CN" : null,
    trackingCarrier: base.status !== "awaiting_quote" ? "CMA CGM" : null,
    aiCategory: { label: "Cosmétique", emoji: "🧴" },
    currentStage,
    progress,
    transitaireReviews: 312,
    dateSubmitted: "12 oct. 2025",
    products: [
      {
        name: base.productName,
        cartons: 2,
        weightDeclared: 0.4,
        weightActual: base.status !== "awaiting_quote" ? 0.45 : null,
        photosDeclared: [
          { emoji: "🧴", bg: "linear-gradient(135deg,#FCE7F3,#F472B6)" },
          { emoji: "📦", bg: "linear-gradient(135deg,#FEF3C7,#F59E0B)" },
        ],
        photosReceived:
          base.status !== "awaiting_quote"
            ? [
                { emoji: "🧴", bg: "linear-gradient(135deg,#FBCFE8,#EC4899)" },
                { emoji: "📦", bg: "linear-gradient(135deg,#FDE68A,#D97706)" },
                { emoji: "📋", bg: "linear-gradient(135deg,#DBEAFE,#3B82F6)" },
              ]
            : [],
      },
      ...(base.otherProductsCount > 0
        ? [
            {
              name: "Sacs à main cuir",
              cartons: 1,
              weightDeclared: 0.6,
              weightActual: base.status !== "awaiting_quote" ? 0.62 : null,
              photosDeclared: [
                { emoji: "👜", bg: "linear-gradient(135deg,#DBEAFE,#3B82F6)" },
              ],
              photosReceived:
                base.status !== "awaiting_quote"
                  ? [
                      { emoji: "👜", bg: "linear-gradient(135deg,#C7D2FE,#6366F1)" },
                    ]
                  : [],
            },
          ]
        : []),
    ],
    quote:
      base.amountXof !== null
        ? {
            issuedAt: "24 oct. 2025 · 10:12",
            validUntil: "31 oct. 2025",
            lines: [
              {
                label: "Transport maritime · 1.07 kg",
                amountXof: 89000,
              },
              { label: "Frais de dédouanement", amountXof: 78000 },
              { label: "Assurance Kamoo (2%)", amountXof: 18000 },
              {
                label: "Livraison dernier kilomètre · Dakar",
                amountXof: 45000,
              },
              { label: "Frais de service Kamoo", amountXof: 15000 },
            ],
            totalXof: base.amountXof,
          }
        : null,
    history: [
      {
        date: "12 oct. 2025 · 14:32",
        authorName: "Aïcha Diop",
        authorRole: "vendor",
        icon: "plus",
        label: "Expédition créée",
        detail: `${base.otherProductsCount + 1} colis · ${
          base.transportMode === "sea"
            ? "maritime"
            : base.transportMode === "air_express"
              ? "aérien express"
              : "aérien standard"
        }`,
      },
      {
        date: "15 oct. 2025 · 09:18",
        authorName: "Système",
        authorRole: "system",
        icon: "box",
        label: "Shipping mark partagé au fournisseur",
        detail: base.publicCode,
      },
      ...(base.status !== "awaiting_quote"
        ? [
            {
              date: "23 oct. 2025 · 16:47",
              authorName: `${base.transitaire.name.split(" ")[0]} (transitaire)`,
              authorRole: "transitaire" as const,
              icon: "camera" as const,
              label: "Colis reçus à l'entrepôt Guangzhou",
              detail: "3 cartons · 1.07 kg",
            },
            {
              date: "24 oct. 2025 · 10:12",
              authorName: "Système",
              authorRole: "system" as const,
              icon: "sparkle" as const,
              label: "Devis émis",
              detail: base.amountXof
                ? `${base.amountXof.toLocaleString("fr-FR")} F CFA`
                : "",
            },
          ]
        : []),
      ...(base.status === "arrived_destination"
        ? [
            {
              date: "28 oct. 2025 · 06:30",
              authorName: "CMA CGM",
              authorRole: "carrier" as const,
              icon: "ship" as const,
              label: "Embarquement Port de Shenzhen",
              detail: "Navire CMA CGM Africa One",
            },
            {
              date: "02 nov. 2025 · 22:00",
              authorName: "CMA CGM",
              authorRole: "carrier" as const,
              icon: "globe" as const,
              label: "Arrivée Port de Dakar",
              detail: "Dédouanement en cours",
            },
          ]
        : []),
    ],
  };
}

export function getMockExpeditionDetail(id: string) {
  return buildDetail(id);
}
