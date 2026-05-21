import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

const useRequireAuth = () => {
  const { isLoggedIn } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();
  

  const checkAuth = () => {
    const fullPath = location.pathname + location.search;
    console.log("Redirect Location::", fullPath)
    if (!isLoggedIn) {
      localStorage.setItem("shubhtalk_redirect_after_login", fullPath);
      navigate("/login?skip=welcome", {
        state: { from: fullPath },
      });
      return false;
    }
    return true;
  };

  return checkAuth;
};

export default useRequireAuth;
