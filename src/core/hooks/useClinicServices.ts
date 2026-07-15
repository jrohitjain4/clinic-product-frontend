import { useCallback, useEffect, useState } from "react";
import { apiGet } from "../utils/apiClient";
import type { ClinicDepartment } from "./useClinicDepartments";

export interface ClinicService {
    id: string;
    serviceName: string;
    price: number;
    duration?: string;
    status: string;
    departmentId: string;
    department?: ClinicDepartment;
}

export const useClinicServices = (type?: string) => {
    const [services, setServices] = useState<ClinicService[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchServices = useCallback(async (opts?: { silent?: boolean }) => {
        if (!opts?.silent) setLoading(true);
        setError(null);
        try {
            const url = type ? `/api/services?type=${type}` : "/api/services";
            const data = await apiGet<ClinicService[]>(url);
            setServices(Array.isArray(data) ? data : []);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to load services");
            setServices([]);
        } finally {
            if (!opts?.silent) setLoading(false);
        }
    }, [type]);

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    return {
        services,
        loading,
        error,
        refetch: () => fetchServices({ silent: true }),
    };
};
