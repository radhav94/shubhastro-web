import { useState } from "react";

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
        ...Object.values(PATH.privateRoutes).map((child) => ({
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
