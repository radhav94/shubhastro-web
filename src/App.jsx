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
import { isInAppBrowser } from "./utils/deviceInfo";
import CmsPageWrapper from "./component/CmsPageWrapper";
import CmsNotFoundPage from "./component/CmsNotFoundPage";
import Toast from "./component/toast";
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

/*
 * How long a reload counts as "just tried".
 *
 * The guard used to be a bare 'true' in sessionStorage, set on reload and deleted
 * again by the do-nothing branch. That made the two outcomes alternate for the
 * life of the tab — reload, swallow, reload, swallow — with no relation to
 * whether reloading had actually helped. A tab left open while a deploy replaces
 * the hashed asset filenames could therefore land on the swallowing branch even
 * though a reload is exactly what would fix it.
 *
 * A timestamp instead. Failures inside the window mean reloading did not help,
 * so we explain rather than loop; a failure after it is treated as a new problem
 * and gets its own reload.
 */
const CHUNK_RELOAD_COOLDOWN_MS = 60_000;

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
  
  const lastReloadAt = Number(sessionStorage.getItem(ERROR_STORAGE_KEYS.CHUNK_ERROR_RELOAD)) || 0;
  const reloadedRecently =
    lastReloadAt > 0 && Date.now() - lastReloadAt < CHUNK_RELOAD_COOLDOWN_MS;

  if (!reloadedRecently) {
    sessionStorage.setItem(ERROR_STORAGE_KEYS.CHUNK_ERROR_RELOAD, String(Date.now()));
    window.location.reload();
    return;
  }

  /*
   * Reloading has already been tried in the last minute and the import still
   * failed, so don't start a reload loop — but don't go quiet either.
   *
   * Both callers run event.preventDefault() before getting here, so nothing else
   * will surface this: the previous version's only output was a console.error
   * behind `import.meta.env.DEV`, which is compiled out of production. The
   * navigation that triggered the import was therefore swallowed in full — no
   * route change, no reload, no message. A lazily-loaded route is only reached by
   * tapping something, so that presents as a dead click on whatever was tapped.
   *
   * The timestamp is deliberately left in place: while the cooldown is running,
   * further failures should keep explaining rather than flip back to reloading.
   */
  console.error(`Chunk load failed again after a reload (${context}).`);
  Toast.error("Couldn't load that page. Please refresh to get the latest version.");
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

  // Push notification setup, deliberately gated and deferred.
  //
  // This used to run on every page load for every visitor. Registering the
  // service worker (which itself importScripts two gstatic Firebase bundles),
  // calling Notification.requestPermission(), then Firebase installations + FCM
  // token registration is a lot of work for a token that currently only reaches
  // localStorage — see the "TODO: Send token to your backend" in fcmService.
  //
  // It also produces a JS error for a whole class of visitor. In an in-app
  // webview (Instagram/Facebook on Android) both requestPermission() and
  // serviceWorker.register() are proxied to native over the injected JS bridge.
  // Meta's browser does not support web push, so the bridge call into Java
  // throws and the WebView surfaces it as "error invoking postmessage: java
  // exception was raised during method invocation" — on our page, at load, for
  // every visitor arriving from an Instagram ad.
  //
  // So only initialise when it can actually succeed: permission already granted
  // (a repeat visitor who opted in) or a signed-in user we could register a
  // token against. Deferred to idle either way so it never competes with first
  // paint. `typeof Notification` is checked before reading .permission because
  // the constructor is absent entirely in some webviews.
  useEffect(() => {
    /*
     * Never attempt this in an embedded browser, whatever the sign-in state.
     *
     * The gate below (permission granted, or signed in) spares first-time
     * visitors, who are the bulk of Instagram/Facebook ad traffic. It does not
     * spare a *returning signed-in* visitor in the same browser: for them
     * `signedIn` is true, initializeFCM runs, and requestPermission() /
     * serviceWorker.register() go over the host app's injected JS bridge again.
     *
     * Meta's in-app browser does not support web push at all, so that call can
     * only ever fail. It surfaces as an uncaught "error invoking postmessage: …"
     * — Clarity has recorded both variants of it ("java exception was raised
     * during method invocation" and "java object is gone"), on two separate
     * Instagram visitors 19 minutes apart, one of whom lasted 20 seconds. There
     * is no token worth registering behind a call that cannot succeed.
     */
    if (isInAppBrowser()) return;

    const permissionGranted =
      typeof Notification !== "undefined" &&
      Notification.permission === "granted";
    const signedIn = Boolean(
      localStorage.getItem("shubhtalk_customer_token") ||
        localStorage.getItem("shubhtalk_astro_token")
    );
    if (!permissionGranted && !signedIn) return;

    const start = () =>
      initializeFCM().catch((err) =>
        console.error("FCM initialization failed:", err)
      );

    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(start, { timeout: 2000 });
      return () => window.cancelIdleCallback?.(id);
    }
    // Safari has no requestIdleCallback.
    const timer = setTimeout(start, 2000);
    return () => clearTimeout(timer);
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
