import React from "react";
import { Navigate } from "react-router-dom";
// import { getToken } from 'utils/utils';

const PrivateRoute = ({ component: Component }) => {
  return (
    // getToken() ? <Component /> : <Navigate to="/login"/>

    true ? <Component /> : <Navigate to="/login" />
  );
};

export default PrivateRoute;
