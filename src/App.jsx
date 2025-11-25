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
import SocketConnector from "./SocketConnector";   // ⭐ STEP 1 — ADD THIS
import { useEffect } from "react";


function App() {
  // Helper function to flatten nested routes
const flattenRoutes = (routes) => {
  const flattened = [];

  Object.values(routes).forEach((route) => {
    if (!route || typeof route !== "object") return;

    // Handle array or single path
    const paths = Array.isArray(route.path) ? route.path : [route.path];

    if (route.element && paths[0]) {
      paths.forEach((p) => {
        flattened.push({ ...route, path: p });
      });
    }

    // Handle nested routes (like HOROSCOPE.DAILY, HOROSCOPE.MONTHLY)
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
    //public routes
    ...Object.values(PATH.publicRoutes).map((route) => ({
      path: route.path,
      element: <PublicRoute component={route.element} />,
    })),

    {
      //private routes
      path: "/",
      element: <PrivateRoute component={HomeLayout} />,
      children: [
        ...flattenRoutes(PATH.privateRoutes).map((child) => ({
          path: child.path,
          element: <child.element />,
          handle: { header: child.header ?? true },
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
    <div className={classes.app}>
      {/* <SocketConnector /> */}
      <RouterProvider router={roleWiseRouting} />
    </div>
  );
}

export default App;