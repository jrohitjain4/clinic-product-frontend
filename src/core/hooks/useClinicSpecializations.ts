import { useCallback, useEffect, useState } from "react";
import { apiGet } from "../utils/apiClient";

export interface ClinicSpecialization {
    id: string;
    name: string;
    description?: string;
    image?: string;
    status: string;
    noOfDoctor?: number;
    createdAt: string;
    updatedAt: string;
}

export const useClinicSpecializations = (type?: string) => {
    const [specializations, setSpecializations] = useState<ClinicSpecialization[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSpecializations = useCallback(async (opts?: { silent?: boolean }) => {
        if (!opts?.silent) setLoading(true);
        setError(null);
        try {
            const url = type ? `/api/specializations?type=${type}` : "/api/specializations";
            const data = await apiGet<ClinicSpecialization[]>(url);
            setSpecializations(Array.isArray(data) ? data : []);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to load specializations");
            setSpecializations([]);
        } finally {
            if (!opts?.silent) setLoading(false);
        }
    }, [type]);

    useEffect(() => {
        fetchSpecializations();
    }, [fetchSpecializations]);

    return {
        specializations,
        loading,
        error,
        refetch: () => fetchSpecializations({ silent: true }),
    };
};
