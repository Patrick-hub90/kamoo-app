import { notFound } from "next/navigation";
import { getMockExpeditionDetail } from "@/lib/data/mock-expedition-detail";
import { ExpeditionDetailView } from "@/components/console/expeditions/expedition-detail-view";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ExpeditionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const exp = getMockExpeditionDetail(id);
  if (!exp) notFound();
  return <ExpeditionDetailView exp={exp} />;
}
