import React from "react";

const MixedRoute = ({ component: Component }) => {
    // Allow access to both authenticated and unauthenticated users
    return <Component />;
};

export default MixedRoute;
