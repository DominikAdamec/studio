'use client';

import {
  auth,
  db
} from '@/lib/firebase';
import {
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  onValue,
  ref,
  set
} from 'firebase/database';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState
} from 'react';

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

const UserContext = createContext < UserContextType | undefined > (undefined);

export const UserProvider = ({
  children
}: {
  children: ReactNode
}) => {
  const [user, setUser] = useState < User | null > (null);
  const [userData, setUserData] = useState < UserData | null > (null);
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
      const userRef = ref(db, 'users/' + user.uid);
      const unsubscribe = onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setUserData({
            email: data.email,
            plan: data.plan,
            credits: data.credits ?? 0, // Default to 0 if credits not set
          });
        } else {
          // This should ideally be handled at sign-up, but as a fallback:
          const initialData: UserData = {
            email: user.email,
            plan: 'free',
            credits: 10
          };
          set(userRef, initialData).then(() => setUserData(initialData));
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

  return <UserContext.Provider value = {
    value
  } > {
    children
  } </UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};