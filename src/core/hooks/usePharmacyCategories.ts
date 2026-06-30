import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "../utils/apiClient";

export interface PharmacyCategory {
    id: string;
    name: string;
    description: string;
    status: string;
    clinicId: string;
    createdAt: string;
    updatedAt: string;
}

export const usePharmacyCategories = () => {
    const [categories, setCategories] = useState<PharmacyCategory[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiGet<PharmacyCategory[]>("/api/pharmacy-categories");
            setCategories(Array.isArray(data) ? data : []);
        } catch (err: any) {
            console.error("Failed to fetch pharmacy categories:", err);
            setError(err?.message || "Failed to fetch pharmacy categories");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const createCategory = async (body: { name: string; description?: string; status?: string }) => {
        const created = await apiPost<PharmacyCategory>("/api/pharmacy-categories", body);
        setCategories((prev) => [created, ...prev]);
        return created;
    };

    const updateCategory = async (id: string, body: { name?: string; description?: string; status?: string }) => {
        const updated = await apiPut<PharmacyCategory>(`/api/pharmacy-categories/${id}`, body);
        setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
        return updated;
    };

    const deleteCategory = async (id: string) => {
        await apiDelete(`/api/pharmacy-categories/${id}`);
        setCategories((prev) => prev.filter((c) => c.id !== id));
    };

    const bulkDeleteCategories = async (ids: string[]) => {
        await apiPost("/api/pharmacy-categories/bulk-delete", { ids });
        setCategories((prev) => prev.filter((c) => !ids.includes(c.id)));
    };

    return { categories, loading, error, refetch: fetchCategories, createCategory, updateCategory, deleteCategory, bulkDeleteCategories };
};
