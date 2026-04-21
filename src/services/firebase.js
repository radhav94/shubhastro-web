import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// TODO: Replace with your actual Firebase project config
const firebaseConfig = {
    apiKey: "AIzaSyBAn58yLqiljWUXhSC7D6KK79uDfZXskts",
    authDomain: "shubhtalk-fbb51.firebaseapp.com",
    projectId: "shubhtalk-fbb51",
    storageBucket: "shubhtalk-fbb51.firebasestorage.app",
    messagingSenderId: "291098264414",
    appId: "1:291098264414:web:08098fdf9db01648f305cf"
};

// TODO: Replace with your actual VAPID key from Firebase Console > Cloud Messaging > Web Push certificates
const VAPID_KEY = "BA8u2x_jQI0fGf0uMVqj-arH7Cr2Z037HW5ZOEHMmPrVIpCOBsUR0W7ng6pepdZdDIaYv-T8EWyPQ-s-qx518r8";

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
