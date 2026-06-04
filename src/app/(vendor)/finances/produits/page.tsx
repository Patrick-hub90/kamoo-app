import { redirect } from "next/navigation";

/**
 * /finances/produits a été fusionné dans /boutique.
 * On redirige les anciens liens (sidebar, bookmarks) vers la Boutique
 * qui contient désormais toutes les colonnes de rentabilité produit.
 */
export default function FinancesProduitsRedirectPage() {
  redirect("/boutique");
}
