import { useState, useCallback, useEffect } from "react";
import { apiUrl } from "../config/api";

export type Leave = {
    id: string;
    employeeId: string;
    employeeType: string;
    employeeName: string;
    profileImage: string;
    email: string;
    leaveTypeId: string;
    leaveTypeName: string;
    startDate: string;
    endDate: string;
    days: number;
    workingDays: number;
    reason: string;
    status: string; // APPLIED, APPROVED, REJECTED, COMPLETED, WITHDRAWN, CANCELLED
    rejectRemark?: string;
    adminNotes?: string;
    isPaid: boolean;
    appliedOn: string;
};

export const useLeaves = () => {
    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLeaves = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch(apiUrl("/api/leaves"), {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            if (res.ok) setLeaves(await res.json());
            else setError("Failed to load leaves");
        } catch (e) {
            console.error(e);
            setError("Failed to load leaves");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

    const applyLeave = async (data: any) => {
        const res = await fetch(apiUrl("/api/leaves/apply"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(data),
        });
        if (res.ok) { await fetchLeaves(); return true; }
        return false;
    };

    const updateStatus = async (id: string, data: {
        status: "APPROVED" | "REJECTED" | "CANCELLED",
        rejectRemark?: string,
        startDate?: string,
        endDate?: string,
        isPaid?: boolean,
        adminNotes?: string
    }) => {
        const res = await fetch(apiUrl(`/api/leaves/${id}/status`), {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(data),
        });
        if (res.ok) { await fetchLeaves(); return true; }
        return false;
    };

    const withdrawLeave = async (id: string) => {
        const res = await fetch(apiUrl(`/api/leaves/${id}/withdraw`), {
            method: "POST",
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (res.ok) { await fetchLeaves(); return true; }
        return false;
    };

    const deleteLeave = async (id: string) => {
        const res = await fetch(apiUrl(`/api/leaves/${id}`), {
            method: "DELETE",
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (res.ok) { await fetchLeaves(); return true; }
        return false;
    };

    const getWorkingDays = async (startDate: string, endDate: string) => {
        const res = await fetch(apiUrl(`/api/leaves/calculate-days?startDate=${startDate}&endDate=${endDate}`), {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (res.ok) {
            const data = await res.json();
            return data.count;
        }
        return 0;
    };

    return { leaves, loading, error, applyLeave, updateStatus, withdrawLeave, deleteLeave, getWorkingDays, reload: fetchLeaves };
};
