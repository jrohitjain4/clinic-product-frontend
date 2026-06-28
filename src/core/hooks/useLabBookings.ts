import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "../utils/apiClient";

export interface LabBooking {
    id: string;
    bookingCode: string;
    patientId: string | null;
    patient: { id: string; firstName: string; lastName: string; patientCode: string; phone: string } | null;
    testId: string | null;
    test: {
        id: string;
        name: string;
        price: number;
        testCode: string | null;
        category: { id: string; name: string };
    } | null;
    scheduledAt: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string | null;
    discount: number;
    tax: number;
    totalAmount: number;
    invoiceNo: string | null;
    sessionSlot: string | null;
    assignedUserId: string | null;
    remarks: string | null;
    clinicId: string;
    createdAt: string;
    updatedAt: string;
}

export interface LabDashboardStats {
    totalBookings: number;
    todaysBookings: number;
    pendingBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    todaysRevenue: number;
    recentBookings: any[];
    categoryStats: any[];
}

export const useLabBookings = () => {
    const [bookings, setBookings] = useState<LabBooking[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchBookings = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiGet<LabBooking[]>("/api/lab-bookings");
            setBookings(Array.isArray(data) ? data : []);
        } catch (err: any) {
            console.error("Failed to fetch lab bookings:", err);
            setError(err?.message || "Failed to fetch lab bookings");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const createBooking = async (body: any) => {
        const created = await apiPost<LabBooking>("/api/lab-bookings", body);
        setBookings((prev) => [created, ...prev]);
        return created;
    };

    const updateBooking = async (id: string, body: any) => {
        const updated = await apiPut<LabBooking>(`/api/lab-bookings/${id}`, body);
        setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, ...updated } : b)));
        return updated;
    };

    const deleteBooking = async (id: string) => {
        await apiDelete(`/api/lab-bookings/${id}`);
        setBookings((prev) => prev.filter((b) => b.id !== id));
    };

    const bulkDeleteBookings = async (ids: string[]) => {
        await apiPost("/api/lab-bookings/bulk-delete", { ids });
        setBookings((prev) => prev.filter((b) => !ids.includes(b.id)));
    };

    return { bookings, loading, error, refetch: fetchBookings, createBooking, updateBooking, deleteBooking, bulkDeleteBookings };
};

export const useLabDashboard = () => {
    const [stats, setStats] = useState<LabDashboardStats | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchDashboard = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiGet<LabDashboardStats>("/api/lab-bookings/dashboard");
            setStats(data);
        } catch (err: any) {
            console.error("Failed to fetch lab dashboard:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    return { stats, loading, refetch: fetchDashboard };
};
