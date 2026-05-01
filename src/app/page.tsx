import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="w-full max-w-2xl text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-kamoo-orange-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-kamoo-orange-700">
          🚀 En cours de construction · MVP 15 oct 2026
        </div>

        {/* Logo wordmark */}
        <h1 className="font-display mt-8 text-6xl font-extrabold tracking-tight text-kamoo-blue-900 sm:text-7xl">
          Kamoo<span className="text-kamoo-orange-500">.</span>
        </h1>

        {/* Tagline */}
        <p className="font-display mt-4 text-2xl font-bold text-ink-900 sm:text-3xl">
          Vendez. <span className="text-kamoo-orange-500">On s&apos;occupe du reste.</span>
        </p>

        {/* Sous-titre */}
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink-500">
          La plateforme qui gère votre import depuis la Chine, votre closing
          téléphonique et votre livraison en Afrique de l&apos;Ouest.
          Concentrez-vous sur votre business, on fait le reste.
        </p>

        {/* Pays */}
        <div className="mt-8 flex items-center justify-center gap-3 text-sm text-ink-500">
          <span className="font-semibold text-ink-700">Disponible bientôt :</span>
          <span className="inline-flex items-center gap-1">🇸🇳 Sénégal</span>
          <span className="inline-flex items-center gap-1">🇨🇮 Côte d&apos;Ivoire</span>
          <span className="inline-flex items-center gap-1">🇨🇲 Cameroun</span>
        </div>

        {/* CTA */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-kamoo-orange-500 px-6 font-bold text-white transition hover:bg-kamoo-orange-600"
          >
            Voir le tableau de bord →
          </Link>
          <Link
            href="/expeditions"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-6 font-semibold text-ink-900 transition hover:bg-paper-2"
          >
            Mes expéditions
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-20 text-xs text-ink-400">
          Next.js {process.env.NODE_ENV === "production" ? "" : "dev mode"} ·
          Tailwind v4 · Supabase ready
        </div>
      </div>
    </div>
  );
}
