/*
 * Firebase Cloud Messaging, loaded on demand.
 *
 * Why the SDK is behind a dynamic import
 * --------------------------------------
 * This module used to `import { initializeApp } from "firebase/app"` and
 * `getMessaging` from "firebase/messaging" at the top level, and call
 * initializeApp() at module scope. Five modules import from here â€”
 * fcmService, OtpVerification, OTPScreen, useTruecallerLogin,
 * useGuestChatAuth and GuestKundliAuthModal â€” and one of those
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

        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (token) {
            console.log("FCM Token received");
            return token;
        }

        console.warn("No FCM token received");
        return null;
    } catch (error) {
        // Handle IndexedDB version mismatch (stale service worker)
        if (error?.name === "VersionError") {
            console.warn("FCM IndexedDB version conflict â€” clearing and retrying");
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
                const token = await getToken(messaging, { vapidKey: VAPID_KEY });
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

/*
 * Foreground-message fan-out.
 *
 * IMPORTANT: @firebase/messaging's onMessage() stores a SINGLE handler
 * (messaging.onMessageHandler = nextOrObserver) — calling it twice OVERWRITES
 * the first. So we must never call the SDK's onMessage more than once, or the
 * last subscriber silently steals every foreground push from the earlier ones
 * (this is exactly how the fcmService notification toast disappeared once a
 * second subscriber — the Virtual Assistant auto-refresh — was added).
 *
 * Instead we register the SDK handler exactly once and dispatch each payload to
 * a Set of subscribers. Every consumer gets every message, and unsubscribing
 * only removes that consumer.
 */
const foregroundSubscribers = new Set();
let foregroundHandlerAttached = false;

const ensureForegroundHandler = () => {
    if (foregroundHandlerAttached) return;
    foregroundHandlerAttached = true;

    loadMessaging().then((fb) => {
        if (!fb) {
            // Messaging unavailable — allow a later retry if the SDK becomes
            // available (it won't in practice, but keep the flag honest).
            foregroundHandlerAttached = false;
            return;
        }
        const { messaging, onMessage } = fb;
        onMessage(messaging, (payload) => {
            console.log("Foreground message received:", payload);
            foregroundSubscribers.forEach((cb) => {
                try {
                    cb(payload);
                } catch (err) {
                    console.warn("[Firebase] foreground subscriber threw:", err);
                }
            });
        });
    });
};

/**
 * Listens for foreground messages and calls the provided callback.
 * Returns an unsubscribe function.
 *
 * Multiple callers are supported: each receives every foreground push. The
 * underlying SDK handler is attached only once (see the note above on why a
 * second onMessage() call would clobber the first).
 */
export const onForegroundMessage = (callback) => {
    foregroundSubscribers.add(callback);
    ensureForegroundHandler();

    return () => {
        foregroundSubscribers.delete(callback);
    };
};