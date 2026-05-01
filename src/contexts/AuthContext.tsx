import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  role: 'director' | 'social_worker' | 'accountant' | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  signIn: async () => {},
  logOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'director' | 'social_worker' | 'accountant' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Fetch or create user document
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          setRole(userDocSnap.data().role as any);
        } else {
          // If first user, make them director, else make them social_worker by default for now (can be adjusted)
          // Alternatively, wait for an admin to assign a role. Let's make the user "social_worker" by default or prompt. 
          // For the sake of this prototype, if it's the first login, let's create a director profile.
          const defaultRole = 'director'; // Just for prototype easily. In production, we'd assign manually.
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
        // L'utilisateur a fermé ou annulé le popup, on peut ignorer silencieusement.
        console.log("Connexion annulée par l'utilisateur.");
      } else {
        console.error("Erreur d'authentification:", error);
        alert(`Erreur lors de la connexion: ${error.message}`);
      }
    }
  };

  const logOut = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signIn, logOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
