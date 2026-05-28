import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "../config/api";

export interface ClinicRole {
    id: string;
    name: string;
    permissions: string[];
    status: string;
    createdAt?: string;
    updatedAt?: string;
}

export const useClinicRoles = () => {
    const [roles, setRoles] = useState<ClinicRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRoles = useCallback(async (opts?: { silent?: boolean }) => {
        if (!opts?.silent) setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(apiUrl("/api/clinic-roles"), {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Failed to load clinic roles");
            }
            const data = await res.json();
            setRoles(Array.isArray(data) ? data : []);
        } catch (e: any) {
            setError(e.message || "Something went wrong.");
            setRoles([]);
        } finally {
            if (!opts?.silent) setLoading(false);
        }
    }, []);

    const createRole = async (data: any) => {
        const token = localStorage.getItem("token");
        const res = await fetch(apiUrl("/api/clinic-roles"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || "Failed to create role");
        }
        fetchRoles({ silent: true });
        return res.json();
    };

    const updateRole = async (id: string, data: any) => {
        const token = localStorage.getItem("token");
        const res = await fetch(apiUrl(`/api/clinic-roles/${id}`), {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || "Failed to update role");
        }
        fetchRoles({ silent: true });
        return res.json();
    };

    const deleteRole = async (id: string) => {
        const token = localStorage.getItem("token");
        const res = await fetch(apiUrl(`/api/clinic-roles/${id}`), {
            method: "DELETE",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || "Failed to delete role");
        }
        fetchRoles({ silent: true });
    };

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    return {
        roles,
        loading,
        error,
        createRole,
        updateRole,
        deleteRole,
        refetch: fetchRoles,
    };
};
