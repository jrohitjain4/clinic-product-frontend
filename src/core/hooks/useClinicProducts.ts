import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "../config/api";

export const useClinicProducts = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProducts = useCallback(async (opts?: { silent?: boolean }) => {
        if (!opts?.silent) setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(apiUrl("/api/products"), {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) {
                throw new Error("Failed to load products");
            }
            const data = await res.json();
            setProducts(Array.isArray(data) ? data : []);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to load products");
            setProducts([]);
        } finally {
            if (!opts?.silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    return { products, loading, error, refetch: () => fetchProducts({ silent: true }) };
};
