import Link from "next/link";
import { X } from "lucide-react";

/**
 * Layout standalone pour le wizard de création de marché.
 *
 * Pas de sidebar ni de topbar de l'app — focus mode total. Juste un header
 * minimal avec logo et bouton fermer (revient à l'app). Approche Shopify :
 * la création d'un marché est un workflow guidé qui mérite plein écran.
 */
export default function MarchesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-8 py-4">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="font-display text-2xl font-extrabold tracking-tight text-kamoo-blue-900">
              Kamoo<span className="text-kamoo-orange-500">.</span>
            </span>
          </Link>

          <Link
            href="/"
            title="Annuler et revenir à l'app"
            className="grid h-9 w-9 place-items-center rounded-lg text-ink-500 hover:bg-paper-2 hover:text-ink-900"
          >
            <X className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center">
        <div className="mx-auto w-full max-w-4xl px-8 py-10">{children}</div>
      </main>
    </div>
  );
}
