import type { ExpeditionDetail } from "@/lib/types/expedition-detail";
import { MOCK_EXPEDITIONS } from "./mock-expeditions";

/**
 * Mock détaillé pour une expédition.
 * Cycle simplifié (3 phases) selon le vrai workflow :
 *   1. Soumis · vendeur transmet le shipping mark à son fournisseur
 *   2. Reçu en Chine · transitaire annonce la réception + le devis
 *   3. Arrivé à destination · à récupérer (ou payer si COD)
 */
function buildDetail(id: string): ExpeditionDetail | null {
  const base = MOCK_EXPEDITIONS.find((e) => e.id === id);
  if (!base) return null;

  const currentStage =
    base.status === "arrived_destination"
      ? {
          emoji: "📍",
          label: "Arrivé à Dakar",
          sub: "Vous pouvez passer le récupérer à l'entrepôt local",
        }
      : base.status === "received_china"
        ? {
            emoji: "📦",
            label: "Reçu chez le transitaire en Chine",
            sub: "Devis émis. En attente du paiement / de l'expédition",
          }
        : {
            emoji: "⏳",
            label: "En attente de réception en Chine",
            sub: "Le transitaire vous enverra un devis dès réception",
          };

  // Progress en 3 phases (au lieu de 4) : Soumis · Reçu Chine · Arrivé
  const progress =
    base.status === "arrived_destination"
      ? 2
      : base.status === "received_china"
        ? 1
        : 0;

  return {
    ...base,
    warehouseAddress:
      "KAMOO Logistics, n°12 Pazhou Avenue, Haizhu District, Guangzhou 510308, China",
    destinationCity: "Dakar",
    destinationCityFlag: "🇸🇳",
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
        photosDeclared: [
          { emoji: base.thumb.emoji, bg: base.thumb.bg },
          {
            emoji: "📦",
            bg: "linear-gradient(135deg,#FEF3C7,#F59E0B)",
          },
        ],
      },
      ...(base.otherProductsCount > 0
        ? [
            {
              name: "Sacs à main cuir",
              cartons: 1,
              weightDeclared: 0.6,
              photosDeclared: [
                {
                  emoji: "👜",
                  bg: "linear-gradient(135deg,#DBEAFE,#3B82F6)",
                },
              ],
            },
          ]
        : []),
    ],
    quote:
      base.amountXof !== null
        ? {
            issuedAt: "24 oct. 2025 · 10:12",
            validUntil: "31 oct. 2025",
            weightKg: 1.07,
            volumeCbm: base.transportMode === "sea" ? 0.024 : undefined,
            unitCost: {
              amountXof: base.transportMode === "sea" ? 1_650_000 : 8_200,
              unit: base.transportMode === "sea" ? "cbm" : "kg",
            },
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
        detail: `Shipping mark ${base.publicCode} généré`,
      },
      ...(base.status !== "awaiting_quote"
        ? [
            {
              date: "23 oct. 2025 · 16:47",
              authorName: `${base.transitaire.name.split(" ")[0]} (transitaire)`,
              authorRole: "transitaire" as const,
              icon: "box" as const,
              label: "Colis reçus en Chine",
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
              date: "02 nov. 2025 · 09:00",
              authorName: `${base.transitaire.name.split(" ")[0]} (transitaire)`,
              authorRole: "transitaire" as const,
              icon: "check" as const,
              label: "Colis arrivé à destination",
              detail: "À récupérer à l'entrepôt local",
            },
          ]
        : []),
    ],
  };
}

export function getMockExpeditionDetail(id: string) {
  return buildDetail(id);
}
