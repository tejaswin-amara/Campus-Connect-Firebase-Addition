import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD5u0vt99_cjjUB21cBMKQVFU1WXWYegsg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "campusconnect-afd1e.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "campusconnect-afd1e",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "campusconnect-afd1e.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "228582852256",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:228582852256:web:b5a74c4258a2ff6ca6ebc5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Safe async initializer for Firebase Cloud Messaging
export const getMessagingInstance = async () => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const supported = await isSupported();
      if (supported) {
        return getMessaging(app);
      }
    } catch (err) {
      console.warn('Firebase Messaging check failed:', err);
    }
  }
  return null;
};



// Connect to local emulator suite in development/local mode
if (import.meta.env.DEV) {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);

  } catch (err) {
    console.error('Error connecting to Firebase emulators:', err);
  }
}

export default app;

