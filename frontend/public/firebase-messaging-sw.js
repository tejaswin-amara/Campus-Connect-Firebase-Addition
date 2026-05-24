// Give the service worker access to Firebase Messaging.
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker.
firebase.initializeApp({
  apiKey: "AIzaSyD5u0vt99_cjjUB21cBMKQVFU1WXWYegsg",
  authDomain: "campusconnect-afd1e.firebaseapp.com",
  projectId: "campusconnect-afd1e",
  storageBucket: "campusconnect-afd1e.firebasestorage.app",
  messagingSenderId: "228582852256",
  appId: "1:228582852256:web:b5a74c4258a2ff6ca6ebc5"
});

// Retrieve an instance of Firebase Messaging.
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'Campus Connect';
  const notificationOptions = {
    body: payload.notification?.body || 'New university update is available!',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: payload.data || {},
    tag: payload.data?.tag || 'campus-connect-notification'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
