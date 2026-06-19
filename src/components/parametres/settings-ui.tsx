"use client";

import { cn } from "@/lib/utils";

/**
 * Primitives Paramètres — direction « réglages façon messagerie » :
 *
 *   LIBELLÉ DU GROUPE (muet)
 *   ┌────────────────────────────────────────────┐
 *   │  ◻  Label                         valeur  › │  ← ligne
 *   ├────────────────────────────────────────────┤  ← filet
 *   │  ◻  Label                         valeur  › │
 *   └────────────────────────────────────────────┘
 *   petite légende optionnelle sous le panneau
 *
 * On bannit la « card soup » ET la disposition deux-colonnes (rail + contrôles).
 * Chaque groupe = un libellé muet + UN panneau blanc de lignes séparées par des
 * filets fins. Les surfaces restent calmes ; l'accent (navy) sert l'action et la
 * sélection. Empile naturellement sur mobile.
 */

/** Pile transparente de groupes (les panneaux flottent sur le fond paper). */
export function SettingsCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("flex flex-col gap-6", className)}>{children}</div>;
}

/**
 * Groupe de réglages : libellé muet (+ légende) au-dessus d'un panneau blanc.
 * Les enfants directs du panneau sont séparés par des filets (lignes / corps).
 */
export function SettingsSection({
  title,
  description,
  caption,
  children,
  className,
}: {
  title?: string;
  description?: React.ReactNode;
  /** Petite légende affichée SOUS le panneau (façon Telegram). */
  caption?: React.ReactNode;
  children?: React.ReactNode;
  /** Conservé pour compat — la mise en page est désormais toujours pleine largeur. */
  wide?: boolean;
  className?: string;
}) {
  return (
    <section className={className}>
      {(title || description) && (
        <div className="mb-2 px-1">
          {title && (
            <h2 className="text-[11px] font-medium uppercase tracking-[0.06em] text-ink-400">
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-1 text-[12px] leading-relaxed text-ink-500">{description}</p>
          )}
        </div>
      )}
      <SettingsPanel>{children}</SettingsPanel>
      {caption && (
        <p className="mt-2 px-1 text-[11.5px] leading-relaxed text-ink-400">{caption}</p>
      )}
    </section>
  );
}

/** Panneau blanc à coins arrondis ; enfants directs séparés par des filets. */
export function SettingsPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "divide-y divide-line overflow-hidden rounded-xl border border-line bg-white",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Ligne de réglage : icône (optionnelle) + label muet / valeur + action à droite.
 * Utiliser `children` pour un contenu personnalisé (input en édition, toggle…).
 */
export function SettingsRow({
  icon,
  label,
  value,
  action,
  children,
  className,
  align = "center",
}: {
  icon?: React.ReactNode;
  label?: React.ReactNode;
  value?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  align?: "center" | "start";
}) {
  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-3 sm:px-5",
        align === "center" ? "items-center" : "items-start",
        className,
      )}
    >
      {icon && (
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-paper-2 text-ink-500">
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        {label && <div className="text-[11px] text-ink-400">{label}</div>}
        {value !== undefined && (
          <div className="mt-0.5 text-[13.5px] text-ink-900">{value}</div>
        )}
        {children}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** Contenu libre (formulaire, grille) dans un panneau, avec marge interne. */
export function SettingsBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("p-4 sm:p-5", className)}>{children}</div>;
}

/** Libellé de champ standardisé (uppercase, sobre). */
export function FieldLabel({
  children,
  htmlFor,
  className,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-ink-400",
        className,
      )}
    >
      {children}
    </label>
  );
}

/** Conteneur de liste de lignes (compat) — filets fins. */
export function SettingsList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("flex flex-col gap-2", className)}>{children}</div>;
}
