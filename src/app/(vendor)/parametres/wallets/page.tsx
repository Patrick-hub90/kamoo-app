"use client";

import { useState } from "react";
import { Check, Plus, Smartphone, Star, Trash2, X } from "lucide-react";
import {
  MOCK_VENDOR_WALLETS,
  WALLET_LABELS,
  type VendorWallet,
  type WalletKind,
} from "@/lib/data/mock-vendor";
import {
  SettingsCard,
  SettingsSection,
  SettingsBody,
  FieldLabel,
} from "@/components/parametres/settings-ui";
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
    <>
      <SettingsCard>
        <SettingsSection
          title="Vos wallets"
          caption="Numéros sur lesquels vos livreurs envoient le cash encaissé. Le wallet marqué comme défaut est utilisé en priorité."
        >
          {sortedWallets.length === 0 ? (
            <div className="px-4 py-10 text-center sm:px-5">
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-lg bg-paper-2 text-ink-400">
                <Smartphone className="h-5 w-5" />
              </span>
              <p className="mt-3 text-[13px] font-medium text-ink-700">
                Aucun wallet enregistré
              </p>
              <p className="mt-1 text-[11.5px] text-ink-500">
                Ajoutez au moins un numéro Wave ou Orange Money pour recevoir
                les versements de vos livreurs.
              </p>
            </div>
          ) : (
            sortedWallets.map((wallet) => (
              <WalletRow
                key={wallet.id}
                wallet={wallet}
                onDelete={() => handleDelete(wallet.id)}
                onSetDefault={() => handleSetDefault(wallet.kind, wallet.id)}
              />
            ))
          )}

          <div className="px-4 py-3 sm:px-5">
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-kamoo-blue-900 px-3.5 py-2 text-[13px] font-medium text-white transition hover:bg-kamoo-blue-800"
            >
              <Plus className="h-4 w-4" />
              Ajouter un wallet
            </button>
          </div>
        </SettingsSection>
      </SettingsCard>

      {addOpen && (
        <AddWalletDialog
          existingKinds={new Set(wallets.map((w) => w.kind))}
          onClose={() => setAddOpen(false)}
          onAdd={handleAdd}
        />
      )}
    </>
  );
}

/** Ligne wallet : tuile neutre + libellé/numéro + statut défaut + actions. */
function WalletRow({
  wallet,
  onDelete,
  onSetDefault,
}: {
  wallet: VendorWallet;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-paper-2 text-ink-500">
        <Smartphone className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13.5px] font-medium text-ink-900">
            {WALLET_LABELS[wallet.kind]}
          </span>
          {wallet.isDefault && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11.5px] font-medium text-emerald-700">
              <Star className="h-2.5 w-2.5 fill-emerald-600 text-emerald-600" />
              Par défaut
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[12px]">
          <code className="font-mono-kamoo tabular-nums text-ink-700">
            {wallet.phone}
          </code>
          <span className="text-ink-300">·</span>
          <span className="text-ink-500">{wallet.holderName}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {!wallet.isDefault && (
          <button
            type="button"
            onClick={onSetDefault}
            title="Définir par défaut"
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-medium text-ink-500 transition hover:bg-paper-2 hover:text-ink-900"
          >
            Définir par défaut
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          title="Retirer ce wallet"
          className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 transition hover:bg-red-50 hover:text-red-700"
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
      className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-xl border border-line bg-white shadow-kamoo-sm"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h3 className="text-[15px] font-medium text-ink-900">
              Ajouter un wallet
            </h3>
            <p className="mt-0.5 text-[12.5px] text-ink-500">
              Renseignez le numéro sur lequel vous recevrez les versements.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Fermer"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-400 transition hover:bg-paper-2 hover:text-ink-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <SettingsBody className="space-y-4">
          <div>
            <FieldLabel>Type de wallet</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              {ALL_KINDS.map((k) => {
                const isActive = kind === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border p-2.5 text-left text-[12.5px] font-medium transition",
                      isActive
                        ? "border-kamoo-blue-900 bg-kamoo-blue-50 text-kamoo-blue-900"
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
                Vous avez déjà un wallet {WALLET_LABELS[kind]}. Le nouveau ne
                sera pas défini comme défaut automatiquement.
              </p>
            )}
          </div>

          <div>
            <FieldLabel htmlFor="wallet-phone">Numéro de téléphone</FieldLabel>
            <input
              id="wallet-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+221 77 000 00 00"
              className="h-10 w-full rounded-lg border border-line bg-white px-3 text-[13px] text-ink-900 outline-none transition focus:border-kamoo-blue-600 focus:ring-2 focus:ring-kamoo-blue-600/12"
            />
          </div>

          <div>
            <FieldLabel htmlFor="wallet-holder">Nom du titulaire</FieldLabel>
            <input
              id="wallet-holder"
              type="text"
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
              placeholder="Nom affiché sur l'app du wallet"
              className="h-10 w-full rounded-lg border border-line bg-white px-3 text-[13px] text-ink-900 outline-none transition focus:border-kamoo-blue-600 focus:ring-2 focus:ring-kamoo-blue-600/12"
            />
            <p className="mt-1.5 text-[11px] text-ink-400">
              Permet aux livreurs de vérifier qu'ils versent au bon compte
              avant d'envoyer.
            </p>
          </div>
        </SettingsBody>

        <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line bg-white px-4 py-2 text-[13px] font-medium text-ink-700 transition hover:bg-paper-2"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => onAdd(kind, phone.trim(), holderName.trim())}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-medium transition",
              canSubmit
                ? "bg-kamoo-blue-900 text-white hover:bg-kamoo-blue-800"
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
