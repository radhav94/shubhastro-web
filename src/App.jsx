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
import { isShubhMallEnabled, isShubhMallRoute } from "./utils/featureConfig";
import { useEffect, Suspense, useMemo } from "react";
import { CallProvider } from "./context/CallContext";
import { ChatProvider } from "./context/ChatContext";
import { WaitingQueueProvider } from "./context/WaitingQueueContext";
import PermissionModalProvider from "./component/UI/modal/PermissionModal/PermissionModalProvider";
import ErrorBoundary from "./component/ErrorBoundary";
import RouteErrorBoundary from "./component/RouteErrorBoundary";
import PrimaryLoader from "./component/UI/PrimaryLoader";
import NoInternet, { useOnlineStatus } from "./component/NoInternet/NoInternet";
import { initializeFCM } from "./services/fcmService.jsx";
import CmsPageWrapper from "./component/CmsPageWrapper";
import CmsNotFoundPage from "./component/CmsNotFoundPage";
import useAstrologerStatusSocket from "./hooks/useAstrologerStatusSocket";

// Flatten routes helper - moved outside component for better performance
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

// Shared error element instance
const routeErrorElement = <RouteErrorBoundary />;

/**
 * Session storage keys for error tracking
 * @constant {Object}
 */
const ERROR_STORAGE_KEYS = {
  CHUNK_ERROR_RELOAD: 'chunk-error-reload',
};

/**
 * Checks if an error is related to chunk loading failures
 * @param {Error} error - The error object to check
 * @returns {boolean} True if error is chunk-related
 */
const isChunkLoadError = (error) => {
  if (!error) return false;
  
  const chunkErrorPatterns = [
    'Failed to fetch dynamically imported module',
    'Importing a module script failed',
    'error loading dynamically imported module',
  ];
  
  return (
    error.name === 'ChunkLoadError' ||
    chunkErrorPatterns.some((pattern) => error.message?.includes(pattern))
  );
};

/**
 * Handles chunk loading errors with automatic page reload
 * Reloads page once, then shows error if problem persists
 * @param {string} context - Context where error occurred (for logging)
 */
const handleChunkLoadError = (context) => {
  if (import.meta.env.DEV) console.log(`🔴 Chunk loading error detected in ${context}`);
  
  const hasReloaded = sessionStorage.getItem(ERROR_STORAGE_KEYS.CHUNK_ERROR_RELOAD);
  
  if (!hasReloaded) {
    sessionStorage.setItem(ERROR_STORAGE_KEYS.CHUNK_ERROR_RELOAD, 'true');
    window.location.reload();
  } else {
    sessionStorage.removeItem(ERROR_STORAGE_KEYS.CHUNK_ERROR_RELOAD);
    if (import.meta.env.DEV) console.error('❌ Chunk error persists after reload. Please clear cache.');
  }
};

function App() {
  const isOnline = useOnlineStatus();

  // Real-time astrologer online/offline status updates across all pages
  useAstrologerStatusSocket();

  // Memoize router creation - only create once
  const roleWiseRouting = useMemo(() => {
    return createBrowserRouter([
      // Open routes — no auth check, accessible to everyone
      ...Object.values(PATH.openRoutes || {})
        .filter((route) => route.path && route.element)
        .map((route) => ({
          path: route.path,
          element: (
            <NavigationSetup>
              <route.element />
            </NavigationSetup>
          ),
          errorElement: routeErrorElement,
        })),

      ...Object.values(PATH.publicRoutes)
        .filter((route) => route.path !== "*")
        .map((route) => ({
          path: route.path,
          element: (
            <NavigationSetup>
              <PublicRoute component={route.element} />
            </NavigationSetup>
          ),
          errorElement: routeErrorElement,
        })),

      {
        path: "/",
        element: (
          <NavigationSetup>
            <MixedRoute component={HomeLayout} />
          </NavigationSetup>
        ),
        errorElement: routeErrorElement,
        children: [
          ...flattenRoutes(PATH.privateRoutes)
            .filter((child) => {
              // Filter out ShubhMall routes when feature is disabled
              if (!isShubhMallEnabled() && isShubhMallRoute(child.path)) {
                return false;
              }
              return true;
            })
            .map((child) => {
            // ProductDetail route requires authentication
            // Numerology route — commented out to allow public access
            // child.path === "/numerology" ||
            // child.path === PATH.privateRoutes.NUMEROLOGY?.path ||
            if (
              child.path === "/shop/:slug/:productSlug" ||
              child.path === PATH.privateRoutes.PRODUCT_DETAIL?.path ||
              child.path === "/profile" ||
              child.path === "/community" ||
              child.path === "/aiwow/muhurat-calendar" ||
              child.path === "/ai-wow/muhurat-calendar"
            ) {
              return {
                path: child.path,
                element: (
                  <CmsPageWrapper>
                    <PrivateRoute component={child.element} />
                  </CmsPageWrapper>
                ),
                errorElement: routeErrorElement,
                handle: { header: child.header ?? true, footer: child.footer ?? true, topHeader: child.topHeader ?? true },
              };
            }
            // All other routes are accessible to everyone
            return {
              path: child.path,
              element: (
                <CmsPageWrapper>
                  <child.element />
                </CmsPageWrapper>
              ),
              errorElement: routeErrorElement,
              handle: { header: child.header ?? true, footer: child.footer ?? true, topHeader: child.topHeader ?? true },
            };
          }),
          { path: "/", element: <Navigate to={PATH.privateRoutes.HOME.path} /> },
          {
            path: "*",
            element: <CmsNotFoundPage />,
            handle: { header: true, footer: true },
          },
        ],
      },
    ]);
  }, []); // Empty deps - router only created once

  // Initialize FCM push notifications
  useEffect(() => {
    initializeFCM().catch((err) =>
      console.error("FCM initialization failed:", err)
    );
  }, []);

  useEffect(() => {
    // Google Maps autocomplete z-index fix
    const style = document.createElement("style");
    style.innerHTML = `
      .pac-container {
        z-index: 999999 !important;
        position: absolute !important;
      }
    `;
    document.head.appendChild(style);

    /**
     * Global error handler for uncaught errors
     * Catches chunk loading errors and triggers reload
     * @param {ErrorEvent} event - The error event
     */
    const handleError = (event) => {
      if (import.meta.env.DEV) {
        console.log('🔍 Error event received:', {
          type: event.type,
          error: event.error,
          message: event.message,
          hasError: !!event.error,
        });
      }
      
      if (isChunkLoadError(event.error)) {
        event.preventDefault();
        handleChunkLoadError('global error handler');
      }
    };

    /**
     * Global handler for unhandled promise rejections
     * Catches chunk loading errors in promises and triggers reload
     * @param {PromiseRejectionEvent} event - The promise rejection event
     */
    const handleUnhandledRejection = (event) => {
      if (import.meta.env.DEV) {
        console.log('🔍 Promise rejection event received:', {
          type: event.type,
          reason: event.reason,
          hasReason: !!event.reason,
        });
      }
      
      if (isChunkLoadError(event.reason)) {
        event.preventDefault();
        handleChunkLoadError('promise rejection');
      }
    };

    // Register global error handlers
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <ErrorBoundary>
      <CallProvider>
        <ChatProvider>
          <WaitingQueueProvider>
            <div className={classes.app}>
              <Suspense fallback={<PrimaryLoader isLoading={true} />}>
                <RouterProvider router={roleWiseRouting} />
              </Suspense>
            </div>
            <PermissionModalProvider />
          </WaitingQueueProvider>
        </ChatProvider>
      </CallProvider>
    </ErrorBoundary>
  );
}

export default App;
