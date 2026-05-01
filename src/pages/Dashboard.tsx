import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Users, HeartHandshake, TrendingUp, HandCoins } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';

export function Dashboard() {
  const { role } = useAuth();
  const [stats, setStats] = useState({
    totalChildren: 0,
    activeChildren: 0,
    totalDonations: 0,
    recentDonations: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeChildren: () => void;
    let unsubscribeDonations: () => void;

    if (role === 'director' || role === 'social_worker') {
      const qChildren = query(collection(db, 'children'));
      unsubscribeChildren = onSnapshot(qChildren, (snapshot) => {
        const children = snapshot.docs.map(doc => doc.data());
        setStats(prev => ({
          ...prev,
          totalChildren: children.length,
          activeChildren: children.filter(c => c.status === 'active').length,
        }));
      }, (error) => handleFirestoreError(error, OperationType.GET, 'children'));
    }

    if (role === 'director' || role === 'accountant') {
      const qDonations = query(collection(db, 'donations'));
      unsubscribeDonations = onSnapshot(qDonations, (snapshot) => {
        const donations = snapshot.docs.map(doc => doc.data());
        const total = donations.filter(d => d.type === 'money').reduce((acc, curr) => acc + (curr.amount || 0), 0);
        setStats(prev => ({
          ...prev,
          totalDonations: total,
          recentDonations: donations.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5)
        }));
      }, (error) => handleFirestoreError(error, OperationType.GET, 'donations'));
    }

    setLoading(false);

    return () => {
      if (unsubscribeChildren) unsubscribeChildren();
      if (unsubscribeDonations) unsubscribeDonations();
    };
  }, [role]);

  const mockChartData = [
    { name: 'Jan', enfants: 40, dons: 2400 },
    { name: 'Fév', enfants: 42, dons: 1398 },
    { name: 'Mar', enfants: 42, dons: 9800 },
    { name: 'Avr', enfants: 45, dons: 3908 },
    { name: 'Mai', enfants: 48, dons: 4800 },
    { name: 'Juin', enfants: 50, dons: 3800 },
  ];

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500">Vue d'ensemble des activités de Gest-Ekabana.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(role === 'director' || role === 'social_worker') && (
          <>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="bg-white p-5 rounded-[12px] border border-slate-200 shadow-sm flex flex-col justify-center hover:shadow-md transition-shadow"
            >
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-1">Total Enfants</div>
              <div className="text-[28px] font-bold text-slate-900 tracking-tight">{stats.totalChildren}</div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="bg-white p-5 rounded-[12px] border border-slate-200 shadow-sm flex flex-col justify-center hover:shadow-md transition-shadow"
            >
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-1">Enfants Actifs</div>
              <div className="text-[28px] font-bold text-slate-900 tracking-tight">{stats.activeChildren}</div>
            </motion.div>
          </>
        )}

        {(role === 'director' || role === 'accountant') && (
          <>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="bg-white p-5 rounded-[12px] border border-slate-200 shadow-sm flex flex-col justify-center hover:shadow-md transition-shadow"
            >
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-1">Dons Financiers (USD)</div>
              <div className="text-[28px] font-bold text-slate-900 font-mono tracking-tight">${stats.totalDonations.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="bg-white p-5 rounded-[12px] border border-slate-200 shadow-sm flex flex-col justify-center hover:shadow-md transition-shadow"
            >
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-1">Dons Récents</div>
              <div className="text-[28px] font-bold text-slate-900 tracking-tight">{stats.recentDonations.length}</div>
            </motion.div>
          </>
        )}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5"
      >
        <div className="bg-white p-5 rounded-[12px] border border-slate-200 shadow-sm flex flex-col">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
             <TrendingUp className="w-4 h-4 text-slate-400" />
             Évolution des effectifs et dons
          </div>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dy={10} />
                <YAxis yAxisId="left" orientation="left" stroke="#2563eb" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                <YAxis yAxisId="right" orientation="right" stroke="#16a34a" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'}} />
                <Bar yAxisId="left" dataKey="enfants" fill="#2563eb" radius={[2, 2, 0, 0]} name="Enfants" maxBarSize={30} />
                <Bar yAxisId="right" dataKey="dons" fill="#16a34a" radius={[2, 2, 0, 0]} name="Dons ($)" maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* If there are recent donations */}
        {(role === 'director' || role === 'accountant') && (
          <div className="bg-white rounded-[12px] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-2">
                 <HandCoins className="w-4 h-4 text-slate-400" />
                 Derniers Dons
              </div>
            </div>
            {stats.recentDonations.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-[12px] flex-1 flex flex-col items-center justify-center">
                Aucun don enregistré récemment.
              </div>
            ) : (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-[13px] whitespace-nowrap">
                  <thead>
                    <tr>
                      <th className="px-5 py-3 bg-white border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wide text-[11px]">Type</th>
                      <th className="px-5 py-3 bg-white border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wide text-[11px]">Date</th>
                      <th className="px-5 py-3 bg-white border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wide text-[11px]">Valeur</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {stats.recentDonations.map((don, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3 text-slate-800 font-medium">
                          {don.type === 'money' ? (
                            <span className="inline-flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>Espèces</span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>Nature</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-slate-500">
                          {new Date(don.createdAt).toLocaleDateString()}
                        </td>
                        <td className={`px-5 py-3 ${don.type === 'money' ? 'font-mono font-bold text-slate-700' : 'text-slate-600 truncate max-w-[150px]'}`}>
                          {don.type === 'money' ? `$${parseFloat(don.amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : don.itemDescription}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
