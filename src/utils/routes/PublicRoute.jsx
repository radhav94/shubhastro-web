import { Navigate } from "react-router-dom";
import { getToken } from "../token";

const PublicRoute = ({ component: Component }) => {
  const token = getToken();

  return !token ? <Component /> : <Navigate to="/" replace />;
};

export default PublicRoute;
