import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Users, HeartHandshake, FileText, Settings, LogOut, Menu, Search } from 'lucide-react';
import { useState } from 'react';

export function Layout() {
  const { user, role, logOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={logOut}
            className="flex items-center gap-2 w-full px-3 py-2 text-[13px] font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-[4px] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Desktop Header */}
        <header className="hidden md:flex bg-white border-b border-slate-200 h-[60px] items-center justify-between px-6 shrink-0">
          <div className="flex items-center">
            <span className="font-semibold text-[15px]">Gestion Intégrée de l'Orphelinat</span>
            <span className="text-[10px] px-1.5 py-0.5 border border-slate-300 rounded-[4px] ml-2 text-slate-500 uppercase font-semibold">{role?.replace('_', ' ')}</span>
          </div>
          <div className="flex items-center gap-4">
             <div className="relative">
                <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Rechercher un dossier..." className="pl-9 pr-3 py-1.5 border border-slate-200 rounded-[4px] text-[13px] w-[240px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
             </div>
             <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[12px] font-bold text-slate-700 uppercase">
                {user.email?.charAt(0)}
             </div>
          </div>
        </header>

        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2 text-slate-900">
            <HeartHandshake className="w-6 h-6 text-blue-500" />
            <span className="text-lg font-bold">Gest-Ekabana</span>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-600">
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}>
            <div className="w-64 h-full bg-slate-900 p-4 flex flex-col" onClick={e => e.stopPropagation()}>
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
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto bg-slate-100 p-5">
            <Outlet />
        </div>
      </main>
    </div>
  );
}
