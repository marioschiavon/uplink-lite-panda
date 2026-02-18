import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const RouteChangeTracker = () => {
  const location = useLocation();

  useEffect(() => {
    window.dataLayer?.push({
      event: 'virtualPageview',
      page_path: location.pathname + location.search,
      page_title: document.title
    });
  }, [location]);

  return null;
};
