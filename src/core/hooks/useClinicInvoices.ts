import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "../config/api";

export interface ClinicInvoice {
    id: string;
    invoiceCode: string;
    patientId: string;
    patient: any;
    invoiceDate: string;
    dueDate: string;
    tax: number;
    discount: number;
    subTotal: number;
    totalAmount: number;
    amountPaid?: number;
    paymentMethod: string;
    paymentStatus: string;
    otherInfo: string;
    items: any[];
    createdAt: string;
    clinicName?: string;
    clinic?: {
        name?: string;
        landingPage?: {
            logo?: string;
            address?: string;
        };
    };
}

export const useClinicInvoices = (params?: { type?: string }) => {
    const [invoices, setInvoices] = useState<ClinicInvoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const typeStr = params?.type;

    const fetchInvoices = useCallback(async (opts?: { silent?: boolean }) => {
        if (!opts?.silent) setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            const query = typeStr ? `?type=${typeStr}` : "";
            const res = await fetch(apiUrl(`/api/invoices${query}`), {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || "Failed to load invoices");
            }
            const data = await res.json();
            setInvoices(Array.isArray(data) ? data : []);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to load invoices");
            setInvoices([]);
        } finally {
            if (!opts?.silent) setLoading(false);
        }
    }, [typeStr]);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    const refetch = useCallback(() => fetchInvoices({ silent: true }), [fetchInvoices]);

    const getInvoiceById = useCallback(async (id: string): Promise<ClinicInvoice | null> => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(apiUrl(`/api/invoices/${id}`), {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) return null;
            return await res.json();
        } catch (e) {
            console.error("Error fetching invoice:", e);
            return null;
        }
    }, []);

    return { invoices, loading, error, refetch, reload: fetchInvoices, getInvoiceById };
};
