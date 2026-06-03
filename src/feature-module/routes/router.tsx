import { Route, Routes, Navigate } from "react-router";
import { authRoutes, publicRoutes } from "./router.link";
import { all_routes } from "./all_routes";
import AuthFeature from "../feathure-components/authFeature";
import Feature from "../feathure-components/feature";
import ClinicLandingPage from "../components/pages/home/clinicLandingPage";
import PermissionGuard from "../components/PermissionGuard";


const ALLRoutes: React.FC = () => {
  return (
    <>
      <Routes>
        {/* Public Clinic Landing Pages (Top Priority - outside all layout wrappers) */}
        <Route path="/c/:username" element={<ClinicLandingPage />} />
        <Route path="/clinic/:clinicId" element={<ClinicLandingPage />} />

        <Route element={<AuthFeature />}>
          {authRoutes.map((route, idx) => (
            <Route path={route.path} element={route.element} key={idx} />
          ))}
        </Route>

        <Route element={<Feature />}>
          {publicRoutes.map((route, idx) => (
            <Route
              path={route.path}
              element={<PermissionGuard>{route.element}</PermissionGuard>}
              key={idx}
            />
          ))}
        </Route>

        {/* Catch-all global redirect */}
        <Route path="*" element={<Navigate to={all_routes.dashboard} replace />} />
      </Routes>
    </>
  );
};

export default ALLRoutes;
