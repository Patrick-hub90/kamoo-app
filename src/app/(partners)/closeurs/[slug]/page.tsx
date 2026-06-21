import { notFound } from "next/navigation";
import { getCloseuse } from "@/lib/data/mock-closeuses";
import { CloseuseProfileView } from "@/components/kamoo/closeuse-profile-view";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CloseuseProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const c = getCloseuse(slug);
  if (!c) notFound();
  return <CloseuseProfileView closeuse={c} />;
}
