// Navigation helper for non-React contexts (like API interceptors)
// This allows us to navigate without full page refresh

let navigateFunction = null;

export const setNavigate = (navigate) => {
  navigateFunction = navigate;
};

export const navigateToLogin = (currentPath) => {
  console.log("🔄 navigateToLogin called with path:", currentPath);
  console.log("📍 window.location.pathname:", window.location.pathname);
  console.log("📍 window.location.search:", window.location.search);
  console.log("📍 window.location.href:", window.location.href);

  // Don't redirect guest users browsing public-facing pages (e.g., astrologer profile)
  const publicPathPatterns = [/^\/astrologer\//, /^\/astrologers/];
  const pathname = window.location.pathname;
  if (publicPathPatterns.some((pattern) => pattern.test(pathname))) {
    console.log("⏭️ Skipping login redirect — user on public page:", pathname);
    return;
  }
  
  // Save the current location for redirect after login
  if (currentPath && currentPath !== "/login") {
    localStorage.setItem("shubhtalk_redirect_after_login", currentPath);
    console.log("💾 Saved redirect path to localStorage:", currentPath);
    
    // Verify it was saved
    const saved = localStorage.getItem("shubhtalk_redirect_after_login");
    console.log("✅ Verified saved path:", saved);
  } else {
    console.log("⚠️ Not saving redirect path (invalid path):", currentPath);
  }
  
  // Clear tokens
  const role = localStorage.getItem("shubhtalk_role");
  
  if (role === "ASTROLOGER") {
    localStorage.removeItem("shubhtalk_astro_token");
    localStorage.removeItem("shubhtalk_astro_id");
  }

  if (role === "CUSTOMER") {
    localStorage.removeItem("shubhtalk_customer_token");
    localStorage.removeItem("shubhtalk_customer_id");
    localStorage.removeItem("shubhtalk_customer_wallet");
  }

  localStorage.removeItem("shubhtalk_role");
  localStorage.removeItem("token");
  
  // Use React Router navigate if available, otherwise fallback to window.location
  if (navigateFunction) {
    console.log("✅ Using React Router navigate");
    navigateFunction("/login?skip=welcome", { replace: true });
  } else {
    console.log("⚠️ Fallback to window.location.href");
    // Fallback for cases where navigate isn't set up yet
    window.location.href = "/login?skip=welcome";
  }
};

export const getNavigate = () => navigateFunction;
