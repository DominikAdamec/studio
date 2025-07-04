'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useToast } from './use-toast';
import { useRouter } from 'next/navigation';

interface UserData {
  email: string | null;
  plan: 'free' | 'pro';
}

interface UserContextType {
  user: User | null;
  userData: UserData | null;
  isPro: boolean;
  loading: boolean;
  upgradeToPro: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const router = useRouter();
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
          setUserData(docSnap.data() as UserData);
        } else {
          // This should ideally be handled at sign-up, but as a fallback:
          const initialData: UserData = { email: user.email, plan: 'free' };
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

  const upgradeToPro = async () => {
    if (!user) {
        toast({ variant: 'destructive', title: 'You must be logged in to upgrade.' });
        router.push('/login?redirect=/pro');
        return;
    }
    const userRef = doc(db, 'users', user.uid);
    try {
        await updateDoc(userRef, { plan: 'pro' });
        toast({ title: 'Congratulations!', description: "You've unlocked Prompty PRO!" });
    } catch (error) {
        console.error("Upgrade failed:", error);
        toast({ variant: 'destructive', title: 'Upgrade Failed', description: 'Could not update your plan. Please try again.' });
    }
  };

  const value = {
    user,
    userData,
    isPro: userData?.plan === 'pro',
    loading,
    upgradeToPro,
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
