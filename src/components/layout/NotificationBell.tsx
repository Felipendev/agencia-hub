"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useNotifications } from "@/contexts/notification-context";
import { BellIcon } from "@/components/icons";

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
        className="relative rounded-lg p-2 transition-colors hover:bg-slate-100"
        aria-label="Notificações"
      >
        <BellIcon className="h-5 w-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-[var(--hub-border)] bg-white shadow-xl sm:w-96">
          <div className="flex items-center justify-between border-b border-[var(--hub-border)] px-4 py-3">
            <h3 className="font-semibold text-[var(--hub-blue-dark)]">
              Notificações
            </h3>
            {notifications.length > 0 && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    markAllAsRead();
                  }}
                  className="text-xs text-[var(--hub-blue)] hover:underline"
                >
                  Marcar todas como lidas
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearAll();
                  }}
                  className="text-xs text-slate-500 hover:underline"
                >
                  Limpar
                </button>
              </div>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                Nenhuma notificação no momento
              </div>
            ) : (
              <ul>
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`border-b border-[var(--hub-border)] last:border-b-0 ${
                      n.read ? "bg-white" : "bg-sky-50/50"
                    }`}
                  >
                    {n.link ? (
                      <Link
                        href={n.link}
                        onClick={() => {
                          markAsRead(n.id);
                          setOpen(false);
                        }}
                        className="block px-4 py-3 transition-colors hover:bg-slate-50"
                      >
                        <NotificationContent notification={n} />
                      </Link>
                    ) : (
                      <div
                        className="px-4 py-3"
                        onClick={() => markAsRead(n.id)}
                      >
                        <NotificationContent notification={n} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationContent({
  notification,
}: {
  notification: { title: string; message: string; createdAt: string };
}) {
  const timeAgo = getTimeAgo(notification.createdAt);

  return (
    <div>
      <p className="text-sm font-semibold text-[var(--hub-blue-dark)]">
        {notification.title}
      </p>
      <p className="mt-0.5 text-sm text-slate-700">{notification.message}</p>
      <p className="mt-1 text-xs text-slate-500">{timeAgo}</p>
    </div>
  );
}

function getTimeAgo(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Agora";
  if (minutes < 60) return `${minutes}min atrás`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d atrás`;

  return new Date(isoDate).toLocaleDateString("pt-BR");
}
