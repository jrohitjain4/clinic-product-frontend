import { apiUrl } from "../config/api";
import { toast } from "react-toastify";

let authRedirectPending = false;

const clearAuthAndRedirect = (message?: string) => {
  if (authRedirectPending) return;
  authRedirectPending = true;

  localStorage.removeItem("token");
  localStorage.removeItem("user");

  if (message && !window.location.pathname.startsWith("/login")) {
    toast.error(message);
  }

  if (!window.location.pathname.startsWith("/login")) {
    window.location.href = "/login";
  } else {
    authRedirectPending = false;
  }
};

const handleAuthError = (status: number, message: string) => {
  const isAuthFailure =
    status === 401 ||
    (status === 403 &&
      /invalid or expired token|authorization header is missing|unauthorized/i.test(message));

  if (isAuthFailure) {
    clearAuthAndRedirect(message);
    throw new Error(message);
  }
};

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
    handleAuthError(res.status, message);
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
    handleAuthError(res.status, message);
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
    const sanitized = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      clinicId: user.clinicId,
      profileImage: typeof user.profileImage === "string" && !user.profileImage.startsWith("data:") ? user.profileImage : "",
      permissions: user.permissions,
      doctorId: user.doctorId,
      patientId: user.patientId,
      clinic: user.clinic ? {
        id: user.clinic.id,
        name: user.clinic.name,
        username: user.clinic.username,
        status: user.clinic.status,
        onboardingStep: typeof user.clinic.onboardingStep === "number" ? user.clinic.onboardingStep : 2,
        packageId: user.clinic.packageId,
        packageName: user.clinic.package?.name || user.clinic.packageName,
        packageDurationInDays: user.clinic.package?.durationInDays || user.clinic.packageDurationInDays,
        packageStartsAt: user.clinic.packageStartsAt,
        packageExpiresAt: user.clinic.packageExpiresAt,
        package: user.clinic.package ? {
          id: user.clinic.package.id,
          name: user.clinic.package.name,
          price: user.clinic.package.price,
          durationInDays: user.clinic.package.durationInDays,
        } : undefined,
      } : undefined,
    };
    localStorage.setItem("user", JSON.stringify(sanitized));
  } catch (e) {
    console.error("Error saving user to localStorage, clearing cached temp items", e);
    try {
      localStorage.setItem("user", JSON.stringify({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        clinicId: user.clinicId,
        clinic: user.clinic ? {
          id: user.clinic.id,
          name: user.clinic.name,
          status: user.clinic.status,
          onboardingStep: typeof user.clinic.onboardingStep === "number" ? user.clinic.onboardingStep : 2,
          packageId: user.clinic.packageId,
          packageExpiresAt: user.clinic.packageExpiresAt,
        } : undefined,
      }));
    } catch (_) {}
  }
};
