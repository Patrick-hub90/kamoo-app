"use client";

import { useState } from "react";
import { BadgeCheck, MessageCircle, X } from "lucide-react";
import { useChat, type ChatPartner } from "@/components/kamoo/chat";
import {
  usePartners,
  type PartnerRole,
} from "@/lib/hooks/use-partners";
import { cn } from "@/lib/utils";

/**
 * Bloc CTA de partenariat — partagé par les 3 profils marketplace.
 *
 * Règle Kamoo : le vendeur CHOISIT directement dans la marketplace (pas
 * d'annonce, pas de candidature). États :
 *  - candidat   → « Choisir … » (modale de confirmation, avertit si remplacement)
 *  - partenaire → badge « Votre {rôle} actuel·le » + Envoyer un message
 *                 + lien discret « Mettre fin au partenariat »
 */
export function PartnerCta({
  role,
  slug,
  name,
  title,
  description,
  priceLabel,
  priceValue,
  priceHint,
  chatPartner,
}: {
  role: PartnerRole;
  slug: string;
  name: string;
  /** Titre du bloc quand on n'est PAS partenaire (ex: « Travailler avec Marie ? ») */
  title: string;
  description: string;
  priceLabel?: string;
  priceValue?: string;
  priceHint?: string;
  chatPartner: ChatPartner;
}) {
  const { openChat } = useChat();
  const { partners, choose, end, isCurrent } = usePartners();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [justChosen, setJustChosen] = useState(false);

  const current = isCurrent(role, slug);
  const replacing = !current && !!partners[role];
  const roleLabel =
    role === "closeuse" ? "closeuse" : role === "transitaire" ? "transitaire" : "livreur";
  const verb = role === "closeuse" ? "cette closeuse" : role === "transitaire" ? "ce transitaire" : "ce livreur";

  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-kamoo-sm">
      {current ? (
        <>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[12px] font-bold text-emerald-700">
            <BadgeCheck className="h-3.5 w-3.5" />
            Votre {roleLabel} actuel{role === "closeuse" ? "le" : ""}
          </div>
          {justChosen && (
            <p className="mt-2 text-[12px] leading-relaxed text-emerald-700">
              Demande envoyée et acceptée — {name} a été notifié{role === "closeuse" ? "e" : ""} sur son
              application Kamoo.
            </p>
          )}
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink-500">
            Vous travaillez avec {name}. Tous vos échanges passent par le chat Kamoo.
          </p>
          {priceValue && (
            <div className="mt-3 rounded-xl bg-paper-2/50 px-3 py-2.5">
              <div className="text-[10.5px] font-medium uppercase tracking-wide text-ink-400">{priceLabel}</div>
              <div className="text-[18px] font-extrabold tabular-nums text-ink-900">{priceValue}</div>
              {priceHint && <div className="mt-0.5 text-[11px] text-ink-400">{priceHint}</div>}
            </div>
          )}
          <button
            onClick={() => openChat(chatPartner)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-kamoo-blue-900 px-4 py-3 text-[14px] font-bold text-white transition hover:bg-kamoo-blue-800"
          >
            <MessageCircle className="h-4 w-4" />
            Envoyer un message
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Mettre fin au partenariat avec ${name} ?`)) {
                end(role);
                setJustChosen(false);
              }
            }}
            className="mt-3 w-full text-center text-[12px] font-semibold text-ink-400 transition hover:text-red-600"
          >
            Mettre fin au partenariat
          </button>
        </>
      ) : (
        <>
          <h2 className="text-[17px] font-bold leading-tight text-ink-900">{title}</h2>
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink-500">{description}</p>
          {priceValue && (
            <div className="mt-3 rounded-xl bg-paper-2/50 px-3 py-2.5">
              <div className="text-[10.5px] font-medium uppercase tracking-wide text-ink-400">{priceLabel}</div>
              <div className="text-[18px] font-extrabold tabular-nums text-ink-900">{priceValue}</div>
              {priceHint && <div className="mt-0.5 text-[11px] text-ink-400">{priceHint}</div>}
            </div>
          )}
          <button
            onClick={() => setConfirmOpen(true)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-kamoo-orange-500 px-4 py-3 text-[14px] font-bold text-white transition hover:bg-kamoo-orange-600"
          >
            Choisir {verb}
          </button>
          <button
            onClick={() => openChat(chatPartner)}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-[13px] font-semibold text-ink-900 transition hover:bg-paper-2"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Discuter avant de décider
          </button>
        </>
      )}

      {/* Modale de confirmation */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-kamoo-blue-900/30 p-4 backdrop-blur-[2px]"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-2xl border border-line bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <h3 className="text-[15px] font-bold text-ink-900">Confirmer le choix</h3>
              <button
                onClick={() => setConfirmOpen(false)}
                className="grid h-7 w-7 place-items-center rounded-lg text-ink-400 transition hover:bg-paper-2 hover:text-ink-900"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-5 py-4 text-[13px] leading-relaxed text-ink-700">
              <p>
                Envoyer une demande de partenariat à <b>{name}</b> ?
                {priceValue && (
                  <>
                    {" "}
                    {priceLabel} : <b>{priceValue}</b>.
                  </>
                )}
              </p>
              {replacing && (
                <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
                  Vous avez déjà un{role === "closeuse" ? "e" : ""} {roleLabel} : ce choix le/la remplacera.
                </p>
              )}
              <p className="mt-2 text-[11.5px] text-ink-400">
                {name} recevra la demande sur son application Kamoo et vous pourrez échanger
                immédiatement via le chat.
              </p>
            </div>
            <div className="flex gap-2 border-t border-line px-5 py-3.5">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 rounded-lg border border-line bg-white py-2.5 text-[13px] font-semibold text-ink-700 transition hover:bg-paper-2"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  choose(role, slug);
                  setJustChosen(true);
                  setConfirmOpen(false);
                }}
                className="flex-1 rounded-lg bg-kamoo-orange-500 py-2.5 text-[13px] font-bold text-white transition hover:bg-kamoo-orange-600"
              >
                Envoyer la demande
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
