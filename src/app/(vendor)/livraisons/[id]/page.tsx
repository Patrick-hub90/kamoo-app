import { notFound } from "next/navigation";
import { OrderDetailView } from "@/components/kamoo/order-detail-view";
import { getClient } from "@/lib/data/mock-clients";
import { getDeliveryItem } from "@/lib/data/mock-closing";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; clientId?: string }>;
};

function getBackLink(
  from: string | undefined,
  clientId: string | undefined,
): { href: string; label: string } {
  if (from === "client" && clientId) {
    const client = getClient(clientId);
    return {
      href: `/clients/${clientId}`,
      label: client?.name ?? "Client",
    };
  }
  return { href: "/livraisons", label: "Livraison" };
}

export default async function LivraisonDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { from, clientId } = await searchParams;
  const a = getDeliveryItem(id);
  if (!a) notFound();

  const back = getBackLink(from, clientId);

  return (
    <OrderDetailView
      a={a}
      backHref={back.href}
      breadcrumbLabel={back.label}
      fullWidth
    />
  );
}
