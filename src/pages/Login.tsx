import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { HeartHandshake } from 'lucide-react';
import React, { useState } from 'react';

export function Login() {
  const { user, signIn, signInWithEmail, signUpWithEmail, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isLogin) {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, name);
      }
    } catch (error: any) {
      console.error(error);
      setAuthError(error.message || "Une erreur s'est produite");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <HeartHandshake className="w-10 h-10 text-blue-600" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-[24px] font-bold text-slate-900 tracking-tight">
          Gest-Ekabana
        </h2>
        <p className="mt-2 text-center text-[13px] text-slate-500">
          Système de Gestion Intégré
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)] sm:rounded-[8px] border border-slate-200 sm:px-10">
          
          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 tracking-wide uppercase mb-1">
                  Nom Complet
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-[4px] text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 tracking-wide uppercase mb-1">
                Adresse Email
              </label>
              <input
                type="email"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-[4px] text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
               <label className="block text-[12px] font-semibold text-slate-700 tracking-wide uppercase mb-1">
                Mot de Passe
              </label>
              <input
                type="password"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-[4px] text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {authError && (
              <div className="bg-red-50 text-red-600 text-[12px] p-2 rounded-[4px] border border-red-100">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-[4px] shadow-sm text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              {isLogin ? 'Se Connecter' : "S'inscrire"}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[12px]">
                <span className="px-2 bg-white text-slate-500 font-medium">Ou continuer avec</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={signIn}
                type="button"
                className="w-full flex justify-center items-center py-2 px-4 border border-slate-300 rounded-[4px] shadow-sm bg-white text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4 mr-2" alt="Google logo" />
                Google
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-[13px]">
             <span className="text-slate-500">
               {isLogin ? "Vous n'avez pas de compte ?" : "Vous avez déjà un compte ?"}
             </span>
             <button 
                onClick={() => setIsLogin(!isLogin)} 
                className="ml-1 text-blue-600 hover:text-blue-800 font-medium"
             >
               {isLogin ? "S'inscrire ici" : "Se connecter"}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
