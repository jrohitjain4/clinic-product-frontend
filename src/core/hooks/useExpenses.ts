import { useState, useEffect, useCallback } from "react";
import { apiGet } from "../utils/apiClient";

export const useExpenses = () => {
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchExpenses = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiGet("/api/expenses");
            setExpenses(Array.isArray(data) ? data : []);
        } catch (err: any) {
            console.error("Failed to fetch expenses:", err);
            setError(err?.message || "Failed to fetch expenses");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    return { expenses, loading, error, refetch: fetchExpenses };
};
