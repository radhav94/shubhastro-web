/**
 * Patch DOM methods to prevent Google Translate from crashing React.
 * Google Translate wraps text nodes in <font> elements, which causes
 * React's reconciliation to fail with "NotFoundError: Failed to execute
 * 'removeChild'/'insertBefore'" when unmounting/updating components.
 * This patch makes those operations gracefully handle missing nodes.
 */
if (typeof Node !== 'undefined') {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (child.parentNode !== this) {
      if (console && console.warn) {
        console.warn('Cannot remove child: node is not a child of this node (likely Google Translate interference)');
      }
      return child;
    }
    return originalRemoveChild.apply(this, arguments);
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (console && console.warn) {
        console.warn('Cannot insert before: reference node is not a child of this node (likely Google Translate interference)');
      }
      return newNode;
    }
    return originalInsertBefore.apply(this, arguments);
  };
}

/**
 * Guard: Clear all data if an ASTROLOGER session is detected.
 * This is a customer-facing app — astrologer tokens/data from the
 * astrologer dashboard should never persist here.
 */
// Wrapped because this runs at module scope, before React mounts: an unhandled
// throw here aborts evaluation of the whole bundle and the user gets a blank
// page. Browsers that block site data throw on the mere *read* of
// `window.localStorage`. index.html installs an in-memory fallback first, so
// this should never throw — but a boot-critical side effect should not depend on
// that shim having succeeded.
(() => {
  try {
    const role = localStorage.getItem('shubhtalk_role');
    if (role === 'ASTROLOGER') {
      // Clear all localStorage
      localStorage.clear();
      // Clear all sessionStorage
      sessionStorage.clear();
      // Clear all cookies
      document.cookie.split(';').forEach((c) => {
        const name = c.split('=')[0].trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      });
    }
    // Always remove stale onboarding session data
    sessionStorage.removeItem('onboardingSession');
  } catch (err) {
    console.warn('[boot] storage unavailable during startup guard:', err);
  }
})()

// import { StrictMode } from "react";
// import { createRoot } from "react-dom/client";

// import App from "./App.jsx";
// import "./global.css";
// import { Toaster } from "react-hot-toast";
// import { Provider } from "react-redux";
// import { store } from "./store/store.js";

// createRoot(document.getElementById("root")).render(
//   // <StrictMode>
//     <Provider store={store} >
//     <Toaster
//       position="top-right"
//       reverseOrder={false}
//       toastOptions={{
//         style: {
//           fontFamily: "Poppins",
//           fontSize: "14px",
//         },
//       }}
//     />
//     <App />
//     </Provider>
//   // </StrictMode>
// );


import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";
import "./global.css";
import { Toaster, ToastBar, toast } from "react-hot-toast";
import { Provider } from "react-redux";
import { store, persistor } from "./store/store.js";
import { PersistGate } from "redux-persist/integration/react";
import { trackTestEvent, BranchEvents } from "./utils/branchEvents";
import { trackBranchEvent, flushBranchEvents } from "./utils/branchIntegration";
/*
 * The `AgoraProvider` import that used to sit here was removed.
 *
 * Its JSX usage below has been commented out for some time, so the provider was
 * never in the tree — but the import still cost every visitor the whole
 * agora-rtc-react SDK. src/agora/agoraClient.jsx calls AgoraRTC.createClient()
 * at module top level, and that side effect makes the module unshakeable: the
 * bundler must keep it even though nothing reads either of its exports.
 *
 * Attributing the entry chunk's emitted bytes through its source map put
 * agora-rtc-react at 1,235 KB — 27% of the chunk — making it the single largest
 * occupant, all to construct one `mode: "rtc"` client that nothing consumed.
 *
 * Nothing depended on a root-level provider: the live streaming screen
 * (InteractiveLiveStreaming.jsx) builds its own `mode: "live"` client and wraps
 * its own subtree in AgoraRTCProvider, and VideoCall/VoiceCall import
 * agora-rtc-sdk-ng directly. If a root provider is ever genuinely needed,
 * re-add it behind lazy() + Suspense rather than as a static import.
 */

