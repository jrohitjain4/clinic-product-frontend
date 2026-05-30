import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "../config/api";
import type { ClinicAppointment } from "../types/clinicAppointment";

export type { ClinicAppointment } from "../types/clinicAppointment";

export const useClinicAppointments = (params?: {
  patientId?: string;
  doctorId?: string;
}) => {
  const [appointments, setAppointments] = useState<ClinicAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buildUrl = useCallback(() => {
    const q = new URLSearchParams();
    if (params?.patientId) q.set("patientId", params.patientId);
    if (params?.doctorId) q.set("doctorId", params.doctorId);
    const qs = q.toString();
    return apiUrl(`/api/appointments${qs ? `?${qs}` : ""}`);
  }, [params?.patientId, params?.doctorId]);

  const fetchAppointments = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(buildUrl(), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Failed to load appointments");
        }
        const data = await res.json();
        setAppointments(Array.isArray(data) ? data : []);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load appointments");
        setAppointments([]);
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [buildUrl]
  );

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const refetch = useCallback(
    () => fetchAppointments({ silent: true }),
    [fetchAppointments]
  );

  const createAppointment = async (payload: { patientId: string; doctorId: string; scheduledAt: string; departmentId?: string; appointmentType?: string; status?: string; reason?: string; mode?: string }) => {
    const token = localStorage.getItem("token");
    const res = await fetch(apiUrl("/api/appointments"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to create appointment");
    }
    await refetch();
    return data;
  };

  return { appointments, loading, error, refetch, reload: fetchAppointments, createAppointment };
};
