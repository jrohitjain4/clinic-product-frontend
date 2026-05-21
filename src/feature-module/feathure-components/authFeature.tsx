import { Outlet, useLocation } from "react-router-dom";
import { all_routes } from "../routes/all_routes";

const AuthFeature = () => {
  const { pathname } = useLocation();
  const isLanding = pathname === all_routes.home;

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
