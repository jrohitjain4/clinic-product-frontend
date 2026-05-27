import { Navigate, Outlet, useLocation } from "react-router-dom";
import { all_routes } from "../routes/all_routes";

const getDashboardPath = (role: string): string => {
  switch (role) {
    case "DOCTOR":
      return all_routes.doctordashboard;
    case "PATIENT":
      return all_routes.patientdashboard;
    default:
      return all_routes.dashboard;
  }
};

const AuthFeature = () => {
  const { pathname } = useLocation();
  const isLanding = pathname === all_routes.home;
  const token = localStorage.getItem("token");

  if (token) {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const dashboard = getDashboardPath(user?.role || "ADMIN");
    if (
      isLanding ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/register")
    ) {
      return <Navigate to={dashboard} replace />;
    }
  }

  return (
    <div
      className={`main-wrapper position-relative overflow-hidden ${
        isLanding ? "" : "auth-bg auth-bg-custom"
      }`}
    >
      <Outlet />
    </div>
  );
};

export default AuthFeature;
