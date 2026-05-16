"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";
import type { ApiLoginResponse } from "@/lib/api/auth-types";
import type { UsuarioSessao } from "@/types";

const AUTH_COOKIE   = "ah_auth";
const STORAGE_USER  = "agencia-hub-user";
const STORAGE_TOKEN = "agencia-hub-token";

type AuthContextValue = {
  user: UsuarioSessao | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string; code?: string }>;
  logout: () => void;
  isReady: boolean;
  isOwner: boolean;
  isSeller: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Cookie helpers ───────────────────────────────────────────────────────────

function setCookie(name: string, value: string, days: number) {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

function readUserFromStorage(): UsuarioSessao | null {
  try {
    const raw = localStorage.getItem(STORAGE_USER);
    if (!raw) return null;
    return JSON.parse(raw) as UsuarioSessao;
  } catch {
    return null;
  }
}

function readTokenFromStorage(): string | null {
  try {
    return localStorage.getItem(STORAGE_TOKEN);
  } catch {
    return null;
  }
}

function persistSession(user: UsuarioSessao, token: string) {
  localStorage.setItem(STORAGE_USER, JSON.stringify(user));
  localStorage.setItem(STORAGE_TOKEN, token);
  setCookie(AUTH_COOKIE, "1", 7);
}

function clearSession() {
  localStorage.removeItem(STORAGE_USER);
  localStorage.removeItem(STORAGE_TOKEN);
  deleteCookie(AUTH_COOKIE);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]   = useState<UsuarioSessao | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const u = readUserFromStorage();
    const t = readTokenFromStorage();
    if (u) {
      setUser(u);
      setToken(t);
      setCookie(AUTH_COOKIE, "1", 7);
    }
    setIsReady(true);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<{ ok: boolean; error?: string; code?: string }> => {
      const trimmed = email.trim();
      if (!trimmed || !password) {
        return { ok: false, error: "Preencha e-mail e senha." };
      }

      const base = getAgenciaHubApiBaseUrl();

      // ── Real API login ────────────────────────────────────────────────────
      if (base) {
        try {
          const res = await fetch(`${base}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: trimmed, password }),
          });

          const data = (await res.json().catch(() => null)) as ApiLoginResponse | null;

          if (!res.ok || !data?.token) {
            const errData = data as { message?: string; code?: string } | null;
            const msg  = errData?.message ?? "Credenciais inválidas.";
            const code = errData?.code;
            return { ok: false, error: msg, code };
          }

          const sessao: UsuarioSessao = {
            id: data.userId,
            email: data.email,
            nome: data.name,
            empresa: data.agencyName ?? "AgênciasHub",
            accountKind: data.accountKind,
            agencyId: data.agencyId,
            agencyName: data.agencyName,
            agencyStatus: data.agencyStatus,
            subscriptionStatus: data.subscriptionStatus,
            trialEndsAt: data.trialEndsAt,
            requiresTermsAcceptance: data.requiresTermsAcceptance,
            mustChangePassword: data.mustChangePassword,
            linkPublicCode: data.publicLinkCode,
          };

          persistSession(sessao, data.token);
          setUser(sessao);
          setToken(data.token);
          return { ok: true };
        } catch {
          return { ok: false, error: "Erro de conexão com o servidor." };
        }
      }

      // ── Mock login (sem API configurada) ──────────────────────────────────
      const local = trimmed.split("@")[0]?.replace(/\./g, " ") ?? "Usuário";
      const nome  = local.charAt(0).toUpperCase() + local.slice(1);
      const sessao: UsuarioSessao = {
        id: "mock-owner",
        email: trimmed,
        nome,
        empresa: "Minha Agência",
        accountKind: "AGENCY_OWNER",
      };
      const mockToken = "mock-token";
      persistSession(sessao, mockToken);
      setUser(sessao);
      setToken(mockToken);
      return { ok: true };
    },
    [],
  );

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setToken(null);
  }, []);

  const isOwner = user?.accountKind === "AGENCY_OWNER";
  const isSeller = user?.accountKind === "SALES_AGENT";

  const value = useMemo(
    () => ({ user, token, login, logout, isReady, isOwner, isSeller }),
    [user, token, login, logout, isReady, isOwner, isSeller],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
