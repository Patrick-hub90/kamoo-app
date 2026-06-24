"use client";

import { useMemo, useState } from "react";
import {
  Ban,
  Bike,
  Check,
  ChevronRight,
  Copy,
  Headphones,
  MapPin,
  Phone,
  Play,
  Store,
  Truck,
  UserPlus,
  X,
} from "lucide-react";
import {
  usePartners,
  PARTNER_MEMBER_STATUS_LABELS,
  type PartnerMember,
  type PartnerMemberStatus,
  type PartnerRole,
  type Partnership,
} from "@/lib/hooks/use-partners";
import { MOCK_LIVREURS } from "@/lib/data/mock-livreurs";
import { MOCK_CLOSEUSES } from "@/lib/data/mock-closeuses";
import { MOCK_TRANSITAIRES } from "@/lib/data/mock-transitaires";
import {
  LIVREUR_SERVICE_LABELS,
  type LivreurService,
} from "@/lib/types/livreur";
import { SettingsCard, SettingsSection } from "@/components/parametres/settings-ui";
import { cn } from "@/lib/utils";

/**
 * Paramètres → Partenaires : le RÉSEAU du vendeur (closeuses, livreurs,
 * transitaires). Un partenaire enrôlé ici (invitation) ou recruté depuis la
 * marketplace devient « reconnu » dans Kamoo : une fois ACTIF, il est
 * assignable partout (Closing / Livraisons / Expéditions). L'état vit dans le
 * store partagé `partners` → la même vérité côté console et côté espace
 * partenaires.
 */

type RoleMeta = {
  role: PartnerRole;
  plural: string;
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
};

const ROLES: RoleMeta[] = [
  {
    role: "closeuse",
    plural: "Closeuses",
    icon: Headphones,
    hint: "Confirment les commandes par appel. Une closeuse active alimente le pipeline Closing.",
  },
  {
    role: "livreur",
    plural: "Livreurs",
    icon: Bike,
    hint: "Livrent et encaissent en COD. Un livreur actif est assignable aux livraisons.",
  },
  {
    role: "transitaire",
    plural: "Transitaires",
    icon: Truck,
    hint: "Acheminent les colis Chine → Afrique. Un transitaire actif est sélectionnable sur une expédition.",
  },
];

