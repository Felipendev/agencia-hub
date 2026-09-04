"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";

const IDLE_LIMIT_MS  = 30 * 60 * 1000;  // 30 min → logout
const WARN_BEFORE_MS =  5 * 60 * 1000;  // warn 5 min before logout

const ACTIVITY_EVENTS: (keyof DocumentEventMap)[] = [
  "mousemove", "mousedown", "keydown", "touchstart", "scroll", "click",
];

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function IdleTimeout() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showWarning, setShowWarning]   = useState(false);
  const [secondsLeft, setSecondsLeft]   = useState(WARN_BEFORE_MS / 1000);
  const warnedAtRef     = useRef<number | null>(null);
  const expiredRef      = useRef(false);
  const warnTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (warnTimerRef.current)   clearTimeout(warnTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
  }, []);

  const expireSession = useCallback(() => {
    if (expiredRef.current) return;
    expiredRef.current = true;
    clearTimers();
    setShowWarning(false);
    logout();
    router.replace("/login");
  }, [clearTimers, logout, router]);

  const scheduleTimers = useCallback(() => {
    clearTimers();
    warnTimerRef.current = setTimeout(() => {
      warnedAtRef.current = Date.now();
      setShowWarning(true);
    }, IDLE_LIMIT_MS - WARN_BEFORE_MS);
    logoutTimerRef.current = setTimeout(() => {
      expireSession();
    }, IDLE_LIMIT_MS);
  }, [clearTimers, expireSession]);

  const resetIdle = useCallback(() => {
    if (expiredRef.current) return;
    if (showWarning) setShowWarning(false);
    scheduleTimers();
  }, [showWarning, scheduleTimers]);

  // Countdown tick — runs only while the warning is visible
  useEffect(() => {
    if (!showWarning) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      setSecondsLeft(WARN_BEFORE_MS / 1000);
      return;
    }

    const compute = () =>
      warnedAtRef.current
        ? Math.max(0, Math.ceil((warnedAtRef.current + WARN_BEFORE_MS - Date.now()) / 1000))
        : WARN_BEFORE_MS / 1000;

    setSecondsLeft(compute());
    countdownRef.current = setInterval(() => setSecondsLeft(compute()), 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [showWarning]);

  useEffect(() => {
    if (!user) return;

    expiredRef.current = false;
    scheduleTimers();

    for (const ev of ACTIVITY_EVENTS) {
      document.addEventListener(ev, resetIdle, { passive: true });
    }

    return () => {
      clearTimers();
      for (const ev of ACTIVITY_EVENTS) {
        document.removeEventListener(ev, resetIdle);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!showWarning) return null;

  const isUrgent = secondsLeft <= 60;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-[var(--hub-radius-xl)] border border-[var(--hub-border)] bg-white p-6 shadow-xl text-center">
        <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${isUrgent ? "bg-red-50" : "bg-amber-50"}`}>
          <svg className={`h-6 w-6 ${isUrgent ? "text-red-500" : "text-amber-500"}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <h2 className="text-base font-bold text-[var(--hub-text-primary)]">
          Sessão prestes a expirar
        </h2>
        <p className="mt-1.5 text-sm text-[var(--hub-text-secondary)]">
          Você está inativo há algum tempo. Sua sessão será encerrada em
        </p>
        <p className={`mt-3 text-3xl font-bold tabular-nums tracking-tight ${isUrgent ? "text-red-500" : "text-amber-500"}`}>
          {formatCountdown(secondsLeft)}
        </p>
        <div className="mt-5 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={expireSession}>
            Sair agora
          </Button>
          <Button className="flex-1" onClick={resetIdle}>
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );
}
