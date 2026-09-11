export const RECENT_ACTIVITY_MS = 5 * 60_000;

export function sessionTiming(token: string): { expiresAt: number; renewAt: number } | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (!Number.isFinite(payload.exp) || !Number.isFinite(payload.iat)) return null;
    const expiresAt = payload.exp * 1000;
    return { expiresAt, renewAt: expiresAt - Math.min(300_000, (payload.exp - payload.iat) * 1000 / 3) };
  } catch { return null; }
}

export function shouldRenew(token: string, now: number, lastActivity: number, visible: boolean): boolean {
  const timing = sessionTiming(token);
  return !!timing && visible && lastActivity > 0 && now - lastActivity < RECENT_ACTIVITY_MS
    && now >= timing.renewAt && now < timing.expiresAt;
}
