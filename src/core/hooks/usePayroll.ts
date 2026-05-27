import { useCallback, useEffect, useState } from "react";
import { apiGet } from "../utils/apiClient";

export interface PayrollStaff {
    profileImage?: string;
    fullName: string;
    email?: string;
    dateOfJoining?: string;
    role: string;
}

export interface Payroll {
    id: string;
    staffId: string;
    staff: PayrollStaff;
    netSalary: number;
    basicSalary: number;
    da: number;
    hra: number;
    conveyance: number;
    medicalAllowance: number;
    otherEarnings: number;
    tds: number;
    esi: number;
    pf: number;
    profTax: number;
    labourWelfare: number;
    otherDeductions: number;
    status: string;
    createdAt: string;
}

export const usePayroll = () => {
    const [payrolls, setPayrolls] = useState<Payroll[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPayrolls = useCallback(async (opts?: { silent?: boolean }) => {
        if (!opts?.silent) setLoading(true);
        setError(null);
        try {
            const data = await apiGet<Payroll[]>("/api/payroll");
            setPayrolls(Array.isArray(data) ? data : []);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to load payroll");
            setPayrolls([]);
        } finally {
            if (!opts?.silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPayrolls();
    }, [fetchPayrolls]);

    return {
        payrolls,
        loading,
        error,
        refetch: () => fetchPayrolls({ silent: true }),
    };
};
