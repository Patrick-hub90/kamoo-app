import { notFound } from "next/navigation";
import { getLivreur } from "@/lib/data/mock-livreurs";
import { LivreurProfileView } from "@/components/kamoo/livreur-profile-view";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function LivreurProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const l = getLivreur(slug);
  if (!l) notFound();
  return <LivreurProfileView livreur={l} />;
}
