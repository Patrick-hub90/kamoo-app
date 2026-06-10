"use client";

import Link from "next/link";
import { use } from "react";
import { OrderDetailView } from "@/components/kamoo/order-detail-view";
import { getClient } from "@/lib/data/mock-clients";
import { useClosingState } from "@/lib/hooks/use-closing-state";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; clientId?: string }>;
};

/**
 * Détail commande closing — CLIENT component : la commande est résolue via
 * useClosingState (fixtures + commandes créées à la main + overrides
 * d'état), donc plus de 404 sur les commandes créées via la modale, et les
 * changements de statut faits depuis la liste sont visibles ici.
 */
export default function ClosingDetailPage({ params, searchParams }: PageProps) {
  const { id } = use(params);
  const { from, clientId } = use(searchParams);
  const closing = useClosingState();
  const a = closing.getById(id);

  const back =
    from === "client" && clientId
      ? { href: `/clients/${clientId}`, label: getClient(clientId)?.name ?? "Client" }
      : { href: "/closing", label: "Closing" };

  if (!a) {
    return (
      <div className="grid min-h-[60vh] place-items-center bg-paper px-6 text-center">
        <div>
          <p className="text-[15px] font-semibold text-ink-900">Commande introuvable</p>
          <p className="mt-1 text-[13px] text-ink-500">
            La commande {id} n&apos;existe pas (ou a été créée dans une autre session).
          </p>
          <Link
            href="/closing"
            className="mt-4 inline-flex rounded-lg bg-kamoo-blue-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-kamoo-blue-800"
          >
            Retour au closing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <OrderDetailView
      a={a}
      backHref={back.href}
      breadcrumbLabel={back.label}
      closing={closing}
    />
  );
}
