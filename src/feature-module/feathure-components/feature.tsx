import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Outlet, useLocation, Navigate } from "react-router";
import Header from "../../core/common/header/header";
import ThemeSettings from "../../core/common/theme-settings";
import Sidebar from "../../core/common/sidebar/sidebar";
import SidebarTwo from "../../core/common/sidebar-two/sidebarTwo";
import Sidebarthree from "../../core/common/sidebarthree/sidebarthree";
import { apiUrl } from "../../core/config/api";
import { setLocalStorageUser } from "../../core/utils/apiClient";

import OnboardingWizard from "./onboarding-wizard/OnboardingWizard";

interface SubscriptionPackage {
  id: string;
  name: string;
  price: number;
  durationInDays: number;
  maxDoctors: number;
  maxPatients: number;
  maxAppointments: number;
  isActive: boolean;
}

const Feature = () => {
  const locations = useLocation();
  const path = locations.pathname;
  const token = localStorage.getItem("token");
  const [isExpired, setIsExpired] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Packages modal state
  const [showPackages, setShowPackages] = useState(false);
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [activating, setActivating] = useState<string | null>(null);
  const [activateMsg, setActivateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const checkOnboarding = () => {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const u = JSON.parse(userStr);
        const step = u?.clinic?.onboardingStep ?? 0;
        if (u?.role === "ADMIN" && step < 2) {
          setShowOnboarding(true);
          return;
        }
      }
      setShowOnboarding(false);
    };

    checkOnboarding();
    const interval = setInterval(checkOnboarding, 2000);
    return () => clearInterval(interval);
  }, [locations.pathname]);

  const handleOnboardingComplete = () => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const u = JSON.parse(userStr);
      if (u?.clinic?.onboardingStep >= 2) {
        setShowOnboarding(false);
      }
    }
  };

  useEffect(() => {
    // Refresh user profile and permissions from backend automatically
    if (token) {
      fetch(apiUrl("/api/auth/me"), {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => {
          if (data.id) {
            setLocalStorageUser(data);
          }
        })
        .catch(err => console.error("Profile refresh failed", err));
    }
  }, [token]);

  useEffect(() => {
    // Initial check
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user?.clinic?.packageExpiresAt) {
        const expired = +new Date(user.clinic.packageExpiresAt) - +new Date() <= 0;
        setIsExpired(expired);
      }
    }

    // Listen for real-time expiry
    const handleExpiry = () => setIsExpired(true);
    window.addEventListener('subscription-expired', handleExpiry);
    return () => window.removeEventListener('subscription-expired', handleExpiry);
  }, []);

  const handleOpenPackages = async () => {
    setShowPackages(true);
    setActivateMsg(null);
    setLoadingPackages(true);
    try {
      const res = await fetch(apiUrl("/api/auth/packages"));
      const data = await res.json();
      setPackages(Array.isArray(data) ? data.filter((p: SubscriptionPackage) => p.isActive && p.price > 0) : []);
    } catch {
      setPackages([]);
    } finally {
      setLoadingPackages(false);
    }
  };

  const handleActivate = async (pkg: SubscriptionPackage) => {
    if (!token) return;
    setActivating(pkg.id);
    setActivateMsg(null);
    try {
      const res = await fetch(apiUrl("/api/auth/upgrade-plan"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ packageId: pkg.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setActivateMsg({ type: 'success', text: `✅ "${pkg.name}" activated! Reloading...` });
        // Update localStorage with new clinic data
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          user.clinic = { ...user.clinic, ...data.clinic };
          setLocalStorageUser(user);
        }
        setTimeout(() => window.location.reload(), 1800);
      } else {
        setActivateMsg({ type: 'error', text: data.message || "Activation failed" });
      }
    } catch {
      setActivateMsg({ type: 'error', text: "Network error. Please try again." });
    } finally {
      setActivating(null);
    }
  };

  const themeSettings = useSelector((state: any) => state.theme.themeSettings);
  const { miniSidebar, mobileSidebar, expandMenu } = useSelector(
    (state: any) => state.sidebarSlice
  );

  // Redirect to login if token is missing and not on a public landing page
  if (!token && path !== "/" && !path.startsWith("/login") && !path.startsWith("/register")) {
    return <Navigate to="/login" replace />;
  }

  // Protect Super Admin routes
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (path.startsWith("/super-admin")) {
    if (user?.role !== "SUPER_ADMIN") {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Prevent Patients from accessing non-patient management routes
  if (user?.role === 'PATIENT') {
    const isPublicPath = path === "/" || path === "/login" || path === "/register" || path.startsWith("/@") || path.startsWith("/clinic/");
    const isPatientPath = path.startsWith("/patient/");
    const isLabPath = path === "/pathlab/bookings";
    if (!isPublicPath && !isPatientPath && !isLabPath && path !== "/patient/patient-dashboard" && !path.startsWith("/new-appointment")) {
      return <Navigate to="/patient/patient-dashboard" replace />;
    }
  }

  // Prevent Doctors from accessing non-doctor management routes
  if (user?.role === 'DOCTOR') {
    const isPublicPath = path === "/" || path === "/login" || path === "/register" || path.startsWith("/@") || path.startsWith("/clinic/");
    const isDoctorPath = path.startsWith("/doctor/");
    const isLabPath = path === "/pathlab/tests" || path === "/pathlab/bookings";
    if (!isPublicPath && !isDoctorPath && !isLabPath && path !== "/doctor/doctor-dashboard" && !path.startsWith("/new-appointment")) {
      return <Navigate to="/doctor/doctor-dashboard" replace />;
    }
  }

  const dataLayout = themeSettings["data-layout"];
  const dataWidth = themeSettings["data-width"];
  const dataSize = themeSettings["data-size"];
  const dir = themeSettings["dir"];

  const clinicName = user?.clinic?.name;

  return (
    <>
      <div
        className={`
        ${miniSidebar || dataLayout === "mini" || dataSize === "compact"
            ? "mini-sidebar"
            : ""
          }
        ${(expandMenu && miniSidebar) || (expandMenu && dataLayout === "mini")
            ? "expand-menu"
            : ""
          }
        ${mobileSidebar ? "menu-opened slide-nav" : ""}
        ${dataWidth === "box" ? "layout-box-mode mini-sidebar" : ""}
        ${dir === "rtl" ? "layout-mode-rtl" : ""}




      `}
      >
        <div className="main-wrapper">
          <Header />
          {user?.role === "DOCTOR" ? (
            <SidebarTwo />
          ) : user?.role === "PATIENT" ? (
            <Sidebarthree />
          ) : (
            <Sidebar />
          )}

          <ThemeSettings />
          <div style={{ filter: (isExpired || showOnboarding) ? 'blur(8px)' : 'none', pointerEvents: (isExpired || showOnboarding) ? 'none' : 'auto', transition: 'filter 0.3s ease' }}>
            <Outlet />
          </div>
        </div>

        {/* ─── Trial Expired Overlay ─── */}
        {isExpired && (
          <div
            className="position-fixed top-0 start-0 w-100 vh-100 d-flex align-items-center justify-content-center"
            style={{ zIndex: 9999, backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)' }}
          >
            {!showPackages ? (
              /* ── Step 1: Expired screen ── */
              <div
                className="card border-0 p-4 p-md-5 text-center"
                style={{
                  maxWidth: '480px', width: '94%',
                  borderRadius: '24px',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
                  boxShadow: '0 30px 80px rgba(0,0,0,0.25)',
                }}
              >
                <div className="mb-4">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                    style={{ width: 72, height: 72, background: 'linear-gradient(135deg,#ff4e4e,#ff8c00)' }}
                  >
                    <i className="ti ti-lock-square-rounded text-white" style={{ fontSize: 36 }} />
                  </div>
                  <h3 className="fw-bold mb-2" style={{ color: '#1a1a2e' }}>Trial Has Ended</h3>
                  <p className="text-muted" style={{ fontSize: 15 }}>
                    Your 72-hour free trial for <strong>{clinicName}</strong> has expired.
                    <br />Choose a plan below to continue using the platform.
                  </p>
                </div>

                <button
                  onClick={handleOpenPackages}
                  className="btn w-100 py-3 fw-bold mb-3 text-white"
                  style={{
                    fontSize: 16, borderRadius: '14px',
                    background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                    border: 'none',
                    boxShadow: '0 8px 24px rgba(79,70,229,0.35)',
                    transition: 'transform 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <i className="ti ti-crown me-2" />
                  Upgrade to Pro — View Plans
                </button>

                <button
                  onClick={() => { localStorage.clear(); window.location.href = "/login"; }}
                  className="btn btn-link text-muted"
                  style={{ fontSize: 13 }}
                >
                  Logout &amp; Switch Account
                </button>
              </div>
            ) : (
              /* ── Step 2: Packages list ── */
              <div
                style={{
                  maxWidth: '900px', width: '96%',
                  maxHeight: '90vh', overflowY: 'auto',
                  borderRadius: '24px',
                  background: 'linear-gradient(160deg,#ffffff 0%,#f0f0ff 100%)',
                  boxShadow: '0 30px 80px rgba(0,0,0,0.3)',
                  padding: '36px 32px',
                }}
              >
                {/* Header */}
                <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
                  <div>
                    <h4 className="fw-bold mb-0" style={{ color: '#1a1a2e' }}>
                      <i className="ti ti-crown text-warning me-2" />
                      Choose Your Plan
                    </h4>
                    <p className="text-muted mb-0" style={{ fontSize: 14 }}>
                      Click a plan to activate it instantly for <strong>{clinicName}</strong>
                    </p>
                  </div>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    style={{ borderRadius: 10 }}
                    onClick={() => { setShowPackages(false); setActivateMsg(null); }}
                  >
                    <i className="ti ti-arrow-left me-1" /> Back
                  </button>
                </div>

                {/* Status message */}
                {activateMsg && (
                  <div
                    className={`alert ${activateMsg.type === 'success' ? 'alert-success' : 'alert-danger'} d-flex align-items-center gap-2 mb-4`}
                    style={{ borderRadius: 12 }}
                  >
                    <i className={`ti ${activateMsg.type === 'success' ? 'ti-circle-check' : 'ti-alert-circle'} fs-18`} />
                    {activateMsg.text}
                  </div>
                )}

                {/* Packages grid */}
                {loadingPackages ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status" />
                    <p className="text-muted mt-3 mb-0">Loading available plans...</p>
                  </div>
                ) : packages.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="ti ti-package-off text-muted" style={{ fontSize: 48 }} />
                    <p className="text-muted mt-3 mb-0">No active paid plans available. Contact support.</p>
                  </div>
                ) : (
                  <div className="row g-3">
                    {packages.map((pkg) => (
                      <div key={pkg.id} className="col-12 col-md-6 col-lg-4">
                        <div
                          className="card border-0 h-100"
                          style={{
                            borderRadius: '18px',
                            background: 'linear-gradient(145deg,#fafbff,#f3f4ff)',
                            boxShadow: '0 4px 20px rgba(79,70,229,0.1)',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                            (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 36px rgba(79,70,229,0.22)';
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                            (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(79,70,229,0.1)';
                          }}
                        >
                          <div className="card-body p-4 d-flex flex-column">
                            {/* Package name & price */}
                            <div className="mb-3">
                              <span
                                className="badge mb-2 px-3 py-2"
                                style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff', borderRadius: 8, fontSize: 11 }}
                              >
                                PRO PLAN
                              </span>
                              <h5 className="fw-bold mb-1" style={{ color: '#1a1a2e' }}>{pkg.name}</h5>
                              <div className="d-flex align-items-baseline gap-1">
                                <span style={{ fontSize: 28, fontWeight: 800, color: '#4f46e5' }}>
                                  ₹{pkg.price.toLocaleString()}
                                </span>
                                <span className="text-muted" style={{ fontSize: 13 }}>
                                  / {pkg.durationInDays} days
                                </span>
                              </div>
                            </div>

                            {/* Features */}
                            <ul className="list-unstyled mb-4 flex-grow-1" style={{ fontSize: 14 }}>
                              {[
                                { icon: 'ti-user-circle', label: `Up to ${pkg.maxDoctors} Doctors` },
                                { icon: 'ti-users', label: `Up to ${pkg.maxPatients} Patients` },
                                { icon: 'ti-calendar-check', label: `Up to ${pkg.maxAppointments} Appointments` },
                                { icon: 'ti-infinity', label: 'All Premium Features' },
                              ].map((f, i) => (
                                <li key={i} className="d-flex align-items-center gap-2 mb-2">
                                  <span
                                    className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                                    style={{ width: 26, height: 26, background: 'rgba(79,70,229,0.1)' }}
                                  >
                                    <i className={`ti ${f.icon} text-primary`} style={{ fontSize: 13 }} />
                                  </span>
                                  <span style={{ color: '#374151' }}>{f.label}</span>
                                </li>
                              ))}
                            </ul>

                            {/* Activate button */}
                            <button
                              onClick={() => handleActivate(pkg)}
                              disabled={!!activating}
                              className="btn w-100 fw-bold text-white"
                              style={{
                                borderRadius: '12px',
                                padding: '11px 0',
                                background: activating === pkg.id
                                  ? 'linear-gradient(135deg,#9ca3af,#6b7280)'
                                  : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                                border: 'none',
                                fontSize: 15,
                                boxShadow: '0 6px 18px rgba(79,70,229,0.3)',
                                transition: 'all 0.2s',
                              }}
                            >
                              {activating === pkg.id ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2" />
                                  Activating...
                                </>
                              ) : (
                                <>
                                  <i className="ti ti-bolt me-2" />
                                  Activate This Plan
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div className="text-center mt-4">
                  <button
                    onClick={() => { localStorage.clear(); window.location.href = "/login"; }}
                    className="btn btn-link text-muted"
                    style={{ fontSize: 13 }}
                  >
                    Logout &amp; Switch Account
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Onboarding Wizard Overlay ─── */}
        {showOnboarding && !isExpired && (
          <OnboardingWizard
            onComplete={handleOnboardingComplete}
          />
        )}

        <div
          className={`sidebar-overlay${mobileSidebar ? " opened" : ""}`}
        ></div>
      </div>
    </>
  );
};

export default Feature;
