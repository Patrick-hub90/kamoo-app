"use client";

/**
 * Chat in-app Kamoo — V1 démo.
 *
 * Tous les échanges avec les PARTENAIRES de la plateforme (closeuse,
 * transitaire, livreur, support) passent par ici : aucun numéro / canal
 * externe n'est exposé pour eux. Les clients finaux, eux, restent joignables
 * par téléphone/WhatsApp (c'est le métier du COD).
 *
 * Architecture : un contexte global `useChat()` + un drawer monté une fois
 * dans le layout vendeur. `openChat(partner)` crée la conversation à la
 * volée si elle n'existe pas. Les messages vivent en mémoire (démo) ; en V2
 * ils seront persistés (table messages + realtime).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  Headset,
  MessageCircle,
  Send,
  X,
} from "lucide-react";
import { MOCK_TODAY, shiftToNow } from "@/lib/clock";
import { cn } from "@/lib/utils";

/* ─── Types ──────────────────────────────────────────────────────── */

export type ChatRole = "support" | "closeuse" | "transitaire" | "livreur";

export type ChatPartner = {
  id: string;
  name: string;
  role: ChatRole;
  /** Photo si dispo, sinon initiales sur fond coloré */
  photoUrl?: string;
  avatarBg?: string;
};

type ChatMessage = {
  id: string;
  from: "me" | "them";
  text: string;
  at: string; // ISO
};

type Conversation = {
  partner: ChatPartner;
  messages: ChatMessage[];
};

const ROLE_LABELS: Record<ChatRole, string> = {
  support: "Support Kamoo",
  closeuse: "Closeuse",
  transitaire: "Transitaire",
  livreur: "Livreur",
};

/* ─── Conversations initiales (démo) ─────────────────────────────── */

const SEED_CONVERSATIONS: Conversation[] = [
  {
    partner: {
      id: "support",
      name: "Support Kamoo",
      role: "support",
      avatarBg: "linear-gradient(135deg,#0F2A52,#1E4D8C)",
    },
    messages: [
      {
        id: "s1",
        from: "them",
        text: "Bienvenue sur Kamoo 👋 Notre équipe est là 7j/7 pour vous accompagner. Posez-nous vos questions !",
        at: shiftToNow("2026-05-02T09:00:00Z"),
      },
    ],
  },
  {
    partner: {
      id: "closeuse:aminata-sene",
      name: "Aminata Sène",
      role: "closeuse",
      photoUrl: "/closeuses/aminata-sene.jpg",
    },
    messages: [
      {
        id: "c1",
        from: "them",
        text: "Bonjour ! J'ai confirmé 3 commandes ce matin. ORD-SN-00130 demande une livraison cet après-midi entre 15h et 16h.",
        at: shiftToNow("2026-05-04T10:15:00Z"),
      },
      {
        id: "c2",
        from: "me",
        text: "Parfait, je préviens le livreur. Merci Aminata 🙏",
        at: shiftToNow("2026-05-04T10:22:00Z"),
      },
    ],
  },
  {
    partner: {
      id: "transitaire:liang-wei-trading",
      name: "Liang Wei Trading",
      role: "transitaire",
      avatarBg: "linear-gradient(135deg,#1E40AF,#0EA5E9)",
    },
    messages: [
      {
        id: "t1",
        from: "them",
        text: "Votre devis pour l'expédition KMO-SN-78421 est prêt : 245 000 F CFA (maritime, 22-28 jours). Vous pouvez le régler depuis l'onglet Devis.",
        at: shiftToNow("2026-05-03T14:30:00Z"),
      },
    ],
  },
];

/* ─── Réponses auto (démo) ───────────────────────────────────────── */

const AUTO_REPLY: Record<ChatRole, string> = {
  support: "Merci pour votre message ! Un conseiller Kamoo vous répond sous quelques minutes.",
  closeuse: "Bien reçu 👍 Je vous tiens au courant dès que c'est traité.",
  transitaire: "Bien noté. Nous revenons vers vous rapidement avec les détails.",
  livreur: "C'est noté chef ! Je vous fais signe dès que c'est fait.",
};

/* ─── Contexte ───────────────────────────────────────────────────── */

type ChatContextValue = {
  openChat: (partner?: ChatPartner) => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat doit être utilisé sous <ChatProvider>");
  return ctx;
}

