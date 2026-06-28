import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "../utils/apiClient";

export interface LabTest {
    id: string;
    testCode: string | null;
    name: string;
    shortName: string | null;
    description: string;
    price: number;
    homeCollectionCharge: number | null;
    duration: string | null;
    preparationInfo: string | null;
    assignment: string;
    status: string;
    categoryId: string;
    category: { id: string; name: string };
    assignedDoctors: any;
    assignedStaff: any;
    schedules: any;
    isSlotBookingEnabled: boolean;
    slotDuration: number | null;
    maxBookingsPerSlot: number | null;
    clinicId: string;
    createdAt: string;
    updatedAt: string;
}

export const useLabTests = () => {
    const [tests, setTests] = useState<LabTest[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTests = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiGet<LabTest[]>("/api/lab-tests");
            setTests(Array.isArray(data) ? data : []);
        } catch (err: any) {
            console.error("Failed to fetch lab tests:", err);
            setError(err?.message || "Failed to fetch lab tests");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTests();
    }, [fetchTests]);

    const createTest = async (body: any) => {
        const created = await apiPost<LabTest>("/api/lab-tests", body);
        setTests((prev) => [created, ...prev]);
        return created;
    };

    const updateTest = async (id: string, body: any) => {
        const updated = await apiPut<LabTest>(`/api/lab-tests/${id}`, body);
        setTests((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
        return updated;
    };

    const deleteTest = async (id: string) => {
        await apiDelete(`/api/lab-tests/${id}`);
        setTests((prev) => prev.filter((t) => t.id !== id));
    };

    const bulkDeleteTests = async (ids: string[]) => {
        await apiPost("/api/lab-tests/bulk-delete", { ids });
        setTests((prev) => prev.filter((t) => !ids.includes(t.id)));
    };

    return { tests, loading, error, refetch: fetchTests, createTest, updateTest, deleteTest, bulkDeleteTests };
};
