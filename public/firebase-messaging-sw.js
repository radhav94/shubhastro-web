/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/11.8.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.8.1/firebase-messaging-compat.js");

// TODO: Must match the config in src/services/firebase.js
firebase.initializeApp({
    apiKey: "AIzaSyBAn58yLqiljWUXhSC7D6KK79uDfZXskts",
    authDomain: "shubhtalk-fbb51.firebaseapp.com",
    projectId: "shubhtalk-fbb51",
    storageBucket: "shubhtalk-fbb51.firebasestorage.app",
    messagingSenderId: "291098264414",
    appId: "1:291098264414:web:08098fdf9db01648f305cf"
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
