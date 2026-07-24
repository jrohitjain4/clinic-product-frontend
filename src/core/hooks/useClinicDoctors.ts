import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "../config/api";
import type { ClinicDoctor } from "../types/clinicDoctor";

export type { ClinicDoctor } from "../types/clinicDoctor";

export const useClinicDoctors = (clinicId?: string, type?: string) => {
  const [doctors, setDoctors] = useState<ClinicDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (clinicId) params.append("clinicId", clinicId);
      if (type) params.append("type", type);
      const queryString = params.toString();
      const url = apiUrl(`/api/doctors${queryString ? `?${queryString}` : ""}`);
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to load doctors");
      }
      const data = await res.json();
      setDoctors(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load doctors");
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [clinicId, type]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  return { doctors, loading, error, refetch: fetchDoctors };
};
