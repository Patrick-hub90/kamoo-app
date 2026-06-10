import Link from "next/link";
import {
  BadgeCheck,
  Crown,
  MapPin,
  MessageCircle,
  Sparkles,
  Star,
} from "lucide-react";
import type { Closeuse } from "@/lib/types/closeuse";
import { isTopPerformer } from "@/lib/data/mock-closeuses";
import { cn } from "@/lib/utils";

const COUNTRY: Record<string, string> = {
  SN: "Sénégal",
  CI: "Côte d'Ivoire",
  CM: "Cameroun",
};

const fmt = (n: number) => n.toLocaleString("fr-FR");
function respLabel(min: number): string {
  return min <= 60 ? "< 1h" : `< ${Math.ceil(min / 60)}h`;
}

type Props = {
  closeuse: Closeuse;
  selected?: boolean;
  onToggle?: () => void;
};

export function CloseuseCard({ closeuse: c, selected = false, onToggle }: Props) {
  const top = isTopPerformer(c);
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-white p-4 transition",
        selected
          ? "border-kamoo-blue-400 ring-2 ring-kamoo-blue-100"
          : "border-line hover:border-ink-300 hover:shadow-[var(--shadow-kamoo-md)]",
      )}
    >
      {/* Sélection (si comparateur) + top performer */}
      {(onToggle || top) && (
        <div className="mb-2 flex items-start justify-between">
          {onToggle ? (
            <label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-medium text-ink-400">
              <input
                type="checkbox"
                checked={selected}
                onChange={onToggle}
                className="h-4 w-4 rounded border-line accent-kamoo-blue-700"
              />
              Comparer
            </label>
          ) : (
            <span />
          )}
          {top && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-600">
              <Crown className="h-3 w-3" /> Top performer
            </span>
          )}
        </div>
      )}

      {/* Identité */}
      <div className="flex gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={c.photoUrl}
          alt={c.name}
          className="h-16 w-16 shrink-0 rounded-xl object-cover"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-[14px] font-bold text-ink-900">{c.name}</h3>
            {c.status === "certified" ? (
              <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <Sparkles className="h-4 w-4 shrink-0 text-kamoo-blue-600" />
            )}
          </div>
          <div className="mt-0.5 inline-flex items-center gap-1 text-[11.5px] text-ink-500">
            <MapPin className="h-3 w-3 shrink-0" />
            {c.city}, {COUNTRY[c.countryCode] ?? c.countryCode}
          </div>
          <div className="mt-1 inline-flex items-center gap-1 text-[12px]">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <b className="text-ink-900">{c.rating}</b>
            <span className="text-ink-500">({c.reviewsCount} avis)</span>
          </div>
        </div>
      </div>

      {/* Bio */}
      <p className="mt-2.5 line-clamp-2 text-[12px] leading-relaxed text-ink-600">{c.bio}</p>

      {/* Stats */}
      <div className="mt-3 grid grid-cols-3 divide-x divide-line rounded-xl border border-line bg-paper-2/40 py-2.5 text-center">
        <Stat value={`${c.kpi.confirmationRate}%`} label="Conversion" />
        <Stat value={respLabel(c.kpi.avgResponseMin)} label="Réponse" />
        <Stat value={fmt(c.kpi.ordersHandled)} label="Cmdes traitées" />
      </div>

      {/* Langues */}
      <div className="mt-2.5 truncate text-[11.5px] text-ink-500">
        {c.languages.map((l) => l.name).join(" · ")}
      </div>

      {/* Prix */}
      <div className="mt-2 text-[13px] font-bold text-ink-900">
        {fmt(c.commissionXof)} <span className="text-[11px] font-medium text-ink-500">FCFA /commande</span>
      </div>

      {/* Action — le contact passe par le profil */}
      <Link
        href={`/marketplace/closeurs/${c.slug}`}
        className="mt-3 flex w-full items-center justify-center rounded-lg bg-kamoo-blue-900 px-3 py-2 text-[12.5px] font-semibold text-white transition hover:bg-kamoo-blue-800"
      >
        Voir le profil
      </Link>
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
