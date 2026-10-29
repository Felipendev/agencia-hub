"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { listFinancialEntriesRemote } from "@/lib/api/list-financial-entries-remote";
import type { LancamentoFinanceiro } from "@/types";

type Result = { key: string; attempt: number; rows: LancamentoFinanceiro[]; error: string | null };

/** The dashboard consults the server independently of the shared/local cache. */
export function useDashboardFinancial(enabled: boolean) {
  const { user, token, isReady, isOwner } = useAuth();
  const key = enabled && isReady && isOwner && user && token
    ? `${user.id}:${user.agencyId ?? ""}:${token}` : null;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const refresh = useCallback(() => setAttempt((current) => current + 1), []);

  useEffect(() => {
    if (!key || !token) return;
    const controller = new AbortController();
    let active = true;
    void listFinancialEntriesRemote(token, controller.signal).then((rows) => {
      if (active) setResult({ key, attempt, rows, error: null });
    }).catch(() => {
      if (active) setResult({ key, attempt, rows: [], error: "Não foi possível carregar o financeiro. Os valores não estão disponíveis." });
    });
    return () => { active = false; controller.abort(); };
  }, [key, token, attempt]);

  if (!enabled || !isReady) return { status: "loading" as const, rows: [], error: null, refresh, canRetry: false };
  if (!user || !token || !isOwner) return {
    status: "error" as const, rows: [], refresh, canRetry: false,
    error: "O financeiro está disponível somente para uma sessão de gestor da agência.",
  };
  // Hide old values on the first render of a new session or a refresh, before effects run.
  if (!key || result?.key !== key || result.attempt !== attempt) {
    return { status: "loading" as const, rows: [], error: null, refresh, canRetry: false };
  }
  return { status: result.error ? "error" as const : "ready" as const, rows: result.rows, error: result.error, refresh, canRetry: true };
}
