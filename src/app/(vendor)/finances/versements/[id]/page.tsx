import { notFound } from "next/navigation";
import { VersementDetailView } from "@/components/finance/versement-detail-view";
import { getVersementById } from "@/lib/data/mock-versements";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
};

/**
 * Source de retour : `?from=apercu` ou `?from=journal`. Permet de revenir
 * à la page d'origine et de garder les filtres sessionStorage intacts.
 */
function getBackLink(from: string | undefined): {
  href: string;
  label: string;
} {
  if (from === "journal") {
    return { href: "/finances/journal", label: "Journal" };
  }
  return { href: "/finances", label: "Aperçu" };
}

export default async function VersementDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { from } = await searchParams;

  // On valide l'existence côté serveur avec le mock statique. Le composant
  // client utilisera ensuite useVersementsState() pour avoir l'état live
  // (incluant les actions Valider/Pas reçu déjà appliquées dans la session).
  const initial = getVersementById(id);
  if (!initial) notFound();

  const back = getBackLink(from);

  return (
    <VersementDetailView
      initialVersement={initial}
      backHref={back.href}
      backLabel={back.label}
    />
  );
}
