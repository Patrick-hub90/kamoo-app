"use client";

import { useState } from "react";
import { Check, Mail, Pencil, Phone, Store, User, X } from "lucide-react";
import { MOCK_VENDOR } from "@/lib/data/mock-vendor";
import {
  SettingsCard,
  SettingsSection,
} from "@/components/parametres/settings-ui";
import { cn } from "@/lib/utils";

/**
 * Profil vendeur — réglages façon messagerie : bloc identité en tête, puis des
 * panneaux de lignes (Identité / Contact / Infos compte). Chaque champ s'édite
 * en place (bouton « Modifier » → input inline + Enregistrer/Annuler).
 *
 * V1 mock : modifications en local state. V2 : server action Supabase.
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
    <SettingsCard>
      {/* BLOC AVATAR */}
      <div className="flex items-center gap-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-kamoo-blue-900 text-lg font-medium text-white">
          {profile.initials}
        </div>
        <div>
          <button
            type="button"
            className="rounded-lg border border-line bg-white px-3 py-1.5 text-[12.5px] font-medium text-ink-700 transition hover:bg-paper-2"
          >
            Changer la photo
          </button>
          <p className="mt-1.5 text-[11px] text-ink-400">JPG ou PNG, 2 Mo maximum</p>
        </div>
      </div>

      {/* IDENTITÉ */}
      <SettingsSection
        title="Identité"
        caption="Ces informations sont visibles par vos partenaires (closeuses, livreurs, transitaires)."
      >
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
      </SettingsSection>

      {/* CONTACT */}
      <SettingsSection
        title="Contact"
        caption="Utilisé pour vous notifier des événements importants et pour la double authentification."
      >
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
      </SettingsSection>

      {/* INFORMATIONS COMPTE — lecture seule */}
      <SettingsSection title="Informations du compte">
        <InfoRow label="Plan">
          <span className="inline-flex items-center rounded-full bg-kamoo-blue-50 px-2.5 py-0.5 text-[11.5px] font-medium text-kamoo-blue-900">
            {profile.plan.toUpperCase()}
          </span>
        </InfoRow>
        <InfoRow label="Compte créé le">
          {new Date(profile.createdAt).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </InfoRow>
        <InfoRow label="Identifiant">
          <span className="font-mono-kamoo text-[12.5px] text-ink-700">{profile.id}</span>
        </InfoRow>
        <InfoRow label="Dernière connexion">
          {new Date(profile.lastLoginAt).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </InfoRow>
      </SettingsSection>
    </SettingsCard>
  );
}

/* ─── Sous-composants ─── */

/** Ligne éditable : lecture (label/valeur + Modifier) ↔ édition (input + ✓/✗). */
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
    <div className="flex items-start gap-3 px-4 py-3 sm:px-5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-paper-2 text-ink-500">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] text-ink-400">{label}</div>

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
              className="h-9 flex-1 rounded-lg border border-line bg-white px-3 text-[13px] text-ink-900 outline-none transition focus:border-kamoo-blue-600 focus:ring-2 focus:ring-kamoo-blue-600/12"
            />
            <button
              type="button"
              onClick={handleSave}
              title="Enregistrer"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-kamoo-blue-900 text-white transition hover:bg-kamoo-blue-800"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleCancel}
              title="Annuler"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-paper-2 text-ink-500 transition hover:text-ink-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="mt-0.5 flex items-center gap-3">
            <span className="flex-1 text-[13.5px] text-ink-900">{value}</span>
            {justSaved && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                <Check className="h-3 w-3" />
                Enregistré
              </span>
            )}
            <button
              type="button"
              onClick={handleEnter}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-medium text-ink-500 transition hover:bg-paper-2 hover:text-ink-900"
            >
              <Pencil className="h-3 w-3" />
              Modifier
            </button>
          </div>
        )}

        {hint && <span className="mt-1 block text-[11px] text-ink-400">{hint}</span>}
      </div>
    </div>
  );
}

/** Ligne d'information en lecture seule : label à gauche, valeur à droite. */
function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 text-[13px] sm:px-5">
      <span className="text-ink-500">{label}</span>
      <span className="text-right text-ink-900">{children}</span>
    </div>
  );
}
