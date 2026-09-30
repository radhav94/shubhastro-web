import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Back that always goes somewhere.
 *
 * `navigate(-1)` is a no-op when the page is the first entry in the tab — a
 * direct link, a Google result, or a link opened in a new tab (Pandit AI chat
 * links used to open with target="_blank"). Clarity 9jmnr6: a visitor
 * rage-tapped the Business Pathfinder back arrow for ~15s and finally left via
 * the menu. React Router stores its own stack position in history.state.idx,
 * so 0 means there is nothing in-app to go back to; go to `fallback` instead.
 */
const useSafeBack = (fallback = "/") => {
  const navigate = useNavigate();
  return useCallback(() => {
    const canGoBack = (window.history.state?.idx ?? 0) > 0;
    if (canGoBack) navigate(-1);
    else navigate(fallback, { replace: true });
  }, [navigate, fallback]);
};

export default useSafeBack;
