/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/11.8.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.8.1/firebase-messaging-compat.js");

// TODO: Must match the config in src/services/firebase.js
firebase.initializeApp({
    apiKey: "AIzaSyCVTIgs3pg31YjvYc09NavFrL8NHD4tRMw",
    authDomain: "shubhtalk-20597.firebaseapp.com",
    projectId: "shubhtalk-20597",
    storageBucket: "shubhtalk-20597.firebasestorage.app",
    messagingSenderId: "130482610258",
    appId: "1:130482610258:web:c8e87ddd747c4714abbf8b"
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
