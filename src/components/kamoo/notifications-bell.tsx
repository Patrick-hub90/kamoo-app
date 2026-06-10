"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  Clock,
  Inbox,
  Package,
  Ship,
  Wallet,
} from "lucide-react";
import {
  buildNotifications,
  type NotificationKind,
} from "@/lib/data/notifications";
import { useSessionStorageState } from "@/lib/hooks/use-session-storage-state";
import { MOCK_TODAY } from "@/lib/clock";
import { cn } from "@/lib/utils";

const KIND_STYLE: Record<
  NotificationKind,
  { icon: React.ComponentType<{ className?: string }>; tone: string }
> = {
  alerte_livraison: { icon: AlertTriangle, tone: "bg-red-50 text-red-600" },
  expedition: { icon: Ship, tone: "bg-kamoo-blue-50 text-kamoo-blue-700" },
  stock: { icon: Package, tone: "bg-amber-50 text-amber-600" },
  paiement: { icon: Wallet, tone: "bg-purple-50 text-purple-700" },
  rappel: { icon: Clock, tone: "bg-emerald-50 text-emerald-700" },
};

function relTime(iso: string): string {
  const diffMs = MOCK_TODAY.getTime() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60_000);
  if (mins < -1440) return `dans ${Math.round(-mins / 1440)} j`;
  if (mins < 0) return `dans ${Math.max(1, Math.round(-mins / 60))} h`;
  if (mins < 60) return `il y a ${Math.max(1, mins)} min`;
  if (mins < 1440) return `il y a ${Math.round(mins / 60)} h`;
  return `il y a ${Math.round(mins / 1440)} j`;
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useSessionStorageState<string[]>(
    "kamoo.notifications.read",
    [],
  );

  const notifications = useMemo(() => buildNotifications(), []);
  const unread = notifications.filter((n) => !readIds.includes(n.id));

  const markRead = (id: string) => {
    if (!readIds.includes(id)) setReadIds([...readIds, id]);
  };
  const markAllRead = () => setReadIds(notifications.map((n) => n.id));

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative grid h-9 w-9 place-items-center rounded-lg border border-line bg-white text-ink-500 transition hover:bg-paper-2 hover:text-ink-900"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unread.length > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[9.5px] font-bold text-white">
            {unread.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-[380px] overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-kamoo-lg)]">
            {/* En-tête */}
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <div className="text-[14px] font-bold text-ink-900">
                Notifications
                {unread.length > 0 && (
                  <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600">
                    {unread.length} non lue{unread.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {unread.length > 0 && (
                <button
                  onClick={markAllRead}
                  className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-kamoo-blue-700 hover:underline"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Tout marquer lu
                </button>
              )}
            </div>

            {/* Liste */}
            <div className="max-h-[420px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="grid place-items-center gap-2 px-4 py-10 text-center">
                  <Inbox className="h-7 w-7 text-ink-300" />
                  <p className="text-[12.5px] text-ink-400">Aucune notification.</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const st = KIND_STYLE[n.kind];
                  const isRead = readIds.includes(n.id);
                  return (
                    <Link
                      key={n.id}
                      href={n.href}
                      onClick={() => {
                        markRead(n.id);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex gap-3 border-b border-[#F4F5F6] px-4 py-3 transition last:border-0 hover:bg-paper-2/50",
                        !isRead && "bg-kamoo-blue-50/30",
                      )}
                    >
                      <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", st.tone)}>
                        <st.icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className={cn("truncate text-[12.5px]", isRead ? "font-medium text-ink-700" : "font-bold text-ink-900")}>
                            {n.title}
                          </span>
                          <span className="shrink-0 text-[10.5px] tabular-nums text-ink-400">{relTime(n.date)}</span>
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-[11.5px] leading-snug text-ink-500">{n.body}</span>
                      </span>
                      {!isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-kamoo-blue-600" />}
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
