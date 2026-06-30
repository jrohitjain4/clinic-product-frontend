import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "../utils/apiClient";

export interface Medicine {
    id: string;
    medicineName: string;
    genericName?: string;
    brandName?: string;
    categoryId?: string;
    category?: { id: string; name: string } | null;
    manufacturer?: string;
    medicineCode?: string;
    hsnCode?: string;
    description?: string;
    purchasePrice: number;
    sellingPrice: number;
    gst: number;
    mrp: number;
    openingStock: number;
    stockIn: number;
    stockOut: number;
    minimumStockAlert: number;
    unit?: string;
    batchNumber?: string;
    manufacturingDate?: string | null;
    expiryDate?: string | null;
    prescriptionRequired: boolean;
    status: string;
    clinicId: string;
    createdAt: string;
    updatedAt: string;
}

export type MedicineInput = Partial<Omit<Medicine, "id" | "clinicId" | "createdAt" | "updatedAt" | "category">>;

export const useMedicines = () => {
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMedicines = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiGet<Medicine[]>("/api/medicines");
            setMedicines(Array.isArray(data) ? data : []);
        } catch (err: any) {
            setError(err?.message || "Failed to fetch medicines");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMedicines();
    }, [fetchMedicines]);

    const createMedicine = async (body: MedicineInput) => {
        const created = await apiPost<Medicine>("/api/medicines", body);
        setMedicines((prev) => [created, ...prev]);
        return created;
    };

    const updateMedicine = async (id: string, body: MedicineInput) => {
        const updated = await apiPut<Medicine>(`/api/medicines/${id}`, body);
        setMedicines((prev) => prev.map((m) => (m.id === id ? { ...m, ...updated } : m)));
        return updated;
    };

    const deleteMedicine = async (id: string) => {
        await apiDelete(`/api/medicines/${id}`);
        setMedicines((prev) => prev.filter((m) => m.id !== id));
    };

    const bulkDeleteMedicines = async (ids: string[]) => {
        await apiPost("/api/medicines/bulk-delete", { ids });
        setMedicines((prev) => prev.filter((m) => !ids.includes(m.id)));
    };

    return { medicines, loading, error, refetch: fetchMedicines, createMedicine, updateMedicine, deleteMedicine, bulkDeleteMedicines };
};
