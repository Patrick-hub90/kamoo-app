"use client";

import { useState } from "react";
import { Check, Plus, Smartphone, Star, Trash2 } from "lucide-react";
import {
  MOCK_VENDOR_WALLETS,
  WALLET_COLORS,
  WALLET_LABELS,
  type VendorWallet,
  type WalletKind,
} from "@/lib/data/mock-vendor";
import { cn } from "@/lib/utils";

/**
 * Wallets vendeur — numéros destinataires des versements livreurs.
 * Quand un livreur déclare un versement, il choisit l'un de ces wallets
 * comme destinataire. Le numéro est aussi affiché dans le détail versement.
 *
 * V1 mock : ajout/suppression en local state.
 * V2 : server actions + validation OTP avant ajout (preuve possession du n°).
 */
export default function WalletsPage() {
  const [wallets, setWallets] = useState<VendorWallet[]>(MOCK_VENDOR_WALLETS);
  const [addOpen, setAddOpen] = useState(false);

  const handleDelete = (id: string) => {
    setWallets((prev) => prev.filter((w) => w.id !== id));
  };

  const handleSetDefault = (kind: WalletKind, id: string) => {
    setWallets((prev) =>
      prev.map((w) =>
        w.kind === kind ? { ...w, isDefault: w.id === id } : w,
      ),
    );
  };

  const handleAdd = (kind: WalletKind, phone: string, holderName: string) => {
    const newWallet: VendorWallet = {
      id: `wlt_${Date.now()}`,
      kind,
      phone,
      holderName,
      isDefault: !wallets.some((w) => w.kind === kind),
      createdAt: new Date().toISOString(),
    };
    setWallets((prev) => [...prev, newWallet]);
    setAddOpen(false);
  };

  const sortedWallets = [...wallets].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind.localeCompare(b.kind);
    return Number(b.isDefault) - Number(a.isDefault);
  });

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-line bg-white p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-extrabold text-ink-900">
              Vos wallets
            </h2>
            <p className="mt-0.5 text-[12.5px] text-ink-500">
              Numéros sur lesquels vos livreurs envoient le cash encaissé. Le
              wallet marqué comme défaut est utilisé en priorité.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-kamoo-orange-500 px-4 py-2 text-[13px] font-bold text-white transition hover:bg-kamoo-orange-600"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        </div>

        {sortedWallets.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-line bg-paper-2/40 p-8 text-center">
            <Smartphone className="mx-auto h-8 w-8 text-ink-400" />
            <p className="mt-2 text-[13px] font-semibold text-ink-700">
              Aucun wallet enregistré
            </p>
            <p className="mt-1 text-[11.5px] text-ink-500">
              Ajoutez au moins un numéro Wave ou Orange Money pour recevoir
              les versements de vos livreurs.
            </p>
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-2">
            {sortedWallets.map((wallet) => (
              <WalletRow
                key={wallet.id}
                wallet={wallet}
                onDelete={() => handleDelete(wallet.id)}
                onSetDefault={() => handleSetDefault(wallet.kind, wallet.id)}
              />
            ))}
          </div>
        )}
      </section>

      {addOpen && (
        <AddWalletDialog
          existingKinds={new Set(wallets.map((w) => w.kind))}
          onClose={() => setAddOpen(false)}
          onAdd={handleAdd}
        />
      )}
    </div>
  );
}

function WalletRow({
  wallet,
  onDelete,
  onSetDefault,
}: {
  wallet: VendorWallet;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  const colors = WALLET_COLORS[wallet.kind];
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line p-3 transition hover:border-kamoo-blue-200">
      <div
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-lg ring-1 ring-inset",
          colors.bg,
          colors.fg,
          colors.ring,
        )}
      >
        <Smartphone className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-ink-900">
            {WALLET_LABELS[wallet.kind]}
          </span>
          {wallet.isDefault && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700">
              <Star className="h-2.5 w-2.5 fill-emerald-700" />
              Par défaut
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[12px]">
          <code className="font-mono font-semibold text-ink-900">
            {wallet.phone}
          </code>
          <span className="text-ink-400">·</span>
          <span className="text-ink-500">{wallet.holderName}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {!wallet.isDefault && (
          <button
            type="button"
            onClick={onSetDefault}
            title="Définir par défaut"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-semibold text-ink-500 hover:bg-paper-2 hover:text-ink-900"
          >
            Définir par défaut
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          title="Retirer ce wallet"
          className="grid h-7 w-7 place-items-center rounded-md text-ink-400 hover:bg-red-50 hover:text-red-700"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ─── Modal ajout wallet ─── */

const ALL_KINDS: WalletKind[] = ["wave", "orange_money", "free_money", "wari"];

function AddWalletDialog({
  existingKinds,
  onClose,
  onAdd,
}: {
  existingKinds: Set<WalletKind>;
  onClose: () => void;
  onAdd: (kind: WalletKind, phone: string, holderName: string) => void;
}) {
  const [kind, setKind] = useState<WalletKind>("wave");
  const [phone, setPhone] = useState("+221 ");
  const [holderName, setHolderName] = useState("");

  const canSubmit = phone.trim().length >= 10 && holderName.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[var(--shadow-kamoo-lg)]"
      >
        <h3 className="font-display text-lg font-extrabold text-ink-900">
          Ajouter un wallet
        </h3>
        <p className="mt-0.5 text-[12.5px] text-ink-500">
          Renseignez le numéro sur lequel vous recevrez les versements.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-500">
              Type de wallet
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_KINDS.map((k) => {
                const colors = WALLET_COLORS[k];
                const isActive = kind === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border p-2.5 text-left text-[12.5px] font-semibold transition",
                      isActive
                        ? cn(
                            "border-transparent ring-2",
                            colors.bg,
                            colors.fg,
                            colors.ring,
                          )
                        : "border-line text-ink-700 hover:bg-paper-2",
                    )}
                  >
                    <Smartphone className="h-4 w-4" />
                    {WALLET_LABELS[k]}
                  </button>
                );
              })}
            </div>
            {existingKinds.has(kind) && (
              <p className="mt-1.5 text-[11px] text-amber-700">
                ⚠ Vous avez déjà un wallet {WALLET_LABELS[kind]}. Le nouveau
                ne sera pas défini comme défaut automatiquement.
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-500">
              Numéro de téléphone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+221 77 000 00 00"
              className="h-10 w-full rounded-lg border border-line bg-white px-3 text-[13px] outline-none focus:border-kamoo-blue-600 focus:ring-2 focus:ring-kamoo-blue-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-500">
              Nom du titulaire
            </label>
            <input
              type="text"
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
              placeholder="Nom affiché sur l'app du wallet"
              className="h-10 w-full rounded-lg border border-line bg-white px-3 text-[13px] outline-none focus:border-kamoo-blue-600 focus:ring-2 focus:ring-kamoo-blue-100"
            />
            <p className="mt-1 text-[10.5px] text-ink-500">
              Permet aux livreurs de vérifier qu'ils versent au bon compte
              avant d'envoyer.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-[13px] font-semibold text-ink-500 hover:bg-paper-2"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => onAdd(kind, phone.trim(), holderName.trim())}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-bold transition",
              canSubmit
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-paper-2 text-ink-400",
            )}
          >
            <Check className="h-4 w-4" />
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}
