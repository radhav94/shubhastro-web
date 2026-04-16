import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// TODO: Replace with your actual Firebase project config
const firebaseConfig = {
    apiKey: "AIzaSyCVTIgs3pg31YjvYc09NavFrL8NHD4tRMw",
    authDomain: "shubhtalk-20597.firebaseapp.com",
    projectId: "shubhtalk-20597",
    storageBucket: "shubhtalk-20597.firebasestorage.app",
    messagingSenderId: "130482610258",
    appId: "1:130482610258:web:c8e87ddd747c4714abbf8b"
};

// TODO: Replace with your actual VAPID key from Firebase Console > Cloud Messaging > Web Push certificates
const VAPID_KEY = "BFGCXxuf5g4qfJ6lyL9uB_acRF_6zO0E2rgwjg3FJmXuHSv_mBKEMTbhtrXSrntvUWLKcqSdW8zcVi68Meo2r5c";

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

/**
 * Requests notification permission and returns the FCM token.
 * Returns null if permission denied or messaging unsupported.
 */
export const requestFCMToken = async () => {
    try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
            console.warn("Notification permission denied");
            return null;
        }

        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (token) {
            console.log("FCM Token:", token);
            return token;
        }

        console.warn("No FCM token received");
        return null;
    } catch (error) {
        console.error("Error getting FCM token:", error);
        return null;
    }
};

/**
 * Listens for foreground messages and calls the provided callback.
 * Returns an unsubscribe function.
 */
export const onForegroundMessage = (callback) => {
    return onMessage(messaging, (payload) => {
        console.log("Foreground message received:", payload);
        callback(payload);
    });
};

export { messaging };
