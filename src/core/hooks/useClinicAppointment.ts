import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "../config/api";
import type { ClinicAppointment } from "../types/clinicAppointment";

export const useClinicAppointment = (id?: string) => {
  const [appointment, setAppointment] = useState<ClinicAppointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointment = useCallback(async () => {
    if (!id) {
      setAppointment(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(apiUrl(`/api/appointments/${id}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to load appointment");
      }
      setAppointment(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load appointment");
      setAppointment(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAppointment();
  }, [fetchAppointment]);

  return { appointment, loading, error, refetch: fetchAppointment };
};
