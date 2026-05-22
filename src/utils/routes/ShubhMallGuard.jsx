import { Navigate } from "react-router-dom";
import { isShubhMallEnabled } from "../featureConfig";

/**
 * Route guard for ShubhMall pages.
 * Redirects to home if ShubhMall feature is disabled.
 */
const ShubhMallGuard = ({ component: Component }) => {
  if (!isShubhMallEnabled()) {
    return <Navigate to="/" replace />;
  }
  return <Component />;
};

export default ShubhMallGuard;
