import { useCallback, useEffect, useState } from "react";
import { apiGet } from "../utils/apiClient";

export interface Holiday {
    id: string;
    title: string;
    description?: string;
    date: string;
    endDate?: string;
    dayName?: string;
    createdAt: string;
    updatedAt: string;
}

export const useHolidays = () => {
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchHolidays = useCallback(async (opts?: { silent?: boolean }) => {
        if (!opts?.silent) setLoading(true);
        setError(null);
        try {
            const data = await apiGet<Holiday[]>("/api/holidays");
            setHolidays(Array.isArray(data) ? data : []);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to load holidays");
            setHolidays([]);
        } finally {
            if (!opts?.silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHolidays();
    }, [fetchHolidays]);

    return {
        holidays,
        loading,
        error,
        refetch: () => fetchHolidays({ silent: true }),
    };
};
