import { FileText, Download, PieChart, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { motion } from 'motion/react';

export function Reports() {
  const { role } = useAuth();

  if (role !== 'director') {
    return <Navigate to="/" />;
  }

  const reports = [
    {
      title: "Rapport Mensuel des Dons",
      description: "Aperçu complet des dons financiers et matériels reçus ce mois-ci.",
      icon: PieChart,
      color: "text-emerald-500",
      bg: "bg-emerald-50"
    },
    {
      title: "Registre des Enfants Actifs",
      description: "Liste de tous les enfants actuellement pris en charge par l'orphelinat.",
      icon: FileSpreadsheet,
      color: "text-blue-500",
      bg: "bg-blue-50"
    },
    {
      title: "Historique des Mouvements",
      description: "Admissions, adoptions et transferts effectués sur les 12 derniers mois.",
      icon: FileText,
      color: "text-purple-500",
      bg: "bg-purple-50"
    }
  ];

  const handleExport = (format: string, title: string) => {
    // Dans une version complète, ceci déclencherait un export réel via jsPDF / SheetJS
    alert(`Génération du rapport "${title}" au format ${format.toUpperCase()} en cours...`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Reporting & PDF</h1>
          <p className="text-[13px] text-slate-500">Générez des rapports pdf ou excel pour les partenaires et réunions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reports.map((report, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 + 0.1, duration: 0.4 }}
            key={idx} 
            className="bg-white rounded-[12px] border border-slate-200 shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow"
          >
            <div className={`w-12 h-12 rounded-[8px] ${report.bg} flex items-center justify-center mb-4`}>
              <report.icon className={`w-6 h-6 ${report.color}`} />
            </div>
            
            <h3 className="text-[15px] font-bold text-slate-900 mb-2">{report.title}</h3>
            <p className="text-slate-500 text-[13px] flex-1 mb-6 leading-relaxed">{report.description}</p>
            
            <div className="flex items-center gap-3 mt-auto">
               <button 
                onClick={() => handleExport('pdf', report.title)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-[12px] font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-[6px] transition-colors focus:ring-2 focus:ring-red-500/20 outline-none"
               >
                 <Download className="w-4 h-4" />
                 PDF
               </button>
               <button 
                onClick={() => handleExport('excel', report.title)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-[12px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-[6px] transition-colors focus:ring-2 focus:ring-emerald-500/20 outline-none"
               >
                 <Download className="w-4 h-4" />
                 Excel
               </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
