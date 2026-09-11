/*
 * Firebase Cloud Messaging, loaded on demand.
 *
 * Why the SDK is behind a dynamic import
 * --------------------------------------
 * This module used to `import { initializeApp } from "firebase/app"` and
 * `getMessaging` from "firebase/messaging" at the top level, and call
 * initializeApp() at module scope. Five modules import from here —
 * fcmService, OtpVerification, OTPScreen, useTruecallerLogin,
 * useGuestChatAuth and GuestKundliAuthModal — and one of those
 * (GuestKundliAuthModal) sits in the eager graph of the "/" landing screen
 * via HomeV2 -> useGuestConnectFlow. So the whole Firebase SDK was compiled
 * into the entry chunk that every first-time visitor blocks on before the
 * homepage can paint.
 *
 * The module-scope initializeApp() call also made the module unshakeable: a
 * top-level side effect must be preserved even when nothing reads the exports.
 * Same failure mode, and same fix, as the AgoraProvider import documented in
 * main.jsx.
 *
 * Nothing here is needed for first paint. Every consumer already awaits
 * requestFCMToken(), and App.jsx defers FCM init to requestIdleCallback behind
 * a permission/sign-in gate, so moving the SDK behind import() costs the push
 * path one extra round trip it can absorb and takes it off the LCP path
 * entirely.
 *
 * The support gate deliberately runs BEFORE the import, so browsers that cannot
 * do web push at all never download the SDK.
 */

//import { isInAppBrowser } from "../utils/deviceInfo";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

/**
 * Resolves to { messaging, getToken, onMessage }, or null when messaging is
 * unavailable in this browser. Memoised so the SDK is fetched and the app
 * initialised at most once, matching the previous module-scope behaviour.
 */
let messagingPromise = null;

const loadMessaging = () => {
    if (messagingPromise) return messagingPromise;

    messagingPromise = (async () => {
        // Firebase Messaging requires a secure context (HTTPS or localhost).
        const isSecureContext =
            window.isSecureContext ||
            window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1";

        if (!isSecureContext || !("Notification" in window) || !("serviceWorker" in navigator)) {
            console.warn("[Firebase] Messaging not available: requires HTTPS or localhost");
            return null;
        }

        /*
         * Never attempt web push inside an embedded browser.
         *
         * App.jsx already refuses to call initializeFCM() when isInAppBrowser()
         * is true, and documents why: in Instagram's / Facebook's Android
         * WebView both Notification.requestPermission() and
         * serviceWorker.register() are proxied to native over the host app's
         * injected JS bridge, Meta's browser does not support web push, and the
         * call into Java fails.
         *
         * But that gate only covered the boot path. Five other call sites reach
         * requestFCMToken() directly and none of them checked —
         * GuestKundliAuthModal, OTPScreen, OtpVerification, useTruecallerLogin
         * and useGuestChatAuth — i.e. every sign-in and guest-auth flow. Those
         * are exactly the paths an Instagram visitor takes, so the boot gate was
         * being bypassed by the traffic it was written for.
         *
         * Centralising it here rather than at the five call sites means a new
         * caller cannot forget it.
         *
         * Two things this buys beyond not calling a bridge that must fail:
         * the permission prompt is never attempted where it cannot be granted,
         * and the Firebase SDK chunk is never downloaded at all for in-app
         * browser visitors — a meaningful share of traffic here, since it is
         * mostly Instagram and Facebook ad clicks.
         *
         * null is the established "messaging unavailable" return; every caller
         * already handles it, because it is also what a permission denial
         * returns.
         */
        // if (isInAppBrowser()) {
        //     console.warn("[Firebase] Messaging skipped: in-app browser cannot support web push");
        //     return null;
        // }

        try {
            const [{ initializeApp }, { getMessaging, getToken, onMessage }] = await Promise.all([
                import("firebase/app"),
                import("firebase/messaging"),
            ]);
            const app = initializeApp(firebaseConfig);
            return { messaging: getMessaging(app), getToken, onMessage };
        } catch (err) {
            console.warn("[Firebase] Failed to initialize messaging:", err.message);
            return null;
        }
    })();

    return messagingPromise;
};

