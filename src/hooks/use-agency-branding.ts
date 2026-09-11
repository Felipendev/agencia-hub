"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";

/** Configuração autenticada; não reutiliza o cache local de outra agência. */
export function useAgencyBranding(enabled = true) {
  const { user, token } = useAuth();
  const [branding, setBranding] = useState<{ token: string; name?: string; logo?: string }>();
  useEffect(() => {
    if (!enabled || !token) return;
    const controller = new AbortController();
    void fetch("/api/app/solicitacao-config", {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    }).then((r) => r.ok ? r.json() : null).then((data) => {
      if (data?.config && !controller.signal.aborted) {
        setBranding({ token, name: data.config.nomeMarca?.trim(), logo: data.config.logoDataUrl || undefined });
      }
    }).catch(() => {});
    return () => controller.abort();
  }, [enabled, token]);
  const current = branding?.token === token ? branding : undefined;
  return { name: current?.name || user?.agencyName?.trim() || "", logo: current?.logo };
}
