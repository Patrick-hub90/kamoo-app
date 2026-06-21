"use client";

import { useState } from "react";
import {
  BadgeCheck,
  Check,
  Clock,
  Headphones,
  MessageCircle,
  Package,
  Pencil,
  Star,
  Truck,
  X,
} from "lucide-react";
import { useChat, type ChatPartner } from "@/components/kamoo/chat";
import { OpenDisputeModal } from "@/components/kamoo/open-dispute-modal";
import {
  END_REASONS,
  usePartners,
  type PartnerRole,
} from "@/lib/hooks/use-partners";
import {
  LIVREUR_SERVICE_SHORT,
  type LivreurService,
  type ServiceOffering,
} from "@/lib/types/livreur";
import { cn } from "@/lib/utils";

/**
 * Bloc CTA de partenariat — partagé par les 3 profils marketplace.
 *
 * Workflow Kamoo (le vendeur CHOISIT directement dans la marketplace) :
 *   Choisir → [sélection des services si livreur] → confirmation
 *   → « En attente de validation » (le partenaire accepte sur son app)
 *   → « Votre partenaire actuel ».
 *
 * Fin de partenariat = vrai workflow : motif obligatoire + évaluation
 * (note / commentaire) conservée et modifiable.
 */

const fmt = (n: number) => n.toLocaleString("fr-FR");

