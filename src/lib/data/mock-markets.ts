import { getCountryByCode } from "@/lib/data/countries";
import type { Market } from "@/lib/types/market";

/**
 * Mocks des marchés de la vendeuse Aïcha Diop.
 *
 *  - Sénégal : marché principal actif (toutes les données mocks de l'app)
 *  - Côte d'Ivoire : récemment ajouté, en cours de configuration
 *  - Cameroun : créé mais désactivé temporairement (pause)
 */
export const MOCK_MARKETS: Market[] = [
  {
    id: "mkt_sn",
    country: getCountryByCode("SN"),
    status: "active",
    createdAt: "2026-01-15T10:00:00Z",
    shopify: {
      domain: "aicha-boutique.myshopify.com",
      lastSyncAt: "2026-05-13T08:15:00Z",
      isConnected: true,
    },
    timezone: "Africa/Dakar",
    stats: {
      partnersCount: 3,
      productsCount: 10,
      ordersThisMonth: 28,
      activeOrdersCount: 47,
      mrrXof: 1_247_000,
    },
  },
  {
    id: "mkt_ci",
    country: getCountryByCode("CI"),
    status: "active",
    createdAt: "2026-04-22T14:30:00Z",
    shopify: {
      domain: "aicha-abidjan.myshopify.com",
      lastSyncAt: "2026-05-13T07:50:00Z",
      isConnected: true,
    },
    timezone: "Africa/Abidjan",
    stats: {
      partnersCount: 2,
      productsCount: 6,
      ordersThisMonth: 19,
      activeOrdersCount: 28,
      mrrXof: 732_000,
    },
  },
  {
    id: "mkt_cm",
    country: getCountryByCode("CM"),
    status: "active",
    createdAt: "2026-02-10T09:00:00Z",
    shopify: {
      domain: "aicha-cameroon.myshopify.com",
      lastSyncAt: "2026-05-12T18:30:00Z",
      isConnected: true,
    },
    timezone: "Africa/Douala",
    stats: {
      partnersCount: 2,
      productsCount: 4,
      ordersThisMonth: 8,
      activeOrdersCount: 12,
      mrrXof: 298_000,
    },
  },
];

export const DEFAULT_ACTIVE_MARKET_ID = "mkt_sn";

export function getMarketById(id: string): Market | undefined {
  return MOCK_MARKETS.find((m) => m.id === id);
}
