import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "../config/api";
import type { ClinicStaff } from "../types/clinicStaff";

export type { ClinicStaff } from "../types/clinicStaff";

export const useClinicStaff = () => {
  const [staffs, setStaffs] = useState<ClinicStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStaffs = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(apiUrl("/api/staffs"), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to load staff");
      }
      const data = await res.json();
      setStaffs(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load staff");
      setStaffs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaffs();
  }, [fetchStaffs]);

  const refetch = useCallback(
    () => fetchStaffs({ silent: true }),
    [fetchStaffs]
  );

  return { staffs, loading, error, refetch, reload: fetchStaffs };
};
