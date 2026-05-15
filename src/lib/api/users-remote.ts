import { apiFetch } from "@/lib/api/authenticated-fetch";
import type {
  ApiCreateUserRequest,
  ApiSalesAgentDashboardResponse,
  ApiUpdateUserRequest,
  ApiUserResponse,
} from "@/lib/api/auth-types";

export async function listUsersRemote(token: string): Promise<ApiUserResponse[]> {
  return apiFetch<ApiUserResponse[]>("/users", {}, token);
}

export async function listSalesAgentsRemote(token: string): Promise<ApiUserResponse[]> {
  return apiFetch<ApiUserResponse[]>("/users/sales-agents", {}, token);
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

export async function getSalesAgentDashboardRemote(
  token: string,
  agentId?: string,
): Promise<ApiSalesAgentDashboardResponse> {
  const path = agentId ? `/sales-agent/dashboard/${agentId}` : "/sales-agent/dashboard/me";
  return apiFetch<ApiSalesAgentDashboardResponse>(path, {}, token);
}
