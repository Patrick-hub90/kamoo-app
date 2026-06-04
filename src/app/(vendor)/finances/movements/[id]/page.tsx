import { notFound } from "next/navigation";
import { MovementDetailView } from "@/components/finance/movement-detail-view";
import { getMovementById } from "@/lib/data/mock-finances";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
};

function getBackLink(from: string | undefined): {
  href: string;
  label: string;
} {
  if (from === "journal") {
    return { href: "/finances/journal", label: "Journal" };
  }
  return { href: "/finances", label: "Aperçu" };
}

export default async function MovementDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { from } = await searchParams;

  const movement = getMovementById(id);
  if (!movement) notFound();

  const back = getBackLink(from);

  return (
    <MovementDetailView
      movement={movement}
      backHref={back.href}
      backLabel={back.label}
    />
  );
}
