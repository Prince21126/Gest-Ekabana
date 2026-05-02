import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialisation de l'application Firebase avec la configuration fournie
const app = initializeApp(firebaseConfig);

// Initialisation du service d'Authentification Firebase
export const auth = getAuth(app);

// Initialisation du service Firestore (Base de données NoSQL)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Énumération des types d'opérations Firestore pour la gestion des erreurs
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

// Interface décrivant la structure des informations d'erreur Firestore à capturer
interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

/**
 * Gère et encapsule les erreurs liées à Firebase/Firestore.
 * Cette fonction capture le type d'opération, le chemin concerné, ainsi que
 * les informations de l'utilisateur connecté pour faciliter le débogage.
 * 
 * @param error - L'erreur interceptée (Exception)
 * @param operationType - Le type d'opération (CREATE, UPDATE, GET, etc.)
 * @param path - Le chemin / collection dans Firestore concerné
 * @throws Relance l'erreur sous forme de chaîne JSON formatée (FirestoreErrorInfo)
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  
  // Journalisation en console pour le développeur
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  
  // Relancer l'erreur sous format JSON pour être éventuellement traitée ailleurs (ex: UI d'erreur)
  throw new Error(JSON.stringify(errInfo));
}
