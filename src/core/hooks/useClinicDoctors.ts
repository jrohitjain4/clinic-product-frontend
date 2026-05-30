import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "../config/api";
import type { ClinicDoctor } from "../types/clinicDoctor";

export type { ClinicDoctor } from "../types/clinicDoctor";

export const useClinicDoctors = (clinicId?: string) => {
  const [doctors, setDoctors] = useState<ClinicDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const url = clinicId ? apiUrl(`/api/doctors?clinicId=${clinicId}`) : apiUrl("/api/doctors");
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
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  return { doctors, loading, error, refetch: fetchDoctors };
};
