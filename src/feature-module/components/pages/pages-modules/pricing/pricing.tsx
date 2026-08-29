import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiUrl } from "../../../../../core/config/api";
import { setLocalStorageUser } from "../../../../../core/utils/apiClient";
import { all_routes } from "../../../../routes/all_routes";
import dayjs from "dayjs";

interface Package {
  id: string;
  name: string;
  price: number;
  durationInDays: number;
  isActive: boolean;
  features?: string[];
  description?: string;
  isPopular?: boolean;
}

const formatDuration = (days?: number) => {
  if (!days) return "1 Month (30 Days)";
  if (days >= 350) {
    const years = Math.round(days / 365);
    return `${years} Year${years > 1 ? "s" : ""} (${days} Days)`;
  }
  if (days >= 25) {
    const months = Math.round(days / 30);
    return `${months} Month${months > 1 ? "s" : ""} (${days} Days)`;
  }
  return `${days} Days`;
};

const defaultFeatures = [
  "Unlimited Patients & OPD Consultations",
  "Digital Rx & E-Prescription Printing",
  "Inpatient (IPD) & Bed Ward Management",
  "Diagnostic & Pathology Lab System",
  "Pharmacy POS & Inventory Tracking",
  "Automated WhatsApp & SMS Alerts",
  "Staff HRM, Attendance & Payroll",
  "Financial Invoicing & GST Reports",
  "High-Speed Cloud Backup & Security",
  "24/7 Dedicated Priority Support",
];

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Pricing = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(() => {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  });

  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<any | null>(null);

  const currentPackageId = user?.clinic?.packageId || user?.clinic?.package?.id;
  const currentPackageExpiresAt = user?.clinic?.packageExpiresAt;
  const currentPackageName =
    user?.clinic?.package?.name ||
    user?.clinic?.packageName ||
    (user?.clinic?.status === "TRIAL" ? "Free Trial" : "DocYori Starter");

  const fetchPackages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(apiUrl("/api/packages"));
      if (res.ok) {
        const data = await res.json();
        const activePkgs = Array.isArray(data) ? data.filter((p: Package) => p.isActive !== false) : [];

        if (activePkgs.length === 0) {
          setPackages([
            {
              id: "starter-1m",
              name: "DocYori Starter",
              price: 1999,
              durationInDays: 30,
              isActive: true,
              description: "Ideal for individual clinics and solo medical practitioners.",
              isPopular: false,
            },
            {
              id: "growth-3m",
              name: "DocYori Professional",
              price: 4999,
              durationInDays: 90,
              isActive: true,
              description: "Best for growing multi-doctor clinics with IPD and Pharmacy.",
              isPopular: true,
            },
            {
              id: "annual-12m",
              name: "DocYori Enterprise (Annual)",
              price: 14999,
              durationInDays: 365,
              isActive: true,
              description: "Complete full-suite solution for hospitals & multi-chain clinics.",
              isPopular: false,
            },
          ]);
        } else {
          setPackages(activePkgs);
        }
      }
    } catch (err) {
      console.error("Failed to load packages", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const handleUpgradeSuccess = (pkg: Package, clinicData: any, paymentId: string) => {
    setProcessingPlanId(null);
    const updatedUser = {
      ...user,
      clinic: {
        ...user?.clinic,
        id: clinicData?.id || user?.clinic?.id,
        name: clinicData?.name || user?.clinic?.name,
        package: clinicData?.package || pkg,
        packageId: pkg.id,
        packageName: pkg.name,
        packageDurationInDays: pkg.durationInDays,
        packageStartsAt: clinicData?.packageStartsAt || new Date().toISOString(),
        packageExpiresAt: clinicData?.packageExpiresAt,
        status: "UPGRADED",
      },
    };

    setLocalStorageUser(updatedUser);
    setUser(updatedUser);

    window.dispatchEvent(new Event("clinic-subscription-updated"));

    setPaymentSuccess({
      transactionId: paymentId || `TXN-${Date.now().toString(36).toUpperCase()}`,
      packageName: pkg.name,
      amount: pkg.price,
      duration: formatDuration(pkg.durationInDays),
      expiresAt: clinicData?.packageExpiresAt,
    });
  };

  const handleRazorpayCheckout = async (pkg: Package) => {
    setProcessingPlanId(pkg.id);
    const token = localStorage.getItem("token");

    try {
      // 1. Free package handler
      if (pkg.price === 0) {
        const res = await fetch(apiUrl("/api/auth/upgrade-plan"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ packageId: pkg.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to activate plan");

        handleUpgradeSuccess(pkg, data.clinic, `FREE-${Date.now().toString(36).toUpperCase()}`);
        return;
      }

      // 2. Create Razorpay Order from backend
      const orderRes = await fetch(apiUrl("/api/payments/create-order"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ packageId: pkg.id }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.message || "Failed to create payment order");
      }

      // If Razorpay gateway is bypassed in backend settings
      if (orderData.bypass) {
        const upgradeRes = await fetch(apiUrl("/api/auth/upgrade-plan"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ packageId: pkg.id }),
        });
        const upgradeData = await upgradeRes.json();
        if (!upgradeRes.ok) throw new Error(upgradeData.message || "Failed to activate plan");

        handleUpgradeSuccess(pkg, upgradeData.clinic, `PAY-${Date.now().toString(36).toUpperCase()}`);
        return;
      }

      // 3. Load Razorpay Checkout SDK and launch popup
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Razorpay SDK failed to load. Please check your internet connection.");
      }

      const options = {
        key: orderData.razorpayKeyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "DocYori Healthcare",
        description: `Upgrade to ${pkg.name} (${formatDuration(pkg.durationInDays)})`,
        image: "/logo.png",
        order_id: orderData.orderId,
        prefill: {
          name: user?.fullName || user?.clinic?.name || "",
          email: user?.email || user?.clinic?.ownerEmail || "",
          contact: user?.phone || user?.clinic?.phone || "",
        },
        notes: {
          packageId: pkg.id,
          clinicId: user?.clinicId || user?.clinic?.id || "",
        },
        theme: {
          color: "#4f46e5",
        },
        handler: async (response: any) => {
          try {
            setProcessingPlanId(pkg.id);
            const verifyRes = await fetch(apiUrl("/api/payments/verify"), {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                packageId: pkg.id,
                clinicId: user?.clinicId || user?.clinic?.id,
                userId: user?.id,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(verifyData.message || "Payment signature verification failed");
            }

            handleUpgradeSuccess(pkg, verifyData.clinic, response.razorpay_payment_id);
          } catch (verErr: any) {
            alert(verErr.message || "Payment verification failed.");
          } finally {
            setProcessingPlanId(null);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessingPlanId(null);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        alert(`Payment failed: ${response.error?.description || "Transaction declined"}`);
        setProcessingPlanId(null);
      });
      rzp.open();
    } catch (err: any) {
      alert(err.message || "Payment initialization failed.");
      setProcessingPlanId(null);
    }
  };

  return (
    <>
      <div className="page-wrapper min-vh-100 pb-5" style={{ background: "#f8fafc" }}>
        <div className="content pt-4">
          {/* Top Header */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
            <div>
              <h2 className="fw-bold mb-1 text-dark" style={{ letterSpacing: "-0.5px", fontSize: "28px" }}>
                Subscription Plans & Pricing
              </h2>
              <p className="text-muted mb-0" style={{ fontSize: "14px" }}>
                Upgrade or renew your DocYori subscription to unlock advanced healthcare modules.
              </p>
            </div>
            <Link
              to={all_routes.dashboard}
              className="btn btn-white border shadow-sm d-flex align-items-center gap-2 rounded-pill px-3.5 py-2 fs-13 text-dark fw-semibold"
              style={{ backgroundColor: "#ffffff" }}
            >
              <i className="ti ti-arrow-left text-primary" /> Back to Dashboard
            </Link>
          </div>

          {/* Current Active Plan Banner */}
          {user?.clinic && (
            <div
              className="card border-0 shadow-sm rounded-4 mb-4 p-4 text-white"
              style={{
                background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "-40px",
                  right: "-40px",
                  width: "180px",
                  height: "180px",
                  background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)",
                  borderRadius: "50%",
                }}
              />
              <div className="row align-items-center gy-3 position-relative z-1">
                <div className="col-md-8">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: "54px", height: "54px", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)" }}
                    >
                      <i className="ti ti-crown fs-28 text-warning" />
                    </div>
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                        <h4 className="fw-bold mb-0 text-white">{currentPackageName}</h4>
                        <span className="badge bg-success text-white px-2.5 py-1 rounded-pill fs-11 fw-semibold">
                          <i className="ti ti-circle-filled me-1 fs-8" />
                          {user?.clinic?.status === "TRIAL" ? "Free Trial" : "Active Subscription"}
                        </span>
                      </div>
                      <p className="mb-0 text-white-50 fs-13">
                        {currentPackageExpiresAt ? (
                          <>
                            Valid until <strong className="text-white">{dayjs(currentPackageExpiresAt).format("DD MMMM, YYYY")}</strong> (
                            {Math.max(0, dayjs(currentPackageExpiresAt).diff(dayjs(), "day"))} days remaining)
                          </>
                        ) : (
                          "Active subscription without expiry"
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 text-md-end">
                  <span
                    className="badge px-3 py-2 rounded-pill fs-12 fw-medium"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.15)",
                      color: "#ffffff",
                      border: "1px solid rgba(255, 255, 255, 0.25)",
                    }}
                  >
                    <i className="ti ti-shield-check me-1 text-warning" /> 100% Secure & Compliant
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Grid */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-3" role="status" />
              <p className="text-muted fs-14">Loading available subscription packages...</p>
            </div>
          ) : (
            <div className="row g-4">
              {packages.map((pkg, idx) => {
                const isCurrent = currentPackageId === pkg.id;
                const isFeatured = pkg.isPopular || idx === 1;
                const isProcessing = processingPlanId === pkg.id;

                return (
                  <div key={pkg.id || idx} className="col-lg-4 col-md-6 d-flex">
                    <div
                      className={`card flex-fill rounded-4 border transition-all h-100 position-relative ${
                        isFeatured ? "border-primary shadow-lg" : "border-light shadow-sm"
                      }`}
                      style={{
                        background: "#ffffff",
                        transition: "transform 0.25s ease, box-shadow 0.25s ease",
                      }}
                    >
                      {/* Popular / Recommended Badge */}
                      {isFeatured && (
                        <div
                          className="position-absolute top-0 start-50 translate-middle badge bg-primary px-3 py-1.5 rounded-pill shadow-sm fw-bold text-uppercase fs-11"
                          style={{ letterSpacing: "0.5px" }}
                        >
                          <i className="ti ti-sparkles me-1" /> Most Popular
                        </div>
                      )}

                      <div className="card-body p-4 d-flex flex-column justify-content-between">
                        <div>
                          {/* Plan Header */}
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <h4 className="fw-bold mb-1 text-dark">{pkg.name}</h4>
                              <p className="text-muted fs-12 mb-0" style={{ minHeight: "36px" }}>
                                {pkg.description || `Full clinic access for ${formatDuration(pkg.durationInDays)}.`}
                              </p>
                            </div>
                            {isCurrent && (
                              <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-1 fs-11 fw-bold">
                                Current
                              </span>
                            )}
                          </div>

                          {/* Price Display */}
                          <div className="py-3 border-bottom border-light-subtle my-2">
                            <div className="d-flex align-items-baseline gap-1">
                              <span className="fs-18 fw-bold text-muted">₹</span>
                              <span className="fs-36 fw-extrabold text-dark" style={{ letterSpacing: "-1px" }}>
                                {pkg.price === 0 ? "Free" : pkg.price.toLocaleString("en-IN")}
                              </span>
                              <span className="text-muted fs-13 fw-semibold">/ {formatDuration(pkg.durationInDays)}</span>
                            </div>
                            <span className="text-muted fs-11 d-block mt-0.5">
                              {pkg.price === 0 ? "No credit card required" : "Inclusive of all GST & Cloud Server Charges"}
                            </span>
                          </div>

                          {/* Features List */}
                          <div className="py-3">
                            <h6 className="fw-bold fs-12 text-uppercase text-muted mb-3" style={{ letterSpacing: "0.5px" }}>
                              Included Features:
                            </h6>
                            <ul className="list-unstyled mb-0 d-flex flex-column gap-2.5">
                              {defaultFeatures.map((feat, fIdx) => (
                                <li key={fIdx} className="d-flex align-items-start gap-2 fs-13 text-secondary">
                                  <i className="ti ti-check text-success fs-16 mt-0.5 flex-shrink-0" />
                                  <span>{feat}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Action Button: Directly Trigger Razorpay */}
                        <div className="pt-4 mt-auto">
                          {isCurrent ? (
                            <button
                              disabled={isProcessing}
                              onClick={() => handleRazorpayCheckout(pkg)}
                              className="btn btn-outline-success w-100 py-2.5 rounded-pill fw-bold fs-13 d-flex align-items-center justify-content-center gap-2"
                            >
                              {isProcessing ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-1" role="status" />
                                  Opening Payment...
                                </>
                              ) : (
                                <>
                                  <i className="ti ti-refresh fs-15" /> Renew / Extend Current Plan
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              disabled={isProcessing}
                              onClick={() => handleRazorpayCheckout(pkg)}
                              className={`btn w-100 py-2.5 rounded-pill fw-bold fs-13 d-flex align-items-center justify-content-center gap-2 shadow-sm ${
                                isFeatured ? "btn-primary" : "btn-outline-primary"
                              }`}
                              style={
                                isFeatured
                                  ? {
                                      background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                                      border: "none",
                                    }
                                  : {}
                              }
                            >
                              {isProcessing ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-1" role="status" />
                                  Opening Razorpay...
                                </>
                              ) : (
                                <>
                                  <i className="ti ti-sparkles fs-15" />
                                  {user?.clinic?.status === "TRIAL" ? `Activate ${pkg.name}` : `Upgrade to ${pkg.name}`}
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pricing Grid End */}
        </div>
      </div>

      {/* ─── PAYMENT SUCCESS CELEBRATION MODAL ─── */}
      {paymentSuccess && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(15, 23, 42, 0.7)", backdropFilter: "blur(6px)", zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "520px" }}>
            <div className="modal-content rounded-4 border-0 shadow-2xl overflow-hidden">
              <div className="modal-body p-5 text-center">
                <div
                  className="mx-auto rounded-circle bg-success-subtle d-flex align-items-center justify-content-center mb-4"
                  style={{ width: "80px", height: "80px", border: "2px solid #10b981" }}
                >
                  <i className="ti ti-check text-success fs-40" />
                </div>
                <h3 className="fw-extrabold text-dark mb-1">Subscription Activated!</h3>
                <p className="text-muted fs-14 mb-4">
                  Payment verified successfully via Razorpay. Your clinic account is now active on{" "}
                  <strong>{paymentSuccess.packageName}</strong>.
                </p>

                <div className="bg-light-subtle rounded-3 p-3 text-start mb-4 border">
                  <div className="d-flex justify-content-between py-1 border-bottom text-muted fs-13">
                    <span>Payment ID / TXN:</span>
                    <strong className="text-dark font-monospace">{paymentSuccess.transactionId}</strong>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom text-muted fs-13">
                    <span>Plan Validity:</span>
                    <strong className="text-dark">{paymentSuccess.duration}</strong>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom text-muted fs-13">
                    <span>Amount Paid:</span>
                    <strong className="text-success fw-bold">₹{paymentSuccess.amount.toLocaleString("en-IN")}</strong>
                  </div>
                  <div className="d-flex justify-content-between py-1 text-muted fs-13">
                    <span>Next Expiry:</span>
                    <strong className="text-primary">
                      {paymentSuccess.expiresAt ? dayjs(paymentSuccess.expiresAt).format("DD MMM, YYYY") : "Active"}
                    </strong>
                  </div>
                </div>

                <div className="d-flex gap-3">
                  <button
                    onClick={() => {
                      setPaymentSuccess(null);
                      navigate(all_routes.dashboard);
                    }}
                    className="btn btn-primary flex-fill rounded-pill py-2.5 fw-bold fs-14"
                    style={{ background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)", border: "none" }}
                  >
                    Go to Dashboard
                  </button>
                  <button
                    onClick={() => setPaymentSuccess(null)}
                    className="btn btn-outline-secondary flex-fill rounded-pill py-2.5 fw-semibold fs-14"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Pricing;