// Disable browser scroll restoration so pull-to-refresh (iOS Chrome) behaves.
// Scroll position is owned by the ScrollToTop component instead: new
// navigations start at the top, back/forward restore the previous offset.
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

// Dynamically adjust toast position based on visual viewport (keyboard open/close)
if (window.visualViewport) {
  const updateToastPosition = () => {
    const offset = window.visualViewport.offsetTop;
    document.documentElement.style.setProperty('--toast-top-offset', `${offset}px`);
  };
  window.visualViewport.addEventListener('resize', updateToastPosition);
  window.visualViewport.addEventListener('scroll', updateToastPosition);
}

createRoot(document.getElementById("root")).render(
  // <StrictMode>
  // <AgoraProvider>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Toaster
          position="top-right"
          reverseOrder={false}
          containerStyle={{
            zIndex: 10000000,
            top: 'calc(8px + var(--toast-top-offset, 0px))',
          }}
          toastOptions={{
            duration:3000,
            style: {
              fontFamily: "Poppins",
              fontSize: "14px",
              zIndex: 10000000,
            },
          }}
        >
          {(t) => (
            <ToastBar toast={t}>
              {({ icon, message }) => (
                <>
                  {icon}
                  {message}
                  {t.type !== "loading" && (
                    <button
                      type="button"
                      aria-label="Close"
                      onClick={() => toast.dismiss(t.id)}
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        color: "#9ca3af",
                        fontSize: "16px",
                        lineHeight: 1,
                        padding: "2px 4px",
                        marginLeft: "4px",
                        alignSelf: "center",
                        flexShrink: 0,
                      }}
                    >
                      ✕
                    </button>
                  )}
                </>
              )}
            </ToastBar>
          )}
        </Toaster>

        <App />
      </PersistGate>
    </Provider>
  // </AgoraProvider>
  // </StrictMode>
);

// ========================================
// 🧪 TEST EVENTS ON PAGE LOAD
// ========================================
// Call test events when app loads to verify tracking
// Comment out when not testing
// 
// IMPORTANT: GTM and GA4 scripts load deferred with max 4000ms delay
// (see index.html line ~624-670 for __deferTagScript__ config).
// So we wait 4500ms to ensure they're loaded before firing test events.
if (import.meta.env.DEV) {
  // Wait for GTM/GA4 to be loaded via deferred script loader (max 4000ms)
  setTimeout(() => {
    // Debug: Check if GTM/GA4 are ready
    if (typeof window !== "undefined") {
      console.log("[TestEvents] Checking if GTM/GA4 are ready...");
      console.log("[TestEvents] window.dataLayer:", typeof window.dataLayer);
      console.log("[TestEvents] window.gtag:", typeof window.gtag);
      console.log("[TestEvents] window.branch:", typeof window.branch);
    }

    // Test event to verify all systems are tracking
    trackTestEvent("app_initialized", {
      environment: "development",
      app_name: "ShubhTalk",
      timestamp: new Date().toISOString(),
    });

    // Test Branch event
    trackBranchEvent("app_load_test", {
      page: "index",
      ready: true,
    });

    // Test BranchEvents GTM/GA4
    BranchEvents.trackLandingPageOpen();

    // Flush Branch events to ensure they're sent immediately
    setTimeout(() => {
      flushBranchEvents();
    }, 500);

    console.log("🧪 TEST EVENTS CALLED ON APP LOAD");
    console.log("✓ Check console for [Analytics] logs (dataLayer push / gtag calls)");
    console.log("✓ Check Network tab for googletagmanager.com requests");
    console.log("✓ Check Network tab for google-analytics.com requests");
    console.log("✓ Check Network tab for branch.io requests");
    console.log("✓ Check GTM Preview panel for events");
    console.log("✓ Check Branch Dashboard Liveview for events");
    console.log("✓ Check GA4 DebugView for events");
  }, 4500); // Wait 4500ms for GTM/GA4 deferred scripts to load (max wait is 4000ms)
}
