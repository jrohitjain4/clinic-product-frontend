import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "../config/api";

export interface DashboardStats {
    doctorsCount: number;
    patientsCount: number;
    appointmentsCount: number;
    revenue: number;
    appointmentStats: {
        total: number;
        completed: number;
        cancelled: number;
        rescheduled: number;
    };
}

export const useDashboardStats = () => {
    const [stats, setStats] = useState<DashboardStats>({
        doctorsCount: 0,
        patientsCount: 0,
        appointmentsCount: 0,
        revenue: 0,
        appointmentStats: { total: 0, completed: 0, cancelled: 0, rescheduled: 0 }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async (opts?: { silent?: boolean }) => {
        if (!opts?.silent) setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(apiUrl("/api/dashboard/stats"), {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || "Failed to load dashboard stats");
            }
            const data = await res.json();
            setStats(data);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to load dashboard stats");
        } finally {
            if (!opts?.silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const refetch = useCallback(() => fetchStats({ silent: true }), [fetchStats]);

    return { stats, loading, error, refetch, reload: fetchStats };
};
