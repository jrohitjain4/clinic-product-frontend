import { useState, useEffect, useCallback } from "react";
import { apiGet } from "../utils/apiClient";

export const useExpenses = () => {
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchExpenses = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiGet("/api/expenses");
            setExpenses(data || []);
        } catch (error) {
            console.error("Failed to fetch expenses:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    return { expenses, loading, refetch: fetchExpenses };
};
