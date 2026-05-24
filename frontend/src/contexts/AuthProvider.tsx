import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import type { User } from './AuthContext';
import { auth, db } from '../lib/firebase';
import { 
  onAuthStateChanged, 
  signOut, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Auto-sync firebase user state to context and Firestore profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setIsLoading(true);
        if (firebaseUser) {
          // Check if user profile document exists in Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          let role: 'STUDENT' | 'ADMIN' = 'STUDENT';
          let username = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User';

          if (userDoc.exists()) {
            const data = userDoc.data();
            role = data.role || 'STUDENT';
            username = data.username || username;
          } else {
            // New user registration flow
            // Whitelist typical admin emails
            const email = firebaseUser.email?.toLowerCase() || '';
            if (email.includes('admin') || email === 'admin@campusconnect.edu' || email === 'admin@gmail.com') {
              role = 'ADMIN';
            }
            
            // Create user document in firestore
            await setDoc(userDocRef, {
              id: firebaseUser.uid,
              username,
              email: firebaseUser.email || '',
              role,
              createdAt: new Date().toISOString()
            });
          }

          setUser({
            id: firebaseUser.uid,
            username,
            role,
            photoURL: firebaseUser.photoURL || undefined,
            email: firebaseUser.email || undefined
          });
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Error syncing auth state with firestore:', err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback((userData: User) => {
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      setUser(null);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    if (auth.currentUser) {
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUser({
            id: auth.currentUser.uid,
            username: data.username || auth.currentUser.email || 'User',
            role: data.role || 'STUDENT',
            photoURL: auth.currentUser.photoURL || undefined,
            email: auth.currentUser.email || undefined
          });
        }
      } catch (err) {
        console.error('Failed to manually check auth status', err);
      }
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithPopup(auth, provider);
  }, []);

  const value = useMemo(() => ({
    user,
    isLoading,
    login,
    logout,
    checkAuth,
    loginWithGoogle
  }), [user, isLoading, login, logout, checkAuth, loginWithGoogle]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
