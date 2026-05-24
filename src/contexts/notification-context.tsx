"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useData } from "@/contexts/data-context";
import { useAuth } from "@/contexts/auth-context";
import {
  type NotifPrefs,
  DEFAULT_NOTIF_PREFS,
  loadNotifPrefs,
  saveNotifPrefs,
} from "@/lib/notif-prefs";

export type NotificationType =
  | "cotacao_vencendo"
  | "cotacao_vencida"
  | "submissao_nova"
  | "cotacao_aprovada"
  | "cliente_novo"
  | "lancamento_confirmado";

export type Notification = {
  id: string;
  type: NotificationType;
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
  prefs: NotifPrefs;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  updatePrefs: (patch: Partial<NotifPrefs>) => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

const STORAGE_NOTIFS   = "agencia-hub-notifications";
const STORAGE_DISMISSED = "agencia-hub-dismissed-cotacoes";

function loadNotifications(): Notification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_NOTIFS);
    if (!raw) return [];
    return JSON.parse(raw) as Notification[];
  } catch {
    return [];
  }
}

function saveNotifications(list: Notification[]) {
  localStorage.setItem(STORAGE_NOTIFS, JSON.stringify(list));
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

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { cotacoes, clientes, lancamentos, isReady } = useData();
  const { token } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>(() =>
    loadNotifications(),
  );
  const [dismissed, setDismissed] = useState<Set<string>>(() => loadDismissed());
  const [prefs, setPrefs] = useState<NotifPrefs>(() => loadNotifPrefs());

  // Refs to track previous state for change-detection
  const prevClienteIds = useRef<Set<string>>(new Set());
  const prevLancamentoIds = useRef<Set<string>>(new Set());
  const prevApprovedIds = useRef<Set<string>>(new Set());
  const prevSubmissionIds = useRef<Set<string>>(new Set());
  const submissionInitializedRef = useRef(false);
  const initializedRef = useRef(false);

  // Persist notifications
  useEffect(() => {
    if (!isReady) return;
    saveNotifications(notifications);
  }, [notifications, isReady]);

  // Persist dismissed
  useEffect(() => {
    if (!isReady) return;
    saveDismissed(dismissed);
  }, [dismissed, isReady]);

  function pushNotifs(novas: Notification[]) {
    if (novas.length === 0) return;
    setNotifications((prev) => {
      const existing = new Set(prev.map((n) => n.id));
      const filtered = novas.filter((n) => !existing.has(n.id));
      if (filtered.length === 0) return prev;
      return [...filtered, ...prev];
    });
  }

  // ── 1. Cotações vencendo/vencida ────────────────────────────────────────────
  useEffect(() => {
    if (!isReady) return;
    if (!prefs.cotacaoVencendo.enabled && !prefs.cotacaoVencida.enabled) return;

    const hoje = new Date().toISOString().slice(0, 10);
    const diasAntes = prefs.cotacaoVencendo.diasAntecedencia;
    const limiteMs = diasAntes * 86400000;

    const abertas = cotacoes.filter((c) =>
      ["aguardando", "em_cotacao", "aguardando_cliente"].includes(c.status),
    );

    const novas: Notification[] = [];

    for (const c of abertas) {
      const key = `cotacao-${c.id}-${c.validade}`;
      if (dismissed.has(key)) continue;

      const isVencida = c.validade < hoje;
      const isHoje = c.validade === hoje;
      const diffMs = new Date(c.validade).getTime() - Date.now();
      const isVencendo = !isVencida && !isHoje && diffMs > 0 && diffMs <= limiteMs;

      if (isVencida && prefs.cotacaoVencida.enabled) {
        novas.push({
          id: key,
          type: "cotacao_vencida",
          title: "Cotação vencida",
          message: `"${c.titulo}" venceu em ${new Date(c.validade + "T12:00:00").toLocaleDateString("pt-BR")}`,
          link: `/cotacoes/${c.id}`,
          createdAt: new Date().toISOString(),
          read: false,
          data: c,
        });
      } else if (isHoje && prefs.cotacaoVencendo.enabled) {
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
      } else if (isVencendo && prefs.cotacaoVencendo.enabled) {
        const diasRestantes = Math.ceil(diffMs / 86400000);
        novas.push({
          id: key,
          type: "cotacao_vencendo",
          title: "Cotação vencendo em breve",
          message: `"${c.titulo}" vence em ${diasRestantes} dia${diasRestantes > 1 ? "s" : ""}.`,
          link: `/cotacoes/${c.id}`,
          createdAt: new Date().toISOString(),
          read: false,
          data: c,
        });
      }
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    pushNotifs(novas);
  }, [cotacoes, isReady, dismissed, prefs.cotacaoVencendo, prefs.cotacaoVencida]);

  // ── 2. Cotação aprovada ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isReady || !prefs.cotacaoAprovada.enabled) return;

    const approved = cotacoes.filter((c) => c.status === "aprovado");
    const novas: Notification[] = [];

    for (const c of approved) {
      if (!initializedRef.current) continue; // skip initial load
      if (prevApprovedIds.current.has(c.id)) continue;
      const key = `aprovada-${c.id}`;
      if (dismissed.has(key)) continue;
      novas.push({
        id: key,
        type: "cotacao_aprovada",
        title: "Cotação aprovada!",
        message: `"${c.titulo}" foi aprovada pelo cliente.`,
        link: `/cotacoes/${c.id}`,
        createdAt: new Date().toISOString(),
        read: false,
        data: c,
      });
    }

    prevApprovedIds.current = new Set(approved.map((c) => c.id));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    pushNotifs(novas);
  }, [cotacoes, isReady, dismissed, prefs.cotacaoAprovada.enabled]);

  // ── 3. Novo cliente ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isReady || !prefs.clienteNovo.enabled) return;

    const novas: Notification[] = [];

    for (const c of clientes) {
      if (!initializedRef.current) continue;
      if (prevClienteIds.current.has(c.id)) continue;
      const key = `cliente-novo-${c.id}`;
      if (dismissed.has(key)) continue;
      novas.push({
        id: key,
        type: "cliente_novo",
        title: "Novo cliente cadastrado",
        message: `${c.nome} foi adicionado à sua base de clientes.`,
        link: `/clientes`,
        createdAt: new Date().toISOString(),
        read: false,
        data: c,
      });
    }

    prevClienteIds.current = new Set(clientes.map((c) => c.id));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    pushNotifs(novas);
  }, [clientes, isReady, dismissed, prefs.clienteNovo.enabled]);

  // ── 4. Lançamento confirmado ────────────────────────────────────────────────
  useEffect(() => {
    if (!isReady || !prefs.lancamentoConfirmado.enabled) return;

    const confirmados = lancamentos.filter((l) => l.status === "confirmado");
    const novas: Notification[] = [];

    for (const l of confirmados) {
      if (!initializedRef.current) continue;
      if (prevLancamentoIds.current.has(l.id)) continue;
      const key = `lanc-conf-${l.id}`;
      if (dismissed.has(key)) continue;
      const valorFmt = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(l.valor);
      novas.push({
        id: key,
        type: "lancamento_confirmado",
        title: `Lançamento confirmado`,
        message: `${l.tipo === "entrada" ? "Receita" : "Despesa"} de ${valorFmt} — ${l.descricao}`,
        link: `/financeiro`,
        createdAt: new Date().toISOString(),
        read: false,
        data: l,
      });
    }

    prevLancamentoIds.current = new Set(confirmados.map((l) => l.id));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    pushNotifs(novas);
  }, [lancamentos, isReady, dismissed, prefs.lancamentoConfirmado.enabled]);

  // Mark first-render complete AFTER all effects above have run
  useEffect(() => {
    if (!isReady) return;
    // Small delay so change-detection effects can finish seeding refs
    const t = setTimeout(() => { initializedRef.current = true; }, 500);
    return () => clearTimeout(t);
  }, [isReady]);

  // ── 5. Nova submissão pelo formulário público ────────────────────────────────
  useEffect(() => {
    if (!isReady || !token || !prefs.submissaoNova.enabled) return;

    async function checkSubmissions() {
      try {
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch("/api/app/solicitacao-submissions", {
          credentials: "include",
          headers,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { submissions?: Array<{ id: string; nome: string; slug: string }> };
        const subs = data.submissions ?? [];

        if (!submissionInitializedRef.current) {
          prevSubmissionIds.current = new Set(subs.map((s) => s.id));
          submissionInitializedRef.current = true;
          return;
        }

        const novas: Notification[] = [];
        for (const s of subs) {
          if (prevSubmissionIds.current.has(s.id)) continue;
          const key = `submissao-nova-${s.id}`;
          if (dismissed.has(key)) continue;
          novas.push({
            id: key,
            type: "submissao_nova",
            title: "Nova solicitação recebida",
            message: `${s.nome} preencheu o formulário público.`,
            link: `/cotacoes`,
            createdAt: new Date().toISOString(),
            read: false,
            data: s,
          });
        }
        prevSubmissionIds.current = new Set(subs.map((s) => s.id));
        pushNotifs(novas);
      } catch {
        /* rede indisponível — ignora */
      }
    }

    void checkSubmissions();
    const id = setInterval(() => void checkSubmissions(), 30_000);
    return () => clearInterval(id);
  }, [isReady, token, dismissed, prefs.submissaoNova.enabled]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
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

  const updatePrefs = useCallback((patch: Partial<NotifPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch } as NotifPrefs;
      saveNotifPrefs(next);
      return next;
    });
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount,
      prefs,
      markAsRead,
      markAllAsRead,
      clearAll,
      updatePrefs,
    }),
    [notifications, unreadCount, prefs, markAsRead, markAllAsRead, clearAll, updatePrefs],
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
    throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}

// ── Default prefs re-export for use in settings UI ─────────────────────────
export { DEFAULT_NOTIF_PREFS };
export type { NotifPrefs };
