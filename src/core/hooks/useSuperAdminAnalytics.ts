import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "../config/api";

export interface TransactionInfo {
    id: string;
    clinicName: string;
    amount: number;
    date: string | Date;
    packageInfo: string;
    paymentMethod: string;
    status: string;
}

export interface SuperAdminAnalytics {
    totalRevenue: number;
    activeSubscriptions: number;
    totalClinics: number;
    pendingRenewals: number;
    transactionHistory: TransactionInfo[];
}

export const useSuperAdminAnalytics = () => {
    const [analytics, setAnalytics] = useState<SuperAdminAnalytics>({
        totalRevenue: 0,
        activeSubscriptions: 0,
        totalClinics: 0,
        pendingRenewals: 0,
        transactionHistory: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalytics = useCallback(async (opts?: { silent?: boolean }) => {
        if (!opts?.silent) setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(apiUrl("/api/superadmin/analytics"), {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || "Failed to load superadmin analytics");
            }
            const data = await res.json();
            setAnalytics(data);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to load superadmin analytics");
        } finally {
            if (!opts?.silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    const refetch = useCallback(() => fetchAnalytics({ silent: true }), [fetchAnalytics]);

    return { analytics, loading, error, refetch, reload: fetchAnalytics };
};
