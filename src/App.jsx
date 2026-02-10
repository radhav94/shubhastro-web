import classes from "./App.module.scss";

import { PATH } from "./utils/routes/Paths";
import HomeLayout from "./layouts/HomeLayout";
import NavigationSetup from "./layouts/NavigationSetup";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import PublicRoute from "./utils/routes/PublicRoute";
import PrivateRoute from "./utils/routes/PrivateRoute";
import MixedRoute from "./utils/routes/MixedRoute";
import { useEffect, Suspense } from "react";
import { CallProvider } from "./context/CallContext";
import { ChatProvider } from "./context/ChatContext";
import ErrorBoundary from "./component/ErrorBoundary";
import PrimaryLoader from "./component/UI/PrimaryLoader";

function App() {
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
    ...Object.values(PATH.publicRoutes).map((route) => ({
      path: route.path,
      element: (
        <NavigationSetup>
          <PublicRoute component={route.element} />
        </NavigationSetup>
      ),
    })),

    {
      path: "/",
      element: (
        <NavigationSetup>
          <MixedRoute component={HomeLayout} />
        </NavigationSetup>
      ),
      children: [
        ...flattenRoutes(PATH.privateRoutes).map((child) => {
          // Numerology and ProductDetail routes require authentication
          if (
            child.path === "/numerology" ||
            child.path === PATH.privateRoutes.NUMEROLOGY?.path ||
            child.path === "/shop/:slug/:productSlug" ||
            child.path === PATH.privateRoutes.PRODUCT_DETAIL?.path
          ) {
            return {
              path: child.path,
              element: <PrivateRoute component={child.element} />,
              handle: { header: child.header ?? true, footer: child.footer ?? true },
            };
          }
          // All other routes are accessible to everyone
          return {
            path: child.path,
            element: <child.element />,
            handle: { header: child.header ?? true, footer: child.footer ?? true },
          };
        }),
        { path: "/", element: <Navigate to={PATH.privateRoutes.HOME.path} /> },
        { path: "*", element: <Navigate to={PATH.privateRoutes.HOME.path} /> },
      ],
    },

    { path: "*", element: <Navigate to="/" /> },
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
    <ErrorBoundary>
      <CallProvider>
        <ChatProvider>
          <div className={classes.app}>
            <Suspense fallback={<PrimaryLoader isLoading={true} />}>
              <RouterProvider router={roleWiseRouting} />
            </Suspense>
          </div>
        </ChatProvider>
      </CallProvider>
    </ErrorBoundary>
  );
}

export default App;
