import { apiUrl } from "../config/api";

export const authHeaders = (): HeadersInit => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(apiUrl(path), { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof data === "object" && data && "message" in data
        ? String((data as { message: string }).message)
        : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

async function apiRequest<T>(path: string, method: string, body?: any): Promise<T> {
  const headers = { ...authHeaders() };
  let options: RequestInit = { method, headers };

  if (body !== undefined) {
    headers["Content-Type" as keyof HeadersInit] = "application/json";
    options.body = JSON.stringify(body);
  }

  const res = await fetch(apiUrl(path), options);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = typeof data === "object" && data && "message" in data
      ? String((data as { message: string }).message)
      : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export async function apiPost<T>(path: string, body?: any): Promise<T> {
  return apiRequest<T>(path, "POST", body);
}

export async function apiPut<T>(path: string, body?: any): Promise<T> {
  return apiRequest<T>(path, "PUT", body);
}

export async function apiDelete<T>(path: string): Promise<T> {
  return apiRequest<T>(path, "DELETE");
}
