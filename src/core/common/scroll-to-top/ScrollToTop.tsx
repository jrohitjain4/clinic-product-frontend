import { useEffect } from "react";
import { useLocation } from "react-router";

/** Resets scroll to top on every route change so new pages always open from the top. */
const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    document
      .querySelectorAll<HTMLElement>(".page-wrapper, .main-wrapper, .content")
      .forEach((el) => {
        el.scrollTop = 0;
      });
  }, [pathname, search]);

  return null;
};

export default ScrollToTop;
