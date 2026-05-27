import { useCallback, useEffect, useState } from "react";
import { apiGet } from "../utils/apiClient";

export interface ClinicDepartment {
  id: string;
  name: string;
  status?: string;
}

export const useClinicDepartments = () => {
  const [departments, setDepartments] = useState<ClinicDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartments = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      const data = await apiGet<ClinicDepartment[]>("/api/departments");
      setDepartments(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load departments");
      setDepartments([]);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  return {
    departments,
    loading,
    error,
    refetch: () => fetchDepartments({ silent: true }),
  };
};
