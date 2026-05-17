"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Trash2, FileText, Users, Wallet, TrendingUp, AlertCircle } from "lucide-react";
import { useNotifications } from "@/contexts/notification-context";

type NotifIcon = "file" | "users" | "wallet" | "trend" | "alert";

function getIconKey(title: string): NotifIcon {
  if (/cota/i.test(title)) return "file";
  if (/client/i.test(title)) return "users";
  if (/financ|transf|lanç/i.test(title)) return "wallet";
  if (/meta|receita|aprovad/i.test(title)) return "trend";
  return "alert";
}

const ICON_MAP: Record<NotifIcon, { icon: React.ElementType; bg: string; color: string }> = {
  file:   { icon: FileText,    bg: "bg-sky-100",     color: "text-sky-600"    },
  users:  { icon: Users,       bg: "bg-violet-100",  color: "text-violet-600" },
  wallet: { icon: Wallet,      bg: "bg-emerald-100", color: "text-emerald-600"},
  trend:  { icon: TrendingUp,  bg: "bg-amber-100",   color: "text-amber-600"  },
  alert:  { icon: AlertCircle, bg: "bg-red-100",     color: "text-red-600"    },
};

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-[var(--hub-radius)] text-[var(--hub-text-secondary)] transition-all duration-150 hover:bg-[var(--hub-bg-subtle)] hover:text-[var(--hub-text-primary)]"
        aria-label="Notificações"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--hub-primary)] opacity-50" />
            <span className="relative h-2 w-2 rounded-full bg-[var(--hub-primary)]" />
          </span>
        )}
      </button>

      {open && (
        <div className="animate-scale-in absolute right-0 top-full z-50 mt-2 w-[360px] overflow-hidden rounded-[var(--hub-radius-lg)] border border-[var(--hub-border)] bg-white shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--hub-border)] px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[var(--hub-text-primary)]">Notificações</h3>
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--hub-primary)] px-1.5 text-[10px] font-semibold text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={markAllAsRead}
                  title="Marcar todas como lidas"
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[var(--hub-text-secondary)] transition-colors hover:bg-[var(--hub-bg-subtle)] hover:text-[var(--hub-text-primary)]"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Lidas</span>
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  title="Limpar notificações"
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[var(--hub-text-secondary)] transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--hub-bg-subtle)]">
                  <Bell className="h-6 w-6 text-[var(--hub-text-muted)]" />
                </div>
                <p className="text-sm text-[var(--hub-text-muted)]">Nenhuma notificação</p>
                <p className="text-xs text-[var(--hub-text-muted)]">Você está em dia!</p>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--hub-border)]">
                {notifications.map((n) => {
                  const iconKey = getIconKey(n.title);
                  const { icon: Icon, bg, color } = ICON_MAP[iconKey];
                  return (
                    <li
                      key={n.id}
                      className={`transition-colors duration-150 ${n.read ? "bg-white hover:bg-[var(--hub-bg-subtle)]/60" : "bg-sky-50/50 hover:bg-sky-50"}`}
                    >
                      {n.link ? (
                        <Link
                          href={n.link}
                          onClick={() => { markAsRead(n.id); setOpen(false); }}
                          className="flex gap-3 px-4 py-3"
                        >
                          <NotifItemContent Icon={Icon} bg={bg} color={color} n={n} read={n.read} />
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className="flex w-full gap-3 px-4 py-3 text-left"
                          onClick={() => markAsRead(n.id)}
                        >
                          <NotifItemContent Icon={Icon} bg={bg} color={color} n={n} read={n.read} />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-[var(--hub-border)] bg-[var(--hub-bg-subtle)]/50 px-4 py-2">
              <p className="text-center text-[10px] font-medium text-[var(--hub-text-muted)]">
                {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}` : "Tudo em dia ✓"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NotifItemContent({
  Icon, bg, color, n, read,
}: {
  Icon: React.ElementType;
  bg: string;
  color: string;
  n: { title: string; message: string; createdAt: string };
  read: boolean;
}) {
  return (
    <>
      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${bg}`}>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm leading-snug ${read ? "font-normal text-[var(--hub-text-primary)]" : "font-semibold text-[var(--hub-text-primary)]"}`}>
            {n.title}
          </p>
          {!read && (
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--hub-primary)]" />
          )}
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-[var(--hub-text-secondary)]">
          {n.message}
        </p>
        <p className="mt-1 text-[10px] text-[var(--hub-text-muted)]">{getTimeAgo(n.createdAt)}</p>
      </div>
    </>
  );
}

function getTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Agora";
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d atrás`;
  return new Date(isoDate).toLocaleDateString("pt-BR");
}
