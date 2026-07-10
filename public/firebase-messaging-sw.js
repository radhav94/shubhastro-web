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

// Handle background notifications
messaging.onBackgroundMessage((payload) => {
    console.log("Background message received:", payload);

    const { title, body, icon, image } = payload.notification || {};

    self.registration.showNotification(title || "ShubhTalk", {
        body: body || "You have a new notification",
        icon: icon || "/vite.svg",
        image,
        data: payload.data,
    });
});
