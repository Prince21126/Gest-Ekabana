import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Users, HeartHandshake, FileText, Settings, LogOut, Menu, Search } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// Composant principal de mise en page, affichant la barre latérale de navigation et l'en-tête,
// encapsulant toutes les pages internes de l'application via <Outlet />
export function Layout() {
  // Récupération des informations de l'utilisateur et de la fonction de déconnexion du contexte
  const { user, role, logOut } = useAuth();
  
  // Utilisation de useLocation pour déterminer la page active dans la sidebar
  const location = useLocation();
  
  // Gestion de l'état d'ouverture du menu mobile et du profil utilisateur
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  
  // Référence pour pouvoir fermer le menu profil si on clique en-dehors
  const profileRef = useRef<HTMLDivElement>(null);

  // Effet pour fermer le menu profil au clic à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileRef]);

  // Redirection automatique vers /login si aucun utilisateur n'est connecté
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Définition des éléments de navigation avec leurs rôles autorisés et styles personnalisés
  const navItems = [
    { 
      path: '/', 
      label: 'Tableau de bord', 
      icon: LayoutDashboard, 
      roles: ['director', 'social_worker', 'accountant'], // Rôles pouvant voir ce menu
      iconColor: 'group-hover:text-amber-400',
      activeColor: 'text-amber-300',
      activeBg: 'bg-slate-800',
      animation: 'group-hover:scale-110 transition-transform duration-300'
    },
    { 
      path: '/children', 
      label: 'Enfants', 
      icon: Users, 
      roles: ['director', 'social_worker'],
      iconColor: 'group-hover:text-blue-400',
      activeColor: 'text-blue-400',
      activeBg: 'bg-slate-800',
      animation: 'group-hover:-translate-y-1 transition-transform duration-300'
    },
    { 
      path: '/donations', 
      label: 'Dons', 
      icon: HeartHandshake, 
      roles: ['director', 'accountant'],
      iconColor: 'group-hover:text-emerald-400',
      activeColor: 'text-emerald-400',
      activeBg: 'bg-slate-800',
      animation: 'group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300'
    },
    { 
      path: '/reports', 
      label: 'Rapports', 
      icon: FileText, 
      roles: ['director'],
      iconColor: 'group-hover:text-purple-400',
      activeColor: 'text-purple-400',
      activeBg: 'bg-slate-800',
      animation: 'group-hover:-rotate-12 transition-transform duration-300'
    },
  // On filtre pour ne garder que les éléments autorisés pour le rôle actuel
  ].filter(item => item.roles.includes(role || ''));

  return (
    // Conteneur principal flex (Sidebar + Contenu)
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-800">
      {/* Sidebar - Desktop (visible uniquement sur les grands écrans md et plus) */}
      <aside className="hidden md:flex flex-col w-[220px] bg-slate-900 text-slate-50 min-h-screen border-r border-slate-800">
        {/* Entête logo sidebar */}
        <div className="flex items-center gap-2 px-5 py-6">
          <HeartHandshake className="w-6 h-6 text-blue-500" />
          <span className="text-[20px] font-bold text-blue-500 tracking-tight">Gest-Ekabana</span>
        </div>
        
        {/* Titre section menu */}
        <div className="px-5 mb-2 mt-2 text-[11px] uppercase tracking-widest text-slate-400 font-semibold">Menu Principal</div>
        
        {/* Navigation des liens */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            // On vérifie si ce lien correspond à la route actuelle
            const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/');
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-[4px] transition-colors text-[13px] overflow-hidden relative ${
                  isActive 
                    ? `${item.activeBg} font-medium text-white` 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {/* Indicateur visuel du lien actif (ligne blanche à gauche) */}
                {isActive && (
                  <motion.div 
                    layoutId="activeTabIndicatorDesktop"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-white"
                  />
                )}
                {/* Icône animée */}
                <div className={`${item.animation}`}>
                  <Icon className={`w-4 h-4 ${isActive ? item.activeColor : item.iconColor} transition-colors duration-300`} />
                </div>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        {/* Profil de l'utilisateur affiché en bas de la sidebar */}
        <div className="p-4 border-t border-slate-800 mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
               {/* Avatar généré avec la première lettre de l'email */}
               <div className="w-8 h-8 rounded-[6px] bg-slate-800 flex items-center justify-center text-[12px] font-bold text-blue-400 uppercase shrink-0">
                  {user.email?.charAt(0)}
               </div>
               {/* Infos utilisateur avec gestion des longs textes */}
               <div className="overflow-hidden">
                 <p className="text-[12px] font-medium text-slate-200 truncate">{user.displayName || user.email?.split('@')[0]}</p>
                 <p className="text-[10px] text-slate-400 truncate capitalize">{role?.replace('_', ' ')}</p>
               </div>
            </div>
            {/* Bouton de déconnexion animé avec bouton */}
            <button onClick={logOut} className="group p-1.5 text-rose-400 hover:text-white rounded-[6px] hover:bg-rose-500/20 transition" title="Déconnexion">
              <LogOut className="w-4 h-4 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content (conteneur du reste de l'application) */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Desktop Header (Barre supérieure) */}
        <header className="hidden md:flex bg-white border-b border-slate-200 h-[60px] items-center justify-between px-6 shrink-0 z-10 relative">
          <div className="flex items-center">
            <span className="font-semibold text-[15px]">Gestion Intégrée de l'Orphelinat</span>
          </div>
        </header>

        {/* Mobile header (Barre supérieure pour petits écrans avec bouton hamburger menu) */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 shrink-0 relative z-10">
          <div className="flex items-center gap-2 text-slate-900">
            <HeartHandshake className="w-6 h-6 text-blue-500" />
            <span className="text-lg font-bold">Gest-Ekabana</span>
          </div>
          {/* Bouton d'ouverture du menu latéral sur mobile */}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-600">
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile sidebar overlay (Volet du menu pour petits écrans géré avec AnimatePresence) */}
        <AnimatePresence>
        {sidebarOpen && (
          // Fond sombre flouté derrière le menu ouvert
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm" 
            onClick={() => setSidebarOpen(false)}
          >
            {/* Contenu du menu glissant depuis la gauche */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-64 h-full bg-slate-900 p-4 flex flex-col shadow-2xl" 
              onClick={e => e.stopPropagation()} // Empêche la fermeture quand on clique à l'intérieur
            >
               <div className="flex items-center gap-2 px-2 py-4 mb-4">
                <HeartHandshake className="w-6 h-6 text-blue-500" />
                <span className="text-[20px] font-bold text-blue-500 tracking-tight">Gest-Ekabana</span>
              </div>
              
              {/* Liens de navigation pour mobile */}
              <nav className="flex-1 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/');
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)} // Fermer le menu sur clic d'un lien
                      className={`group flex items-center gap-3 px-3 py-3 rounded-[4px] text-[13px] relative overflow-hidden transition-colors ${
                        isActive
                          ? `${item.activeBg} font-medium text-white`
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {isActive && (
                        <motion.div 
                          layoutId="activeTabIndicatorMobile"
                          className="absolute left-0 top-0 bottom-0 w-1 bg-white"
                        />
                      )}
                      <div className={`${item.animation}`}>
                        <Icon className={`w-4 h-4 ${isActive ? item.activeColor : item.iconColor} transition-colors duration-300`} />
                      </div>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              
              {/* Bouton de déconnexion pour mobile */}
              <div className="border-t border-slate-800 pt-4 mt-auto">
                <button
                  onClick={logOut}
                  className="group flex items-center gap-3 w-full px-3 py-3 rounded-[4px] text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 text-left text-[13px] transition-colors"
                >
                  <LogOut className="w-4 h-4 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300" />
                  Déconnexion
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>

        {/* Espace central de l'application affichant les composants des routes via Outlet */}
        <div className="flex-1 overflow-auto bg-slate-100 p-5 relative">
            <AnimatePresence mode="wait">
              {/* Animation pour le passage d'une page à l'autre */}
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {/* C'est ici que les composants enfants / routes sont rendus */}
                <Outlet />
              </motion.div>
            </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
