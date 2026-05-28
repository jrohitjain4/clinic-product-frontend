
import { Route, Routes } from "react-router";
import { authRoutes, publicRoutes } from "./router.link";
import AuthFeature from "../feathure-components/authFeature";
import Feature from "../feathure-components/feature";
import PermissionGuard from "../components/PermissionGuard";


const ALLRoutes: React.FC = () => {
  return (
    <>
      <Routes>
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
      </Routes>
    </>
  );
};

export default ALLRoutes;
