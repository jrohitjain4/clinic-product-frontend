import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "../config/api";
import type { ClinicPatient } from "../types/clinicPatient";

export type { ClinicPatient } from "../types/clinicPatient";

export const useClinicPatients = () => {
  const [patients, setPatients] = useState<ClinicPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(apiUrl("/api/patients"), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to load patients");
      }
      const data = await res.json();
      setPatients(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load patients");
      setPatients([]);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const refetch = useCallback(() => fetchPatients({ silent: true }), [fetchPatients]);

  return { patients, loading, error, refetch, reload: fetchPatients };
};
