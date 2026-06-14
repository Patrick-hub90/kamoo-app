"use client";

import { cn } from "@/lib/utils";

/**
 * Primitives de mise en page Paramètres — direction « console à deux colonnes »
 * (façon Stripe / Linear / Vercel) :
 *
 *   ┌──────────────────────────────────────────────────────────┐
 *   │  Titre section        │  contrôles / champs               │
 *   │  description courte    │  ………………………………                   │
 *   ├──────────────────────────────────────────────────────────┤  ← filet
 *   │  Titre section        │  ………………………………                   │
 *   └──────────────────────────────────────────────────────────┘
 *
 * On bannit la « card soup » (une carte par section) : UNE seule carte blanche
 * par page, sections séparées par des filets. Le rail de gauche porte le sens
 * (titre + pourquoi), la colonne de droite porte l'action. Empile sur < lg.
 */

/** Carte-conteneur unique d'une page Paramètres. */
export function SettingsCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-line bg-white shadow-kamoo-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Section à deux colonnes. Par défaut : rail descriptif à gauche (15rem),
 * contrôles à droite. `wide` = contenu pleine largeur (grilles, tableaux,
 * listes de lignes larges) : le titre passe au-dessus.
 */
export function SettingsSection({
  title,
  description,
  children,
  wide = false,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  /** Contenu large (grille/liste) → titre au-dessus, contenu pleine largeur. */
  wide?: boolean;
  className?: string;
}) {
  if (wide) {
    return (
      <section
        className={cn(
          "border-t border-line p-5 first:border-t-0 sm:p-6",
          className,
        )}
      >
        <SectionHeading title={title} description={description} />
        <div className="mt-4 min-w-0">{children}</div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "grid gap-x-10 gap-y-4 border-t border-line p-5 first:border-t-0 sm:p-6 lg:grid-cols-[15rem_minmax(0,1fr)]",
        className,
      )}
    >
      <div className="lg:pr-2">
        <SectionHeading title={title} description={description} />
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description?: React.ReactNode;
}) {
  return (
    <>
      <h2 className="text-[14.5px] font-bold tracking-tight text-ink-900">
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-500">
          {description}
        </p>
      )}
    </>
  );
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
        "mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-500",
        className,
      )}
    >
      {children}
    </label>
  );
}

/** Conteneur de liste de lignes (sessions, wallets, marchés…) — filets fins. */
export function SettingsList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("flex flex-col gap-2", className)}>{children}</div>;
}
