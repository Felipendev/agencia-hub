import { apiFetch } from "@/lib/api/authenticated-fetch";
import type {
  ApiCreateUserRequest,
  ApiSellerDashboardResponse,
  ApiUpdateUserRequest,
  ApiUserResponse,
} from "@/lib/api/auth-types";

export async function listUsersRemote(token: string): Promise<ApiUserResponse[]> {
  return apiFetch<ApiUserResponse[]>("/users", {}, token);
}

export async function listSellersRemote(token: string): Promise<ApiUserResponse[]> {
  return apiFetch<ApiUserResponse[]>("/users/sellers", {}, token);
}

export async function createUserRemote(
  data: ApiCreateUserRequest,
  token: string,
): Promise<ApiUserResponse> {
  return apiFetch<ApiUserResponse>("/users", {
    method: "POST",
    body: JSON.stringify(data),
  }, token);
}

export async function updateUserRemote(
  id: string,
  data: ApiUpdateUserRequest,
  token: string,
): Promise<ApiUserResponse> {
  return apiFetch<ApiUserResponse>(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }, token);
}

export async function getSellerDashboardRemote(
  token: string,
  sellerId?: string,
): Promise<ApiSellerDashboardResponse> {
  const path = sellerId ? `/seller-dashboard/${sellerId}` : "/seller-dashboard/me";
  return apiFetch<ApiSellerDashboardResponse>(path, {}, token);
}
