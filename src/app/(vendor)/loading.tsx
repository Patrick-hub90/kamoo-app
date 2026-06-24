import { ConsolePageSkeleton } from "@/components/kamoo/loading";

/**
 * Chargement des pages de la CONSOLE vendeur. La sidebar + le shell restent
 * montés (layout) ; on remplace seulement le contenu par un gabarit d'attente
 * calqué sur les pages (en-tête + actions + KPI + tableau).
 */
export default function Loading() {
  return <ConsolePageSkeleton />;
}
