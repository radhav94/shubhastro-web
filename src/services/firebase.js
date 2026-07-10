import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

const app = initializeApp(firebaseConfig);

// Firebase Messaging requires a secure context (HTTPS or localhost)
let messaging = null;
try {
    const isSecureContext = window.isSecureContext || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (isSecureContext && "Notification" in window && "serviceWorker" in navigator) {
        messaging = getMessaging(app);
    } else {
        console.warn("[Firebase] Messaging not available: requires HTTPS or localhost");
    }
} catch (err) {
    console.warn("[Firebase] Failed to initialize messaging:", err.message);
}

/**
 * Requests notification permission and returns the FCM token.
 * Returns null if permission denied or messaging unsupported.
 */
export const requestFCMToken = async () => {
    if (!messaging) return null;
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

/**
 * Listens for foreground messages and calls the provided callback.
 * Returns an unsubscribe function or no-op if messaging unavailable.
 */
export const onForegroundMessage = (callback) => {
    if (!messaging) return () => {};
    return onMessage(messaging, (payload) => {
        console.log("Foreground message received:", payload);
        callback(payload);
    });
};

export { messaging };
