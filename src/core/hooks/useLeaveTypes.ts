import { useState, useCallback, useEffect } from "react";
import { apiUrl } from "../config/api";

export type LeaveType = {
    id: string;
    name: string;
    quota: number;
    status: string;
    createdAt: string;
    updatedAt: string;
};

export const useLeaveTypes = () => {
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLeaveTypes = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(apiUrl("/api/leave-types"), {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            if (!res.ok) throw new Error("Failed to load leave types");
            const data = await res.json();
            setLeaveTypes(Array.isArray(data) ? data : []);
            setError(null);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLeaveTypes();
    }, [fetchLeaveTypes]);

    const createLeaveType = async (data: Partial<LeaveType>) => {
        const res = await fetch(apiUrl("/api/leave-types"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(data),
        });
        if (res.ok) {
            await fetchLeaveTypes();
            return true;
        }
        return false;
    };

    const updateLeaveType = async (id: string, data: Partial<LeaveType>) => {
        const res = await fetch(apiUrl(`/api/leave-types/${id}`), {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(data),
        });
        if (res.ok) {
            await fetchLeaveTypes();
            return true;
        }
        return false;
    };

    const deleteLeaveType = async (id: string) => {
        const res = await fetch(apiUrl(`/api/leave-types/${id}`), {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        if (res.ok) {
            await fetchLeaveTypes();
            return true;
        }
        return false;
    };

    return { leaveTypes, loading, error, createLeaveType, updateLeaveType, deleteLeaveType, reload: fetchLeaveTypes };
};
