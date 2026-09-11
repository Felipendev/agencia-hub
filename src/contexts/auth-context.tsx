"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { getAgenciaHubApiBaseUrl } from "@/lib/api/agencia-hub-env";
import type { ApiLoginResponse } from "@/lib/api/auth-types";
import type { UsuarioSessao } from "@/types";
import { sessionTiming, shouldRenew } from "@/lib/session-activity";

const AUTH_COOKIE   = "ah_auth";
const STORAGE_USER  = "agencia-hub-user";
const STORAGE_TOKEN = "agencia-hub-token";

// All app data keys that must be wiped when the user session changes
const APP_DATA_KEYS = [
  "agencia-hub-data",
  "agencia-hub-notifications",
  "agencia-hub-dismissed-cotacoes",
];

type AuthContextValue = {
  user: UsuarioSessao | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string; code?: string; email?: string }>;
  logout: () => void;
  /** Update auth context state after an out-of-band verification (e.g. email verify page). */
  applySession: (user: UsuarioSessao, token: string) => void;
  isReady: boolean;
  isOwner: boolean;
  isSeller: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Cookie helpers ───────────────────────────────────────────────────────────

function setCookie(name: string, value: string, days: number) {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

const ROLE_COOKIE = "ah_role";

// ─── JWT helpers ─────────────────────────────────────────────────────────────

/** Returns the token's expiry timestamp in ms, or null if unreadable. */
function readJwtExp(token: string): number | null {
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(b64)) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const exp = readJwtExp(token);
  return exp !== null && exp < Date.now();
}

// ─── Storage helpers ─────────────────────────────────────────────────────────

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

function clearAppData() {
  for (const key of APP_DATA_KEYS) {
    localStorage.removeItem(key);
  }
}

function persistSession(user: UsuarioSessao, token: string) {
  localStorage.setItem(STORAGE_USER, JSON.stringify(user));
  localStorage.setItem(STORAGE_TOKEN, token);
  setCookie(AUTH_COOKIE, "1", 7);
  setCookie(ROLE_COOKIE, user.accountKind, 7);
}

function clearSession() {
  localStorage.removeItem(STORAGE_USER);
  localStorage.removeItem(STORAGE_TOKEN);
  clearAppData();
  deleteCookie(AUTH_COOKIE);
  deleteCookie(ROLE_COOKIE);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]   = useState<UsuarioSessao | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const lastActivity = useRef(0);

  // Initialise from localStorage
  useEffect(() => {
    const u = readUserFromStorage();
    const t = readTokenFromStorage();
    if (u && t) {
      if (isTokenExpired(t)) {
        clearSession();
      } else {
        setUser(u);
        setToken(t);
        setCookie(AUTH_COOKIE, "1", 7);
      }
    }
    setIsReady(true);
  }, []);

  // Cross-tab sync: when the token changes in another tab, mirror the session
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key !== STORAGE_TOKEN) return;
      if (e.newValue) {
        const u = readUserFromStorage();
        if (u) {
          setUser(u);
          setToken(e.newValue);
          setCookie(AUTH_COOKIE, "1", 7);
        }
      } else {
        setUser(null);
        setToken(null);
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const applySession = useCallback((sessao: UsuarioSessao, tok: string) => {
    lastActivity.current = Date.now();
    clearAppData();
    persistSession(sessao, tok);
    setUser(sessao);
    setToken(tok);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<{ ok: boolean; error?: string; code?: string; email?: string }> => {
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
            const errData = data as { message?: string; code?: string; email?: string } | null;
            const msg   = errData?.message ?? "Credenciais inválidas.";
            const code  = errData?.code;
            const email = errData?.email;
            return { ok: false, error: msg, code, email };
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

          clearAppData();
          lastActivity.current = Date.now();
          persistSession(sessao, data.token);
          setUser(sessao);
          setToken(data.token);
          return { ok: true };
        } catch {
          return { ok: false, error: "Erro de conexão com o servidor." };
        }
      }

      // ── Mock login (somente desenvolvimento/teste) ───────────────────────
      if (process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "test") {
        return {
          ok: false,
          error: "Serviço de autenticação não configurado. Tente novamente mais tarde.",
        };
      }
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
      clearAppData();
      persistSession(sessao, mockToken);
      setUser(sessao);
      setToken(mockToken);
      return { ok: true };
    },
    [],
  );

  const logout = useCallback(() => {
    const currentToken = readTokenFromStorage();
    const base = getAgenciaHubApiBaseUrl();
    if (base && currentToken) {
      void fetch(`${base}/auth/logout`, {
        method: "POST", headers: { Authorization: `Bearer ${currentToken}` }, keepalive: true,
      }).catch(() => {});
    }
    clearSession();
    setUser(null);
    setToken(null);
  }, []);

  // Only real foreground interaction counts. Polling and an open tab cannot keep a session alive.
  useEffect(() => {
    if (!user || !token || !getAgenciaHubApiBaseUrl()) return;
    let pending = false;
    let stopped = false;
    let retryAfter = 0;
    const abort = new AbortController();
    async function tick() {
      if (stopped || pending || readTokenFromStorage() !== token) return;
      const now = Date.now();
      const timing = sessionTiming(token!);
      if (!timing || now >= timing.expiresAt) { logout(); return; }
      if (now < retryAfter || !shouldRenew(token!, now, lastActivity.current, document.visibilityState === "visible")) return;
      pending = true;
      retryAfter = now + 15_000;
      try {
        const response = await fetch(`${getAgenciaHubApiBaseUrl()}/auth/session/renew`, {
          method: "POST", headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.any([abort.signal, AbortSignal.timeout(10_000)]),
        });
        if (stopped || readTokenFromStorage() !== token) return;
        if (response.status === 401 || response.status === 403) { logout(); return; }
        if (!response.ok) return;
        const data = await response.json() as { token?: string };
        if (!stopped && readTokenFromStorage() === token && data.token && data.token !== token) {
          // Renewal preserves cached app data and must never resurrect a logged-out session.
          persistSession(user!, data.token);
          setToken(data.token);
        }
      } catch { /* transient failures retry while the access token is still valid */ }
      finally { pending = false; }
    }
    function activity(event: Event) {
      if (event.isTrusted && document.visibilityState === "visible") {
        lastActivity.current = Date.now();
        void tick();
      }
    }
    const events = ["pointerdown", "keydown", "scroll", "touchstart"];
    events.forEach((name) => window.addEventListener(name, activity, { passive: true }));
    const timer = setInterval(() => void tick(), 5_000);
    return () => {
      stopped = true;
      abort.abort();
      clearInterval(timer);
      events.forEach((name) => window.removeEventListener(name, activity));
    };
  }, [user, token, logout]);

  // Listen for 401 responses dispatched by apiFetch and log the user out
  useEffect(() => {
    function handleUnauthorized(event: Event) {
      const rejectedToken = (event as CustomEvent<string | undefined>).detail;
      if (!rejectedToken || rejectedToken === readTokenFromStorage()) logout();
    }
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [logout]);

  const isOwner = user?.accountKind === "AGENCY_OWNER";
  const isSeller = user?.accountKind === "SALES_AGENT";

  const value = useMemo(
    () => ({ user, token, login, logout, applySession, isReady, isOwner, isSeller }),
    [user, token, login, logout, applySession, isReady, isOwner, isSeller],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
