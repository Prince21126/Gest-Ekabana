import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Fonction utilitaire pour fusionner les classes Tailwind CSS de manière intelligente.
 * Combine 'clsx' (pour la logique conditionnelle) et 'tailwind-merge' (pour résoudre les conflits).
 * 
 * @param inputs - Les classes / conditions à évaluer et fusionner
 * @returns Une chaîne de caractères contenant les classes CSS fusionnées sans conflits
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
