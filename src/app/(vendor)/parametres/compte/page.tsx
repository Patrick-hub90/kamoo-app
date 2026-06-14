"use client";

import { useState } from "react";
import { Check, Mail, Pencil, Phone, Store, User, X } from "lucide-react";
import { MOCK_VENDOR } from "@/lib/data/mock-vendor";
import { cn } from "@/lib/utils";

/**
 * Profil vendeur — affichage des infos avec édition à la demande.
 *
 * UX façon Shopify : chaque champ est affiché en mode lecture par défaut.
 * Bouton "Modifier" → bascule l'input + boutons Enregistrer/Annuler inline.
 * Pas de barre de save globale — chaque champ se sauve indépendamment.
 *
 * V1 mock : modifications conservées en local state, pas de persistance.
 * V2 : server action vers Supabase + invalidation du cache.
 */
export default function ComptePage() {
  const [profile, setProfile] = useState(MOCK_VENDOR);

  const update = <K extends keyof typeof profile>(
    key: K,
    value: (typeof profile)[K],
  ) => {
    setProfile((p) => ({ ...p, [key]: value }));
  };

  return (
    <div className="space-y-5">
      {/* IDENTITÉ — card avec avatar */}
      <section className="rounded-2xl border border-line bg-white p-6">
        <h2 className="font-display text-base font-extrabold text-ink-900">
          Votre identité
        </h2>
        <p className="mt-0.5 text-[12.5px] text-ink-500">
          Ces informations sont visibles par vos partenaires (closeuses,
          livreurs, transitaires).
        </p>

        <div className="mt-5 flex items-center gap-5">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-gradient-to-br from-kamoo-orange-500 to-kamoo-blue-700 text-xl font-extrabold text-white shadow-[var(--shadow-kamoo-sm)]">
            {profile.initials}
          </div>
          <div className="flex-1">
            <button
              type="button"
              className="rounded-lg border border-line bg-white px-3 py-1.5 text-[12.5px] font-semibold text-ink-700 hover:bg-paper-2"
            >
              Changer la photo
            </button>
            <p className="mt-1.5 text-[11px] text-ink-500">
              JPG ou PNG, 2 Mo maximum
            </p>
          </div>
        </div>

        <div className="mt-5 divide-y divide-line">
          <EditableRow
            label="Prénom"
            icon={<User className="h-4 w-4" />}
            value={profile.firstName}
            onSave={(v) => update("firstName", v)}
          />
          <EditableRow
            label="Nom"
            icon={<User className="h-4 w-4" />}
            value={profile.lastName}
            onSave={(v) => update("lastName", v)}
          />
          <EditableRow
            label="Nom commercial"
            icon={<Store className="h-4 w-4" />}
            value={profile.businessName}
            onSave={(v) => update("businessName", v)}
            hint="Affiché sur vos factures et reçus client"
          />
        </div>
      </section>

      {/* CONTACT */}
      <section className="rounded-2xl border border-line bg-white p-6">
        <h2 className="font-display text-base font-extrabold text-ink-900">
          Contact
        </h2>
        <p className="mt-0.5 text-[12.5px] text-ink-500">
          Utilisé pour vous notifier des événements importants et pour la
          double authentification.
        </p>

        <div className="mt-5 divide-y divide-line">
          <EditableRow
            label="Adresse email"
            icon={<Mail className="h-4 w-4" />}
            value={profile.email}
            onSave={(v) => update("email", v)}
            type="email"
            hint="Reçoit les reçus, alertes, et résumés hebdomadaires"
          />
          <EditableRow
            label="Téléphone principal"
            icon={<Phone className="h-4 w-4" />}
            value={profile.phone}
            onSave={(v) => update("phone", v)}
            type="tel"
            hint="Utilisé pour la connexion par code OTP"
          />
        </div>
      </section>

      {/* INFORMATIONS COMPTE — read-only */}
      <section className="rounded-2xl border border-line bg-white p-6">
        <h2 className="font-display text-base font-extrabold text-ink-900">
          Informations du compte
        </h2>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-[13px]">
          <Info label="Plan" value={profile.plan.toUpperCase()} highlight />
          <Info
            label="Compte créé le"
            value={new Date(profile.createdAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          />
          <Info label="Identifiant" value={profile.id} mono />
          <Info
            label="Dernière connexion"
            value={new Date(profile.lastLoginAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          />
        </dl>
      </section>
    </div>
  );
}

/* ─── Sub-components ─── */

/**
 * Ligne avec un label + valeur. Par défaut en mode lecture, avec un bouton
 * "Modifier". Au clic, bascule en mode édition avec input + Enregistrer/Annuler
 * inline. Le save met à jour le parent ; pas de validation serveur en V1.
 */
function EditableRow({
  label,
  icon,
  value,
  onSave,
  type = "text",
  hint,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onSave: (v: string) => void;
  type?: string;
  hint?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [justSaved, setJustSaved] = useState(false);

  const handleEnter = () => {
    setDraft(value);
    setEditing(true);
  };

  const handleCancel = () => {
    setDraft(value);
    setEditing(false);
  };

  const handleSave = () => {
    if (draft.trim() === value.trim()) {
      setEditing(false);
      return;
    }
    onSave(draft.trim());
    setEditing(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1800);
  };

  return (
    <div className="flex items-start gap-4 py-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-paper-2 text-ink-500">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
          {label}
        </div>

        {editing ? (
          <div className="mt-1.5 flex items-center gap-2">
            <input
              type={type}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") handleCancel();
              }}
              className="h-9 flex-1 rounded-lg border border-line bg-white px-3 text-[13px] text-ink-900 outline-none transition focus:border-kamoo-blue-600 focus:ring-2 focus:ring-kamoo-blue-100"
            />
            <button
              type="button"
              onClick={handleSave}
              title="Enregistrer"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-600 text-white transition hover:bg-emerald-700"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleCancel}
              title="Annuler"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-paper-2 text-ink-500 transition hover:bg-paper-2/70 hover:text-ink-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="mt-0.5 flex items-center gap-3">
            <span className="flex-1 text-[13.5px] font-semibold text-ink-900">
              {value}
            </span>
            {justSaved && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                <Check className="h-3 w-3" />
                Enregistré
              </span>
            )}
            <button
              type="button"
              onClick={handleEnter}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11.5px] font-semibold text-ink-500 transition hover:bg-paper-2 hover:text-ink-900"
            >
              <Pencil className="h-3 w-3" />
              Modifier
            </button>
          </div>
        )}

        {hint && (
          <span className="mt-1 block text-[10.5px] text-ink-500">{hint}</span>
        )}
      </div>
    </div>
  );
}

function Info({
  label,
  value,
  mono = false,
  highlight = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1",
          mono && "font-mono text-[12.5px]",
          highlight
            ? "inline-flex items-center rounded-full bg-kamoo-orange-50 px-2.5 py-0.5 text-[11.5px] font-extrabold text-kamoo-orange-700"
            : "text-ink-900",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
