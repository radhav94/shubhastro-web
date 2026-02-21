import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const useRequireAuth = () => {
  const { isLoggedIn } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const checkAuth = () => {
    if (!isLoggedIn) {
      navigate("/login?skip=welcome");
      return false;
    }
    return true;
  };

  return checkAuth;
};

export default useRequireAuth;