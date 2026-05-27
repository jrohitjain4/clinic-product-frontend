import { useState, useCallback, useEffect } from "react";
import { apiUrl } from "../config/api";

export type Leave = {
    id: string;
    employeeId: string;
    employeeType: string;
    employeeName: string;
    profileImage: string;
    leaveTypeId: string;
    leaveTypeName: string;
    startDate: string;
    endDate: string;
    days: number;
    reason: string;
    status: string; // APPLIED, APPROVED, REJECTED
    appliedOn: string;
};

export const useLeaves = () => {
    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLeaves = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(apiUrl("/api/leaves"), {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            if (res.ok) setLeaves(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

    const applyLeave = async (data: Partial<Leave> & { reason?: string }) => {
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

    const updateStatus = async (id: string, status: "APPROVED" | "REJECTED") => {
        const res = await fetch(apiUrl(`/api/leaves/${id}/status`), {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ status }),
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

    return { leaves, loading, applyLeave, updateStatus, deleteLeave, reload: fetchLeaves };
};