/* ─── Provider + Drawer ──────────────────────────────────────────── */

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>(SEED_CONVERSATIONS);
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const idRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const openChat = useCallback((partner?: ChatPartner) => {
    if (partner) {
      setConversations((prev) => {
        if (prev.some((c) => c.partner.id === partner.id)) return prev;
        return [
          ...prev,
          {
            partner,
            messages: [
              {
                id: `welcome-${partner.id}`,
                from: "them",
                text: `Bonjour ! Vous êtes en contact avec ${partner.name}. Comment pouvons-nous vous aider ?`,
                at: MOCK_TODAY.toISOString(),
              },
            ],
          },
        ];
      });
      setActiveId(partner.id);
    } else {
      setActiveId(null);
    }
    setOpen(true);
  }, []);

  const send = useCallback(() => {
    const text = draft.trim();
    if (!text || !activeId) return;
    setDraft("");
    idRef.current += 1;
    const msgId = `m${idRef.current}`;
    setConversations((prev) =>
      prev.map((c) =>
        c.partner.id === activeId
          ? {
              ...c,
              messages: [
                ...c.messages,
                { id: msgId, from: "me", text, at: new Date().toISOString() },
              ],
            }
          : c,
      ),
    );
    // Réponse auto (démo) après un court délai
    setTimeout(() => {
      setConversations((prev) =>
        prev.map((c) =>
          c.partner.id === activeId
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  {
                    id: `${msgId}-r`,
                    from: "them",
                    text: AUTO_REPLY[c.partner.role],
                    at: new Date().toISOString(),
                  },
                ],
              }
            : c,
        ),
      );
    }, 1400);
  }, [draft, activeId]);

  const active = conversations.find((c) => c.partner.id === activeId) ?? null;

  // Scroll en bas à chaque nouveau message / ouverture de fil
  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [active?.messages.length, activeId, open]);

  return (
    <ChatContext.Provider value={{ openChat }}>
      {children}

      {open && (
        <div className="fixed inset-0 z-[70]" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-kamoo-blue-900/20" />
          <aside
            className="absolute bottom-0 right-0 top-0 flex w-full max-w-[400px] flex-col border-l border-line bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── En-tête ── */}
            <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-line px-4">
              {active ? (
                <>
                  <button
                    onClick={() => setActiveId(null)}
                    className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 transition hover:bg-paper-2 hover:text-ink-900"
                    aria-label="Retour aux conversations"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <Avatar partner={active.partner} size={9} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-bold text-ink-900">{active.partner.name}</div>
                    <div className="text-[10.5px] text-ink-400">{ROLE_LABELS[active.partner.role]}</div>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center gap-2 text-[14.5px] font-bold text-ink-900">
                  <MessageCircle className="h-4 w-4 text-kamoo-blue-700" />
                  Messages
                </div>
              )}
              <button
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 transition hover:bg-paper-2 hover:text-ink-900"
                aria-label="Fermer le chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ── Corps ── */}
            {active ? (
              <>
                <div ref={scrollRef} className="flex-1 overflow-y-auto bg-paper px-4 py-4">
                  <div className="flex flex-col gap-2.5">
                    {active.messages.map((m) => (
                      <div key={m.id} className={cn("flex", m.from === "me" ? "justify-end" : "justify-start")}>
                        <div
                          className={cn(
                            "max-w-[80%] rounded-2xl px-3.5 py-2 text-[12.5px] leading-relaxed",
                            m.from === "me"
                              ? "rounded-br-md bg-kamoo-blue-900 text-white"
                              : "rounded-bl-md border border-line bg-white text-ink-800",
                          )}
                        >
                          {m.text}
                          <div className={cn("mt-1 text-right text-[9.5px] tabular-nums", m.from === "me" ? "text-white/50" : "text-ink-300")}>
                            {new Date(m.at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Saisie */}
                <div className="shrink-0 border-t border-line bg-white p-3">
                  <div className="flex items-end gap-2">
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          send();
                        }
                      }}
                      rows={1}
                      placeholder="Écrire un message…"
                      className="max-h-28 min-h-[40px] flex-1 resize-none rounded-xl border border-line bg-paper-2/40 px-3 py-2.5 text-[12.5px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-kamoo-blue-600 focus:bg-white"
                    />
                    <button
                      onClick={send}
                      disabled={!draft.trim()}
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-kamoo-blue-900 text-white transition hover:bg-kamoo-blue-800 disabled:opacity-40"
                      aria-label="Envoyer"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-1.5 text-center text-[9.5px] text-ink-300">
                    Échanges protégés par Kamoo · restez sur la plateforme
                  </p>
                </div>
              </>
            ) : (
              /* Liste des conversations */
              <div className="flex-1 overflow-y-auto">
                {conversations.map((c) => {
                  const last = c.messages[c.messages.length - 1];
                  return (
                    <button
                      key={c.partner.id}
                      onClick={() => setActiveId(c.partner.id)}
                      className="flex w-full items-center gap-3 border-b border-[#F4F5F6] px-4 py-3 text-left transition hover:bg-paper-2/50"
                    >
                      <Avatar partner={c.partner} size={11} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-[13px] font-bold text-ink-900">{c.partner.name}</span>
                          <span className="shrink-0 text-[10px] tabular-nums text-ink-400">
                            {new Date(last.at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </span>
                        <span className="mt-0.5 block truncate text-[11.5px] text-ink-500">
                          {last.from === "me" ? "Vous : " : ""}
                          {last.text}
                        </span>
                      </span>
                    </button>
                  );
                })}
                <div className="px-4 py-6 text-center text-[11px] leading-relaxed text-ink-400">
                  <Headset className="mx-auto mb-1.5 h-4 w-4" />
                  Les échanges avec vos partenaires Kamoo se font ici,
                  <br />
                  en toute sécurité.
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </ChatContext.Provider>
  );
}

function Avatar({ partner, size }: { partner: ChatPartner; size: 9 | 11 }) {
  const cls = size === 9 ? "h-9 w-9" : "h-11 w-11";
  if (partner.photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={partner.photoUrl} alt="" className={cn(cls, "shrink-0 rounded-full object-cover")} />
    );
  }
  return (
    <span
      className={cn(cls, "grid shrink-0 place-items-center rounded-full text-[12px] font-bold text-white")}
      style={{ background: partner.avatarBg ?? "linear-gradient(135deg,#0F2A52,#1E4D8C)" }}
    >
      {partner.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
    </span>
  );
}
