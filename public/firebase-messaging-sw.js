/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/12.6.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.6.0/firebase-messaging-compat.js");

// These placeholders are replaced at build time by the firebaseSwPlugin in vite.config.js
firebase.initializeApp({
    apiKey: "__VITE_FIREBASE_API_KEY__",
    authDomain: "__VITE_FIREBASE_AUTH_DOMAIN__",
    projectId: "__VITE_FIREBASE_PROJECT_ID__",
    storageBucket: "__VITE_FIREBASE_STORAGE_BUCKET__",
    messagingSenderId: "__VITE_FIREBASE_MESSAGING_SENDER_ID__",
    appId: "__VITE_FIREBASE_APP_ID__"
});

const messaging = firebase.messaging();

// Handle background notifications.
//
// IMPORTANT — why this returns early on `payload.notification`:
// the SDK's own push handler already displays any push that carries a
// `notification` block *before* it calls this hook. Its onPush() reads:
//
//     if (!!internalPayload.notification) { await showNotification(...) }
//     if (!!messaging.onBackgroundMessageHandler) { handler(payload) }
//
// so calling showNotification() here again for the same push produced two
// system notifications for one event. The SDK's copy is also the better one:
// it keeps the internal FCM payload in notification.data, which is what
// onNotificationClick() needs to open `fcmOptions.link` / `click_action`.
// Our copy had no such data, so tapping it did nothing.
//
// The hook is kept only for data-only pushes (no `notification` block), which
// the SDK never displays on its own.
messaging.onBackgroundMessage((payload) => {
    if (payload.notification) return;

    const data = payload.data || {};
    const title = data.title || "ShubhTalk";

    self.registration.showNotification(title, {
        body: data.body || "You have a new notification",
        icon: data.icon || "/images/mobile-shubh-astro-logo.svg",
        image: data.image,
        // Collapses repeat pushes for the same conversation/event instead of
        // stacking them.
        tag: data.tag || data.notificationId || data.chatId || undefined,
        data,
    });
});
