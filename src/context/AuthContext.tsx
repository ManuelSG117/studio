
"use client";

import type { ReactNode, FC } from 'react';
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'; // Added setDoc and Timestamp

// Define the shape of the user object within the context
interface AuthUser extends User {
  isProfileComplete?: boolean; // Add profile completion status
}

// Define the shape of the context value
interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true, // Start in loading state
});

// Custom hook to use the AuthContext
export const useAuth = () => useContext(AuthContext);

// AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Check Firestore for profile completeness
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          // Update lastActivity timestamp on each auth state confirmation
          await setDoc(userDocRef, { lastActivity: Timestamp.now() }, { merge: true });

          const userDocSnap = await getDoc(userDocRef);

          let isProfileComplete = false;
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            // Define criteria for a complete profile
            isProfileComplete = !!(
                data.fullName &&
                data.address &&
                data.phoneNumber &&
                data.gender &&
                data.dob
                // Add other necessary fields like photoURL if required
                // data.photoURL
            );
             console.log("Profile data fetched for user:", firebaseUser.uid, "Complete:", isProfileComplete, "Data:", data);
          } else {
             console.log("No profile document found for user:", firebaseUser.uid);
          }

          setUser({ ...firebaseUser, isProfileComplete });
        } catch (error) {
           console.error("Error fetching user profile data or updating lastActivity:", error);
           // Assume profile is incomplete if fetching fails
           setUser({ ...firebaseUser, isProfileComplete: false });
        }
      } else {
        setUser(null);
      }
      setLoading(false); // Finished loading auth state
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Use useMemo to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user, // True if user object exists
    loading,
  }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

