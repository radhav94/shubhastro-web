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
(() => {
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

import { AgoraProvider } from "./agora/agoraClient";  // <-- IMPORTANT

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
