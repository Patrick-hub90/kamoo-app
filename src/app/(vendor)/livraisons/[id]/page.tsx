"use client";

import Link from "next/link";
import { use } from "react";
import { DeliveryDetailView } from "@/components/kamoo/delivery-detail-view";
import { getClient } from "@/lib/data/mock-clients";
import { useClosingState } from "@/lib/hooks/use-closing-state";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; clientId?: string }>;
};

/**
 * Détail livraison — CLIENT component branché sur la machine d'états
 * closing : les livraisons assignées/marquées depuis Closing sont visibles
 * ici, et les actions (Marquer livrée, Relancer) modifient le même état.
 */
export default function LivraisonDetailPage({ params, searchParams }: PageProps) {
  const { id } = use(params);
  const { from, clientId } = use(searchParams);
  const closing = useClosingState();
  const a = closing.getById(id);

  const back =
    from === "client" && clientId
      ? { href: `/clients/${clientId}`, label: getClient(clientId)?.name ?? "Client" }
      : { href: "/livraisons", label: "Livraison" };

  if (!a || !a.delivery) {
    return (
      <div className="grid min-h-[60vh] place-items-center bg-paper px-6 text-center">
        <div>
          <p className="text-[15px] font-semibold text-ink-900">Livraison introuvable</p>
          <p className="mt-1 text-[13px] text-ink-500">
            Aucune livraison ne correspond à {id}.
          </p>
          <Link
            href="/livraisons"
            className="mt-4 inline-flex rounded-lg bg-kamoo-blue-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-kamoo-blue-800"
          >
            Retour aux livraisons
          </Link>
        </div>
      </div>
    );
  }

  return <DeliveryDetailView a={a} backHref={back.href} closing={closing} />;
}
