import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  role: 'director' | 'social_worker' | 'accountant' | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  signIn: async () => {},
  logOut: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'director' | 'social_worker' | 'accountant' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          setRole(userDocSnap.data().role as any);
        } else {
          const defaultRole = 'director'; 
          await setDoc(userDocRef, {
            email: user.email,
            name: user.displayName || 'Utilisateur',
            role: defaultRole,
            createdAt: Date.now()
          });
          setRole(defaultRole);
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/popup-blocked') {
        alert("La fenêtre de connexion a été bloquée. Veuillez autoriser les pop-ups pour ce site ou ouvrir l'application dans un nouvel onglet.");
      } else if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        console.log("Connexion annulée par l'utilisateur.");
      } else {
        console.error("Erreur d'authentification:", error);
        alert(`Erreur lors de la connexion: ${error.message}`);
      }
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    const userCred = await createUserWithEmailAndPassword(auth, email, pass);
    if (userCred.user) {
      await updateProfile(userCred.user, { displayName: name });
      // Doc creation is handled by onAuthStateChanged, but we can do it here to make sure name is caught
      const userDocRef = doc(db, 'users', userCred.user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          email: userCred.user.email,
          name: name,
          role: 'director', // Just for the sake of demo, making everyone a director initially
          createdAt: Date.now()
        });
        setRole('director');
      }
    }
  };

  const logOut = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signIn, logOut, signInWithEmail, signUpWithEmail }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
