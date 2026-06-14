"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  KeyRound,
  Laptop,
  Monitor,
  Save,
  Shield,
  Smartphone,
  X,
} from "lucide-react";
import {
  MOCK_VENDOR_SESSIONS,
  type VendorSession,
} from "@/lib/data/mock-vendor";
import { cn } from "@/lib/utils";

/**
 * Sécurité du compte vendeur :
 *  - Changement de mot de passe
 *  - Authentification à 2 facteurs (placeholder V1)
 *  - Sessions actives
 *  - Zone danger (suppression compte)
 */
export default function SecuritePage() {
  const [sessions, setSessions] = useState<VendorSession[]>(
    MOCK_VENDOR_SESSIONS,
  );
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [twoFA, setTwoFA] = useState(false);

  const handleRevokeSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const handleRevokeAll = () => {
    setSessions((prev) => prev.filter((s) => s.isCurrent));
  };

  const canChangePwd =
    pwd.current.length >= 6 &&
    pwd.next.length >= 8 &&
    pwd.next === pwd.confirm;

  return (
    <div className="space-y-5">
      {/* CHANGEMENT MOT DE PASSE */}
      <section className="rounded-2xl border border-line bg-white p-6">
        <h2 className="font-display text-base font-extrabold text-ink-900">
          Mot de passe
        </h2>
        <p className="mt-0.5 text-[12.5px] text-ink-500">
          Choisissez un mot de passe d'au moins 8 caractères, unique à Kamoo.
        </p>

        <div className="mt-5 space-y-4">
          <PwdField
            label="Mot de passe actuel"
            value={pwd.current}
            onChange={(v) => setPwd({ ...pwd, current: v })}
            visible={showPwd}
          />
          <PwdField
            label="Nouveau mot de passe"
            value={pwd.next}
            onChange={(v) => setPwd({ ...pwd, next: v })}
            visible={showPwd}
            hint="Min. 8 caractères, idéalement avec chiffres et symboles"
          />
          <PwdField
            label="Confirmer le nouveau mot de passe"
            value={pwd.confirm}
            onChange={(v) => setPwd({ ...pwd, confirm: v })}
            visible={showPwd}
            error={
              pwd.confirm.length > 0 && pwd.confirm !== pwd.next
                ? "Les deux mots de passe ne correspondent pas"
                : undefined
            }
          />

          <label className="inline-flex cursor-pointer items-center gap-2 text-[12.5px] text-ink-700">
            <input
              type="checkbox"
              checked={showPwd}
              onChange={(e) => setShowPwd(e.target.checked)}
              className="h-4 w-4 cursor-pointer rounded border-line text-kamoo-blue-600"
            />
            Afficher les mots de passe
          </label>
        </div>

        <div className="mt-5 flex items-center justify-end">
          <button
            type="button"
            disabled={!canChangePwd}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold transition",
              canChangePwd
                ? "bg-kamoo-orange-500 text-white hover:bg-kamoo-orange-600 active:translate-y-px"
                : "bg-paper-2 text-ink-400",
            )}
          >
            <Save className="h-4 w-4" />
            Mettre à jour
          </button>
        </div>
      </section>

      {/* 2FA */}
      <section className="rounded-2xl border border-line bg-white p-6">
        <div className="flex items-start gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
            <Shield className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-base font-extrabold text-ink-900">
                Double authentification
              </h2>
              <Toggle checked={twoFA} onChange={setTwoFA} />
            </div>
            <p className="mt-0.5 text-[12.5px] text-ink-500">
              Reçoit un code OTP par SMS à chaque connexion sur un nouveau
              appareil. Recommandé pour protéger votre activité.
            </p>
            {twoFA && (
              <div className="mt-3 rounded-lg bg-emerald-50/60 p-3 text-[12px] text-emerald-800">
                ✓ Activée — un code à 6 chiffres vous sera envoyé sur{" "}
                <code className="font-mono font-semibold">
                  +221 77 412 88 03
                </code>{" "}
                à chaque connexion.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SESSIONS ACTIVES */}
      <section className="rounded-2xl border border-line bg-white p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-extrabold text-ink-900">
              Sessions actives
            </h2>
            <p className="mt-0.5 text-[12.5px] text-ink-500">
              Appareils sur lesquels votre compte est connecté en ce moment.
            </p>
          </div>
          {sessions.filter((s) => !s.isCurrent).length > 0 && (
            <button
              type="button"
              onClick={handleRevokeAll}
              className="rounded-lg border border-line bg-white px-3 py-1.5 text-[12px] font-semibold text-red-700 hover:bg-red-50"
            >
              Déconnecter tous les autres
            </button>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-2">
          {sessions.map((session) => (
            <SessionRow
              key={session.id}
              session={session}
              onRevoke={() => handleRevokeSession(session.id)}
            />
          ))}
        </div>
      </section>

    </div>
  );
}

/* ─── Sub-components ─── */

function PwdField({
  label,
  value,
  onChange,
  visible,
  hint,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  visible: boolean;
  hint?: string;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-500">
        {label}
      </span>
      <div className="relative">
        <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "h-10 w-full rounded-lg border bg-white pl-10 pr-10 text-[13px] outline-none transition focus:ring-2",
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-100"
              : "border-line focus:border-kamoo-blue-600 focus:ring-kamoo-blue-100",
          )}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400">
          {visible ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </span>
      </div>
      {error ? (
        <span className="mt-1 block text-[10.5px] font-semibold text-red-700">
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1 block text-[10.5px] text-ink-500">{hint}</span>
      ) : null}
    </label>
  );
}

function detectDeviceIcon(device: string): React.ReactNode {
  if (device.toLowerCase().includes("iphone") || device.toLowerCase().includes("android")) {
    return <Smartphone className="h-4 w-4" />;
  }
  if (device.toLowerCase().includes("mac")) {
    return <Laptop className="h-4 w-4" />;
  }
  return <Monitor className="h-4 w-4" />;
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffH = Math.round(diffMs / 3600000);
  if (diffH < 1) return "à l'instant";
  if (diffH < 24) return `il y a ${diffH}h`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 7) return `il y a ${diffD} j`;
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

function SessionRow({
  session,
  onRevoke,
}: {
  session: VendorSession;
  onRevoke: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3",
        session.isCurrent
          ? "border-emerald-200 bg-emerald-50/40"
          : "border-line",
      )}
    >
      <div
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
          session.isCurrent
            ? "bg-emerald-100 text-emerald-700"
            : "bg-paper-2 text-ink-500",
        )}
      >
        {detectDeviceIcon(session.device)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-ink-900">{session.device}</span>
          {session.isCurrent && (
            <span className="inline-flex items-center rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
              Cette session
            </span>
          )}
        </div>
        <div className="mt-0.5 text-[11.5px] text-ink-500">
          {session.location} · Active {formatRelativeTime(session.lastActiveAt)}
        </div>
      </div>
      {!session.isCurrent && (
        <button
          type="button"
          onClick={onRevoke}
          title="Déconnecter cet appareil"
          className="grid h-7 w-7 place-items-center rounded-md text-ink-400 hover:bg-red-50 hover:text-red-700"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition",
        checked ? "bg-emerald-500" : "bg-paper-2 ring-1 ring-inset ring-line",
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
}
