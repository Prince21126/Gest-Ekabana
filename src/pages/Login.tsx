import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { HeartHandshake, Lock, Mail, ArrowRight } from 'lucide-react';
import React, { useState } from 'react';
import { motion } from 'motion/react';

// Composant de la page de connexion
export function Login() {
  // Récupération des fonctions et états d'authentification depuis le contexte
  const { user, signIn, signInWithEmail, loading } = useAuth();
  
  // États locaux pour le formulaire (email, mot de passe, erreurs et statut de soumission)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Si l'application vérifie encore l'état actuel de l'utilisateur, afficher un indicateur de chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Si l'utilisateur est déjà connecté, le rediriger automatiquement vers le tableau de bord
  if (user) {
    return <Navigate to="/" />;
  }

  // Fonction pour gérer la soumission du formulaire de connexion
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Empêcher le rechargement de la page
    setAuthError(''); // Réinitialiser les erreurs précédentes
    setIsSubmitting(true); // Bloquer le bouton pendant la soumission
    try {
      // Tentative de connexion avec l'email et le mot de passe
      await signInWithEmail(email, password);
    } catch (error: any) {
      console.error(error); // Afficher l'erreur dans la console pour le debug
      setAuthError("Email ou mot de passe incorrect"); // Afficher un message d'erreur convivial
      setIsSubmitting(false); // Débloquer le bouton
    }
  };

  return (
    // Conteneur principal qui prend la hauteur totale de l'écran avec un fond blanc
    <div className="min-h-screen flex text-slate-800 bg-white">
      {/* Côté Gauche - Formulaire de connexion */}
      <div className="w-full md:w-[480px] flex flex-col justify-center px-8 md:px-16 shrink-0 relative z-10 bg-white shadow-2xl">
        {/* Animation d'apparition du contenu du formulaire (monte vers le haut et devient visible) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[360px] mx-auto pt-8" // Ajout de pt-8 pour faire descendre légèrement le titre
        >
          {/* En-tête avec Logo et Titre de l'application */}
          <div className="flex items-center gap-3 mb-10">
            {/* Conteneur de l'icône du logo avec fond bleu */}
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30 font-extrabold mt-2 hover:-translate-y-0.5 transition-transform">
              <HeartHandshake className="w-6 h-6 text-white" />
            </div>
            {/* Titre de l'application (modifié pour être plus gras - font-black) */}
            <span className="text-[26px] mt-2 font-black text-slate-900 tracking-tight">Gest-Ekabana</span>
          </div>

          {/* Section d'accueil utilisateur */}
          <div className="mb-10">
            <h1 className="text-[28px] font-bold text-slate-900 tracking-tight mb-2">Bienvenue</h1>
            <p className="text-slate-500 text-[15px]">Connectez-vous à votre espace sécurisé pour gérer l'orphelinat.</p>
          </div>

          {/* Formulaire contenant les champs Email et Mot de passe */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Champ d'adresse Email */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-slate-700">Adresse Email</label>
              <div className="relative">
                {/* Icône de mail à gauche dans l'input */}
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="votre@email.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-all placeholder:text-slate-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)} // Mise à jour de l'état email
                />
              </div>
            </div>

            {/* Champ Mot de Passe */}
            <div className="space-y-1.5">
               <label className="text-[13px] font-semibold text-slate-700">Mot de Passe</label>
               <div className="relative">
                 {/* Icône de cadenas à gauche dans l'input */}
                 <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                 <input
                   type="password"
                   required
                   placeholder="••••••••"
                   className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-all placeholder:text-slate-400"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)} // Mise à jour de l'état mot de passe
                 />
               </div>
            </div>

            {/* Affichage des erreurs éventuelles avec une animation */}
            {authError && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                className="bg-red-50 text-red-600 text-[13px] font-medium p-3.5 rounded-xl border border-red-100 flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                {authError}
              </motion.div>
            )}

            {/* Bouton de soumission du formulaire */}
            <button
              type="submit"
              disabled={isSubmitting} // Désactiver le bouton si le formulaire est en cours de soumission
              className="w-full group flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-[14px] font-semibold text-white bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {/* Si on charge, on affiche un petit spinner */}
              {isSubmitting ? (
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Se Connecter
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Section d'authentification alternative (Google) */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                {/* Ligne séparatrice */}
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[12px]">
                <span className="px-3 bg-white text-slate-500 font-medium">Ou accès rapide avec</span>
              </div>
            </div>

            <div className="mt-6">
              {/* Bouton d'authentification par Google */}
              <button
                onClick={signIn}
                type="button"
                className="w-full flex justify-center items-center gap-2.5 py-3 px-4 border border-slate-200 rounded-xl hover:bg-slate-50 text-[14px] font-semibold text-slate-700 transition-colors"
               >
                 <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 flex-shrink-0" alt="Logo Google" />
                 Continuer avec Google
               </button>
            </div>
          </div>
          
          {/* Note de confidentialité / Avertissement / Mentions */}
          <div className="mt-12 text-center text-[12px] font-medium text-slate-400 leading-relaxed">
            L'accès à cette application est réservé au personnel autorisé de Gest-Ekabana.<br/>Pour obtenir un compte, contactez la direction de l'association.
          </div>
        </motion.div>
      </div>

      {/* Côté Droit - Section Visuelle et Héro (Cachée sur petits écrans) */}
      <div className="hidden md:flex flex-1 relative bg-slate-900 overflow-hidden">
        {/* Arrière-plan de la section droite avec image de l'orphelinat */}
        <div className="absolute inset-0 z-0">
           {/* Image importée d'Unsplash */}
           <img src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2670&auto=format&fit=crop" alt="Arrière-plan d'orphelinat" className="w-full h-full object-cover opacity-30 mix-blend-overlay" />
           {/* Dégradés pour assombrir et styliser l'image */}
           <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
           <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-slate-900/80 via-transparent to-transparent" />
        </div>
        
        {/* Contenu textuel superposé sur l'image */}
        <div className="relative z-10 flex flex-col justify-end p-16 h-full w-full max-w-4xl text-left">
          {/* Animation d'apparition des textes du héros */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            {/* Slogan de l'application */}
            <h2 className="text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight mb-5">
              Semez l'espoir, <br/>
              <span className="text-blue-400">gérez avec cœur.</span>
            </h2>
            {/* Description courte de l'application */}
            <p className="text-lg text-slate-300 max-w-lg leading-relaxed">
              Une plateforme moderne et centralisée pour suivre l'évolution des enfants, administrer les dons et générer des rapports détaillés en toute simplicité.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
