import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getToken } from "../token";

const PrivateRoute = ({ component: Component }) => {
  const token = getToken();
  const location = useLocation();

  if (!token) {
    // Save the current location for redirect after login
    const currentPath = location.pathname + location.search;
    console.log("🔒 PrivateRoute: User not authenticated, saving path:", currentPath);
    localStorage.setItem("shubhtalk_redirect_after_login", currentPath);

    return <Navigate to="/login?skip=welcome" replace />;
  }

  return <Component />;
};

export default PrivateRoute;
