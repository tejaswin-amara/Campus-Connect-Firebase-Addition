import { useEffect, useState } from 'react';
import { getToken } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { db, getMessagingInstance } from '../lib/firebase';

export function useFCM(userId: string | undefined) {
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (!userId) return;
    let isMounted = true;

    const initializePushNotifications = async () => {
      try {
        // 1. Check if Notification API is available
        if (typeof window === 'undefined' || !('Notification' in window)) {
          console.warn('Notifications not supported in this browser.');
          return;
        }

        if (isMounted) {
          setPermission(Notification.permission);
        }

        // If permission is default, request it
        let currentPermission = Notification.permission;
        if (currentPermission === 'denied') {
          return;
        }
        
        if (currentPermission === 'default') {
          try {
            currentPermission = await Notification.requestPermission();
            if (isMounted) {
              setPermission(currentPermission);
            }
          } catch (permErr) {
            console.warn('FCM Notification permission request failed or rejected:', permErr);
            return;
          }
        }

        if (currentPermission !== 'granted') {
          return;
        }

        // 2. Initialize Messaging and get token
        const messaging = await getMessagingInstance();
        if (!messaging) {
          console.warn('FCM Messaging is not supported or failed to initialize.');
          return;
        }

        // VAPID key registration. We can pass a default or project-specific VAPID key.
        const tokenResult = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined
        });

        if (tokenResult && isMounted) {
          setToken(tokenResult);
          
          // 3. Save fcmToken to user's Firestore document
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, {
            fcmToken: tokenResult,
            notificationsEnabled: true,
            updatedAt: new Date().toISOString()
          });

        } else if (!tokenResult) {
          console.warn('No FCM token received. Make sure VAPID or service worker is correctly configured.');
        }

      } catch (err) {
        // Silent try/catch block: soft warning so blocked permissions or environment issues don't log errors or crash
        console.warn('FCM registration skipped or blocked:', err instanceof Error ? err.message : err);
      }
    };

    initializePushNotifications();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return { token, permission };
}
