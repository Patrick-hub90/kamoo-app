import Link from "next/link";
import { ArrowRight, MessageCircle, Phone, ShieldCheck, Ship, Star, Truck } from "lucide-react";
import { MOCK_TRANSITAIRES } from "@/lib/data/mock-transitaires";
import { MOCK_CLOSEUSES } from "@/lib/data/mock-closeuses";
import { MOCK_LIVREURS } from "@/lib/data/mock-livreurs";

export const metadata = {
  title: "Kamoo Partenaires — Transitaires, closeuses & livreurs vérifiés",
  description:
    "L'annuaire des partenaires Kamoo : transitaires pour l'import Chine, closeuses pour la confirmation par appel, livreurs pour la livraison et l'encaissement.",
};

type Pole = {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  tagline: string;
};

const POLES: Pole[] = [
  {
    href: "/transitaires",
    icon: Ship,
    label: "Transitaires",
    count: MOCK_TRANSITAIRES.length,
    tagline:
      "Importez vos produits depuis la Chine. Tarifs, délais et entrepôts comparés en un coup d'œil.",
  },
  {
    href: "/closeurs",
    icon: Phone,
    label: "Closeuses",
    count: MOCK_CLOSEUSES.length,
    tagline:
      "Confirmez vos commandes par appel. Des closeuses qui transforment vos prospects en ventes.",
  },
  {
    href: "/livreurs",
    icon: Truck,
    label: "Livreurs",
    count: MOCK_LIVREURS.length,
    tagline:
      "Livrez et encaissez le cash à la livraison. Un réseau fiable, suivi et noté par les vendeurs.",
  },
];

export default function PartenairesLandingPage() {
  return (
    <div className="min-h-full bg-paper">
      {/* HERO */}
      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-[1320px] px-6 py-16">
          <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-400">
            Espace partenaires
          </div>
          <h1 className="mt-3 max-w-3xl text-[34px] font-medium leading-tight tracking-tight text-ink-900">
            Tous vos partenaires d'opérations, au même endroit.
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-600">
            Kamoo orchestre l'après-vente du paiement à la livraison. Trouvez ici
            les partenaires vérifiés qui vous accompagnent à chaque étape —
            importation, confirmation par appel, livraison et encaissement.
          </p>

          {/* Bandeau de confiance */}
          <div className="mt-7 flex flex-wrap gap-x-7 gap-y-2.5 text-[12.5px] font-medium text-ink-500">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-kamoo-blue-700" /> Profils vérifiés par Kamoo
            </span>
            <span className="inline-flex items-center gap-2">
              <Star className="h-4 w-4 text-kamoo-blue-700" /> Avis authentiques de vendeurs
            </span>
            <span className="inline-flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-kamoo-blue-700" /> Échanges via le chat Kamoo
            </span>
          </div>
        </div>
      </section>

      {/* PÔLES */}
      <section className="mx-auto max-w-[1320px] px-6 py-10">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {POLES.map((p) => {
            const Icon = p.icon;
            return (
              <Link
                key={p.href}
                href={p.href}
                className="group flex flex-col rounded-xl border border-line bg-white p-6 shadow-kamoo-sm transition hover:border-kamoo-blue-200 hover:shadow-[var(--shadow-kamoo-lg)]"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-kamoo-blue-50 text-kamoo-blue-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="rounded-full bg-paper-2 px-2.5 py-1 text-[11.5px] font-medium text-ink-500">
                    {p.count} référencé{p.count > 1 ? "s" : ""}
                  </span>
                </div>
                <h2 className="mt-5 text-[18px] font-medium text-ink-900">{p.label}</h2>
                <p className="mt-2 flex-1 text-[13px] leading-relaxed text-ink-500">
                  {p.tagline}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-kamoo-blue-700">
                  Explorer
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
