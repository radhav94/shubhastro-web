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

function App() {
  // Helper function to flatten nested routes
  const flattenRoutes = (routes) => {
    const flattened = [];
    
    Object.values(routes).forEach((route) => {
      // If route has path and element, it's a valid route
      if (route.path && route.element) {
        flattened.push(route);
      }
      
      // Check for nested routes (like HOROSCOPE.DAILY, HOROSCOPE.MONTHLY)
      Object.values(route).forEach((nestedRoute) => {
        if (nestedRoute && typeof nestedRoute === 'object' && nestedRoute.path && nestedRoute.element) {
          flattened.push(nestedRoute);
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

  return (
    <div className={classes.app}>
      <RouterProvider router={roleWiseRouting} />
    </div>
  );
}

export default App;