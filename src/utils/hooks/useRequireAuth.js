import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

const useRequireAuth = () => {
  const { isLoggedIn } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();
  

  const checkAuth = () => {
    console.log("Redirect Locatrion::",location.pathname || "/")
    if (!isLoggedIn) {
      navigate("/login?skip=welcome", {
        state: { from: location.pathname },
      });
      return false;
    }
    return true;
  };

  return checkAuth;
};

export default useRequireAuth;