/** Nom + avatar d'un profil marketplace, par rôle + slug. */
function resolveMarketplace(role: PartnerRole, slug: string): { name: string; avatarBg: string } | null {
  const src =
    role === "livreur" ? MOCK_LIVREURS : role === "closeuse" ? MOCK_CLOSEUSES : MOCK_TRANSITAIRES;
  const hit = src.find((x) => x.slug === slug);
  if (!hit) return null;
  return { name: hit.name, avatarBg: hit.avatarBg };
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default function PartenairesPage() {
  const {
    partners,
    getMembers,
    inviteMember,
    setMemberStatus,
    removeMember,
  } = usePartners();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState<PartnerRole>("livreur");

  const counts = useMemo(() => {
    const members = partners.members ?? [];
    const active =
      members.filter((m) => m.status === "actif").length +
      partners.livreurs.filter((p) => p.status === "active").length +
      partners.transitaires.filter((p) => p.status === "active").length +
      (partners.closeuse?.status === "active" ? 1 : 0);
    const pending =
      members.filter((m) => m.status === "invite").length +
      partners.livreurs.filter((p) => p.status === "pending").length +
      partners.transitaires.filter((p) => p.status === "pending").length +
      (partners.closeuse?.status === "pending" ? 1 : 0);
    return { active, pending, total: active + pending };
  }, [partners]);

  function marketplaceFor(role: PartnerRole): Partnership[] {
    if (role === "closeuse") return partners.closeuse ? [partners.closeuse] : [];
    return role === "livreur" ? partners.livreurs : partners.transitaires;
  }

  return (
    <SettingsCard>
      {/* Intro + action */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] leading-relaxed text-ink-600">
            Votre réseau de partenaires. Invitez les vôtres ou recrutez depuis la
            marketplace — une fois <span className="font-medium text-ink-900">actif</span>, un
            partenaire est reconnu dans Kamoo et devient assignable.
          </p>
          <div className="mt-2 flex items-center gap-4 text-[12px] text-ink-500">
            <span><span className="font-medium tabular-nums text-ink-900">{counts.active}</span> actif{counts.active > 1 ? "s" : ""}</span>
            <span><span className="font-medium tabular-nums text-ink-900">{counts.pending}</span> en attente</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-kamoo-blue-900 px-3.5 text-[13px] font-medium text-white transition hover:bg-kamoo-blue-800"
        >
          <UserPlus className="h-4 w-4" />
          Inviter un partenaire
        </button>
      </div>

      {ROLES.map((meta) => {
        const members = getMembers(meta.role);
        const market = marketplaceFor(meta.role);
        const isEmpty = members.length === 0 && market.length === 0;
        return (
          <SettingsSection key={meta.role} title={meta.plural} caption={meta.hint}>
            {isEmpty ? (
              <EmptyRow
                icon={meta.icon}
                onInvite={() => {
                  setInviteRole(meta.role);
                  setInviteOpen(true);
                }}
              />
            ) : (
              <>
                {members.map((m) => (
                  <MemberRow
                    key={m.id}
                    member={m}
                    onActivate={() => setMemberStatus(m.id, "actif")}
                    onSuspend={() => setMemberStatus(m.id, "suspendu")}
                    onReactivate={() => setMemberStatus(m.id, "actif")}
                    onRemove={() => {
                      if (
                        window.confirm(`Retirer ${m.name} de votre réseau ? Cette action est irréversible.`)
                      ) {
                        removeMember(m.id);
                      }
                    }}
                  />
                ))}
                {market.map((p) => (
                  <MarketplaceRow key={p.slug} role={meta.role} p={p} />
                ))}
              </>
            )}
          </SettingsSection>
        );
      })}

      {inviteOpen && (
        <InviteModal
          initialRole={inviteRole}
          onClose={() => setInviteOpen(false)}
          onInvite={inviteMember}
          onActivate={(id) => setMemberStatus(id, "actif")}
        />
      )}
    </SettingsCard>
  );
}

/* ─── Lignes ──────────────────────────────────────────────────────── */

function StatusPill({ status }: { status: PartnerMemberStatus }) {
  const tone =
    status === "actif"
      ? "bg-emerald-50 text-emerald-700"
      : status === "invite"
        ? "bg-amber-50 text-amber-700"
        : "bg-paper-2 text-ink-500";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium",
        tone,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "actif" ? "bg-emerald-500" : status === "invite" ? "bg-amber-500" : "bg-ink-400",
        )}
      />
      {PARTNER_MEMBER_STATUS_LABELS[status]}
    </span>
  );
}

function Avatar({ bg, name }: { bg: string; name: string }) {
  return (
    <span
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-medium text-white"
      style={{ background: bg }}
    >
      {initialsOf(name)}
    </span>
  );
}

