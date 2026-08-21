import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import {
  UserProfile,
  AuthContextType,
  checkEmailAuthorization,
} from './authTypes';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const email = firebaseUser.email;
        const authCheck = checkEmailAuthorization(email);

        if (authCheck.isAuthorized) {
          const domain = email ? email.split('@')[1] : null;
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || email?.split('@')[0] || 'BrightOps User',
            photoURL: firebaseUser.photoURL,
            domain,
            isAuthorized: true,
            role: 'member',
          });
          setError(null);
        } else {
          void signOut(auth);
          setUser(null);
          setError(authCheck.reason || 'Access restricted to authorised BrightOps domains.');
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const authCheck = checkEmailAuthorization(result.user.email);

      if (!authCheck.isAuthorized) {
        await signOut(auth);
        setUser(null);
        setError(authCheck.reason || 'Access restricted to authorised BrightOps domains.');
      }
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled.');
      } else {
        setError('Unable to sign in with Google. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setError(null);
    } catch (err) {
      console.error('Sign-out error:', err);
      setError('Unable to sign out right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{ user, loading, error, signInWithGoogle, signOutUser, clearError }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
