import { Navigate, useSearchParams } from "react-router-dom";
import { getToken } from "../token";

const PublicRoute = ({ component: Component }) => {
  const token = getToken();
  const [searchParams] = useSearchParams();

  // Allow logged-in users through when redirected from kundli self-check
  if (!token || searchParams.get("step") === "personalize") {
    return <Component />;
  }

  return <Navigate to="/" replace />;
};

export default PublicRoute;
