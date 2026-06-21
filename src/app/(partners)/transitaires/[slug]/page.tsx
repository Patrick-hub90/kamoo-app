import { notFound } from "next/navigation";
import { getTransitaireBySlug } from "@/lib/data/mock-transitaires";
import { TransitaireProfileView } from "@/components/kamoo/transitaire-profile-view";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function TransitaireProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const t = getTransitaireBySlug(slug);
  if (!t) notFound();
  return <TransitaireProfileView transitaire={t} />;
}
