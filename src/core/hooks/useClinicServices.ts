import { useCallback, useEffect, useState } from "react";
import { apiGet } from "../utils/apiClient";
import type { ClinicDepartment } from "./useClinicDepartments";

export interface ClinicService {
    id: string;
    serviceName: string;
    price: number;
    status: string;
    departmentId: string;
    department?: ClinicDepartment;
}

export const useClinicServices = () => {
    const [services, setServices] = useState<ClinicService[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchServices = useCallback(async (opts?: { silent?: boolean }) => {
        if (!opts?.silent) setLoading(true);
        setError(null);
        try {
            const data = await apiGet<ClinicService[]>("/api/services");
            setServices(Array.isArray(data) ? data : []);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to load services");
            setServices([]);
        } finally {
            if (!opts?.silent) setLoading(false);
        }
    }, []);

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
