import { redirect } from "next/navigation";

/** /marketplace n'a pas de contenu propre : on atterrit sur les transitaires. */
export default function MarketplaceOverviewPage() {
  redirect("/marketplace/transitaires");
}
