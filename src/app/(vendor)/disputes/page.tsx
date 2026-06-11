"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageCircle,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/kamoo/page-header";
import { useChat } from "@/components/kamoo/chat";
import {
  canEscalate,
  msUntilEscalation,
  useDisputes,
  type Dispute,
} from "@/lib/hooks/use-disputes";
import { cn } from "@/lib/utils";

/**
 * Page Disputes — le centre de résolution des conflits entre partenaires.
 * Kamoo ne gère pas l'argent : il intervient en MÉDIATEUR, et seulement
 * après 72 h de tentative de résolution directe.
 */

const ROLE_LABEL = { closeuse: "Closeuse", transitaire: "Transitaire", livreur: "Livreur" } as const;

const ROLE_PROFILE_PATH = {
  closeuse: "/marketplace/closeurs",
  transitaire: "/marketplace/transitaires",
  livreur: "/marketplace/livreurs",
} as const;

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function Countdown({ d }: { d: Dispute }) {
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((x) => x + 1), 60_000);
    return () => clearInterval(t);
  }, []);
  const ms = msUntilEscalation(d);
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-paper-2 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-ink-600">
      <Clock className="h-3 w-3" />
      Kamoo activable dans {h} h {String(m).padStart(2, "0")} min
    </span>
  );
}

export default function DisputesPage() {
  const { disputes, resolve, escalate } = useDisputes();
  const { openChat } = useChat();
  const actives = disputes.filter((d) => d.status !== "reglee");
  const closed = disputes.filter((d) => d.status === "reglee");

  return (
    <div className="min-h-full bg-paper">
      <PageHeader kicker="Mon activité" title="Disputes" />

      <div className="mx-auto flex max-w-[1320px] flex-col gap-5 px-6 py-6">
        {/* Règles du jeu — courtes et claires */}
        <div className="rounded-2xl border border-line bg-white p-4 shadow-kamoo-sm">
          <div className="grid gap-3 text-[12.5px] leading-relaxed text-ink-600 sm:grid-cols-3">
            <div className="flex items-start gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-red-50 text-red-600"><AlertTriangle className="h-4 w-4" /></span>
              <span><b className="text-ink-900">1. Vous ouvrez la dispute.</b> Le profil du partenaire est publiquement marqué « En dispute ».</span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-600"><MessageCircle className="h-4 w-4" /></span>
              <span><b className="text-ink-900">2. 72 h pour régler entre vous</b> via le chat — la plupart des litiges se règlent là.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-kamoo-blue-50 text-kamoo-blue-700"><ShieldAlert className="h-4 w-4" /></span>
              <span><b className="text-ink-900">3. Kamoo intervient</b> après 72 h, à la demande de l&apos;une ou l&apos;autre partie.</span>
            </div>
          </div>
        </div>

        {/* Actives */}
        <section>
          <h2 className="mb-3 text-[15px] font-bold text-ink-900">
            En cours <span className="text-ink-400">({actives.length})</span>
          </h2>
          {actives.length === 0 ? (
            <div className="rounded-2xl border border-line bg-white px-5 py-10 text-center shadow-kamoo-sm">
              <ShieldCheck className="mx-auto h-8 w-8 text-emerald-500" />
              <p className="mt-2 text-[13.5px] font-semibold text-ink-900">Aucune dispute en cours</p>
              <p className="mt-1 text-[12.5px] text-ink-500">
                En cas de problème avec un partenaire, ouvrez une dispute depuis son profil
                ou depuis l&apos;expédition / la commande concernée.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {actives.map((d) => (
                <div key={d.id} className="rounded-2xl border border-red-200 bg-white p-5 shadow-kamoo-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[11.5px] font-bold text-red-600">
                          <AlertTriangle className="h-3 w-3" />
                          {d.status === "kamoo" ? "Kamoo est saisi" : "Dispute ouverte"}
                        </span>
                        <span className="text-[12px] text-ink-400">le {fmtDate(d.openedAt)}</span>
                        {d.status === "ouverte" && <Countdown d={d} />}
                        {d.status === "kamoo" && d.kamooAt && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-kamoo-blue-50 px-2 py-0.5 text-[11px] font-semibold text-kamoo-blue-700">
                            <ShieldAlert className="h-3 w-3" /> Médiation depuis le {fmtDate(d.kamooAt)}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-2 text-[15px] font-bold text-ink-900">
                        {d.reason} —{" "}
                        <Link href={`${ROLE_PROFILE_PATH[d.againstRole]}/${d.againstSlug}`} className="text-kamoo-blue-700 hover:underline">
                          {d.againstName}
                        </Link>{" "}
                        <span className="text-[12px] font-medium text-ink-400">({ROLE_LABEL[d.againstRole]})</span>
                      </h3>
                      {d.context && <div className="mt-0.5 text-[12px] font-semibold text-ink-500">{d.context}</div>}
                      <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-ink-600">{d.description}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3.5">
                    <button
                      onClick={() =>
                        openChat({
                          id: `${d.againstRole}:${d.againstSlug}`,
                          name: d.againstName,
                          role: d.againstRole,
                        })
                      }
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-kamoo-blue-900 px-3.5 text-[12.5px] font-semibold text-white transition hover:bg-kamoo-blue-800"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> Discuter pour régler
                    </button>
                    {d.status === "ouverte" && (
                      <button
                        disabled={!canEscalate(d)}
                        title={canEscalate(d) ? undefined : "Activable 72 h après l'ouverture"}
                        onClick={() => escalate(d.id)}
                        className={cn(
                          "inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-[12.5px] font-bold transition",
                          canEscalate(d)
                            ? "bg-kamoo-orange-500 text-white hover:bg-kamoo-orange-600"
                            : "cursor-not-allowed border border-line bg-paper-2 text-ink-400",
                        )}
                      >
                        <ShieldAlert className="h-3.5 w-3.5" /> Faire intervenir Kamoo
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (window.confirm("Marquer cette dispute comme réglée ? Le badge public disparaîtra.")) resolve(d.id);
                      }}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3.5 text-[12.5px] font-semibold text-emerald-700 transition hover:bg-emerald-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Problème réglé
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Historique */}
        {closed.length > 0 && (
          <section>
            <h2 className="mb-3 text-[15px] font-bold text-ink-900">
              Réglées <span className="text-ink-400">({closed.length})</span>
            </h2>
            <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-kamoo-sm">
              {closed.map((d, i) => (
                <div key={d.id} className={cn("flex flex-wrap items-center gap-3 px-5 py-3.5", i > 0 && "border-t border-line")}>
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-ink-900">
                      {d.reason} — {d.againstName}
                    </div>
                    <div className="text-[11.5px] text-ink-400">
                      Ouverte le {fmtDate(d.openedAt)} · réglée le {d.resolvedAt ? fmtDate(d.resolvedAt) : "—"}
                    </div>
                  </div>
                  {d.context && <span className="text-[11.5px] font-semibold text-ink-400">{d.context}</span>}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
