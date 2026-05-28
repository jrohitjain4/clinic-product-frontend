import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "../utils/apiClient";
import { message } from "antd";

export const usePrescriptions = () => {
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchPrescriptions = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiGet<any[]>("/api/prescriptions");
            setPrescriptions(data || []);
        } catch (error) {
            console.error("Failed to fetch prescriptions:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPrescriptions();
    }, [fetchPrescriptions]);

    const createPrescription = async (payload: any) => {
        try {
            const created = await apiPost("/api/prescriptions", payload);
            await fetchPrescriptions();
            message.success("Prescription created successfully!");
            return created;
        } catch (error: any) {
            message.error(error.message || "Failed to create prescription");
            throw error;
        }
    };

    const updatePrescription = async (id: string, payload: any) => {
        try {
            const updated = await apiPut(`/api/prescriptions/${id}`, payload);
            await fetchPrescriptions();
            message.success("Prescription updated successfully!");
            return updated;
        } catch (error: any) {
            message.error(error.message || "Failed to update prescription");
            throw error;
        }
    };

    const deletePrescription = async (id: string) => {
        try {
            await apiDelete(`/api/prescriptions/${id}`);
            await fetchPrescriptions();
            message.success("Prescription deleted successfully!");
        } catch (error: any) {
            message.error(error.message || "Failed to delete prescription");
            throw error;
        }
    };

    const getPrescriptionById = async (id: string) => {
        try {
            return await apiGet<any>(`/api/prescriptions/${id}`);
        } catch (error: any) {
            message.error("Failed to fetch prescription details");
            throw error;
        }
    };

    return {
        prescriptions,
        loading,
        refetch: fetchPrescriptions,
        createPrescription,
        updatePrescription,
        deletePrescription,
        getPrescriptionById,
    };
};
