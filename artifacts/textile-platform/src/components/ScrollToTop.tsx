import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * Scrolls to the top of the page instantly whenever the route changes.
 * Must be rendered inside the Wouter Router so it has access to useLocation.
 */
export function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location]);

  return null;
}
