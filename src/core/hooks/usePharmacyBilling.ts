import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost, apiDelete } from "../utils/apiClient";
import type { Medicine } from "./useMedicines";

export interface PharmacyInvoiceItem {
    id: string;
    invoiceId: string;
    medicineId?: string;
    medicine?: Medicine | null;
    medicineName: string;
    quantity: number;
    unitCost: number;
    gst: number;
    amount: number;
    createdAt: string;
}

export interface PharmacyInvoice {
    id: string;
    invoiceNo: string;
    patientId?: string;
    patient?: { id: string; firstName: string; lastName: string; patientCode: string; phone?: string; address1?: string } | null;
    customerName?: string;
    customerPhone?: string;
    invoiceDate: string;
    tax: number;
    discount: number;
    subTotal: number;
    totalAmount: number;
    paymentMethod: string;
    paymentStatus: string;
    items: PharmacyInvoiceItem[];
    createdAt: string;
}

export const usePharmacyBilling = () => {
    const [invoices, setInvoices] = useState<PharmacyInvoice[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiGet<PharmacyInvoice[]>("/api/pharmacy-invoices");
            setInvoices(Array.isArray(data) ? data : []);
        } catch (err: any) {
            setError(err?.message || "Failed to fetch invoices");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    const createInvoice = async (body: {
        patientId?: string;
        customerName?: string;
        customerPhone?: string;
        discount: number;
        tax: number;
        subTotal: number;
        totalAmount: number;
        paymentMethod: string;
        paymentStatus: string;
        items: {
            medicineId?: string;
            medicineName: string;
            quantity: number;
            unitCost: number;
            gst: number;
            amount: number;
        }[];
    }) => {
        const created = await apiPost<PharmacyInvoice>("/api/pharmacy-invoices", body);
        setInvoices((prev) => [created, ...prev]);
        return created;
    };

    const deleteInvoice = async (id: string) => {
        await apiDelete(`/api/pharmacy-invoices/${id}`);
        setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    };

    return { invoices, loading, error, refetch: fetchInvoices, createInvoice, deleteInvoice };
};
