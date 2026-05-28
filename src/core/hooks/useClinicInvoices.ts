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
    paymentMethod: string;
    paymentStatus: string;
    otherInfo: string;
    items: any[];
    createdAt: string;
}

export const useClinicInvoices = () => {
    const [invoices, setInvoices] = useState<ClinicInvoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchInvoices = useCallback(async (opts?: { silent?: boolean }) => {
        if (!opts?.silent) setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(apiUrl("/api/invoices"), {
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
    }, []);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    const refetch = useCallback(() => fetchInvoices({ silent: true }), [fetchInvoices]);

    return { invoices, loading, error, refetch, reload: fetchInvoices };
};