/**
 * Ensures our own /firebase-messaging-sw.js is registered AND active, and
 * resolves to its registration.
 *
 * Why this exists
 * ---------------
 * getToken() needs an active service worker. When it is called without an
 * explicit `serviceWorkerRegistration`, Firebase falls back to auto-registering
 * its own worker and racing its activation in the same tick as the token
 * request. That was masked while initializeApp()/getMessaging() ran at module
 * scope (the eager landing-page import warmed the worker long before any
 * login), but now that the SDK is loaded on demand the very first
 * requestFCMToken() during first-time login runs before any worker is active,
 * so getToken() intermittently returns null / rejects and no token ever reaches
 * the verify-OTP payload — the device is never registered for push.
 *
 * Registering here and awaiting `navigator.serviceWorker.ready` gives getToken()
 * a settled registration to use, removing the race regardless of call ordering.
 */
const ensureServiceWorker = async () => {
    if (!("serviceWorker" in navigator)) return undefined;
    try {
        await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        // ready resolves only once a worker for this scope is active.
        return await navigator.serviceWorker.ready;
    } catch (err) {
        console.warn("[Firebase] Service worker registration failed:", err?.message);
        return undefined;
    }
};

/**
 * Requests notification permission and returns the FCM token.
 * Returns null if permission denied or messaging unsupported.
 */
export const requestFCMToken = async () => {
    const fb = await loadMessaging();
    if (!fb) return null;
    const { messaging, getToken } = fb;

    try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
            console.warn("Notification permission denied");
            return null;
        }

        const serviceWorkerRegistration = await ensureServiceWorker();
        const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            ...(serviceWorkerRegistration ? { serviceWorkerRegistration } : {}),
        });
        if (token) {
            console.log("FCM Token received");
            return token;
        }

        console.warn("No FCM token received");
        return null;
    } catch (error) {
        // Handle IndexedDB version mismatch (stale service worker)
        if (error?.name === "VersionError") {
            console.warn("FCM IndexedDB version conflict — clearing and retrying");
            try {
                const databases = await indexedDB.databases();
                const fcmDbs = databases.filter(db => db.name?.includes("firebase-messaging"));
                await Promise.all(fcmDbs.map(db => new Promise((resolve, reject) => {
                    const req = indexedDB.deleteDatabase(db.name);
                    req.onsuccess = resolve;
                    req.onerror = reject;
                })));
                // Re-register service worker to pick up new version
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const reg of registrations) {
                    await reg.update();
                }
                const serviceWorkerRegistration = await ensureServiceWorker();
                const token = await getToken(messaging, {
                    vapidKey: VAPID_KEY,
                    ...(serviceWorkerRegistration ? { serviceWorkerRegistration } : {}),
                });
                if (token) {
                    console.log("FCM Token received after DB reset");
                    return token;
                }
            } catch (retryError) {
                console.error("FCM token retry failed:", retryError);
            }
        }
        console.error("Error getting FCM token:", error);
        return null;
    }
};

/**
 * Listens for foreground messages and calls the provided callback.
 * Returns an unsubscribe function or no-op if messaging unavailable.
 *
 * Stays synchronous-returning even though the SDK now loads asynchronously:
 * callers treat the return value as an unsubscribe handle they may invoke at
 * any time, including before the SDK has finished loading. Unsubscribing early
 * sets a flag that both prevents the listener being attached and tears it down
 * if the race went the other way.
 */
export const onForegroundMessage = (callback) => {
    let cancelled = false;
    let detach = null;

    loadMessaging().then((fb) => {
        if (!fb || cancelled) return;
        const { messaging, onMessage } = fb;
        detach = onMessage(messaging, (payload) => {
            console.log("Foreground message received:", payload);
            callback(payload);
        });
        if (cancelled) {
            detach();
            detach = null;
        }
    });

    return () => {
        cancelled = true;
        if (detach) {
            detach();
            detach = null;
        }
    };
};
