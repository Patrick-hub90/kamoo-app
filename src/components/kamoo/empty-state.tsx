import Link from "next/link";
import type { ComponentType } from "react";

/**
 * État vide cohérent (identité Kamoo) — affiché quand une page n'a aucune
 * donnée. Icône ronde douce, message clair, CTA optionnel. À utiliser partout
 * pour que « tout à zéro » reste élégant plutôt que blanc/cassé.
 */
export function EmptyState({
  icon: Icon,
  title,
  body,
  actionLabel,
  actionHref,
  onAction,
  tone = "blue",
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  body?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  tone?: "blue" | "orange" | "neutral";
}) {
  const toneCls =
    tone === "orange"
      ? "bg-kamoo-orange-50 text-kamoo-orange-600"
      : tone === "neutral"
        ? "bg-paper-2 text-ink-400"
        : "bg-kamoo-blue-50 text-kamoo-blue-700";

  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center">
      <div className={`grid h-14 w-14 place-items-center rounded-2xl ${toneCls}`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-[15px] font-bold text-ink-900">{title}</h3>
      {body && <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-ink-500">{body}</p>}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-kamoo-blue-900 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-kamoo-blue-800"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <button
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-kamoo-blue-900 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-kamoo-blue-800"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