function MemberRow({
  member,
  onActivate,
  onSuspend,
  onReactivate,
  onRemove,
}: {
  member: PartnerMember;
  onActivate: () => void;
  onSuspend: () => void;
  onReactivate: () => void;
  onRemove: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const sub = [member.phone, member.city].filter(Boolean).join(" · ");
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
      <Avatar bg={member.avatarBg} name={member.name} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13.5px] font-medium text-ink-900">{member.name}</span>
          <StatusPill status={member.status} />
        </div>
        {sub && (
          <div className="mt-0.5 flex items-center gap-1 truncate text-[11.5px] text-ink-500">
            <Phone className="h-3 w-3 text-ink-400" />
            {sub}
          </div>
        )}
        {member.status === "invite" && (
          <button
            type="button"
            onClick={() => {
              try {
                navigator.clipboard?.writeText(member.inviteCode);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              } catch {
                /* ignore */
              }
            }}
            className="mt-1.5 inline-flex items-center gap-1.5 rounded-md border border-line bg-paper-2/60 px-2 py-1 font-mono-kamoo text-[11.5px] font-medium tracking-wide text-ink-700 transition hover:bg-paper-2"
            title="Copier le code d'invitation"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-ink-400" />}
            {copied ? "Copié" : member.inviteCode}
          </button>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {member.status === "invite" && (
          <RowBtn onClick={onActivate} icon={Check} label="Activer" primary />
        )}
        {member.status === "actif" && <RowBtn onClick={onSuspend} icon={Ban} label="Suspendre" />}
        {member.status === "suspendu" && (
          <RowBtn onClick={onReactivate} icon={Play} label="Réactiver" primary />
        )}
        <button
          type="button"
          onClick={onRemove}
          className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-white text-ink-400 transition hover:bg-red-50 hover:text-red-600"
          aria-label="Retirer"
          title="Retirer du réseau"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function MarketplaceRow({ role, p }: { role: PartnerRole; p: Partnership }) {
  const prof = resolveMarketplace(role, p.slug);
  const name = prof?.name ?? p.slug;
  return (
    <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
      <Avatar bg={prof?.avatarBg ?? "linear-gradient(135deg,#94A3B8,#64748B)"} name={name} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13.5px] font-medium text-ink-900">{name}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-paper-2 px-1.5 py-0.5 text-[10px] font-medium text-ink-500">
            <Store className="h-2.5 w-2.5" /> Marketplace
          </span>
        </div>
        <div className="mt-0.5 text-[11.5px] text-ink-500">
          {p.status === "active" ? "Partenariat actif" : "En attente de validation"}
        </div>
      </div>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium",
          p.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", p.status === "active" ? "bg-emerald-500" : "bg-amber-500")} />
        {p.status === "active" ? "Actif" : "En attente"}
      </span>
    </div>
  );
}

function EmptyRow({
  icon: Icon,
  onInvite,
}: {
  icon: React.ComponentType<{ className?: string }>;
  onInvite: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-5 sm:px-5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-paper-2 text-ink-400">
        <Icon className="h-4 w-4" />
      </span>
      <p className="min-w-0 flex-1 text-[12.5px] text-ink-500">Aucun partenaire pour le moment.</p>
      <button
        type="button"
        onClick={onInvite}
        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[12px] font-medium text-ink-700 transition hover:bg-paper-2"
      >
        <UserPlus className="h-3.5 w-3.5 text-ink-400" />
        Inviter
      </button>
    </div>
  );
}

function RowBtn({
  onClick,
  icon: Icon,
  label,
  primary = false,
}: {
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-medium transition",
        primary
          ? "bg-kamoo-blue-900 text-white hover:bg-kamoo-blue-800"
          : "border border-line bg-white text-ink-700 hover:bg-paper-2",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

/* ─── Modale d'invitation ─────────────────────────────────────────── */

const ALL_SERVICES: LivreurService[] = ["livraison", "closing", "entreposage"];

function InviteModal({
  initialRole,
  onClose,
  onInvite,
  onActivate,
}: {
  initialRole: PartnerRole;
  onClose: () => void;
  onInvite: (input: {
    role: PartnerRole;
    name: string;
    phone: string;
    city?: string;
    zones?: string[];
    services?: LivreurService[];
  }) => PartnerMember;
  onActivate: (id: string) => void;
}) {
  const [role, setRole] = useState<PartnerRole>(initialRole);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [zones, setZones] = useState("");
  const [services, setServices] = useState<LivreurService[]>(["livraison"]);
  const [created, setCreated] = useState<PartnerMember | null>(null);
  const [copied, setCopied] = useState(false);

  const canSubmit = name.trim().length > 1 && phone.trim().length > 4;

  function submit() {
    if (!canSubmit) return;
    const m = onInvite({
      role,
      name,
      phone,
      city: city || undefined,
      zones: role === "livreur" ? zones.split(",") : undefined,
      services: role === "livreur" ? services : undefined,
    });
    setCreated(m);
  }

  const roleMeta = ROLES.find((r) => r.role === role)!;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-kamoo-blue-900/30 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-xl border border-line bg-white shadow-[var(--shadow-kamoo-lg)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h3 className="inline-flex items-center gap-2 text-[15px] font-medium text-ink-900">
            <UserPlus className="h-4 w-4 text-ink-400" />
            {created ? "Invitation créée" : "Inviter un partenaire"}
          </h3>
          <button
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-lg text-ink-400 transition hover:bg-paper-2 hover:text-ink-900"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {created ? (
          <div className="px-5 py-5">
            <p className="text-[13px] leading-relaxed text-ink-600">
              Transmettez ce code à <span className="font-medium text-ink-900">{created.name}</span>.
              Il le saisira dans l&apos;espace partenaires pour rejoindre votre réseau. En
              attendant, vous pouvez le marquer actif dès maintenant.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 rounded-lg border border-line bg-paper-2/50 px-4 py-3 text-center font-mono-kamoo text-[20px] font-medium tracking-[0.25em] text-ink-900">
                {created.inviteCode}
              </div>
              <button
                type="button"
                onClick={() => {
                  try {
                    navigator.clipboard?.writeText(created.inviteCode);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  } catch {
                    /* ignore */
                  }
                }}
                className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-line bg-white text-ink-500 transition hover:bg-paper-2"
                aria-label="Copier le code"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-line bg-white py-2.5 text-[13px] font-medium text-ink-700 transition hover:bg-paper-2"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  onActivate(created.id);
                  onClose();
                }}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-kamoo-blue-900 py-2.5 text-[13px] font-medium text-white transition hover:bg-kamoo-blue-800"
              >
                <Check className="h-4 w-4" />
                Marquer actif
              </button>
            </div>
          </div>
        ) : (
          <div className="px-5 py-4">
            {/* Rôle */}
            <div className="mb-3 grid grid-cols-3 gap-1.5">
              {ROLES.map((r) => {
                const Icon = r.icon;
                const active = role === r.role;
                return (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => setRole(r.role)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-[12px] font-medium transition",
                      active
                        ? "border-kamoo-blue-200 bg-kamoo-blue-50 text-kamoo-blue-900"
                        : "border-line bg-white text-ink-600 hover:bg-paper-2",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {r.plural.replace(/s$/, "")}
                  </button>
                );
              })}
            </div>

            <Field label="Nom complet">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex. Moussa Sow"
                className="h-9 w-full rounded-lg border border-line bg-white px-3 text-[13px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Téléphone">
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+221 77 000 00 00"
                  inputMode="tel"
                  className="h-9 w-full rounded-lg border border-line bg-white px-3 text-[13px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600"
                />
              </Field>
              <Field label="Ville">
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Dakar"
                  className="h-9 w-full rounded-lg border border-line bg-white px-3 text-[13px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600"
                />
              </Field>
            </div>

            {role === "livreur" && (
              <>
                <Field label="Zones desservies (séparées par des virgules)">
                  <input
                    value={zones}
                    onChange={(e) => setZones(e.target.value)}
                    placeholder="Almadies, Plateau, Yoff"
                    className="h-9 w-full rounded-lg border border-line bg-white px-3 text-[13px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600"
                  />
                </Field>
                <Field label="Services">
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_SERVICES.map((s) => {
                      const on = services.includes(s);
                      const isBase = s === "livraison";
                      return (
                        <button
                          key={s}
                          type="button"
                          disabled={isBase}
                          onClick={() =>
                            setServices((prev) =>
                              prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
                            )
                          }
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition",
                            on
                              ? "border-kamoo-blue-200 bg-kamoo-blue-50 text-kamoo-blue-900"
                              : "border-line bg-white text-ink-600 hover:bg-paper-2",
                            isBase && "opacity-70",
                          )}
                        >
                          {on && <Check className="h-3 w-3" />}
                          {LIVREUR_SERVICE_LABELS[s]}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </>
            )}

            <p className="mt-1 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-ink-400">
              <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
              {roleMeta.hint}
            </p>

            <div className="mt-4 flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-line bg-white py-2.5 text-[13px] font-medium text-ink-700 transition hover:bg-paper-2"
              >
                Annuler
              </button>
              <button
                disabled={!canSubmit}
                onClick={submit}
                className="flex-1 rounded-lg bg-kamoo-blue-900 py-2.5 text-[13px] font-medium text-white transition hover:bg-kamoo-blue-800 disabled:opacity-40"
              >
                Créer l&apos;invitation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-ink-400">
        {label}
      </label>
      {children}
    </div>
  );
}
