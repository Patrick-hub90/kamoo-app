import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Megaphone,
  Package,
  PackageX,
  Pencil,
  Plane,
  Plus,
  Ship,
} from "lucide-react";
import { CopyButton } from "@/components/kamoo/copy-button";
import { ProductActiveToggle } from "@/components/kamoo/product-active-toggle";
import {
  ProductImageEditProvider,
  ProductImageManager,
  ProductSaveButton,
} from "@/components/kamoo/product-image-manager";
import { campaignsForProduct } from "@/lib/data/mock-ad-campaigns";
import { getApprovisionnements, getProduit } from "@/lib/data/mock-produits";
import {
  conversionRate,
  costPerDelivered,
  PLATFORM_LABELS,
  STATUS_LABELS,
  type AdCampaign,
} from "@/lib/types/ad-campaign";
import {
  acquisitionCost,
  averageAcquisitionCost,
  getStockLevel,
  marginRate,
  unitMargin,
  type Approvisionnement,
} from "@/lib/types/produit";
import { formatXOF } from "@/lib/format";
import { cn } from "@/lib/utils";

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const APPRO_LABELS: Record<Approvisionnement["status"], string> = {
  en_route: "En route",
  arrive: "Arrivé",
  en_attente_devis: "En attente devis",
};

/* Statut appro = rôle couleur doctrine : en cours (bleu), fait (emerald),
 * attente (ambre). Plus de cyan, pas de ring. */
const APPRO_TONE: Record<Approvisionnement["status"], { bg: string; fg: string; dot: string }> = {
  en_route: { bg: "bg-kamoo-blue-50", fg: "text-kamoo-blue-700", dot: "bg-kamoo-blue-600" },
  arrive: { bg: "bg-emerald-50", fg: "text-emerald-700", dot: "bg-emerald-500" },
  en_attente_devis: { bg: "bg-amber-50", fg: "text-amber-700", dot: "bg-amber-500" },
};

