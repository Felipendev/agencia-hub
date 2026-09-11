export type CouponDTO = {
  id: string;
  code: string;
  expiresAt?: string | null;
  active: boolean;
  createdAt: string;
  discountPercent?: number | null;
  maxDiscountAmount?: number | null;
  maxUses?: number | null;
  usedCount: number;
};

export type UpsertCouponInput = {
  code: string;
  expiresAt?: string | null;
  active?: boolean;
  discountPercent?: number | null;
  maxDiscountAmount?: number | null;
  maxUses?: number | null;
};

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function unwrap<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
  return data as T;
}

export async function listCouponsRemote(token: string): Promise<CouponDTO[]> {
  const res = await fetch("/api/app/coupons", { headers: authHeaders(token) });
  return unwrap<CouponDTO[]>(res);
}

export async function createCouponRemote(token: string, input: UpsertCouponInput): Promise<CouponDTO> {
  const res = await fetch("/api/app/coupons", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
  return unwrap<CouponDTO>(res);
}

export async function updateCouponRemote(token: string, id: string, input: UpsertCouponInput): Promise<CouponDTO> {
  const res = await fetch(`/api/app/coupons?id=${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
  return unwrap<CouponDTO>(res);
}

export async function deleteCouponRemote(token: string, id: string): Promise<void> {
  const res = await fetch(`/api/app/coupons?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  await unwrap<{ ok: true }>(res);
}
