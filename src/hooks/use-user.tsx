'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface UserData {
  email: string | null;
  plan: 'free' | 'pro';
  credits: number;
}

interface UserContextType {
  user: User | null;
  userData: UserData | null;
  isPro: boolean;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      if (!authUser) {
        // If user logs out, reset state and stop loading
        setUserData(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      setLoading(true);
      const userRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
           setUserData({
              email: data.email,
              plan: data.plan,
              credits: data.credits ?? 0, // Default to 0 if credits not set
          });
        } else {
          // This should ideally be handled at sign-up, but as a fallback:
          const initialData: UserData = { email: user.email, plan: 'free', credits: 10 };
          setDoc(userRef, initialData).then(() => setUserData(initialData));
        }
        setLoading(false);
      }, (error) => {
        console.error("Error fetching user data:", error);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const value = {
    user,
    userData,
    isPro: userData?.plan === 'pro',
    loading,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
