import { apiUrl } from "../config/api";
import { toast } from "react-toastify";

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
    toast.error(message);
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
    toast.error(message);
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

export const setLocalStorageUser = (user: any) => {
  if (!user) return;
  try {
    const sanitized = JSON.parse(JSON.stringify(user));
    
    // Recursively strip all base64 data URLs (data:image) to prevent QuotaExceededError
    const stripBase64 = (obj: any) => {
      if (!obj || typeof obj !== "object") return;
      for (const key in obj) {
        if (typeof obj[key] === "string" && obj[key].startsWith("data:image")) {
          obj[key] = "";
        } else if (typeof obj[key] === "object") {
          stripBase64(obj[key]);
        }
      }
    };
    
    stripBase64(sanitized);
    localStorage.setItem("user", JSON.stringify(sanitized));
  } catch (e) {
    console.error("Error saving user to localStorage", e);
  }
};
