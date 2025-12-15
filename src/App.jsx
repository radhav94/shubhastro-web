import classes from "./App.module.scss";

import { PATH } from "./utils/routes/Paths";
import HomeLayout from "./layouts/HomeLayout";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import PublicRoute from "./utils/routes/PublicRoute";
import PrivateRoute from "./utils/routes/PrivateRoute";
import { useEffect } from "react";
import VideoCallContainer from "./component/call/VideoCallContainer";
import { CallProvider } from "./context/CallContext";

// ⭐ ADD THESE TWO IMPORTS
// import { CallProvider } from "./context/CallContext";
// import VideoCallContainer from "./components/VideoCallContainer"; 

function App() {
  // Helper function to flatten nested routes
  const flattenRoutes = (routes) => {
    const flattened = [];

    Object.values(routes).forEach((route) => {
      if (!route || typeof route !== "object") return;

      const paths = Array.isArray(route.path) ? route.path : [route.path];

      if (route.element && paths[0]) {
        paths.forEach((p) => {
          flattened.push({ ...route, path: p });
        });
      }

      Object.values(route).forEach((nestedRoute) => {
        if (nestedRoute && typeof nestedRoute === "object") {
          const nestedPaths = Array.isArray(nestedRoute.path)
            ? nestedRoute.path
            : [nestedRoute.path];
          if (nestedRoute.element && nestedPaths[0]) {
            nestedPaths.forEach((p) => {
              flattened.push({ ...nestedRoute, path: p });
            });
          }
        }
      });
    });

    return flattened;
  };

  const roleWiseRouting = createBrowserRouter([
    // Public routes
    ...Object.values(PATH.publicRoutes).map((route) => ({
      path: route.path,
      element: <PublicRoute component={route.element} />,
    })),

    // Private routes
    {
      path: "/",
      element: <PrivateRoute component={HomeLayout} />,
      children: [
        ...flattenRoutes(PATH.privateRoutes).map((child) => ({
          path: child.path,
          element: <child.element />,
          handle: { header: child.header ?? true, footer: child.footer ?? true },
        })),
        {
          path: "/",
          element: <Navigate to={PATH.privateRoutes.HOME.path} />,
        },
        {
          path: "*",
          element: <Navigate to={PATH.privateRoutes.HOME.path} />,
        },
      ],
    },

    // fallback
    {
      path: "*",
      element: <Navigate to="/" />,
    },
  ]);

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .pac-container {
        z-index: 999999 !important;
        position: absolute !important;
      }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    // ⭐ WRAP EVERYTHING INSIDE CallProvider
    <CallProvider>
      <div className={classes.app}>
        <RouterProvider router={roleWiseRouting} />

        {/* ⭐ VERY IMPORTANT: GLOBAL CALL WINDOW */}
        {/* <VideoCallContainer /> */}
        <VideoCallContainer/>
      </div>
    </CallProvider>
  );
}

export default App;