export default async function ProduitDetailPage({ params }: PageProps) {
  const { id } = await params;
  const p = getProduit(id);
  if (!p) notFound();

  const appros = getApprovisionnements(p.id);
  const campaigns = campaignsForProduct(p.id);
  const totalAdSpend = campaigns.reduce((s, c) => s + c.spentXof, 0);
  const totalAdDelivered = campaigns.reduce((s, c) => s + c.ordersDelivered, 0);
  const stockLevel = getStockLevel(p);

  // Coût d'acquisition : moyen pondéré dérivé des expéditions arrivées (donnée
  // vraie) en priorité, sinon coût saisi manuellement, sinon non calculable.
  const avgAcquisition = averageAcquisitionCost(appros);
  const effectiveCost: number | null = avgAcquisition ?? p.costPriceXof ?? null;
  const costSource: "expeditions" | "manual" | "none" =
    avgAcquisition !== null ? "expeditions" : p.costPriceXof !== undefined ? "manual" : "none";

  const margin = effectiveCost !== null ? p.priceXof - effectiveCost : unitMargin(p);
  const margePct =
    effectiveCost !== null && p.priceXof > 0
      ? Math.round(((p.priceXof - effectiveCost) / p.priceXof) * 100)
      : marginRate(p);

  const margeTone =
    margePct === null
      ? ""
      : margePct >= 60
        ? "bg-emerald-50 text-emerald-700"
        : margePct >= 40
          ? "bg-amber-50 text-amber-700"
          : "bg-red-50 text-red-600";

  const stockColor =
    stockLevel === "rupture"
      ? "text-red-600"
      : stockLevel === "bas"
        ? "text-amber-700"
        : "text-ink-900";

  return (
    <ProductImageEditProvider productId={p.id} initialPhotos={p.photos}>
      <div className="min-h-full bg-paper">
        <div className="mx-auto w-full max-w-6xl px-6 py-6">
          <div className="overflow-hidden rounded-xl border border-line bg-white shadow-kamoo-sm">
            {/* ─── HEADER (dans la carte) ─── */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-6 py-4">
              <Link
                href="/boutique"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-paper-2 text-ink-500 transition hover:text-ink-700"
                aria-label="Retour au catalogue"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-xl"
                style={{ background: p.bg }}
              >
                {p.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-[18px] font-medium tracking-tight text-ink-900 md:text-[22px]">
                  {p.name}
                </h1>
                <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-ink-400">
                  <span className="font-mono-kamoo">{p.sku}</span>
                  <CopyButton value={p.sku} />
                </div>
              </div>

              <div className="ml-auto flex shrink-0 items-center gap-2">
                <ProductActiveToggle
                  productId={p.id}
                  initialActive={p.isActive}
                  productName={p.name}
                  variant="badge"
                />
                <ProductSaveButton />
                <Link
                  href={`/boutique/${p.id}/edit`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 text-[13px] font-medium text-ink-900 transition hover:bg-paper-2"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Modifier
                </Link>
              </div>
            </div>

            {/* ─── CORPS 2 COLONNES ─── */}
            <div className="grid grid-cols-1 items-start gap-5 p-6 lg:grid-cols-[1.55fr_1fr]">
              {/* ═══ GAUCHE ═══ */}
              <div className="flex flex-col gap-5">
                {/* HERO RENTABILITÉ + PERFORMANCE */}
                <div className="rounded-xl border border-line p-5">
                  <div className="flex items-start gap-5">
                    <ProductImageManager emoji={p.emoji} bg={p.bg} name={p.name} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-ink-400">
                        Prix de vente
                      </div>
                      <div className="mt-1 text-[26px] font-medium leading-none tracking-tight tabular-nums text-ink-900 md:text-[28px]">
                        {formatXOF(p.priceXof)}
                      </div>

                      {effectiveCost !== null && margin !== null && margePct !== null ? (
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[12.5px]">
                          <span className="text-ink-500">
                            {costSource === "expeditions" ? "Coût acquisition moyen" : "Coût d'achat"}
                            {" · "}
                            <span className="font-medium text-ink-700">
                              {formatXOF(effectiveCost)}
                            </span>
                          </span>
                          <span className="text-ink-300">·</span>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium",
                              margeTone,
                            )}
                          >
                            Marge {formatXOF(margin, false)} F ({margePct}%)
                          </span>
                        </div>
                      ) : (
                        <div className="mt-3 rounded-lg bg-amber-50/60 px-3.5 py-3 text-[12.5px] leading-relaxed text-ink-800">
                          <div className="text-[10.5px] font-medium uppercase tracking-wider text-amber-700">
                            Marge non calculée
                          </div>
                          <p className="mt-1 font-medium text-ink-800">
                            Renseignez votre prix d&apos;achat moyen, ou créez une expédition avec
                            coût pour le calcul automatique.{" "}
                            <Link
                              href={`/boutique/${p.id}/edit`}
                              className="font-medium text-kamoo-blue-700 hover:underline"
                            >
                              Ajouter le prix d&apos;achat
                            </Link>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bande Performance fusionnée */}
                  <div className="mt-4 grid grid-cols-2 border-t border-line pt-3">
                    <Stat label="Vendu total" value={p.soldTotal.toLocaleString("fr-FR")} />
                    <Stat
                      label="CA total"
                      value={`${formatXOF(p.revenueTotalXof, false)} F`}
                      divider
                    />
                  </div>

                  <p className="mt-4 rounded-lg bg-paper-2/40 px-3.5 py-3 text-[13px] leading-relaxed text-ink-800">
                    {p.description}
                  </p>
                </div>

                {/* APPROVISIONNEMENTS */}
                <Card title="Approvisionnements" count={appros.length} action={
                  <Link
                    href="/expeditions/nouvelle"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-paper-2 px-2.5 py-1.5 text-[12px] font-medium text-ink-700 transition hover:bg-ink-100 hover:text-ink-900"
                  >
                    <Plus className="h-3 w-3" />
                    Nouvelle expédition
                  </Link>
                }>
                  {appros.length === 0 ? (
                    <EmptyState
                      icon={<Package className="mx-auto h-6 w-6 text-ink-400" />}
                      title="Aucun approvisionnement enregistré"
                      hint="Créez une expédition pour ajouter du stock"
                    />
                  ) : (
                    <div className="overflow-hidden rounded-lg border border-line">
                      <div className="grid grid-cols-[1.4fr_56px_1fr_1fr_1fr] items-center gap-2 bg-paper-2/60 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.06em] text-ink-400">
                        <span>Expédition</span>
                        <span className="text-right">Qté</span>
                        <span className="text-right">Achat / u</span>
                        <span className="text-right">Expéd. / u</span>
                        <span className="text-right">Acquis. / u</span>
                      </div>
                      {appros.map((a, i) => {
                        const Icon = a.status === "en_route" ? Ship : Plane;
                        const acq = acquisitionCost(a);
                        const tone = APPRO_TONE[a.status];
                        return (
                          <Link
                            key={a.expeditionId}
                            href={`/expeditions/${a.expeditionId}?from=boutique&productId=${p.id}`}
                            className={cn(
                              "group grid grid-cols-[1.4fr_56px_1fr_1fr_1fr] items-center gap-2 px-3 py-2.5 transition hover:bg-paper-2",
                              i < appros.length - 1 && "border-b border-line",
                            )}
                          >
                            <div className="flex min-w-0 items-center gap-2.5">
                              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-ink-400 ring-1 ring-line">
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-mono-kamoo truncate text-[12px] font-medium text-ink-900 group-hover:text-kamoo-blue-700">
                                  {a.expeditionCode}
                                </div>
                                <div className="mt-0.5 flex items-center gap-1.5 text-[10.5px]">
                                  <span
                                    className={cn(
                                      "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium",
                                      tone.bg,
                                      tone.fg,
                                    )}
                                  >
                                    <span className={cn("h-1 w-1 rounded-full", tone.dot)} />
                                    {APPRO_LABELS[a.status]}
                                  </span>
                                  <span className="truncate text-ink-400">
                                    {a.status === "arrive"
                                      ? formatDate(a.arrivalDate)
                                      : a.status === "en_route"
                                        ? `ETA ${formatDate(a.arrivalDate)}`
                                        : "—"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right text-[12.5px] font-medium tabular-nums text-ink-900">
                              {a.quantity > 0 ? `×${a.quantity}` : "—"}
                            </div>
                            <div className="text-right text-[12px] tabular-nums">
                              {a.purchasePriceXof !== undefined ? (
                                <span className="font-medium text-ink-700">
                                  {formatXOF(a.purchasePriceXof, false)}
                                </span>
                              ) : (
                                <span className="text-ink-400">—</span>
                              )}
                            </div>
                            <div className="text-right text-[12px] tabular-nums">
                              {a.shippingCostXof !== undefined ? (
                                <span className="font-medium text-ink-700">
                                  {formatXOF(a.shippingCostXof, false)}
                                </span>
                              ) : (
                                <span className="text-amber-700" title="Devis Kamoo en attente">
                                  en attente
                                </span>
                              )}
                            </div>
                            <div className="text-right text-[12.5px] tabular-nums">
                              {acq !== null ? (
                                <span className="font-medium text-ink-900">
                                  {formatXOF(acq, false)}
                                </span>
                              ) : (
                                <span className="text-ink-400">—</span>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </Card>

                {/* CAMPAGNES PUBLICITAIRES */}
                <Card title="Campagnes publicitaires" count={campaigns.length} action={
                  <Link
                    href="/finances/pubs"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-paper-2 px-2.5 py-1.5 text-[12px] font-medium text-ink-700 transition hover:bg-ink-100 hover:text-ink-900"
                  >
                    <Plus className="h-3 w-3" />
                    Gérer les campagnes
                  </Link>
                }>
                  {campaigns.length === 0 ? (
                    <EmptyState
                      icon={<Megaphone className="mx-auto h-6 w-6 text-ink-400" />}
                      title="Aucune campagne pub liée à ce produit"
                      hint="Lancez une campagne Facebook ou TikTok pour booster les ventes"
                    />
                  ) : (
                    <>
                      <div className="mb-3 grid grid-cols-2 gap-2">
                        <div className="rounded-lg border border-line p-3">
                          <div className="text-[10.5px] font-medium uppercase tracking-[0.05em] text-ink-400">
                            Dépense totale pub
                          </div>
                          <div className="mt-0.5 text-[15px] font-medium tabular-nums text-ink-900">
                            {formatXOF(totalAdSpend, false)}
                            <span className="ml-1 text-[10px] font-medium text-ink-400">F</span>
                          </div>
                        </div>
                        <div className="rounded-lg border border-line p-3">
                          <div className="text-[10.5px] font-medium uppercase tracking-[0.05em] text-ink-400">
                            Coût moyen / livré
                          </div>
                          <div className="mt-0.5 text-[15px] font-medium tabular-nums text-ink-900">
                            {totalAdDelivered > 0
                              ? formatXOF(Math.round(totalAdSpend / totalAdDelivered), false)
                              : "—"}
                            {totalAdDelivered > 0 && (
                              <span className="ml-1 text-[10px] font-medium text-ink-400">F</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {campaigns.map((c) => (
                          <CampaignRow key={c.id} campaign={c} />
                        ))}
                      </div>
                    </>
                  )}
                </Card>
              </div>

              {/* ═══ DROITE (rail sticky) ═══ */}
              <div className="flex flex-col gap-5 lg:sticky lg:top-6">
                {/* STOCK */}
                <Card title="Stock disponible">
                  <div className="flex items-baseline gap-2">
                    <span
                      className={cn(
                        "text-[26px] font-medium leading-none tracking-tight tabular-nums md:text-[28px]",
                        stockColor,
                      )}
                    >
                      {p.stock}
                    </span>
                    <span className="text-[14px] font-medium text-ink-400">unités</span>
                  </div>
                  <div className="mt-3">
                    {stockLevel === "rupture" ? (
                      <StatusPill bg="bg-red-50" fg="text-red-600" dot="bg-red-500" icon={<PackageX className="h-3 w-3" />}>
                        Rupture de stock
                      </StatusPill>
                    ) : stockLevel === "bas" ? (
                      <StatusPill bg="bg-amber-50" fg="text-amber-700" dot="bg-amber-500" icon={<AlertTriangle className="h-3 w-3" />}>
                        Stock bas (≤{p.lowStockThreshold})
                      </StatusPill>
                    ) : (
                      <StatusPill bg="bg-emerald-50" fg="text-emerald-700" dot="bg-emerald-500" icon={<CheckCircle2 className="h-3 w-3" />}>
                        Stock OK
                      </StatusPill>
                    )}
                  </div>
                  <Link
                    href="/expeditions/nouvelle"
                    className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-kamoo-blue-700 transition hover:text-kamoo-blue-900"
                  >
                    <Plus className="h-3 w-3" />
                    Réapprovisionner
                  </Link>
                </Card>

                {/* PUBLICATION */}
                <Card title="Publication">
                  <p className="mb-3 text-[12.5px] leading-relaxed text-ink-500">
                    Gérez la visibilité de ce produit dans votre boutique et chez vos closeuses.
                  </p>
                  <ProductActiveToggle
                    productId={p.id}
                    initialActive={p.isActive}
                    productName={p.name}
                    variant="button"
                  />
                </Card>

                {/* INFOS */}
                <Card title="Infos produit" icon={<Package className="h-3.5 w-3.5" />}>
                  <div className="flex flex-col gap-3">
                    <Row label="SKU">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="font-mono-kamoo">{p.sku}</span>
                        <CopyButton value={p.sku} />
                      </span>
                    </Row>
                    <Row label="Ajouté le">
                      <span className="tabular-nums">{formatDate(p.createdAt)}</span>
                    </Row>
                    {p.lastSoldAt && (
                      <Row label="Dernière vente">
                        <span className="tabular-nums">{formatDate(p.lastSoldAt)}</span>
                      </Row>
                    )}
                    <Row label="Seuil stock bas">
                      <span className="tabular-nums">{p.lowStockThreshold} unités</span>
                    </Row>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProductImageEditProvider>
  );
}

/* ─── Sous-composants ─── */

function Card({
  title,
  count,
  icon,
  action,
  children,
}: {
  title: string;
  count?: number;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line p-5">
      <div className="mb-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-ink-400">
          {icon}
          {title}
          {count != null && <span>· {count}</span>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[13px]">
      <span className="text-ink-500">{label}</span>
      <div className="min-w-0 text-right text-ink-900">{children}</div>
    </div>
  );
}

function Stat({ label, value, divider }: { label: string; value: string; divider?: boolean }) {
  return (
    <div className={cn("px-3 first:pl-0", divider && "border-l border-line")}>
      <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-ink-400">{label}</div>
      <div className="mt-0.5 text-[17px] font-medium tabular-nums text-ink-900">{value}</div>
    </div>
  );
}

function StatusPill({
  bg,
  fg,
  dot,
  icon,
  children,
}: {
  bg: string;
  fg: string;
  dot: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium",
        bg,
        fg,
      )}
    >
      {icon ?? <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />}
      {children}
    </span>
  );
}

function EmptyState({
  icon,
  title,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-paper-2/30 px-3 py-8 text-center">
      {icon}
      <p className="mt-2 text-[12.5px] font-medium text-ink-700">{title}</p>
      <p className="mt-1 text-[11.5px] text-ink-400">{hint}</p>
    </div>
  );
}

function CampaignRow({ campaign: c }: { campaign: AdCampaign }) {
  const cpd = costPerDelivered(c);
  const conv = conversionRate(c);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-paper-2/40 p-3 transition hover:border-kamoo-blue-200 hover:bg-white">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-paper-2 text-ink-500">
        <Megaphone className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-[12.5px] font-medium text-ink-900">{c.name}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10.5px]">
          <span className="rounded-full bg-paper-2 px-2 py-0.5 font-medium text-ink-600">
            {PLATFORM_LABELS[c.platform]}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium",
              c.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-paper-2 text-ink-500",
            )}
          >
            <span
              className={cn(
                "h-1 w-1 rounded-full",
                c.status === "active" ? "bg-emerald-500" : "bg-ink-400",
              )}
            />
            {STATUS_LABELS[c.status]}
          </span>
          {c.paymentStatus === "pending" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
              <AlertTriangle className="h-2.5 w-2.5" />À payer
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-4 text-right">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.05em] text-ink-400">Dépensé</div>
          <div className="text-[12.5px] font-medium tabular-nums text-ink-900">
            {formatXOF(c.spentXof, false)}
            <span className="ml-0.5 text-[10px] font-medium text-ink-400">F</span>
          </div>
        </div>
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.05em] text-ink-400">Livrés</div>
          <div className="text-[12.5px] font-medium tabular-nums text-emerald-700">
            {c.ordersDelivered}
            <span className="ml-1 text-[10px] font-medium text-ink-400">({conv}%)</span>
          </div>
        </div>
        <div className="min-w-[70px]">
          <div className="text-[10px] font-medium uppercase tracking-[0.05em] text-ink-400">Coût/livré</div>
          <div className="text-[12.5px] font-medium tabular-nums text-ink-900">
            {cpd !== null ? (
              <>
                {formatXOF(cpd, false)}
                <span className="ml-0.5 text-[10px] font-medium text-ink-400">F</span>
              </>
            ) : (
              <span className="text-ink-400">—</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
