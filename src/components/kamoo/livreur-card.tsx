import Link from "next/link";
import {
  BadgeCheck,
  Bike,
  Building2,
  Clock,
  MapPin,
  MessageCircle,
  Sparkles,
  Star,
} from "lucide-react";
import type { Livreur } from "@/lib/types/livreur";
import { cn } from "@/lib/utils";

const COUNTRY: Record<string, string> = { SN: "Sénégal", CI: "Côte d'Ivoire", CM: "Cameroun" };
const fmt = (n: number) => n.toLocaleString("fr-FR");

export function LivreurCard({ livreur: l }: { livreur: Livreur }) {
  const minPrice = Math.min(...l.zones.map((z) => z.priceXof));
  const isAgence = l.type === "agence";
  return (
    <div className="flex flex-col rounded-2xl border border-line bg-white p-4 transition hover:border-ink-300 hover:shadow-[var(--shadow-kamoo-md)]">
      {/* Identité */}
      <div className="flex gap-3">
        {l.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={l.photoUrl} alt={l.name} className="h-16 w-16 shrink-0 rounded-xl object-cover" />
        ) : (
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl text-[16px] font-extrabold text-white" style={{ background: l.avatarBg }}>
            {l.initials}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-[14px] font-bold text-ink-900">{l.name}</h3>
            {l.status === "certified" ? (
              <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <Sparkles className="h-4 w-4 shrink-0 text-kamoo-blue-600" />
            )}
          </div>
          <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-paper-2 px-2 py-0.5 text-[10.5px] font-semibold text-ink-600">
            {isAgence ? <Building2 className="h-3 w-3" /> : <Bike className="h-3 w-3" />}
            {isAgence ? "Agence" : "Indépendant"}
          </span>
          <div className="mt-1 inline-flex items-center gap-1 text-[11.5px] text-ink-500">
            <MapPin className="h-3 w-3 shrink-0" />
            {l.city}, {COUNTRY[l.countryCode] ?? l.countryCode}
          </div>
        </div>
        <div className="ml-auto inline-flex shrink-0 items-center gap-1 text-[12px]">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <b className="text-ink-900">{l.rating}</b>
          <span className="text-ink-500">({l.reviewsCount})</span>
        </div>
      </div>

      {/* Bio */}
      <p className="mt-2.5 line-clamp-2 text-[12px] leading-relaxed text-ink-600">{l.bio}</p>

      {/* Stats */}
      <div className="mt-3 grid grid-cols-3 divide-x divide-line rounded-xl border border-line bg-paper-2/40 py-2.5 text-center">
        <Stat value={`${l.kpi.deliverySuccessRate}%`} label="Réussite" />
        <Stat value={`${l.kpi.avgDeliveryMin} min`} label="Délai moyen" />
        <Stat value={fmt(l.kpi.deliveriesHandled)} label="Livraisons" />
      </div>

      {/* Zones + tarif */}
      <div className="mt-2.5 flex items-center justify-between text-[11.5px]">
        <span className="inline-flex items-center gap-1 text-ink-500">
          <MapPin className="h-3 w-3" /> {l.zones.length} zones desservies
        </span>
        <span className="font-semibold text-ink-900">dès {fmt(minPrice)} <span className="text-[10px] font-medium text-ink-500">F CFA</span></span>
      </div>

      {/* Actions */}
      <div className="mt-3 flex gap-2">
        <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-2 text-[12.5px] font-semibold text-ink-700 transition hover:bg-paper-2">
          <MessageCircle className="h-3.5 w-3.5" />
          Contacter
        </button>
        <Link
          href={`/marketplace/livreurs/${l.slug}`}
          className="flex flex-1 items-center justify-center rounded-lg bg-kamoo-blue-900 px-3 py-2 text-[12.5px] font-semibold text-white transition hover:bg-kamoo-blue-800"
        >
          Voir le profil
        </Link>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-1">
      <div className="text-[13px] font-bold tabular-nums text-ink-900">{value}</div>
      <div className="text-[10px] text-ink-400">{label}</div>
    </div>
  );
}
