import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Users, HeartHandshake, FileText, Settings, LogOut, Menu, Search } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export function Layout() {
  const { user, role, logOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

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

  if (!user) {
    return <Navigate to="/login" />;
  }

  const navItems = [
    { path: '/', label: 'Tableau de bord', icon: LayoutDashboard, roles: ['director', 'social_worker', 'accountant'] },
    { path: '/children', label: 'Enfants', icon: Users, roles: ['director', 'social_worker'] },
    { path: '/donations', label: 'Dons', icon: HeartHandshake, roles: ['director', 'accountant'] },
    { path: '/reports', label: 'Rapports', icon: FileText, roles: ['director'] },
  ].filter(item => item.roles.includes(role || ''));

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-800">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-[220px] bg-slate-900 text-slate-50 min-h-screen border-r border-slate-800">
        <div className="flex items-center gap-2 px-5 py-6">
          <HeartHandshake className="w-6 h-6 text-blue-500" />
          <span className="text-[20px] font-bold text-blue-500 tracking-tight">Gest-Ekabana</span>
        </div>
        
        <div className="px-5 mb-2 mt-2 text-[11px] uppercase tracking-widest text-slate-400 font-semibold">Menu Principal</div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/');
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[4px] transition-colors text-[13px] ${
                  isActive 
                    ? 'bg-blue-600 text-white font-medium' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Desktop Header */}
        <header className="hidden md:flex bg-white border-b border-slate-200 h-[60px] items-center justify-between px-6 shrink-0 z-10 relative">
          <div className="flex items-center">
            <span className="font-semibold text-[15px]">Gestion Intégrée de l'Orphelinat</span>
          </div>
          <div className="flex items-center gap-4">
             <div className="relative">
                <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Rechercher un dossier..." className="pl-9 pr-3 py-1.5 border border-slate-200 rounded-[4px] text-[13px] w-[240px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
             </div>
             
             <div className="relative" ref={profileRef}>
               <button 
                 onClick={() => setProfileOpen(!profileOpen)}
                 className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[12px] font-bold text-blue-700 uppercase cursor-pointer hover:bg-blue-200 transition-colors"
               >
                  {user.email?.charAt(0)}
               </button>
               
               <AnimatePresence>
               {profileOpen && (
                 <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-[6px] shadow-lg py-1 z-50 origin-top-right"
                 >
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-[13px] font-medium text-slate-900 truncate">{user.displayName || 'Utilisateur'}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <p className="text-[10px] uppercase font-bold text-blue-600 mt-1">{role?.replace('_', ' ')}</p>
                    </div>
                    <button
                      onClick={logOut}
                      className="w-full text-left px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-50 hover:text-red-600 flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Déconnexion
                    </button>
                 </motion.div>
               )}
               </AnimatePresence>
             </div>
          </div>
        </header>

        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 shrink-0 relative z-10">
          <div className="flex items-center gap-2 text-slate-900">
            <HeartHandshake className="w-6 h-6 text-blue-500" />
            <span className="text-lg font-bold">Gest-Ekabana</span>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-600">
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm" 
            onClick={() => setSidebarOpen(false)}
          >
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-64 h-full bg-slate-900 p-4 flex flex-col shadow-2xl" 
              onClick={e => e.stopPropagation()}
            >
               <div className="flex items-center gap-2 px-2 py-4 mb-4">
                <HeartHandshake className="w-6 h-6 text-blue-500" />
                <span className="text-[20px] font-bold text-blue-500 tracking-tight">Gest-Ekabana</span>
              </div>
              <nav className="flex-1 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-[4px] text-slate-300 hover:bg-slate-800 text-[13px]"
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t border-slate-800 pt-4 mt-auto">
                <button
                  onClick={logOut}
                  className="flex items-center gap-3 w-full px-3 py-3 rounded-[4px] text-slate-300 hover:bg-slate-800 text-left text-[13px]"
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>

        <div className="flex-1 overflow-auto bg-slate-100 p-5 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
