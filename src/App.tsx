import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ChildrenList } from './pages/ChildrenList';
import { Donations } from './pages/Donations';
import { Reports } from './pages/Reports';

// Composant racine de l'application gérant le routage principal
export default function App() {
  return (
    // Fournisseur du contexte d'authentification (rend les données utilisateur disponibles partout)
    <AuthProvider>
      {/* Configuration du routeur pour la navigation côté client */}
      <BrowserRouter>
        <Routes>
          {/* Route publique pour la page de connexion */}
          <Route path="/login" element={<Login />} />
          
          {/* Routes privées imbriquées dans le Layout principal (Sidebar + Topbar) */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="children" element={<ChildrenList />} />
            <Route path="donations" element={<Donations />} />
            <Route path="reports" element={<Reports />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
