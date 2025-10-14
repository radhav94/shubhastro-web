import { Navigate } from "react-router-dom";

const PublicRoute = ({ component: Component }) => {
  return (
    // !getToken() ? <Component /> : <Navigate to="/" />
    true ? <Component /> : <Navigate to="/" />
  );
};

export default PublicRoute;
