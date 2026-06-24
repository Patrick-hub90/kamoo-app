"use client";

import Link from "next/link";
import { Bike, X } from "lucide-react";
import { MOCK_LIVREURS } from "@/lib/data/mock-livreurs";
import { useCurrentMarket } from "@/lib/hooks/use-current-market";
import { usePartners } from "@/lib/hooks/use-partners";
import type { AssignedDelivery } from "@/lib/types/closing";

/**
 * Modale « Assigner un livreur » — partagée entre la liste Closing et la
 * page détail commande. Ne propose que VOS livreurs partenaires (actifs)
 * du marché courant ; le choix crée l'AssignedDelivery (en_attente, +3 h).
 */
export function AssignLivreurModal({
  onClose,
  onAssign,
}: {
  onClose: () => void;
  onAssign: (d: AssignedDelivery) => void;
}) {
  const { currentMarket } = useCurrentMarket();
  const { partners } = usePartners();
  /* Seulement MES livreurs (partenariat actif) — pas toute la marketplace. */
  const activeSlugs = partners.livreurs
    .filter((p) => p.status === "active")
    .map((p) => p.slug);
  const livreurs = MOCK_LIVREURS.filter(
    (l) => l.countryCode === currentMarket.country.code && activeSlugs.includes(l.slug),
  );

  function pick(slug: string) {
    const l = livreurs.find((x) => x.slug === slug);
    if (!l) return;
    const eta = new Date();
    eta.setHours(eta.getHours() + 3, 0, 0, 0);
    onAssign({
      id: `lv_${l.slug}`,
      name: l.name,
      phone: "", // jamais affiché : contact via chat in-app uniquement
      avatarBg: l.avatarBg,
      rating: l.rating,
      progress: "en_attente",
      scheduledAt: eta.toISOString(),
      pickedUpAt: new Date().toISOString(),
      deliveriesCount: l.kpi.deliveriesHandled,
    });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-kamoo-blue-900/30 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 className="text-[15px] font-bold text-ink-900">Assigner un livreur</h2>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-lg text-ink-400 transition hover:bg-paper-2 hover:text-ink-900" aria-label="Fermer">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-3">
          {livreurs.length === 0 && (
            <div className="px-4 py-8 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-kamoo-blue-50 text-kamoo-blue-700">
                <Bike className="h-5 w-5" />
              </div>
              <p className="mt-3 text-[13.5px] font-semibold text-ink-900">
                Aucun livreur partenaire
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-ink-500">
                Connectez-vous d&apos;abord à un livreur dans la marketplace —
                vous pourrez ensuite lui assigner vos livraisons.
              </p>
              <Link
                href="/marketplace/livreurs"
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-kamoo-blue-900 px-4 py-2 text-[12.5px] font-bold text-white transition hover:bg-kamoo-blue-800"
              >
                Trouver un livreur
              </Link>
            </div>
          )}
          {livreurs.map((l) => (
            <button
              key={l.slug}
              onClick={() => pick(l.slug)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-paper-2"
            >
              {l.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={l.photoUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[12px] font-bold text-white" style={{ background: l.avatarBg }}>
                  {l.initials}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-ink-900">{l.name}</span>
                <span className="block text-[11px] text-ink-500">
                  ★ {l.rating} · {l.kpi.deliverySuccessRate}% réussite · {l.zones.length} zones
                </span>
              </span>
              <span className="shrink-0 text-[11.5px] font-semibold text-kamoo-blue-700">Choisir</span>
            </button>
          ))}
        </div>
        <p className="border-t border-line px-5 py-3 text-[11px] text-ink-400">
          Le livreur reçoit la course sur son app Kamoo et vous suivez la livraison en temps réel.
        </p>
      </div>
    </div>
  );
}
