import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { canAccessRoute, getStoredPermissions } from "../../core/utils/staffPermissions";

/**
 * Wraps protected page content.
 * If the current user is STAFF and does NOT have permission for this route,
 * they are redirected to /dashboard with an alert.
 */
const PermissionGuard = ({ children }: { children: React.ReactNode }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const perms = getStoredPermissions();

    useEffect(() => {
        // Only enforce for STAFF users (perms !== null means STAFF)
        if (perms !== null && !canAccessRoute(location.pathname)) {
            alert("You don't have permission to access this page.");
            navigate("/dashboard", { replace: true });
        }
    }, [location.pathname]);

    // If STAFF and no access, render nothing while redirecting
    if (perms !== null && !canAccessRoute(location.pathname)) {
        return null;
    }

    return <>{children}</>;
};

export default PermissionGuard;