const SERVICE_ICON: Record<LivreurService, React.ComponentType<{ className?: string }>> = {
  livraison: Truck,
  closing: Headphones,
  entreposage: Package,
};

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
  serviceOfferings,
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
  /** Grille de services (livreurs) — déclenche l'étape de sélection */
  serviceOfferings?: ServiceOffering[];
}) {
  const { openChat } = useChat();
  const partnersApi = usePartners();
  const { partners, getPartnership, request, cancelRequest } = partnersApi;

  const [chooseOpen, setChooseOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [manageServices, setManageServices] = useState(false);

  const partnership = getPartnership(role, slug);
  /* Remplacement : seulement pour la closeuse (mono) — transitaires et
   * livreurs sont multi-connexions, on AJOUTE sans rien remplacer. */
  const other =
    role === "closeuse" && partners.closeuse && partners.closeuse.slug !== slug
      ? partners.closeuse
      : null;

  const roleLabel =
    role === "closeuse" ? "closeuse" : role === "transitaire" ? "transitaire" : "livreur";
  const verb =
    role === "closeuse" ? "cette closeuse" : role === "transitaire" ? "ce transitaire" : "ce livreur";

  const hasServiceStep = (serviceOfferings?.length ?? 0) > 1;
  const subscribedServices = partnership?.services ?? ["livraison" as LivreurService];
  /* Cardinalité : UNE seule closeuse. Si une closeuse est déjà active, le
   * service « Closing » d'un livreur est verrouillé (on ne peut pas avoir
   * deux pôles de closing en parallèle). */
  const closeuseActive =
    role === "livreur" && partners.closeuse?.status === "active";

  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-kamoo-sm">
      {/* ─── PARTENAIRE ACTUEL ─── */}
      {partnership?.status === "active" && (
        <>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[12px] font-bold text-emerald-700">
            <BadgeCheck className="h-3.5 w-3.5" />
            Votre {roleLabel} actuel{role === "closeuse" ? "le" : ""}
          </div>
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

          {/* Services souscrits (livreur) */}
          {hasServiceStep && (
            <div className="mt-3 rounded-xl border border-line bg-paper-2/40 px-3 py-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-medium uppercase tracking-wide text-ink-400">
                  Services souscrits
                </span>
                <button
                  onClick={() => setManageServices(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-kamoo-blue-700 hover:underline"
                >
                  <Pencil className="h-3 w-3" /> Gérer
                </button>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {subscribedServices.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold text-ink-700 ring-1 ring-inset ring-line">
                    <Check className="h-3 w-3 text-emerald-600" /> {LIVREUR_SERVICE_SHORT[s]}
                  </span>
                ))}
              </div>
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
            onClick={() => setRateOpen(true)}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-[13px] font-semibold text-ink-900 transition hover:bg-paper-2"
          >
            <Star className="h-3.5 w-3.5 text-amber-400" />
            {partnersApi.getReview(slug) ? "Modifier mon avis" : "Laisser un avis"}
          </button>
          <div className="mt-3 flex items-center justify-center gap-4">
            <button
              onClick={() => setDisputeOpen(true)}
              className="text-center text-[12px] font-semibold text-ink-400 transition hover:text-red-600"
            >
              Signaler un problème
            </button>
            <span className="h-3 w-px bg-line" />
            <button
              onClick={() => setEndOpen(true)}
              className="text-center text-[12px] font-semibold text-ink-400 transition hover:text-red-600"
            >
              Mettre fin au partenariat
            </button>
          </div>
        </>
      )}

      {/* ─── DEMANDE EN ATTENTE (ce profil) ─── */}
      {partnership?.status === "pending" && (
        <>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[12px] font-bold text-amber-700">
            <Clock className="h-3.5 w-3.5" />
            En attente de validation
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink-500">
            Votre demande a été envoyée à <b className="text-ink-700">{name}</b>.{" "}
            {role === "closeuse" ? "Elle sera notifiée" : "Il sera notifié"} sur son application
            Kamoo et doit accepter la demande pour démarrer le partenariat.
          </p>
          {hasServiceStep && partnership.services && (
            <div className="mt-3 rounded-xl border border-line bg-paper-2/40 px-3 py-2.5">
              <div className="text-[10.5px] font-medium uppercase tracking-wide text-ink-400">Services demandés</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {partnership.services.map((s) => (
                  <span key={s} className="rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold text-ink-700 ring-1 ring-inset ring-line">
                    {LIVREUR_SERVICE_SHORT[s]}
                  </span>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={() => openChat(chatPartner)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-[13px] font-semibold text-ink-900 transition hover:bg-paper-2"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Envoyer un message
          </button>
          <button
            onClick={() => cancelRequest(role, slug)}
            className="mt-3 w-full text-center text-[12px] font-semibold text-ink-400 transition hover:text-red-600"
          >
            Annuler la demande
          </button>
        </>
      )}

      {/* ─── PAS (ENCORE) PARTENAIRE ─── */}
      {!partnership && (
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
            onClick={() => setChooseOpen(true)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-kamoo-blue-900 px-4 py-3 text-[14px] font-bold text-white transition hover:bg-kamoo-blue-800"
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

      {/* ─── MODALES ─── */}
      {chooseOpen && (
        <ChooseModal
          role={role}
          name={name}
          verb={verb}
          roleLabel={roleLabel}
          priceLabel={priceLabel}
          priceValue={priceValue}
          serviceOfferings={hasServiceStep ? serviceOfferings : undefined}
          closeuseActive={closeuseActive}
          replacing={other ? other.slug : null}
          onClose={() => setChooseOpen(false)}
          onConfirm={(services) => {
            request(role, slug, services);
            setChooseOpen(false);
          }}
        />
      )}

      {manageServices && serviceOfferings && (
        <ServicesModal
          name={name}
          offerings={serviceOfferings}
          initial={subscribedServices}
          closeuseActive={closeuseActive}
          onClose={() => setManageServices(false)}
          onSave={(services) => {
            partnersApi.setServices(role, slug, services);
            setManageServices(false);
          }}
        />
      )}

      {endOpen && (
        <EndPartnershipModal
          role={role}
          slug={slug}
          name={name}
          roleLabel={roleLabel}
          partnersApi={partnersApi}
          onClose={() => setEndOpen(false)}
        />
      )}

      {disputeOpen && (
        <OpenDisputeModal
          againstRole={role}
          againstSlug={slug}
          againstName={name}
          onClose={() => setDisputeOpen(false)}
        />
      )}

      {rateOpen && (
        <RateModal
          slug={slug}
          name={name}
          partnersApi={partnersApi}
          onClose={() => setRateOpen(false)}
        />
      )}
    </div>
  );
}

/* ─── Modale « Laisser / modifier un avis » (partenaire actif) ──── */

function RateModal({
  slug,
  name,
  partnersApi,
  onClose,
}: {
  slug: string;
  name: string;
  partnersApi: ReturnType<typeof usePartners>;
  onClose: () => void;
}) {
  const existing = partnersApi.getReview(slug);
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? "");

  return (
    <ModalShell onClose={onClose} title={existing ? "Modifier mon avis" : "Laisser un avis"}>
      <div className="flex flex-col gap-4 px-5 py-4">
        <p className="text-[12.5px] leading-relaxed text-ink-500">
          Votre avis sur <b className="text-ink-700">{name}</b> est visible par les autres
          e-commerçants sur son profil. Vous pouvez le modifier à tout moment.
        </p>
        <div>
          <label className="mb-1 block text-[11.5px] font-semibold text-ink-600">
            Votre note <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)} aria-label={`${n} étoile${n > 1 ? "s" : ""}`}>
                <Star
                  className={cn(
                    "h-7 w-7 transition",
                    n <= rating ? "fill-amber-400 text-amber-400" : "text-ink-200 hover:text-amber-300",
                  )}
                />
              </button>
            ))}
            {rating > 0 && <span className="ml-2 text-[12.5px] font-semibold text-ink-700">{rating}/5</span>}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-[11.5px] font-semibold text-ink-600">Commentaire</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder={`Votre expérience avec ${name.split(" ")[0]}…`}
            className="w-full resize-none rounded-lg border border-line bg-white px-3 py-2 text-[13px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600"
          />
        </div>
      </div>
      <div className="flex gap-2 border-t border-line px-5 py-3.5">
        <button onClick={onClose} className="flex-1 rounded-lg border border-line bg-white py-2.5 text-[13px] font-semibold text-ink-700 transition hover:bg-paper-2">
          Annuler
        </button>
        <button
          disabled={rating === 0}
          onClick={() => {
            partnersApi.saveReview(slug, { rating, comment: comment.trim() });
            onClose();
          }}
          className="flex-1 rounded-lg bg-kamoo-blue-900 py-2.5 text-[13px] font-bold text-white transition hover:bg-kamoo-blue-800 disabled:opacity-40"
        >
          Publier l&apos;avis
        </button>
      </div>
    </ModalShell>
  );
}

/* ─── Modale « Choisir » : [services →] confirmation → demande ──── */

function ChooseModal({
  role,
  name,
  verb,
  roleLabel,
  priceLabel,
  priceValue,
  serviceOfferings,
  closeuseActive,
  replacing,
  onClose,
  onConfirm,
}: {
  role: PartnerRole;
  name: string;
  verb: string;
  roleLabel: string;
  priceLabel?: string;
  priceValue?: string;
  serviceOfferings?: ServiceOffering[];
  closeuseActive?: boolean;
  replacing: string | null;
  onClose: () => void;
  onConfirm: (services?: LivreurService[]) => void;
}) {
  const [step, setStep] = useState<"services" | "confirm">(
    serviceOfferings ? "services" : "confirm",
  );
  const [selected, setSelected] = useState<LivreurService[]>(["livraison"]);

  const toggle = (s: LivreurService) => {
    if (s === "livraison") return; // toujours incluse
    if (s === "closing" && closeuseActive) return; // verrouillé : closeuse déjà active
    setSelected((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  };

  return (
    <ModalShell onClose={onClose} title={step === "services" ? "Composer votre offre" : "Confirmer la demande"}>
      {step === "services" && serviceOfferings ? (
        <>
          <p className="px-5 pt-4 text-[12.5px] leading-relaxed text-ink-500">
            {name} propose plusieurs services. Sélectionnez ceux que vous voulez —
            vous pourrez les modifier à tout moment.
          </p>
          <div className="flex flex-col gap-2 px-5 py-4">
            {serviceOfferings.map((o) => {
              const Icon = SERVICE_ICON[o.service];
              const isBase = o.service === "livraison";
              const locked = o.service === "closing" && closeuseActive;
              const checked = selected.includes(o.service) && !locked;
              return (
                <button
                  key={o.service}
                  onClick={() => toggle(o.service)}
                  disabled={locked}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-3 text-left transition",
                    checked ? "border-kamoo-blue-600 bg-kamoo-blue-50/40" : "border-line bg-white hover:bg-paper-2/50",
                    isBase && "cursor-default",
                    locked && "cursor-not-allowed opacity-60 hover:bg-white",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border",
                      checked ? "border-kamoo-blue-600 bg-kamoo-blue-600 text-white" : "border-ink-300 bg-white",
                    )}
                  >
                    {checked && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ink-900">
                        <Icon className="h-3.5 w-3.5 text-ink-400" />
                        {LIVREUR_SERVICE_SHORT[o.service]}
                        {isBase && <span className="rounded bg-paper-2 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase text-ink-500">Inclus</span>}
                        {locked && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase text-amber-700">Indisponible</span>}
                      </span>
                      <span className="shrink-0 text-[12px] font-bold tabular-nums text-ink-900">
                        {o.priceXof != null ? `${fmt(o.priceXof)} F ${o.unit ?? ""}` : "Tarif par zone"}
                      </span>
                    </span>
                    <span className="mt-1 block text-[11.5px] leading-relaxed text-ink-500">
                      {locked
                        ? "Vous avez déjà une closeuse active. Mettez fin à ce partenariat pour confier le closing à ce livreur."
                        : o.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 border-t border-line px-5 py-3.5">
            <button onClick={onClose} className="flex-1 rounded-lg border border-line bg-white py-2.5 text-[13px] font-semibold text-ink-700 transition hover:bg-paper-2">
              Annuler
            </button>
            <button
              onClick={() => setStep("confirm")}
              className="flex-1 rounded-lg bg-kamoo-blue-900 py-2.5 text-[13px] font-bold text-white transition hover:bg-kamoo-blue-800"
            >
              Continuer ({selected.length} service{selected.length > 1 ? "s" : ""})
            </button>
          </div>
        </>
      ) : (
        <>
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
            {serviceOfferings && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selected.map((s) => (
                  <span key={s} className="rounded-md bg-paper-2 px-2 py-0.5 text-[11px] font-semibold text-ink-700">
                    {LIVREUR_SERVICE_SHORT[s]}
                  </span>
                ))}
              </div>
            )}
            {replacing && (
              <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
                Vous avez déjà un{role === "closeuse" ? "e" : ""} {roleLabel} : ce choix mettra fin
                au partenariat en cours.
              </p>
            )}
            <p className="mt-2 text-[11.5px] text-ink-400">
              {name} recevra la demande sur son application Kamoo. Le partenariat démarre
              dès qu&apos;{role === "closeuse" ? "elle" : "il"} l&apos;accepte — vous serez notifié.
            </p>
          </div>
          <div className="flex gap-2 border-t border-line px-5 py-3.5">
            <button
              onClick={serviceOfferings ? () => setStep("services") : onClose}
              className="flex-1 rounded-lg border border-line bg-white py-2.5 text-[13px] font-semibold text-ink-700 transition hover:bg-paper-2"
            >
              {serviceOfferings ? "Retour" : "Annuler"}
            </button>
            <button
              onClick={() => onConfirm(serviceOfferings ? selected : undefined)}
              className="flex-1 rounded-lg bg-kamoo-blue-900 py-2.5 text-[13px] font-bold text-white transition hover:bg-kamoo-blue-800"
            >
              Envoyer la demande
            </button>
          </div>
        </>
      )}
    </ModalShell>
  );
}

/* ─── Modale « Gérer les services » (partenariat actif) ─────────── */

function ServicesModal({
  name,
  offerings,
  initial,
  closeuseActive,
  onClose,
  onSave,
}: {
  name: string;
  offerings: ServiceOffering[];
  initial: LivreurService[];
  closeuseActive?: boolean;
  onClose: () => void;
  onSave: (services: LivreurService[]) => void;
}) {
  const [selected, setSelected] = useState<LivreurService[]>(
    initial.includes("livraison") ? initial : ["livraison", ...initial],
  );
  const toggle = (s: LivreurService) => {
    if (s === "livraison") return;
    if (s === "closing" && closeuseActive) return; // verrouillé : closeuse déjà active
    setSelected((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  return (
    <ModalShell onClose={onClose} title="Gérer les services">
      <p className="px-5 pt-4 text-[12.5px] leading-relaxed text-ink-500">
        Ajustez les services que vous prenez chez {name}. {name.split(" ")[0]} sera
        notifié du changement.
      </p>
      <div className="flex flex-col gap-2 px-5 py-4">
        {offerings.map((o) => {
          const isBase = o.service === "livraison";
          const locked = o.service === "closing" && closeuseActive;
          const checked = selected.includes(o.service) && !locked;
          return (
            <button
              key={o.service}
              onClick={() => toggle(o.service)}
              disabled={locked}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                checked ? "border-kamoo-blue-600 bg-kamoo-blue-50/40" : "border-line bg-white hover:bg-paper-2/50",
                isBase && "cursor-default",
                locked && "cursor-not-allowed opacity-60 hover:bg-white",
              )}
            >
              <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-md border", checked ? "border-kamoo-blue-600 bg-kamoo-blue-600 text-white" : "border-ink-300 bg-white")}>
                {checked && <Check className="h-3.5 w-3.5" />}
              </span>
              <span className="flex-1 text-[13px] font-semibold text-ink-900">
                {LIVREUR_SERVICE_SHORT[o.service]}
                {isBase && <span className="ml-2 rounded bg-paper-2 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase text-ink-500">Inclus</span>}
                {locked && <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase text-amber-700">Indisponible</span>}
                {locked && (
                  <span className="mt-0.5 block text-[11px] font-normal leading-snug text-ink-500">
                    Closeuse déjà active — mettez fin à ce partenariat pour l’activer.
                  </span>
                )}
              </span>
              <span className="shrink-0 text-[12px] font-bold tabular-nums text-ink-700">
                {o.priceXof != null ? `${fmt(o.priceXof)} F ${o.unit ?? ""}` : "Par zone"}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex gap-2 border-t border-line px-5 py-3.5">
        <button onClick={onClose} className="flex-1 rounded-lg border border-line bg-white py-2.5 text-[13px] font-semibold text-ink-700 transition hover:bg-paper-2">
          Annuler
        </button>
        <button
          onClick={() => onSave(selected)}
          className="flex-1 rounded-lg bg-kamoo-blue-900 py-2.5 text-[13px] font-bold text-white transition hover:bg-kamoo-blue-800"
        >
          Enregistrer
        </button>
      </div>
    </ModalShell>
  );
}

/* ─── Modale « Mettre fin au partenariat » : motif + évaluation ─── */

function EndPartnershipModal({
  role,
  slug,
  name,
  roleLabel,
  partnersApi,
  onClose,
}: {
  role: PartnerRole;
  slug: string;
  name: string;
  roleLabel: string;
  partnersApi: ReturnType<typeof usePartners>;
  onClose: () => void;
}) {
  const existing = partnersApi.getReview(slug);
  const [reason, setReason] = useState("");
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const valid = reason !== "" && rating > 0;

  return (
    <ModalShell onClose={onClose} title="Mettre fin au partenariat">
      <div className="flex flex-col gap-4 px-5 py-4">
        <p className="text-[12.5px] leading-relaxed text-ink-500">
          Vous mettez fin au partenariat avec <b className="text-ink-700">{name}</b>.
          Indiquez le motif et laissez une évaluation — elle aide les autres
          e-commerçants et reste modifiable.
        </p>

        {/* Motif */}
        <div>
          <label className="mb-1 block text-[11.5px] font-semibold text-ink-600">
            Motif <span className="text-red-500">*</span>
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="h-10 w-full rounded-lg border border-line bg-white px-3 text-[13px] text-ink-900 outline-none focus:border-kamoo-blue-600"
          >
            <option value="" disabled>
              Choisir un motif…
            </option>
            {END_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Note */}
        <div>
          <label className="mb-1 block text-[11.5px] font-semibold text-ink-600">
            {existing ? "Modifier votre note" : "Votre note"} <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)} aria-label={`${n} étoile${n > 1 ? "s" : ""}`}>
                <Star
                  className={cn(
                    "h-7 w-7 transition",
                    n <= rating ? "fill-amber-400 text-amber-400" : "text-ink-200 hover:text-amber-300",
                  )}
                />
              </button>
            ))}
            {rating > 0 && <span className="ml-2 text-[12.5px] font-semibold text-ink-700">{rating}/5</span>}
          </div>
        </div>

        {/* Commentaire */}
        <div>
          <label className="mb-1 block text-[11.5px] font-semibold text-ink-600">
            Commentaire {existing ? "(déjà laissé — modifiable)" : "(optionnel)"}
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder={`Votre expérience avec ${name.split(" ")[0]}…`}
            className="w-full resize-none rounded-lg border border-line bg-white px-3 py-2 text-[13px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600"
          />
        </div>
      </div>
      <div className="flex gap-2 border-t border-line px-5 py-3.5">
        <button onClick={onClose} className="flex-1 rounded-lg border border-line bg-white py-2.5 text-[13px] font-semibold text-ink-700 transition hover:bg-paper-2">
          Annuler
        </button>
        <button
          disabled={!valid}
          onClick={() => {
            partnersApi.end(role, slug, { reason, rating, comment: comment.trim() });
            onClose();
          }}
          className="flex-1 rounded-lg bg-red-600 py-2.5 text-[13px] font-bold text-white transition hover:bg-red-700 disabled:opacity-40"
        >
          Mettre fin au partenariat
        </button>
      </div>
      {!valid && (
        <p className="px-5 pb-3 text-center text-[10.5px] text-ink-400">
          Le motif et la note sont requis pour clôturer un partenariat de {roleLabel}.
        </p>
      )}
    </ModalShell>
  );
}

/* ─── Coquille de modale partagée ────────────────────────────────── */

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-kamoo-blue-900/30 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-line bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h3 className="text-[15px] font-bold text-ink-900">{title}</h3>
          <button
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-lg text-ink-400 transition hover:bg-paper-2 hover:text-ink-900"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
