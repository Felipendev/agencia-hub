"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useData } from "@/contexts/data-context";
import type { Cotacao } from "@/types";

export type Notification = {
  id: string;
  type: "cotacao_vencendo" | "cotacao_vencida" | "submissao_nova";
  title: string;
  message: string;
  link?: string;
  createdAt: string;
  read: boolean;
  data?: unknown;
};

type NotificationContextValue = {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(
  null
);

const STORAGE_KEY = "agencia-hub-notifications";
const STORAGE_DISMISSED = "agencia-hub-dismissed-cotacoes";

function loadNotifications(): Notification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Notification[];
  } catch {
    return [];
  }
}

function saveNotifications(list: Notification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function loadDismissed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_DISMISSED);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveDismissed(set: Set<string>) {
  localStorage.setItem(STORAGE_DISMISSED, JSON.stringify([...set]));
}

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { cotacoes, isReady } = useData();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    setNotifications(loadNotifications());
    setDismissed(loadDismissed());
  }, []);

  useEffect(() => {
    if (!isReady) return;
    saveNotifications(notifications);
  }, [notifications, isReady]);

  useEffect(() => {
    if (!isReady) return;
    saveDismissed(dismissed);
  }, [dismissed, isReady]);

  // Verificar cotações vencendo/vencidas
  useEffect(() => {
    if (!isReady) return;

    const hoje = new Date().toISOString().slice(0, 10);
    const amanha = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const depois = new Date(Date.now() + 2 * 86400000)
      .toISOString()
      .slice(0, 10);

    const abertas = cotacoes.filter((c) =>
      ["aguardando", "em_cotacao", "aguardando_cliente"].includes(c.status)
    );

    const novas: Notification[] = [];

    for (const c of abertas) {
      const key = `cotacao-${c.id}-${c.validade}`;
      if (dismissed.has(key)) continue;

      if (c.validade < hoje) {
        novas.push({
          id: key,
          type: "cotacao_vencida",
          title: "Cotação vencida",
          message: `"${c.titulo}" venceu em ${new Date(c.validade).toLocaleDateString("pt-BR")}`,
          link: `/cotacoes/${c.id}`,
          createdAt: new Date().toISOString(),
          read: false,
          data: c,
        });
      } else if (c.validade === hoje) {
        novas.push({
          id: key,
          type: "cotacao_vencendo",
          title: "Cotação vence hoje",
          message: `"${c.titulo}" vence hoje!`,
          link: `/cotacoes/${c.id}`,
          createdAt: new Date().toISOString(),
          read: false,
          data: c,
        });
      } else if (c.validade === amanha || c.validade === depois) {
        novas.push({
          id: key,
          type: "cotacao_vencendo",
          title: "Cotação vencendo em breve",
          message: `"${c.titulo}" vence em ${new Date(c.validade).toLocaleDateString("pt-BR")}`,
          link: `/cotacoes/${c.id}`,
          createdAt: new Date().toISOString(),
          read: false,
          data: c,
        });
      }
    }

    if (novas.length > 0) {
      setNotifications((prev) => {
        const existing = new Set(prev.map((n) => n.id));
        const filtered = novas.filter((n) => !existing.has(n.id));
        return [...filtered, ...prev];
      });
    }
  }, [cotacoes, isReady, dismissed]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    const ids = notifications.map((n) => n.id);
    setDismissed((prev) => new Set([...prev, ...ids]));
    setNotifications([]);
  }, [notifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      clearAll,
    }),
    [notifications, unreadCount, markAsRead, markAllAsRead, clearAll]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used within NotificationProvider"
    );
  return ctx;
}
