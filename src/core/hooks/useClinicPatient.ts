import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "../config/api";
import type { ClinicPatient } from "../types/clinicPatient";

export const useClinicPatient = (id?: string) => {
  const [patient, setPatient] = useState<ClinicPatient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatient = useCallback(async () => {
    if (!id) {
      setPatient(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(apiUrl(`/api/patients/${id}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to load patient");
      }
      setPatient(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load patient");
      setPatient(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPatient();
  }, [fetchPatient]);

  return { patient, loading, error, refetch: fetchPatient };
};
