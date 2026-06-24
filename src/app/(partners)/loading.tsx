import { KamooBrandLoader } from "@/components/kamoo/loading";

/**
 * Chargement de l'espace public Partenaires (partners.kamoo.me). La coque
 * (barre de marque + onglets) reste montée ; on centre un loader de marque
 * dans la zone de contenu plutôt qu'un écran blanc.
 */
export default function Loading() {
  return <KamooBrandLoader fullScreen={false} />;
}
