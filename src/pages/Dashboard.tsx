import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Users, HeartHandshake, TrendingUp, HandCoins } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';

// Composant de la page Tableau de Bord
export function Dashboard() {
  // Récupération du rôle de l'utilisateur pour afficher/masquer certaines sections
  const { role } = useAuth();
  
  // État local pour stocker les statistiques globales
  const [stats, setStats] = useState({
    totalChildren: 0,
    activeChildren: 0,
    totalDonations: 0,
    recentDonations: [] as any[]
  });
  
  // État local pour stocker les données du graphique d'historique
  const [chartData, setChartData] = useState<any[]>([]);
  
  // État local pour gérer l'affichage pendant le chargement des données
  const [loading, setLoading] = useState(true);

  // Effet s'exécutant au montage pour récupérer les données en temps réel depuis Firestore
  useEffect(() => {
    let unsubscribeChildren: () => void;
    let unsubscribeDonations: () => void;
    
    // Variables temporaires pour stocker les données avant de mettre à jour les états
    let childrenData: any[] = [];
    let donationsData: any[] = [];

    // Fonction interne pour reformater les données de Firestore en vue du graphique Recharts
    const processChartData = (children: any[], donations: any[]) => {
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
      const currentYear = new Date().getFullYear();
      
      // Initialisation d'un tableau pour les 12 mois avec des compteurs à 0
      const byMonth = Array.from({length: 12}, (_, i) => ({
        name: months[i],
        enfants: 0, // Nombre d'enfants inscrits ce mois
        dons: 0,    // Montant total des dons de ce mois
      }));

      // Boucle sur les enfants pour compter les inscriptions par mois pour l'année en cours
      children.forEach(c => {
        if (c.createdAt) {
          const d = new Date(c.createdAt);
          if (d.getFullYear() === currentYear) {
            byMonth[d.getMonth()].enfants += 1;
          }
        }
      });
      
      // Calcul du cumul des enfants mois par mois
      let runningChildren = 0;
      byMonth.forEach(month => {
        runningChildren += month.enfants;
        month.enfants = runningChildren;
      });

      // Boucle sur les dons pour agréger les montants par mois pour l'année en cours
      donations.forEach(d => {
        if (d.createdAt && d.type === 'money') {
          const date = new Date(d.createdAt);
          if (date.getFullYear() === currentYear) {
            byMonth[date.getMonth()].dons += (d.amount || 0);
          }
        }
      });

      // Ne conserver que les données allant jusqu'au mois actuel, et typiquement les 6 derniers mois
      const currentMonth = new Date().getMonth();
      let startIndex = currentMonth - 5;
      if (startIndex < 0) startIndex = 0; // Garantir que l'index ne soit pas négatif
      
      // Mise à jour de l'état du graphique avec les données traitées
      setChartData(byMonth.slice(startIndex, currentMonth + 1));
    };

    // Si le rôle permet de voir les stats des enfants (Directeur ou Travailleur social)
    if (role === 'director' || role === 'social_worker') {
      const qChildren = query(collection(db, 'children'));
      unsubscribeChildren = onSnapshot(qChildren, (snapshot) => {
        childrenData = snapshot.docs.map(doc => doc.data());
        
        // Mise à jour des compteurs statistiques des enfants
        setStats(prev => ({
          ...prev,
          totalChildren: childrenData.length,
          activeChildren: childrenData.filter(c => c.status === 'active').length,
        }));
        
        // Rafraîchir les données du graphique à chaque réception de mise à jour
        processChartData(childrenData, donationsData);
      }, (error) => handleFirestoreError(error, OperationType.GET, 'children'));
    }

    // Si le rôle permet de voir les dons (Directeur ou Comptable)
    if (role === 'director' || role === 'accountant') {
      const qDonations = query(collection(db, 'donations'));
      unsubscribeDonations = onSnapshot(qDonations, (snapshot) => {
        donationsData = snapshot.docs.map(doc => doc.data());
        
        // Total des dons d'argent
        const total = donationsData.filter(d => d.type === 'money').reduce((acc, curr) => acc + (curr.amount || 0), 0);
        
        // Mise à jour des statistiques des dons : Total calculé, et les 5 dons les plus récents
        setStats(prev => ({
          ...prev,
          totalDonations: total,
          recentDonations: donationsData.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5)
        }));
        
        // Rafraîchir les données du graphique
        processChartData(childrenData, donationsData);
      }, (error) => handleFirestoreError(error, OperationType.GET, 'donations'));
    }

    // Le chargement initial est terminé une fois les écouteurs en place
    setLoading(false);

    // Nettoyage : retirer les écouteurs de la BD à la fermeture du composant
    return () => {
      if (unsubscribeChildren) unsubscribeChildren();
      if (unsubscribeDonations) unsubscribeDonations();
    };
  }, [role]);

  // Écran de chargement si les requêtes n'ont pas encore abouties
  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    // Animation principale du Dashboard pour avoir un effet fluide d'apparition
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* En-tête de la page */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500">Vue d'ensemble des activités de Gest-Ekabana.</p>
      </div>

      {/* Cartes contenant les KPI (Indicateurs Clés de Performance) organisées en grille */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Affichage conditionnel des statistiques des enfants selon le rôle */}
        {(role === 'director' || role === 'social_worker') && (
          <>
            {/* Carte "Total Enfants" */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="group bg-white p-5 rounded-[12px] border border-slate-200 shadow-sm flex flex-col justify-center hover:shadow-md hover:border-blue-200 transition-all"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-1">Total Enfants</div>
                {/* Icône avec effet d'animation au survol sur son parent */}
                <div className="p-2 bg-blue-50 text-blue-500 rounded-lg group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="text-[28px] font-bold text-slate-900 tracking-tight">{stats.totalChildren}</div>
            </motion.div>
            
            {/* Carte "Enfants Actifs (Internes)" */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="group bg-white p-5 rounded-[12px] border border-slate-200 shadow-sm flex flex-col justify-center hover:shadow-md hover:border-sky-200 transition-all"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-1">Enfants Actifs</div>
                <div className="p-2 bg-sky-50 text-sky-500 rounded-lg group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300">
                   <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="text-[28px] font-bold text-slate-900 tracking-tight">{stats.activeChildren}</div>
            </motion.div>
          </>
        )}

        {/* Affichage conditionnel des statistiques des dons selon le rôle */}
        {(role === 'director' || role === 'accountant') && (
          <>
            {/* Carte "Total Dons Financiers" */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="group bg-white p-5 rounded-[12px] border border-slate-200 shadow-sm flex flex-col justify-center hover:shadow-md hover:border-emerald-200 transition-all"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-1">Dons Financiers (USD)</div>
                <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                  <HeartHandshake className="w-5 h-5" />
                </div>
              </div>
              <div className="text-[28px] font-bold text-slate-900 font-mono tracking-tight">${stats.totalDonations.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            </motion.div>
            
            {/* Carte "Activité mensuelle - dons récents" */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="group bg-white p-5 rounded-[12px] border border-slate-200 shadow-sm flex flex-col justify-center hover:shadow-md hover:border-amber-200 transition-all"
            >
               <div className="flex justify-between items-start mb-2">
                <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-1">Dons Récents</div>
                <div className="p-2 bg-amber-50 text-amber-500 rounded-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                  <HandCoins className="w-5 h-5" />
                </div>
              </div>
              <div className="text-[28px] font-bold text-slate-900 tracking-tight">{stats.recentDonations.length}</div>
            </motion.div>
          </>
        )}
      </div>

      {/* Section Graphiques et Listes avec Animation d'apparition retardée */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5"
      >
        {/* Conteneur gauche pour le Graphique de l'évolution des effectifs et dons */}
        <div className="bg-white p-5 rounded-[12px] border border-slate-200 shadow-sm flex flex-col">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
             <TrendingUp className="w-4 h-4 text-slate-400" />
             Évolution des effectifs et dons
          </div>
          <div className="flex-1 min-h-[250px]">
             {/* Vérifier si nous avons des données pour afficher le graphe */}
             {chartData.length > 0 ? (
               // Graphique Responsive supportant différentes tailles d'écrans (réalisée avec Recharts)
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dy={10} />
                   {/* Axe de gauche pour le nombre d'enfants */}
                   <YAxis yAxisId="left" orientation="left" stroke="#2563eb" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                   {/* Axe de droite pour les valeurs des dons */}
                   <YAxis yAxisId="right" orientation="right" stroke="#16a34a" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                   <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'}} />
                   
                   {/* Barre représentant le nombre d'Enfants (Colorée en bleu, connectée à l'axe de gauche) */}
                   <Bar yAxisId="left" dataKey="enfants" fill="#2563eb" radius={[2, 2, 0, 0]} name="Enfants" maxBarSize={30} />
                   
                   {/* Barre représentant la somme des Dons (Colorée en vert, connectée à l'axe de droite) */}
                   <Bar yAxisId="right" dataKey="dons" fill="#16a34a" radius={[2, 2, 0, 0]} name="Dons ($)" maxBarSize={30} />
                 </BarChart>
               </ResponsiveContainer>
             ) : (
               <div className="flex items-center justify-center h-full text-slate-500 text-[12px]">Récolte des données en cours...</div>
             )}
          </div>
        </div>

        {/* Section de droite affichant la liste des dons récents (soumise à condition sur le rôle) */}
        {(role === 'director' || role === 'accountant') && (
          <div className="bg-white rounded-[12px] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            {/* En-tête de la liste */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-2">
                 <HandCoins className="w-4 h-4 text-slate-400" />
                 Derniers Dons
              </div>
            </div>
            
            {/* Si la liste est vide, on affiche un texte alternatif, sinon, on affiche le tableau */}
            {stats.recentDonations.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-[12px] flex-1 flex flex-col items-center justify-center">
                Aucun don enregistré récemment.
              </div>
            ) : (
              <div className="overflow-x-auto flex-1">
                {/* Tableau récapitulatif des dons récents */}
                <table className="w-full text-left text-[13px] whitespace-nowrap">
                  <thead>
                    <tr>
                      <th className="px-5 py-3 bg-white border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wide text-[11px]">Type</th>
                      <th className="px-5 py-3 bg-white border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wide text-[11px]">Date</th>
                      <th className="px-5 py-3 bg-white border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wide text-[11px]">Valeur</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {/* Itération sur les derniers dons */}
                    {stats.recentDonations.map((don, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3 text-slate-800 font-medium">
                          {/* Affichage différencié (badge couleur) du type de don */}
                          {don.type === 'money' ? (
                            <span className="inline-flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>Espèces</span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>Nature</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-slate-500">
                          {/* Formatage basique de la date */}
                          {new Date(don.createdAt).toLocaleDateString()}
                        </td>
                        {/* Application conditionnelle de styles sur le formatage du montant ou de la désignation */}
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
