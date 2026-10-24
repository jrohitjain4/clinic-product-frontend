import React, { useState, useEffect, useMemo } from "react";
import { apiUrl } from "../../../../../core/config/api";
import { toast } from "react-toastify";

export interface Package {
    id: string;
    name: string;
    price: number;
    durationInDays: number;
    isActive: boolean;
    maxDoctors?: number | null;
    maxPatients?: number | null;
    maxAppointments?: number | null;
    _count?: {
        clinics: number;
    };
    createdAt?: string;
    updatedAt?: string;
}

export type BillingCycleKey = "all" | "trial_custom" | "weekly" | "monthly" | "quarterly" | "half_yearly" | "yearly";

interface SectionMeta {
    id: BillingCycleKey;
    title: string;
    badge: string;
    defaultDays: number;
    description: string;
    icon: string;
    gradient: string;
    lightBg: string;
    textColor: string;
    frequencyLabel: string;
}

const SECTIONS: Record<Exclude<BillingCycleKey, "all">, SectionMeta> = {
    trial_custom: {
        id: "trial_custom",
        title: "Free Trial & Custom Plans",
        badge: "Trial / Custom",
        defaultDays: 14,
        description: "Complimentary evaluation trials, zero-price starter packages, or custom duration plans",
        icon: "ti ti-gift",
        gradient: "linear-gradient(135deg, #475569 0%, #334155 100%)",
        lightBg: "#f8fafc",
        textColor: "#475569",
        frequencyLabel: "/ Plan Duration",
    },
    weekly: {
        id: "weekly",
        title: "Weekly Plans",
        badge: "7 Days",
        defaultDays: 7,
        description: "Short-term trial or weekly recurring plans for rapid clinic onboarding",
        icon: "ti ti-calendar-event",
        gradient: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
        lightBg: "#f0f9ff",
        textColor: "#0284c7",
        frequencyLabel: "/ 7 Days",
    },
    monthly: {
        id: "monthly",
        title: "Monthly Plans",
        badge: "30 Days",
        defaultDays: 30,
        description: "Standard monthly billing plans for clinics preferring flexible monthly payments",
        icon: "ti ti-calendar",
        gradient: "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)",
        lightBg: "#eef2ff",
        textColor: "#4f46e5",
        frequencyLabel: "/ Month",
    },
    quarterly: {
        id: "quarterly",
        title: "Quarterly Plans",
        badge: "90 Days (3 Months)",
        defaultDays: 90,
        description: "3-Month recurring subscription packages with quarterly payment cycles",
        icon: "ti ti-chart-pie",
        gradient: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)",
        lightBg: "#f5f3ff",
        textColor: "#7c3aed",
        frequencyLabel: "/ 3 Months",
    },
    half_yearly: {
        id: "half_yearly",
        title: "Half Yearly Plans",
        badge: "180 Days (6 Months)",
        defaultDays: 180,
        description: "6-Month mid-term subscription plans with semi-annual billing discounts",
        icon: "ti ti-calendar-stats",
        gradient: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
        lightBg: "#fffbeb",
        textColor: "#d97706",
        frequencyLabel: "/ 6 Months",
    },
    yearly: {
        id: "yearly",
        title: "Yearly Plans",
        badge: "365 Days (1 Year)",
        defaultDays: 365,
        description: "Annual subscription packages offering long-term commitment and maximum revenue",
        icon: "ti ti-crown",
        gradient: "linear-gradient(135deg, #059669 0%, #047857 100%)",
        lightBg: "#ecfdf5",
        textColor: "#059669",
        frequencyLabel: "/ Year",
    },
};

export const getPackageCycle = (pkg: Package): Exclude<BillingCycleKey, "all"> => {
    const days = pkg.durationInDays;
    const name = (pkg.name || "").toLowerCase();

    // Free / Trial
    if (pkg.price === 0 || days === 14 || name.includes("trial") || name.includes("free")) {
        return "trial_custom";
    }
    // Weekly
    if (days === 7 || name.includes("week")) {
        return "weekly";
    }
    // Monthly (28 to 35 days)
    if ((days >= 28 && days <= 35) || name.includes("month")) {
        return "monthly";
    }
    // Quarterly (80 to 105 days)
    if ((days >= 80 && days <= 105) || name.includes("quarter") || name.includes("3 month")) {
        return "quarterly";
    }
    // Half Yearly (165 to 200 days)
    if ((days >= 165 && days <= 200) || name.includes("half") || name.includes("6 month")) {
        return "half_yearly";
    }
    // Yearly (350 to 370 days)
    if ((days >= 350 && days <= 370) || name.includes("year") || name.includes("annual")) {
        return "yearly";
    }

    return "trial_custom";
};

