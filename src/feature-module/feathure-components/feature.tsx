import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Outlet, useLocation, Navigate } from "react-router";
import Header from "../../core/common/header/header";
import ThemeSettings from "../../core/common/theme-settings";
import Sidebar from "../../core/common/sidebar/sidebar";
import SidebarTwo from "../../core/common/sidebar-two/sidebarTwo";
import Sidebarthree from "../../core/common/sidebarthree/sidebarthree";

const Feature = () => {
  const locations = useLocation();
  const path = locations.pathname;
  const token = localStorage.getItem("token");
  const [isExpired, setIsExpired] = useState(false);

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

  // Redirect to login if token is missing and not on a public landing page
  if (!token && path !== "/" && !path.startsWith("/login") && !path.startsWith("/register")) {
    return <Navigate to="/login" replace />;
  }

  // Protect Super Admin routes
  if (path.startsWith("/super-admin")) {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.role !== "SUPER_ADMIN") {
      return <Navigate to="/dashboard" replace />;
    }
  }

  const themeSettings = useSelector((state: any) => state.theme.themeSettings);
  const { miniSidebar, mobileSidebar, expandMenu } = useSelector(
    (state: any) => state.sidebarSlice
  );

  const dataLayout = themeSettings["data-layout"];
  const dataWidth = themeSettings["data-width"];
  const dataSize = themeSettings["data-size"];
  const dir = themeSettings["dir"];

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
          {path.startsWith("/doctor/") ? (
            <SidebarTwo />
          ) : path.startsWith("/patient/") ? (
            <Sidebarthree />
          ) : (
            <Sidebar />
          )}

          <ThemeSettings />
          <div style={{ filter: isExpired ? 'blur(8px)' : 'none', pointerEvents: isExpired ? 'none' : 'auto', transition: 'filter 0.3s ease' }}>
            <Outlet />
          </div>
        </div>

        {isExpired && (
          <div className="position-fixed top-0 start-0 w-100 vh-100 d-flex align-items-center justify-content-center" style={{ zIndex: 9999, backgroundColor: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(4px)' }}>
            <div className="card shadow-2xl border-0 p-4 text-center" style={{ maxWidth: '450px', borderRadius: '20px' }}>
              <div className="mb-4">
                <div className="bg-danger-subtle rounded-circle d-inline-flex p-3 mb-3">
                  <i className="ti ti-lock-square-rounded text-danger fs-40" />
                </div>
                <h3 className="fw-bold">Your Trial Has Ended</h3>
                <p className="text-muted fs-15">Your 72-hour free trial for <strong>{JSON.parse(localStorage.getItem("user") || "{}")?.clinic?.name}</strong> has expired. Please activate a pro plan to continue using the platform.</p>
              </div>
              <button className="btn btn-primary w-100 py-3 fw-bold fs-16 rounded-pill shadow-sm mb-3">
                <i className="ti ti-plus me-2" /> Activate Pro Plan Now
              </button>
              <button onClick={() => { localStorage.clear(); window.location.href = "/login"; }} className="btn btn-link text-muted fs-14">
                Logout and Switch Account
              </button>
            </div>
          </div>
        )}

        <div
          className={`sidebar-overlay${mobileSidebar ? " opened" : ""}`}
        ></div>
      </div>
    </>
  );
};

export default Feature;
