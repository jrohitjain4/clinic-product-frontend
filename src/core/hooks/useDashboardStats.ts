import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "../config/api";

export interface DashboardStats {
    doctorsCount: number;
    patientsCount: number;
    appointmentsCount: number;
    revenue: number;
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
    appointmentStats: {
        total: number;
        completed: number;
        cancelled: number;
        rescheduled: number;
    };
    monthlyData: { month: string, completed: number, ongoing: number, rescheduled: number }[];
    topDepartments: { name: string, patientCount: number }[];
    incomeByTreatment: { name: string, income: number, appointmentCount: number }[];
    topPatients: { id: string, fullName: string, profileImage: string | null, totalPaid: number, appointmentCount: number }[];
    recentTransactions: { id: string, type: 'income' | 'expense', description: string, invoiceCode: string | null, amount: number, status: string, method: string | null, date: string }[];
    recentAppointments: { id: string, doctor: { fullName: string, profileImage: string | null }, patient: { firstName: string, lastName: string, phone: string | null }, department: { name: string } | null, scheduledAt: string, status: string, mode: string }[];
    profileCompletion: number;
    revenueBreakdown?: { consultation: number, procedures: number, products: number, discounts: number };
    patientStats?: { newCount: number, returningCount: number, inactiveCount: number };
    staffAttendance?: { total: number, present: number, absent: number, percentage: number };
    topServices?: { name: string, count: number, type: string }[];
}

export const useDashboardStats = () => {
    const [stats, setStats] = useState<DashboardStats>({
        doctorsCount: 0,
        patientsCount: 0,
        appointmentsCount: 0,
        revenue: 0,
        totalIncome: 0,
        totalExpense: 0,
        netProfit: 0,
        appointmentStats: { total: 0, completed: 0, cancelled: 0, rescheduled: 0 },
        monthlyData: [],
        topDepartments: [],
        incomeByTreatment: [],
        topPatients: [],
        recentTransactions: [],
        recentAppointments: [],
        profileCompletion: 0
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
