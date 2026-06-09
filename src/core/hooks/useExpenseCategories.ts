import { useState, useEffect, useCallback } from "react";
import { apiGet } from "../utils/apiClient";

export const useExpenseCategories = () => {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiGet("/api/expense-categories");
            setCategories(Array.isArray(data) ? data : []);
        } catch (err: any) {
            console.error("Failed to fetch expense categories:", err);
            setError(err?.message || "Failed to fetch expense categories");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    return { categories, loading, error, refetch: fetchCategories };
};