const PackagesAdmin = () => {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loadingList, setLoadingList] = useState(true);
    const [activeTab, setActiveTab] = useState<BillingCycleKey>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "disabled">("all");

    // Modal state for full create/edit
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState<Package | null>(null);
    const [saving, setSaving] = useState(false);

    // Modal state for quick price update
    const [quickPriceModal, setQuickPriceModal] = useState<{ open: boolean; pkg: Package | null; newPrice: string }>({
        open: false,
        pkg: null,
        newPrice: "",
    });
    const [quickPriceSaving, setQuickPriceSaving] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        name: "",
        price: "",
        durationInDays: "30",
        billingCyclePreset: "monthly" as Exclude<BillingCycleKey, "all"> | "custom",
        isActive: true,
        maxDoctors: "",
        maxPatients: "",
        maxAppointments: "",
    });

    const getAuthHeaders = () => {
        const token = localStorage.getItem("token");
        return {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        };
    };

    const fetchPackages = async () => {
        try {
            setLoadingList(true);
            const response = await fetch(apiUrl("/api/packages"), {
                headers: getAuthHeaders(),
            });
            if (response.ok) {
                const data = await response.json();
                setPackages(Array.isArray(data) ? data : []);
            } else {
                toast.error("Failed to load packages from server");
            }
        } catch (error) {
            console.error("Error fetching packages:", error);
            toast.error("Network error fetching packages");
        } finally {
            setLoadingList(false);
        }
    };

    useEffect(() => {
        fetchPackages();
    }, []);

    // Filter packages by search and status
    const filteredPackages = useMemo(() => {
        return packages.filter((pkg) => {
            const matchesSearch =
                !searchQuery.trim() ||
                pkg.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
                pkg.durationInDays.toString().includes(searchQuery.trim()) ||
                pkg.price.toString().includes(searchQuery.trim());

            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" && pkg.isActive) ||
                (statusFilter === "disabled" && !pkg.isActive);

            return matchesSearch && matchesStatus;
        });
    }, [packages, searchQuery, statusFilter]);

    // Group packages by section
    const groupedPackages = useMemo(() => {
        const groups: Record<Exclude<BillingCycleKey, "all">, Package[]> = {
            trial_custom: [],
            weekly: [],
            monthly: [],
            quarterly: [],
            half_yearly: [],
            yearly: [],
        };

        filteredPackages.forEach((pkg) => {
            const cycle = getPackageCycle(pkg);
            groups[cycle].push(pkg);
        });

        Object.keys(groups).forEach((key) => {
            const k = key as Exclude<BillingCycleKey, "all">;
            groups[k].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
        });

        return groups;
    }, [filteredPackages]);

    // Total counts across all packages (regardless of search filter)
    const cycleCounts = useMemo(() => {
        const counts: Record<BillingCycleKey, number> = {
            all: packages.length,
            weekly: 0,
            monthly: 0,
            quarterly: 0,
            half_yearly: 0,
            yearly: 0,
            trial_custom: 0,
        };

        packages.forEach((pkg) => {
            const cycle = getPackageCycle(pkg);
            counts[cycle] += 1;
        });

        return counts;
    }, [packages]);

    // Summary statistics
    const stats = useMemo(() => {
        const total = packages.length;
        const activeCount = packages.filter((p) => p.isActive).length;
        const paidCount = packages.filter((p) => p.price > 0 && p.isActive).length;
        const totalClinics = packages.reduce((acc, p) => acc + (p._count?.clinics || 0), 0);
        return { total, activeCount, paidCount, totalClinics };
    }, [packages]);

    // Handle Cycle Preset change in Modal
    const handlePresetChange = (preset: Exclude<BillingCycleKey, "all"> | "custom") => {
        if (preset === "custom") {
            setFormData((prev) => ({
                ...prev,
                billingCyclePreset: "custom",
            }));
            return;
        }

        const meta = SECTIONS[preset];
        setFormData((prev) => ({
            ...prev,
            billingCyclePreset: preset,
            durationInDays: meta.defaultDays.toString(),
            price: preset === "trial_custom" && prev.price === "" ? "0" : prev.price,
        }));
    };

    const openAddModal = (defaultCycle?: Exclude<BillingCycleKey, "all">) => {
        const targetCycle = defaultCycle || (activeTab !== "all" ? activeTab : "monthly");
        const defaultDays = SECTIONS[targetCycle]?.defaultDays || 30;

        setFormData({
            name: "",
            price: targetCycle === "trial_custom" ? "0" : "",
            durationInDays: defaultDays.toString(),
            billingCyclePreset: targetCycle,
            isActive: true,
            maxDoctors: "",
            maxPatients: "",
            maxAppointments: "",
        });
        setEditingPackage(null);
        setIsModalOpen(true);
    };

    const openEditModal = (pkg: Package) => {
        const detectedCycle = getPackageCycle(pkg);
        setFormData({
            name: pkg.name,
            price: pkg.price.toString(),
            durationInDays: pkg.durationInDays.toString(),
            billingCyclePreset: detectedCycle,
            isActive: pkg.isActive,
            maxDoctors: pkg.maxDoctors != null ? pkg.maxDoctors.toString() : "",
            maxPatients: pkg.maxPatients != null ? pkg.maxPatients.toString() : "",
            maxAppointments: pkg.maxAppointments != null ? pkg.maxAppointments.toString() : "",
        });
        setEditingPackage(pkg);
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const dataToSave = {
            name: formData.name.trim(),
            price: parseFloat(formData.price) || 0,
            durationInDays: parseInt(formData.durationInDays) || 30,
            isActive: formData.isActive,
            maxDoctors: formData.maxDoctors ? parseInt(formData.maxDoctors) : null,
            maxPatients: formData.maxPatients ? parseInt(formData.maxPatients) : null,
            maxAppointments: formData.maxAppointments ? parseInt(formData.maxAppointments) : null,
        };

        try {
            const url = editingPackage
                ? apiUrl(`/api/packages/${editingPackage.id}`)
                : apiUrl("/api/packages");

            const method = editingPackage ? "PUT" : "POST";
            const response = await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(dataToSave),
            });

            if (response.ok) {
                toast.success(editingPackage ? "Package updated successfully!" : "Package created successfully!");
                setIsModalOpen(false);
                setEditingPackage(null);
                fetchPackages();
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || "Failed to save package");
            }
        } catch (error) {
            console.error("Error saving package:", error);
            toast.error("Network error while saving package");
        } finally {
            setSaving(false);
        }
    };

    // Quick Price Update Handler
    const handleQuickPriceSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quickPriceModal.pkg) return;

        const parsedPrice = parseFloat(quickPriceModal.newPrice);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
            toast.error("Please enter a valid price amount");
            return;
        }

        setQuickPriceSaving(true);
        try {
            const response = await fetch(apiUrl(`/api/packages/${quickPriceModal.pkg.id}`), {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    price: parsedPrice,
                }),
            });

            if (response.ok) {
                toast.success(`Price updated to ₹${parsedPrice.toLocaleString("en-IN")} successfully!`);
                setQuickPriceModal({ open: false, pkg: null, newPrice: "" });
                fetchPackages();
            } else {
                const err = await response.json();
                toast.error(err.message || "Failed to update price");
            }
        } catch (error) {
            console.error("Quick price error:", error);
            toast.error("Network error while updating price");
        } finally {
            setQuickPriceSaving(false);
        }
    };

    const handleDelete = async (pkg: Package) => {
        const clinicsCount = pkg._count?.clinics || 0;
        if (clinicsCount > 0) {
            alert(
                `Protected: "${pkg.name}" currently has ${clinicsCount} active clinic(s) assigned. To preserve clinic accounts and billing history, please disable this package instead of deleting it.`
            );
            return;
        }

        if (!window.confirm(`Are you sure you want to delete the package "${pkg.name}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(apiUrl(`/api/packages/${pkg.id}`), {
                method: "DELETE",
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                toast.success("Package deleted successfully");
                fetchPackages();
            } else {
                const err = await response.json();
                toast.error(err.message || "Failed to delete package");
            }
        } catch (error) {
            console.error("Error deleting package:", error);
            toast.error("Network error deleting package");
        }
    };

    const toggleStatus = async (pkg: Package) => {
        try {
            const newStatus = !pkg.isActive;
            const response = await fetch(apiUrl(`/api/packages/${pkg.id}`), {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify({ isActive: newStatus }),
            });

            if (response.ok) {
                toast.success(`"${pkg.name}" is now ${newStatus ? "Active (Accepting Payments)" : "Disabled"}`);
                fetchPackages();
            } else {
                const err = await response.json();
                toast.error(err.message || "Failed to update package status");
            }
        } catch (error) {
            console.error("Error toggling status:", error);
            toast.error("Network error updating status");
        }
    };

    // Render individual package card
    const renderPackageCard = (pkg: Package, meta: SectionMeta) => {
        const clinicsCount = pkg._count?.clinics || 0;
        const estRevenue = (pkg.price * clinicsCount).toLocaleString("en-IN");

        return (
            <div key={pkg.id} className="col-12 col-md-6 col-xl-4">
                <div
                    className={`card border-0 shadow-sm h-100 transition-all ${
                        !pkg.isActive ? "opacity-75" : ""
                    }`}
                    style={{
                        borderRadius: "18px",
                        overflow: "hidden",
                        backgroundColor: "#ffffff",
                        border: pkg.isActive ? "1px solid #e2e8f0" : "1px dashed #cbd5e1",
                    }}
                >
                    {/* Card Header Banner */}
                    <div
                        className="p-4 text-white position-relative"
                        style={{
                            background: pkg.isActive ? meta.gradient : "linear-gradient(135deg, #64748b 0%, #475569 100%)",
                        }}
                    >
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span
                                className="badge bg-white text-dark fw-bold px-2.5 py-1.5 shadow-sm d-flex align-items-center gap-1"
                                style={{ borderRadius: "20px", fontSize: "11px" }}
                            >
                                <i className={meta.icon} style={{ color: meta.textColor }}></i>
                                {meta.badge}
                            </span>
                            <div className="d-flex align-items-center gap-2">
                                <button
                                    className="btn btn-sm btn-white p-1 rounded-circle border-0 shadow-sm d-flex align-items-center justify-content-center"
                                    style={{ width: "32px", height: "32px", background: "rgba(255,255,255,0.9)" }}
                                    onClick={() => handleDelete(pkg)}
                                    title={clinicsCount > 0 ? "Package has active clinics" : "Delete Package"}
                                >
                                    <i className="ti ti-trash text-danger fs-14" />
                                </button>
                            </div>
                        </div>

                        <h5 className="text-white fw-bold mb-1 text-truncate" title={pkg.name}>
                            {pkg.name}
                        </h5>

                        <div className="d-flex align-items-baseline mt-3">
                            <h2 className="text-white fw-extrabold mb-0" style={{ letterSpacing: "-0.5px" }}>
                                {pkg.price === 0 ? "Free" : `₹${pkg.price.toLocaleString("en-IN")}`}
                            </h2>
                            <span className="text-white-50 ms-2 fs-13 fw-medium">
                                {meta.frequencyLabel} ({pkg.durationInDays} Days)
                            </span>
                        </div>
                    </div>

                    {/* Card Body & Payment Controls */}
                    <div className="card-body p-4 d-flex flex-column justify-content-between">
                        {/* Subscribed Tenants & Estimated Revenue Info */}
                        <div className="d-flex align-items-center justify-content-between p-2.5 rounded-3 mb-3" style={{ background: "#f8fafc" }}>
                            <div className="d-flex align-items-center gap-2">
                                <div
                                    className="rounded-circle d-flex align-items-center justify-content-center"
                                    style={{ width: "28px", height: "28px", background: "#e2e8f0" }}
                                >
                                    <i className="ti ti-building-hospital text-dark fs-14"></i>
                                </div>
                                <span className="fs-13 fw-semibold text-dark">
                                    {clinicsCount} {clinicsCount === 1 ? "Clinic Subscribed" : "Clinics Subscribed"}
                                </span>
                            </div>
                            {clinicsCount > 0 && pkg.price > 0 && (
                                <span className="badge bg-success-subtle text-success fs-12 fw-bold px-2 py-1">
                                    Rev: ₹{estRevenue}
                                </span>
                            )}
                        </div>

                        {/* Plan Limits Quotas */}
                        <div className="row g-2 mb-3">
                            <div className="col-4">
                                <div className="p-2 border rounded-3 text-center" style={{ background: "#ffffff" }}>
                                    <small className="text-muted d-block fs-11 text-uppercase fw-semibold">Doctors</small>
                                    <span className="fw-bold text-dark fs-12">
                                        {pkg.maxDoctors != null ? `${pkg.maxDoctors}` : "∞ Max"}
                                    </span>
                                </div>
                            </div>
                            <div className="col-4">
                                <div className="p-2 border rounded-3 text-center" style={{ background: "#ffffff" }}>
                                    <small className="text-muted d-block fs-11 text-uppercase fw-semibold">Patients</small>
                                    <span className="fw-bold text-dark fs-12">
                                        {pkg.maxPatients != null ? `${pkg.maxPatients}` : "∞ Max"}
                                    </span>
                                </div>
                            </div>
                            <div className="col-4">
                                <div className="p-2 border rounded-3 text-center" style={{ background: "#ffffff" }}>
                                    <small className="text-muted d-block fs-11 text-uppercase fw-semibold">Appts</small>
                                    <span className="fw-bold text-dark fs-12">
                                        {pkg.maxAppointments != null ? `${pkg.maxAppointments}` : "∞ Max"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Status & Quick Management Buttons */}
                        <div className="border-top pt-3 mt-auto">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div className="form-check form-switch m-0 d-flex align-items-center">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={pkg.isActive}
                                        onChange={() => toggleStatus(pkg)}
                                        id={`status-${pkg.id}`}
                                        style={{ width: "38px", height: "20px", cursor: "pointer" }}
                                    />
                                    <label
                                        className="form-check-label ms-2 fs-13 fw-semibold cursor-pointer"
                                        htmlFor={`status-${pkg.id}`}
                                        style={{ color: pkg.isActive ? "#16a34a" : "#64748b" }}
                                    >
                                        {pkg.isActive ? "Accepting Payments" : "Payments Paused"}
                                    </label>
                                </div>
                                <span
                                    className={`badge px-2 py-1 fs-11 fw-bold ${
                                        pkg.isActive ? "bg-success-subtle text-success" : "bg-secondary-subtle text-muted"
                                    }`}
                                >
                                    {pkg.isActive ? "Live" : "Disabled"}
                                </span>
                            </div>

                            <div className="d-flex gap-2">
                                <button
                                    className="btn btn-outline-secondary btn-sm flex-grow-1 rounded-pill fw-semibold d-flex align-items-center justify-content-center gap-1"
                                    onClick={() =>
                                        setQuickPriceModal({
                                            open: true,
                                            pkg,
                                            newPrice: pkg.price.toString(),
                                        })
                                    }
                                >
                                    <i className="ti ti-currency-rupee fs-14" /> Edit Price
                                </button>
                                <button
                                    className="btn btn-primary btn-sm flex-grow-1 rounded-pill fw-semibold d-flex align-items-center justify-content-center gap-1"
                                    onClick={() => openEditModal(pkg)}
                                >
                                    <i className="ti ti-edit fs-14" /> Edit Plan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Render a section with header, description, and list of cards
    const renderSection = (cycleKey: Exclude<BillingCycleKey, "all">) => {
        const meta = SECTIONS[cycleKey];
        const sectionPkgs = groupedPackages[cycleKey];

        return (
            <div key={cycleKey} className="mb-5">
                {/* Section Header */}
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 pb-2 border-bottom">
                    <div className="d-flex align-items-center gap-2 mb-2 mb-md-0">
                        <div
                            className="rounded-3 p-2 d-flex align-items-center justify-content-center"
                            style={{ background: meta.lightBg, color: meta.textColor }}
                        >
                            <i className={`${meta.icon} fs-20`}></i>
                        </div>
                        <div>
                            <div className="d-flex align-items-center gap-2">
                                <h5 className="fw-bold mb-0 text-dark fs-18">{meta.title}</h5>
                                <span className="badge rounded-pill fw-bold" style={{ background: meta.lightBg, color: meta.textColor }}>
                                    {sectionPkgs.length} {sectionPkgs.length === 1 ? "Plan" : "Plans"}
                                </span>
                            </div>
                            <small className="text-muted fs-13">{meta.description}</small>
                        </div>
                    </div>
                    <button
                        className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-bold d-flex align-items-center gap-1"
                        onClick={() => openAddModal(cycleKey)}
                    >
                        <i className="ti ti-plus" /> Add {meta.title.replace(" Plans", "")} Plan
                    </button>
                </div>

                {/* Section Cards */}
                {sectionPkgs.length === 0 ? (
                    <div
                        className="p-4 rounded-4 text-center my-3"
                        style={{ background: "#f8fafc", border: "1px dashed #cbd5e1" }}
                    >
                        <div
                            className="rounded-circle d-inline-flex p-3 mb-2"
                            style={{ background: meta.lightBg, color: meta.textColor }}
                        >
                            <i className={`${meta.icon} fs-24`}></i>
                        </div>
                        <h6 className="fw-bold text-dark mb-1">No {meta.title} Configured</h6>
                        <p className="text-muted fs-13 mb-3">
                            Create a {meta.title.toLowerCase().replace(" plans", "")} package to allow clinics to subscribe on this billing cycle.
                        </p>
                        <button
                            className="btn btn-primary btn-sm rounded-pill px-4 fw-bold"
                            onClick={() => openAddModal(cycleKey)}
                        >
                            <i className="ti ti-plus me-1" /> Create First {meta.title.replace(" Plans", "")} Plan
                        </button>
                    </div>
                ) : (
                    <div className="row g-4">{sectionPkgs.map((pkg) => renderPackageCard(pkg, meta))}</div>
                )}
            </div>
        );
    };

    return (
        <div className="page-wrapper">
            <div className="content">
                {/* Page Title & Main Action Button */}
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                    <div>
                        <h4 className="fw-bold fs-3 mb-1 text-dark d-flex align-items-center gap-2">
                            <i className="ti ti-packages text-primary"></i> Subscription Packages & Payment Plans
                        </h4>
                        <p className="text-muted fs-14 mb-0">
                            Configure SaaS pricing tiers, billing cycles, and payment settings for tenant clinics
                        </p>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <button
                            className="btn btn-outline-secondary d-flex align-items-center gap-1.5 px-3 py-2 rounded-pill fw-semibold shadow-sm"
                            onClick={fetchPackages}
                            disabled={loadingList}
                        >
                            <i className={`ti ti-refresh ${loadingList ? "spin" : ""}`} /> Refresh
                        </button>
                        <button
                            className="btn btn-primary d-flex align-items-center gap-1.5 px-4 py-2 rounded-pill fw-bold shadow"
                            onClick={() => openAddModal()}
                        >
                            <i className="ti ti-plus fs-16" /> Add New Package
                        </button>
                    </div>
                </div>

                {/* Top Metrics Cards */}
                <div className="row g-3 mb-4">
                    <div className="col-6 col-md-3">
                        <div className="card border-0 shadow-sm p-3 rounded-4" style={{ background: "#ffffff" }}>
                            <div className="d-flex align-items-center gap-3">
                                <div className="rounded-3 p-2.5 bg-primary-subtle text-primary">
                                    <i className="ti ti-packages fs-20"></i>
                                </div>
                                <div>
                                    <small className="text-muted d-block fs-12 text-uppercase fw-semibold">Total Packages</small>
                                    <h4 className="fw-bold text-dark mb-0">{stats.total}</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="card border-0 shadow-sm p-3 rounded-4" style={{ background: "#ffffff" }}>
                            <div className="d-flex align-items-center gap-3">
                                <div className="rounded-3 p-2.5 bg-success-subtle text-success">
                                    <i className="ti ti-credit-card fs-20"></i>
                                </div>
                                <div>
                                    <small className="text-muted d-block fs-12 text-uppercase fw-semibold">Accepting Payments</small>
                                    <h4 className="fw-bold text-dark mb-0">{stats.activeCount}</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="card border-0 shadow-sm p-3 rounded-4" style={{ background: "#ffffff" }}>
                            <div className="d-flex align-items-center gap-3">
                                <div className="rounded-3 p-2.5 bg-info-subtle text-info">
                                    <i className="ti ti-building-hospital fs-20"></i>
                                </div>
                                <div>
                                    <small className="text-muted d-block fs-12 text-uppercase fw-semibold">Subscribed Clinics</small>
                                    <h4 className="fw-bold text-dark mb-0">{stats.totalClinics}</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="card border-0 shadow-sm p-3 rounded-4" style={{ background: "#ffffff" }}>
                            <div className="d-flex align-items-center gap-3">
                                <div className="rounded-3 p-2.5 bg-warning-subtle text-warning">
                                    <i className="ti ti-calendar-stats fs-20"></i>
                                </div>
                                <div>
                                    <small className="text-muted d-block fs-12 text-uppercase fw-semibold">Paid Tier Plans</small>
                                    <h4 className="fw-bold text-dark mb-0">{stats.paidCount}</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Billing Cycle Tabs Navigation */}
                <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: "16px" }}>
                    <div className="card-body p-3">
                        <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between">
                            <ul className="nav nav-pills gap-1.5 border-0 m-0">
                                <li className="nav-item">
                                    <button
                                        className={`nav-link rounded-pill px-3 py-2 fw-semibold fs-13 d-flex align-items-center gap-2 ${
                                            activeTab === "all" ? "active bg-primary text-white" : "text-muted"
                                        }`}
                                        onClick={() => setActiveTab("all")}
                                    >
                                        <i className="ti ti-layout-grid"></i> All Plans
                                        <span className={`badge rounded-pill ${activeTab === "all" ? "bg-white text-primary" : "bg-light text-dark"}`}>
                                            {cycleCounts.all}
                                        </span>
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button
                                        className={`nav-link rounded-pill px-3 py-2 fw-semibold fs-13 d-flex align-items-center gap-2 ${
                                            activeTab === "trial_custom" ? "active bg-primary text-white" : "text-muted"
                                        }`}
                                        onClick={() => setActiveTab("trial_custom")}
                                    >
                                        <i className={SECTIONS.trial_custom.icon}></i> Free Trial / Custom
                                        <span className={`badge rounded-pill ${activeTab === "trial_custom" ? "bg-white text-primary" : "bg-light text-dark"}`}>
                                            {cycleCounts.trial_custom}
                                        </span>
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button
                                        className={`nav-link rounded-pill px-3 py-2 fw-semibold fs-13 d-flex align-items-center gap-2 ${
                                            activeTab === "weekly" ? "active bg-primary text-white" : "text-muted"
                                        }`}
                                        onClick={() => setActiveTab("weekly")}
                                    >
                                        <i className={SECTIONS.weekly.icon}></i> Weekly (7d)
                                        <span className={`badge rounded-pill ${activeTab === "weekly" ? "bg-white text-primary" : "bg-light text-dark"}`}>
                                            {cycleCounts.weekly}
                                        </span>
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button
                                        className={`nav-link rounded-pill px-3 py-2 fw-semibold fs-13 d-flex align-items-center gap-2 ${
                                            activeTab === "monthly" ? "active bg-primary text-white" : "text-muted"
                                        }`}
                                        onClick={() => setActiveTab("monthly")}
                                    >
                                        <i className={SECTIONS.monthly.icon}></i> Monthly (30d)
                                        <span className={`badge rounded-pill ${activeTab === "monthly" ? "bg-white text-primary" : "bg-light text-dark"}`}>
                                            {cycleCounts.monthly}
                                        </span>
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button
                                        className={`nav-link rounded-pill px-3 py-2 fw-semibold fs-13 d-flex align-items-center gap-2 ${
                                            activeTab === "quarterly" ? "active bg-primary text-white" : "text-muted"
                                        }`}
                                        onClick={() => setActiveTab("quarterly")}
                                    >
                                        <i className={SECTIONS.quarterly.icon}></i> Quarterly (90d)
                                        <span className={`badge rounded-pill ${activeTab === "quarterly" ? "bg-white text-primary" : "bg-light text-dark"}`}>
                                            {cycleCounts.quarterly}
                                        </span>
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button
                                        className={`nav-link rounded-pill px-3 py-2 fw-semibold fs-13 d-flex align-items-center gap-2 ${
                                            activeTab === "half_yearly" ? "active bg-primary text-white" : "text-muted"
                                        }`}
                                        onClick={() => setActiveTab("half_yearly")}
                                    >
                                        <i className={SECTIONS.half_yearly.icon}></i> Half Yearly (180d)
                                        <span className={`badge rounded-pill ${activeTab === "half_yearly" ? "bg-white text-primary" : "bg-light text-dark"}`}>
                                            {cycleCounts.half_yearly}
                                        </span>
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button
                                        className={`nav-link rounded-pill px-3 py-2 fw-semibold fs-13 d-flex align-items-center gap-2 ${
                                            activeTab === "yearly" ? "active bg-primary text-white" : "text-muted"
                                        }`}
                                        onClick={() => setActiveTab("yearly")}
                                    >
                                        <i className={SECTIONS.yearly.icon}></i> Yearly (365d)
                                        <span className={`badge rounded-pill ${activeTab === "yearly" ? "bg-white text-primary" : "bg-light text-dark"}`}>
                                            {cycleCounts.yearly}
                                        </span>
                                    </button>
                                </li>
                            </ul>

                            {/* Search and Filter Inputs */}
                            <div className="d-flex align-items-center gap-2 mt-2 mt-lg-0">
                                <div className="position-relative" style={{ width: "245px" }}>
                                    <input
                                        type="text"
                                        className="form-control form-control-sm bg-light fs-13 ps-5"
                                        style={{
                                            borderRadius: "20px",
                                            paddingLeft: "42px",
                                            paddingRight: searchQuery ? "32px" : "14px",
                                            borderColor: "#e2e8f0",
                                            boxShadow: "none",
                                            height: "36px",
                                        }}
                                        placeholder="Search packages..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <i
                                        className="ti ti-search text-muted position-absolute"
                                        style={{
                                            left: "13px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            fontSize: "14px",
                                            pointerEvents: "none",
                                        }}
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            className="btn btn-link p-0 position-absolute text-muted d-flex align-items-center justify-content-center"
                                            style={{
                                                right: "10px",
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                width: "20px",
                                                height: "20px",
                                                textDecoration: "none",
                                                border: "none",
                                                background: "transparent",
                                            }}
                                            onClick={() => setSearchQuery("")}
                                            title="Clear search"
                                        >
                                            <i className="ti ti-x fs-12" />
                                        </button>
                                    )}
                                </div>

                                <select
                                    className="form-select form-select-sm bg-light fs-13"
                                    style={{
                                        width: "135px",
                                        borderRadius: "20px",
                                        borderColor: "#e2e8f0",
                                        height: "36px",
                                        cursor: "pointer",
                                    }}
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as any)}
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active Only</option>
                                    <option value="disabled">Disabled Only</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Sections */}
                {loadingList ? (
                    <div className="d-flex justify-content-center align-items-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading packages...</span>
                        </div>
                    </div>
                ) : filteredPackages.length === 0 && searchQuery ? (
                    <div className="card border-0 shadow-sm p-5 text-center rounded-4">
                        <i className="ti ti-search-off fs-1 text-muted mb-2"></i>
                        <h5 className="fw-bold text-dark">No packages match "{searchQuery}"</h5>
                        <p className="text-muted fs-14 mb-3">Try clearing your search query or switching tabs.</p>
                        <button className="btn btn-primary btn-sm rounded-pill px-4 mx-auto" onClick={() => setSearchQuery("")}>
                            Clear Search
                        </button>
                    </div>
                ) : (
                    <div>
                        {activeTab === "all" ? (
                            <>
                                {renderSection("trial_custom")}
                                {renderSection("weekly")}
                                {renderSection("monthly")}
                                {renderSection("quarterly")}
                                {renderSection("half_yearly")}
                                {renderSection("yearly")}
                            </>
                        ) : (
                            renderSection(activeTab)
                        )}
                    </div>
                )}
            </div>

            {/* Quick Price Update Modal */}
            {quickPriceModal.open && quickPriceModal.pkg && (
                <div
                    className="modal show d-block"
                    tabIndex={-1}
                    style={{ backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", zIndex: 1055 }}
                >
                    <div className="modal-dialog modal-dialog-centered modal-sm">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "20px" }}>
                            <div className="modal-header border-0 p-4 pb-0">
                                <div>
                                    <h5 className="modal-title fw-bold fs-16 mb-0 text-dark">Quick Price Update</h5>
                                    <small className="text-muted">{quickPriceModal.pkg.name}</small>
                                </div>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setQuickPriceModal({ open: false, pkg: null, newPrice: "" })}
                                />
                            </div>
                            <form onSubmit={handleQuickPriceSave}>
                                <div className="modal-body p-4">
                                    <label className="form-label fw-bold fs-13">New Price (₹ INR)</label>
                                    <div className="position-relative mb-3">
                                        <span
                                            className="position-absolute text-muted fw-bold fs-18 d-flex align-items-center justify-content-center"
                                            style={{
                                                left: "14px",
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                pointerEvents: "none",
                                                zIndex: 2,
                                                color: "#64748b",
                                            }}
                                        >
                                            ₹
                                        </span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            className="form-control fw-bold fs-18 quick-price-input"
                                            style={{
                                                height: "50px",
                                                borderRadius: "12px",
                                            }}
                                            required
                                            value={quickPriceModal.newPrice}
                                            onChange={(e) =>
                                                setQuickPriceModal((prev) => ({ ...prev, newPrice: e.target.value }))
                                            }
                                            placeholder="0.00"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="d-flex gap-2">
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary btn-sm rounded-pill flex-grow-1"
                                            onClick={() =>
                                                setQuickPriceModal((prev) => ({ ...prev, newPrice: "0" }))
                                            }
                                        >
                                            Set as Free (₹0)
                                        </button>
                                    </div>
                                </div>
                                <div className="modal-footer border-0 p-4 pt-0 d-flex gap-2">
                                    <button
                                        type="button"
                                        className="btn btn-light rounded-pill flex-grow-1"
                                        onClick={() => setQuickPriceModal({ open: false, pkg: null, newPrice: "" })}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={quickPriceSaving}
                                        className="btn btn-primary rounded-pill flex-grow-1 fw-bold"
                                    >
                                        {quickPriceSaving ? "Saving..." : "Update Price"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Create & Edit Package Modal */}
            {isModalOpen && (
                <div
                    className="modal show d-block"
                    tabIndex={-1}
                    style={{ backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", zIndex: 1050 }}
                >
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "22px" }}>
                            <div className="modal-header border-0 p-4 pb-2 d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="modal-title fw-bold fs-20 text-dark mb-1">
                                        {editingPackage ? "Edit Subscription Plan & Pricing" : "Create New Subscription Plan"}
                                    </h5>
                                    <p className="text-muted fs-13 mb-0">
                                        Configure plan billing frequency, pricing amount, and clinic resource limits
                                    </p>
                                </div>
                                <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)} />
                            </div>

                            <div className="modal-body p-4 pt-3">
                                <form onSubmit={handleSave}>
                                    {/* 1. Billing Cycle Presets Selector */}
                                    <div className="mb-4">
                                        <style>{`
                                            .billing-cycle-chip {
                                                border: 1.5px solid #00D3C7 !important;
                                                background-color: #ffffff !important;
                                                color: #008f86 !important;
                                                font-weight: 600;
                                                font-size: 13px;
                                                padding: 6px 14px;
                                                border-radius: 50rem;
                                                transition: all 0.2s ease-in-out;
                                                display: inline-flex;
                                                align-items: center;
                                                gap: 6px;
                                                cursor: pointer;
                                            }
                                            .billing-cycle-chip:hover {
                                                background-color: #e6faf8 !important;
                                                border-color: #00998f !important;
                                                color: #005a54 !important;
                                                transform: translateY(-1px);
                                            }
                                            .billing-cycle-chip.selected {
                                                background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%) !important;
                                                border-color: #4f46e5 !important;
                                                color: #ffffff !important;
                                                box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3) !important;
                                            }
                                            .billing-cycle-chip.selected:hover {
                                                color: #ffffff !important;
                                            }
                                            .pricing-amount-input {
                                                padding-left: 48px !important;
                                            }
                                            .duration-days-input {
                                                padding-right: 68px !important;
                                            }
                                            .quick-price-input {
                                                padding-left: 48px !important;
                                            }
                                        `}</style>
                                        <label className="form-label fw-bold text-dark fs-13 mb-2 d-block">
                                            Select Billing Cycle Section:
                                        </label>
                                        <div className="d-flex flex-wrap gap-2">
                                            {(["trial_custom", "weekly", "monthly", "quarterly", "half_yearly", "yearly"] as const).map(
                                                (presetKey) => {
                                                    const isSelected = formData.billingCyclePreset === presetKey;
                                                    const meta = SECTIONS[presetKey];
                                                    return (
                                                        <button
                                                            key={presetKey}
                                                            type="button"
                                                            className={`billing-cycle-chip ${isSelected ? "selected" : ""}`}
                                                            onClick={() => handlePresetChange(presetKey)}
                                                        >
                                                            <i className={meta.icon}></i>
                                                            {meta.title.replace(" Plans", "")} ({meta.badge})
                                                        </button>
                                                    );
                                                }
                                            )}
                                        </div>
                                    </div>

                                    {/* 2. Core Package Info */}
                                    <div className="row g-3 mb-4">
                                        <div className="col-12 col-md-7">
                                            <label className="form-label fw-bold text-dark fs-13">Plan Name *</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-lg fs-14"
                                                style={{ height: "46px", borderRadius: "12px" }}
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="e.g. Standard Monthly Clinic Plan, Annual Pro"
                                            />
                                        </div>

                                        <div className="col-12 col-md-5">
                                            <label className="form-label fw-bold text-dark fs-13">Duration (Days) *</label>
                                            <div className="position-relative w-100">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="form-control form-control-lg fs-14 duration-days-input"
                                                    style={{
                                                        height: "46px",
                                                        borderRadius: "12px",
                                                    }}
                                                    required
                                                    value={formData.durationInDays}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            durationInDays: e.target.value,
                                                            billingCyclePreset: "custom",
                                                        })
                                                    }
                                                    placeholder="7"
                                                />
                                                <span
                                                    className="position-absolute text-muted fw-semibold fs-12 d-flex align-items-center justify-content-center"
                                                    style={{
                                                        right: "12px",
                                                        top: "50%",
                                                        transform: "translateY(-50%)",
                                                        backgroundColor: "#f1f5f9",
                                                        color: "#475569",
                                                        padding: "4px 10px",
                                                        borderRadius: "8px",
                                                        pointerEvents: "none",
                                                        lineHeight: "1",
                                                    }}
                                                >
                                                    Days
                                                </span>
                                            </div>
                                        </div>

                                        <div className="col-12 col-md-7">
                                            <label className="form-label fw-bold text-dark fs-13">
                                                Pricing Amount (₹ INR) *
                                            </label>
                                            <div className="d-flex align-items-center gap-2">
                                                <div className="position-relative flex-grow-1">
                                                    <span
                                                        className="position-absolute text-muted fw-bold fs-16 d-flex align-items-center justify-content-center"
                                                        style={{
                                                            left: "14px",
                                                            top: "50%",
                                                            transform: "translateY(-50%)",
                                                            pointerEvents: "none",
                                                            zIndex: 2,
                                                            color: "#64748b",
                                                        }}
                                                    >
                                                        ₹
                                                    </span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        className="form-control form-control-lg fs-15 fw-bold pricing-amount-input"
                                                        style={{
                                                            height: "46px",
                                                            borderRadius: "12px",
                                                        }}
                                                        required
                                                        value={formData.price}
                                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    className="btn fs-12 px-3 fw-semibold text-nowrap d-flex align-items-center justify-content-center"
                                                    style={{
                                                        height: "46px",
                                                        borderRadius: "12px",
                                                        border: "1.5px solid #00D3C7",
                                                        color: "#008f86",
                                                        backgroundColor: "#ffffff",
                                                        transition: "all 0.2s ease-in-out",
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = "#e6faf8";
                                                        e.currentTarget.style.color = "#005a54";
                                                        e.currentTarget.style.borderColor = "#00998f";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = "#ffffff";
                                                        e.currentTarget.style.color = "#008f86";
                                                        e.currentTarget.style.borderColor = "#00D3C7";
                                                    }}
                                                    onClick={() => setFormData({ ...formData, price: "0" })}
                                                >
                                                    Free (₹0)
                                                </button>
                                            </div>
                                            <small className="text-muted fs-12 mt-1 d-block">
                                                Online payment via Razorpay will be triggered for any price &gt; 0
                                            </small>
                                        </div>

                                        <div className="col-12 col-md-5 d-flex align-items-center">
                                            <div className="p-3 border rounded-3 w-100 bg-light">
                                                <div className="form-check form-switch m-0 d-flex align-items-center justify-content-between">
                                                    <div>
                                                        <label
                                                            className="form-check-label fw-bold text-dark fs-13 cursor-pointer"
                                                            htmlFor="packageIsActiveToggle"
                                                        >
                                                            Plan Status
                                                        </label>
                                                        <small className="d-block text-muted fs-11">
                                                            {formData.isActive ? "Available for online payment" : "Paused / Hidden from clinics"}
                                                        </small>
                                                    </div>
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="packageIsActiveToggle"
                                                        checked={formData.isActive}
                                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                                        style={{ width: "40px", height: "22px", cursor: "pointer" }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. Resource Quotas / Limits (Optional) */}
                                    <div className="p-3 rounded-4 mb-4" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                                        <h6 className="fw-bold text-dark fs-13 mb-2 d-flex align-items-center gap-1.5">
                                            <i className="ti ti-shield-check text-primary"></i> Resource Limits & Quotas (Optional)
                                        </h6>
                                        <small className="text-muted d-block mb-3 fs-12">
                                            Leave blank or empty for unlimited quotas for subscribed clinics.
                                        </small>

                                        <div className="row g-3">
                                            <div className="col-md-4">
                                                <label className="form-label fs-12 fw-semibold text-secondary">Max Doctors</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="form-control form-control-sm"
                                                    placeholder="e.g. 10 (or blank for ∞)"
                                                    value={formData.maxDoctors}
                                                    onChange={(e) => setFormData({ ...formData, maxDoctors: e.target.value })}
                                                />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label fs-12 fw-semibold text-secondary">Max Patients</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="form-control form-control-sm"
                                                    placeholder="e.g. 1000 (or blank for ∞)"
                                                    value={formData.maxPatients}
                                                    onChange={(e) => setFormData({ ...formData, maxPatients: e.target.value })}
                                                />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label fs-12 fw-semibold text-secondary">Max Appointments</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="form-control form-control-sm"
                                                    placeholder="e.g. 5000 (or blank for ∞)"
                                                    value={formData.maxAppointments}
                                                    onChange={(e) => setFormData({ ...formData, maxAppointments: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Modal Actions */}
                                    <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                                        <button
                                            type="button"
                                            className="btn btn-light px-4 rounded-pill fw-semibold"
                                            onClick={() => setIsModalOpen(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="btn btn-primary px-5 rounded-pill fw-bold d-flex align-items-center gap-2 shadow"
                                        >
                                            {saving && <span className="spinner-border spinner-border-sm" />}
                                            {saving ? "Saving Plan..." : editingPackage ? "Save Changes" : "Create Plan"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PackagesAdmin;
