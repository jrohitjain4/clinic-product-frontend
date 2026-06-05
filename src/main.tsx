import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import store from './core/redux/store'
import { BrowserRouter } from 'react-router'
import { base_path } from './environment'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ALLRoutes from './feature-module/routes/router'
import ThemeRouteHandler from './core/common/theme-route-handler/themeRouteHandler'
import "../node_modules/bootstrap/dist/css/bootstrap.min.css";
import "../node_modules/bootstrap/dist/js/bootstrap.bundle.min.js";
import "../src/style/css/iconsax.css";
import "../src/style/css/feather.css";
import "../node_modules/@tabler/icons-webfont/dist/tabler-icons.css";
import "../node_modules/@fortawesome/fontawesome-free/css/fontawesome.min.css";
import "../node_modules/@fortawesome/fontawesome-free/css/all.min.css";
import "../src/index.scss";
import { toast } from 'react-toastify';
import { apiUrl } from './core/config/api';

// Global Fetch Interceptor to universally show Success Toasts on CRUD operations
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const url = typeof args[0] === "string" ? args[0] : (args[0] && "url" in args[0] ? args[0].url : "");
  const method = args[1]?.method || "GET";

  const isApiRequest = url.includes("/api/") || url.includes(":5000") || url.includes("docyori.com");
  const isMutation = method === "POST" || method === "PUT" || method === "DELETE";

  const res = await originalFetch(...args);

  if (isApiRequest && isMutation && res.ok) {
    const clone = res.clone();
    try {
      const data = await clone.json();
      if (data && data.message) {
        toast.success(data.message, { toastId: `${method}-${url}` });
      } else {
        toast.success(
          method === "POST" ? "Successfully added!" :
            method === "PUT" ? "Successfully updated!" :
              "Successfully deleted!", { toastId: `${method}-${url}` }
        );
      }
    } catch (e) {
      toast.success(
        method === "POST" ? "Successfully added!" :
          method === "PUT" ? "Successfully updated!" :
            "Successfully deleted!", { toastId: `${method}-${url}` }
      );
    }
  }

  return res;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter basename={base_path}>
        <ThemeRouteHandler />
        <ToastContainer />
        <ALLRoutes />
      </BrowserRouter>
    </Provider>
  </StrictMode>
)
