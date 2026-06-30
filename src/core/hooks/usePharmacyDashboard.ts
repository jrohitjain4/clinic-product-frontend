import { useState, useEffect, useCallback } from "react";
import { apiGet } from "../utils/apiClient";

export interface PharmacyDashboardStats {
  totalBills: number;
  paidBills: number;
  unpaidBills: number;
  todayBills: number;
  todayRevenue: number;
  totalRevenue: number;
  totalMedicines: number;
  outOfStockCount: number;
  expiredCount: number;
  lowStockMedicines: {
    id: string;
    medicineName: string;
    medicineCode?: string;
    currentStock: number;
    minimumStockAlert: number;
    category?: { name: string };
  }[];
  expiredMedicines: {
    id: string;
    medicineName: string;
    medicineCode?: string;
    currentStock: number;
    expiryDate: string;
    category?: { name: string };
  }[];
  recentSales: {
    id: string;
    invoiceNo: string;
    customerName?: string;
    totalAmount: number;
    paymentStatus: string;
    paymentMethod: string;
    invoiceDate: string;
    patient?: { firstName: string; lastName: string };
    items: { medicineName: string; quantity: number; amount: number }[];
  }[];
}

export const usePharmacyDashboard = () => {
  const [stats, setStats] = useState<PharmacyDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiGet<PharmacyDashboardStats>("/api/pharmacy-invoices/dashboard");
      setStats(data);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
};
