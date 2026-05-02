import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

// Interface définissant la structure de notre contexte d'authentification
interface AuthContextType {
  user: User | null; // L'utilisateur Firebase natif
  role: 'director' | 'social_worker' | 'accountant' | null; // Le rôle de l'utilisateur dans l'application
  loading: boolean; // État de chargement initial de l'authentification
  signIn: () => Promise<void>; // Connexion via Google
  logOut: () => Promise<void>; // Déconnexion
  signInWithEmail: (email: string, pass: string) => Promise<void>; // Connexion par email/mot de passe
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>; // Inscription par email/mot de passe
}

// Création du contexte avec des valeurs par défaut vides
const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  signIn: async () => {},
  logOut: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
});

// Composant fournisseur qui enveloppera l'application
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // États locaux pour gérer l'utilisateur, son rôle et l'état de chargement
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'director' | 'social_worker' | 'accountant' | null>(null);
  const [loading, setLoading] = useState(true);

  // Effet s'exécutant au montage pour écouter les changements d'état d'authentification
  useEffect(() => {
    // onAuthStateChanged est un observateur fourni par Firebase
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Si un utilisateur est connecté, on récupère son rôle depuis Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          // L'utilisateur existe en base, on définit son rôle
          setRole(userDocSnap.data().role as any);
        } else {
          // C'est un nouvel utilisateur (peut-être via Google), on crée son profil par défaut
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
        // Si personne n'est connecté, on réinitialise le rôle
        setRole(null);
      }
      // Le chargement initial est terminé
      setLoading(false);
    });

    // Nettoyage de l'observateur au démontage du composant
    return () => unsubscribe();
  }, []);

  // Fonction pour se connecter avec Google
  const signIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      // Gestion spécifique des erreurs de popup
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

  // Fonction pour se connecter avec Email et Mot de passe
  const signInWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  // Fonction pour créer un nouveau compte avec Email et Mot de passe
  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    const userCred = await createUserWithEmailAndPassword(auth, email, pass);
    if (userCred.user) {
      // Met à jour le profil de l'utilisateur Firebase avec son nom
      await updateProfile(userCred.user, { displayName: name });
      
      // La création du document est gérée par onAuthStateChanged, mais on le fait ici pour
      // être sûr de capturer le nom fourni lors de l'inscription manuelle
      const userDocRef = doc(db, 'users', userCred.user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          email: userCred.user.email,
          name: name,
          role: 'director', // Rôle par défaut (directeur) pour simplifier la démo
          createdAt: Date.now()
        });
        setRole('director');
      }
    }
  };

  // Fonction pour se déconnecter
  const logOut = async () => {
    await signOut(auth);
  };

  return (
    // Fournit les variables et fonctions aux composants enfants
    <AuthContext.Provider value={{ user, role, loading, signIn, logOut, signInWithEmail, signUpWithEmail }}>
      {/* On empêche le rendu des enfants tant que Firebase n'a pas vérifié l'état initial */}
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Hook personnalisé pour utiliser plus facilement le contexte d'authentification
export const useAuth = () => useContext(AuthContext);
