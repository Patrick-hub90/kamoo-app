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
  TrendingUp,
  Wallet,
} from "lucide-react";
import { CopyButton } from "@/components/kamoo/copy-button";
import { ProductActiveToggle } from "@/components/kamoo/product-active-toggle";
import {
  ProductImageEditProvider,
  ProductImageManager,
  ProductSaveButton,
} from "@/components/kamoo/product-image-manager";
import { campaignsForProduct } from "@/lib/data/mock-ad-campaigns";
import {
  getApprovisionnements,
  getProduit,
} from "@/lib/data/mock-produits";
import {
  conversionRate,
  costPerDelivered,
  PLATFORM_LABELS,
  PLATFORM_TONE,
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

const APPRO_TONE: Record<Approvisionnement["status"], string> = {
  en_route: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  arrive: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  en_attente_devis: "bg-amber-50 text-amber-700 ring-amber-300",
};

export default async function ProduitDetailPage({ params }: PageProps) {
  const { id } = await params;
  const p = getProduit(id);
  if (!p) notFound();

  const appros = getApprovisionnements(p.id);
  const campaigns = campaignsForProduct(p.id);
  const totalAdSpend = campaigns.reduce((s, c) => s + c.spentXof, 0);
  const totalAdDelivered = campaigns.reduce(
    (s, c) => s + c.ordersDelivered,
    0,
  );
  const stockLevel = getStockLevel(p);

  // Coût d'acquisition : on privilégie le moyen pondéré dérivé des
  // expéditions arrivées (donnée vraie). Sinon on retombe sur le coût
  // saisi manuellement par le vendeur. Sinon → marge non calculable.
  const avgAcquisition = averageAcquisitionCost(appros);
  const effectiveCost: number | null =
    avgAcquisition ?? p.costPriceXof ?? null;
  const costSource: "expeditions" | "manual" | "none" =
    avgAcquisition !== null
      ? "expeditions"
      : p.costPriceXof !== undefined
        ? "manual"
        : "none";

  const margin =
    effectiveCost !== null ? p.priceXof - effectiveCost : unitMargin(p);
  const margePct =
    effectiveCost !== null && p.priceXof > 0
      ? Math.round(((p.priceXof - effectiveCost) / p.priceXof) * 100)
      : marginRate(p);

  return (
    <ProductImageEditProvider productId={p.id} initialPhotos={p.photos}>
    <div className="flex flex-col">
      {/* HEADER */}
      <div className="flex items-center gap-4 border-b border-line bg-white px-10 py-5">
        <Link
          href="/boutique"
          className="grid h-9 w-9 place-items-center rounded-lg bg-paper-2 text-ink-500 hover:text-ink-700"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
            Boutique · Produit
          </div>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="font-display text-xl font-extrabold text-ink-900">
              {p.name}
            </h1>
            <span className="font-mono-kamoo text-[12px] text-ink-500">
              {p.sku}
            </span>
            <CopyButton value={p.sku} />
          </div>
        </div>

        <ProductSaveButton />
        <ProductActiveToggle
          productId={p.id}
          initialActive={p.isActive}
          productName={p.name}
        />
        <Link
          href={`/boutique/${p.id}/edit`}
          className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-[13px] font-semibold text-ink-900 hover:border-kamoo-blue-600 hover:bg-paper-2"
        >
          <Pencil className="h-3.5 w-3.5" />
          Modifier
        </Link>
      </div>

      {/* BODY 2 COLONNES */}
      <div className="grid grid-cols-[1.5fr_1fr] gap-5 px-10 py-6">
        {/* ═══ COLONNE GAUCHE ═══ */}
        <div className="flex flex-col gap-4">
          {/* HERO PRODUIT */}
          <div className="rounded-2xl border border-line bg-white p-6">
            <div className="flex items-start gap-5">
              <ProductImageManager emoji={p.emoji} bg={p.bg} name={p.name} />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
                  Prix de vente
                </div>
                <div className="mt-1 font-display text-3xl font-extrabold text-ink-900">
                  {formatXOF(p.priceXof)}
                </div>
                {effectiveCost !== null && margin !== null && margePct !== null ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[12.5px]">
                    <span className="text-ink-500">
                      {costSource === "expeditions"
                        ? "Coût acquisition moyen ·"
                        : "Coût d'achat ·"}{" "}
                      <span className="font-bold text-ink-700">
                        {formatXOF(effectiveCost)}
                      </span>
                    </span>
                    <span className="text-ink-300">·</span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-bold",
                        margePct >= 60
                          ? "bg-emerald-50 text-emerald-700"
                          : margePct >= 40
                            ? "bg-amber-50 text-amber-700"
                            : "bg-red-50 text-red-700",
                      )}
                    >
                      Marge · {formatXOF(margin, false)} F ({margePct}%)
                    </span>
                  </div>
                ) : (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-dashed border-amber-300 bg-amber-50/60 p-2.5 text-[12px] text-amber-900">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />
                    <div className="leading-relaxed">
                      <span className="font-bold">Marge non calculée.</span>{" "}
                      Renseignez votre prix d&apos;achat moyen, ou créez une
                      expédition avec coût pour le calcul automatique.{" "}
                      <button className="font-bold text-amber-900 underline hover:text-amber-700">
                        Ajouter le prix d&apos;achat
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <p className="mt-5 rounded-xl bg-paper-2/40 p-4 text-[13.5px] leading-relaxed text-ink-700">
              {p.description}
            </p>
          </div>

          {/* PERFORMANCE */}
          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-ink-500">
              Performance
            </div>
            <div className="grid grid-cols-2 gap-3">
              <KpiCell
                icon={<TrendingUp className="h-3.5 w-3.5" />}
                label="Vendu total"
                value={p.soldTotal.toLocaleString("fr-FR")}
                tone="green"
                highlight={p.soldTotal > 0}
              />
              <KpiCell
                icon={<Wallet className="h-3.5 w-3.5" />}
                label="CA total"
                value={`${formatXOF(p.revenueTotalXof, false)} F`}
                tone="green"
              />
            </div>
          </div>

          {/* APPROVISIONNEMENTS */}
          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
                Approvisionnements · expéditions liées
              </h2>
              <Link
                href="/expeditions/nouvelle"
                className="inline-flex items-center gap-1 text-[12px] font-bold text-kamoo-blue-700 hover:underline"
              >
                <Plus className="h-3 w-3" />
                Nouvelle expédition
              </Link>
            </div>

            {appros.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line bg-paper-2/30 px-3 py-6 text-center">
                <div className="text-2xl">📦</div>
                <p className="mt-2 text-[12px] font-semibold text-ink-700">
                  Aucun approvisionnement enregistré
                </p>
                <p className="mt-1 text-[11px] text-ink-500">
                  Créez une expédition pour ajouter du stock
                </p>
              </div>
            ) : (
              <>
                {/* Tableau des expéditions avec coûts */}
                <div className="overflow-hidden rounded-xl border border-line">
                  <div className="grid grid-cols-[1.4fr_56px_1fr_1fr_1fr] items-center gap-2 border-b border-line bg-paper-2/60 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                    <span>Expédition</span>
                    <span className="text-right">Qté</span>
                    <span className="text-right">Achat / u</span>
                    <span className="text-right">Expéd. / u</span>
                    <span className="text-right">Acquis. / u</span>
                  </div>
                  {appros.map((a, i) => {
                    const Icon = a.status === "en_route" ? Ship : Plane;
                    const acq = acquisitionCost(a);
                    return (
                      <Link
                        key={a.expeditionId}
                        href={`/expeditions/${a.expeditionId}?from=boutique&productId=${p.id}`}
                        className={cn(
                          "group grid grid-cols-[1.4fr_56px_1fr_1fr_1fr] items-center gap-2 px-3 py-2.5 transition hover:bg-kamoo-blue-50/40",
                          i < appros.length - 1 && "border-b border-line",
                        )}
                      >
                        {/* Col 1 — code + statut + ETA */}
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-cyan-50 text-cyan-700">
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-mono-kamoo truncate text-[12px] font-bold text-ink-900 group-hover:text-kamoo-blue-700">
                              {a.expeditionCode}
                            </div>
                            <div className="mt-0.5 flex items-center gap-1.5 text-[10.5px]">
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-full px-1.5 py-0.5 font-bold ring-1 ring-inset",
                                  APPRO_TONE[a.status],
                                )}
                              >
                                {APPRO_LABELS[a.status]}
                              </span>
                              <span className="truncate text-ink-500">
                                {a.status === "arrive"
                                  ? formatDate(a.arrivalDate)
                                  : a.status === "en_route"
                                    ? `ETA ${formatDate(a.arrivalDate)}`
                                    : "—"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Col 2 — qté */}
                        <div className="text-right text-[12.5px] font-bold text-ink-900">
                          {a.quantity > 0 ? `×${a.quantity}` : "—"}
                        </div>

                        {/* Col 3 — prix d'achat */}
                        <div className="text-right text-[12px] tabular-nums">
                          {a.purchasePriceXof !== undefined ? (
                            <span className="font-semibold text-ink-700">
                              {formatXOF(a.purchasePriceXof, false)}
                            </span>
                          ) : (
                            <span className="text-ink-400">—</span>
                          )}
                        </div>

                        {/* Col 4 — coût expédition */}
                        <div className="text-right text-[12px] tabular-nums">
                          {a.shippingCostXof !== undefined ? (
                            <span className="font-semibold text-ink-700">
                              {formatXOF(a.shippingCostXof, false)}
                            </span>
                          ) : (
                            <span
                              className="text-amber-700"
                              title="Devis Kamoo en attente"
                            >
                              en attente
                            </span>
                          )}
                        </div>

                        {/* Col 5 — coût d'acquisition unitaire */}
                        <div className="text-right text-[12.5px] tabular-nums">
                          {acq !== null ? (
                            <span className="font-extrabold text-ink-900">
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
              </>
            )}
          </div>

          {/* CAMPAGNES PUBS */}
          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
                Campagnes publicitaires · {campaigns.length}
              </h2>
              <Link
                href="/finances/pubs"
                className="inline-flex items-center gap-1 text-[12px] font-bold text-kamoo-blue-700 hover:underline"
              >
                <Plus className="h-3 w-3" />
                Gérer les campagnes
              </Link>
            </div>

            {campaigns.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line bg-paper-2/30 px-3 py-6 text-center">
                <Megaphone className="mx-auto h-6 w-6 text-ink-400" />
                <p className="mt-2 text-[12px] font-semibold text-ink-700">
                  Aucune campagne pub liée à ce produit
                </p>
                <p className="mt-1 text-[11px] text-ink-500">
                  Lancez une campagne Facebook ou TikTok pour booster les ventes
                </p>
              </div>
            ) : (
              <>
                {/* Mini-stats agrégées */}
                <div className="mb-3 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-purple-50 p-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
                      Dépense totale pub
                    </div>
                    <div className="font-display mt-0.5 text-base font-extrabold text-ink-900">
                      {formatXOF(totalAdSpend, false)}
                      <span className="ml-1 text-[10px] font-bold text-ink-500">
                        F
                      </span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      Coût moyen / livré
                    </div>
                    <div className="font-display mt-0.5 text-base font-extrabold text-ink-900">
                      {totalAdDelivered > 0
                        ? formatXOF(
                            Math.round(totalAdSpend / totalAdDelivered),
                            false,
                          )
                        : "—"}
                      {totalAdDelivered > 0 && (
                        <span className="ml-1 text-[10px] font-bold text-ink-500">
                          F
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Liste des campagnes */}
                <div className="flex flex-col gap-2">
                  {campaigns.map((c) => (
                    <CampaignRow key={c.id} campaign={c} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ═══ COLONNE DROITE ═══ */}
        <div className="flex flex-col gap-4">
          {/* STOCK */}
          <div className="rounded-2xl border border-line bg-white p-6">
            <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
              Stock disponible
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className={cn(
                  "font-display text-4xl font-extrabold leading-none",
                  stockLevel === "rupture"
                    ? "text-red-700"
                    : stockLevel === "bas"
                      ? "text-amber-700"
                      : "text-ink-900",
                )}
              >
                {p.stock}
              </span>
              <span className="text-sm font-bold text-ink-500">unités</span>
            </div>

            <div className="mt-3">
              {stockLevel === "rupture" ? (
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1 text-[11.5px] font-bold text-red-700 ring-1 ring-inset ring-red-200">
                  <PackageX className="h-3 w-3" />
                  Rupture de stock
                </div>
              ) : stockLevel === "bas" ? (
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-[11.5px] font-bold text-amber-800 ring-1 ring-inset ring-amber-300">
                  <AlertTriangle className="h-3 w-3" />
                  Stock bas (≤{p.lowStockThreshold})
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11.5px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                  <CheckCircle2 className="h-3 w-3" />
                  Stock OK
                </div>
              )}
            </div>

          </div>

          {/* INFOS */}
          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-ink-500">
              <Package className="h-3 w-3" />
              Infos produit
            </div>
            <div className="flex flex-col gap-2 text-[13px]">
              <div className="flex items-center justify-between">
                <span className="text-ink-500">SKU</span>
                <span className="font-mono-kamoo font-bold text-ink-900">
                  {p.sku}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-500">Ajouté le</span>
                <span className="font-bold text-ink-900">
                  {formatDate(p.createdAt)}
                </span>
              </div>
              {p.lastSoldAt && (
                <div className="flex items-center justify-between">
                  <span className="text-ink-500">Dernière vente</span>
                  <span className="font-bold text-ink-900">
                    {formatDate(p.lastSoldAt)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-ink-500">Seuil stock bas</span>
                <span className="font-bold text-ink-900">
                  {p.lowStockThreshold} unités
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </ProductImageEditProvider>
  );
}

function CampaignRow({ campaign: c }: { campaign: AdCampaign }) {
  const platformTone = PLATFORM_TONE[c.platform];
  const cpd = costPerDelivered(c);
  const conv = conversionRate(c);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-paper-2/30 p-3 transition hover:border-kamoo-blue-600 hover:bg-white">
      {/* Avatar plateforme */}
      <div
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
          platformTone.bg,
          platformTone.fg,
        )}
      >
        <Megaphone className="h-4 w-4" />
      </div>

      {/* Infos campagne */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[12.5px] font-bold text-ink-900">
            {c.name}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[10.5px]">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-1.5 py-0.5 font-bold ring-1 ring-inset",
              platformTone.bg,
              platformTone.fg,
              platformTone.ring,
            )}
          >
            {PLATFORM_LABELS[c.platform]}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-bold",
              c.status === "active"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-paper-2 text-ink-500",
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
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
              <AlertTriangle className="h-2.5 w-2.5" />
              À payer
            </span>
          )}
        </div>
      </div>

      {/* Stats compactes à droite */}
      <div className="flex shrink-0 items-center gap-4 text-right">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
            Dépensé
          </div>
          <div className="font-display text-[13px] font-extrabold text-ink-900 tabular-nums">
            {formatXOF(c.spentXof, false)}
            <span className="ml-0.5 text-[10px] font-bold text-ink-500">F</span>
          </div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
            Livrés
          </div>
          <div className="text-[13px] font-extrabold text-emerald-700 tabular-nums">
            {c.ordersDelivered}
            <span className="ml-1 text-[10px] font-semibold text-ink-500">
              ({conv}%)
            </span>
          </div>
        </div>
        <div className="min-w-[70px]">
          <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
            Coût/livré
          </div>
          <div className="text-[13px] font-extrabold text-ink-900 tabular-nums">
            {cpd !== null ? (
              <>
                {formatXOF(cpd, false)}
                <span className="ml-0.5 text-[10px] font-bold text-ink-500">
                  F
                </span>
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

function KpiCell({
  icon,
  label,
  value,
  sublabel,
  tone,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel?: string;
  tone: "green" | "blue" | "orange";
  highlight?: boolean;
}) {
  const toneClass = {
    green: { bg: "bg-emerald-50", icon: "text-emerald-700" },
    blue: { bg: "bg-kamoo-blue-50", icon: "text-kamoo-blue-700" },
    orange: { bg: "bg-kamoo-orange-50", icon: "text-kamoo-orange-600" },
  }[tone];

  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-4",
        highlight
          ? "border-emerald-200 ring-1 ring-emerald-100"
          : "border-line",
      )}
    >
      <div
        className={cn(
          "mb-2 grid h-7 w-7 place-items-center rounded-lg",
          toneClass.bg,
          toneClass.icon,
        )}
      >
        {icon}
      </div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
        {label}
      </div>
      <div
        className={cn(
          "font-display mt-1 text-xl font-extrabold leading-none",
          highlight ? "text-emerald-700" : "text-ink-900",
        )}
      >
        {value}
      </div>
      {sublabel && (
        <div className="mt-1 text-[10.5px] font-semibold text-ink-500">
          {sublabel}
        </div>
      )}
    </div>
  );
}
