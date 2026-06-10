import { MOCK_CLOSING_ASSIGNMENTS } from "./mock-closing";
import { MOCK_EXPEDITIONS } from "./mock-expeditions";
import { MOCK_FINANCE_MOVEMENTS } from "./mock-finances";
import { MOCK_PRODUITS } from "./mock-produits";
import { getStockLevel } from "@/lib/types/produit";
import { MOCK_TODAY } from "@/lib/clock";

/**
 * Notifications dérivées des données réelles de l'app — AUCUNE fixture
 * dédiée. Chaque source métier produit ses notifications, triées par date.
 * En V2, ces événements seront poussés en BDD (table notifications) par
 * triggers/server actions, et le derive disparaîtra.
 */

export type NotificationKind =
  | "alerte_livraison"
  | "expedition"
  | "stock"
  | "paiement"
  | "rappel";

export type KamooNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  href: string;
  date: string; // ISO
  urgent: boolean;
};

export function buildNotifications(): KamooNotification[] {
  const out: KamooNotification[] = [];

  /* 1. Alertes livreur — la closeuse doit reprendre la main */
  for (const a of MOCK_CLOSING_ASSIGNMENTS) {
    if (a.delivery?.progress !== "alerte") continue;
    out.push({
      id: `alerte:${a.id}`,
      kind: "alerte_livraison",
      title: `Alerte livraison · ${a.id}`,
      body: a.delivery.livreurNote ?? `${a.delivery.name} signale un problème`,
      href: `/livraisons/${a.id}`,
      date: a.delivery.alertRaisedAt ?? a.delivery.scheduledAt ?? a.lastActivityAt,
      urgent: true,
    });
  }

  /* 2. Expéditions — action requise (payer un devis, confirmer une réception…) */
  for (const e of MOCK_EXPEDITIONS) {
    if (!e.action) continue;
    out.push({
      id: `exp:${e.id}`,
      kind: "expedition",
      title: `${e.action.label} · ${e.publicCode}`,
      body: `${e.productName} — ${e.transitaire.name}`,
      href: `/expeditions/${e.id}`,
      date: e.createdAt,
      urgent: e.action.urgent,
    });
  }

  /* 3. Stock bas / rupture */
  for (const p of MOCK_PRODUITS) {
    if (!p.isActive) continue;
    const level = getStockLevel(p);
    if (level !== "rupture" && level !== "bas") continue;
    out.push({
      id: `stock:${p.id}`,
      kind: "stock",
      title: level === "rupture" ? `Rupture de stock · ${p.name}` : `Stock bas · ${p.name}`,
      body:
        level === "rupture"
          ? "Stock épuisé — à réapprovisionner"
          : `${p.stock} unités restantes`,
      href: `/boutique/${p.id}`,
      date: MOCK_TODAY.toISOString(),
      urgent: level === "rupture",
    });
  }

  /* 4. Paiements partenaires à régler (agrégé). Les dépenses pub sont
   * exclues : Meta facture en un paiement groupé (cf. mock-finances), les
   * lignes quotidiennes ne sont pas des virements à faire. Idem pour les
   * frais livreur, auto-déduits du cash collecté. */
  const aPayer = MOCK_FINANCE_MOVEMENTS.filter(
    (m) =>
      m.direction === "out" &&
      m.status === "a_payer" &&
      m.type !== "depense_pub" &&
      m.type !== "frais_livreur",
  );
  if (aPayer.length > 0) {
    const total = aPayer.reduce((s, m) => s + m.amountXof, 0);
    const latest = aPayer.reduce(
      (max, m) => (m.date > max ? m.date : max),
      aPayer[0].date,
    );
    out.push({
      id: "paiements:a-regler",
      kind: "paiement",
      title: `${aPayer.length} paiement${aPayer.length > 1 ? "s" : ""} à régler`,
      body: `${total.toLocaleString("fr-FR")} F CFA dus à vos partenaires`,
      href: "/finances",
      date: latest,
      urgent: false,
    });
  }

  /* 5. Rappels closing planifiés */
  for (const a of MOCK_CLOSING_ASSIGNMENTS) {
    if (a.status !== "rappele" || !a.callbackAt) continue;
    const at = new Date(a.callbackAt);
    out.push({
      id: `rappel:${a.id}`,
      kind: "rappel",
      title: `Rappel client prévu · ${a.id}`,
      body: `${a.client.name} — ${at.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} à ${at.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
      href: `/closing/${a.id}`,
      date: a.callbackAt,
      urgent: false,
    });
  }

  return out.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}
