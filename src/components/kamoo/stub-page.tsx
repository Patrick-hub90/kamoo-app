type Props = {
  title: string;
  subtitle?: string;
  emoji?: string;
};

/**
 * Placeholder pour les pages pas encore implémentées.
 * À supprimer au fur et à mesure qu'on construit les vrais écrans.
 */
export function StubPage({ title, subtitle, emoji = "🚧" }: Props) {
  return (
    <div className="px-10 py-10">
      <h1 className="font-display text-3xl font-extrabold text-ink-900">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 text-sm text-ink-500">{subtitle}</p>
      )}

      <div className="mt-10 rounded-2xl border border-dashed border-line bg-white p-10 text-center">
        <div className="text-4xl">{emoji}</div>
        <p className="mt-3 text-sm text-ink-500">
          Cet écran arrive bientôt — on construit les modules un par un.
        </p>
      </div>
    </div>
  );
}
