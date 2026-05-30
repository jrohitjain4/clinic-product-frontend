import { useState, useEffect, useCallback } from "react";
import { apiGet } from "../utils/apiClient";

export const useClinics = () => {
    const [clinics, setClinics] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchClinics = useCallback(async () => {
        setLoading(true);
        try {
            // Using the tenants endpoint which returns clinic data
            const data = await apiGet<any[]>("/api/tenants");
            setClinics(data || []);
        } catch (error) {
            console.error("Failed to fetch clinics:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchClinics();
    }, [fetchClinics]);

    return {
        clinics,
        loading,
        refetch: fetchClinics,
    };
};
