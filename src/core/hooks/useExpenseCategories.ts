import { useState, useEffect, useCallback } from "react";
import { apiGet } from "../utils/apiClient";

export const useExpenseCategories = () => {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiGet("/api/expense-categories");
            setCategories(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch expense categories:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    return { categories, loading, refetch: fetchCategories };
};
