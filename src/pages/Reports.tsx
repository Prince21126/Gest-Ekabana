import { FileText, Download, PieChart, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Reporting & PDF</h1>
          <p className="text-[13px] text-slate-500">Générez des rapports pdf ou excel pour les partenaires et réunions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reports.map((report, idx) => (
          <div key={idx} className="bg-white rounded-[6px] border border-slate-200 shadow-sm p-4 flex flex-col">
            <div className={`w-10 h-10 rounded-[4px] ${report.bg} ${report.color} flex items-center justify-center mb-3`}>
              <report.icon className="w-5 h-5" />
            </div>
            
            <h3 className="text-[14px] font-bold text-slate-900 mb-1">{report.title}</h3>
            <p className="text-slate-500 text-[12px] flex-1 mb-5">{report.description}</p>
            
            <div className="flex items-center gap-2 mt-auto">
               <button 
                onClick={() => handleExport('pdf', report.title)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-[12px] font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-[4px] transition"
               >
                 <Download className="w-4 h-4" />
                 PDF
               </button>
               <button 
                onClick={() => handleExport('excel', report.title)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-[12px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-[4px] transition"
               >
                 <Download className="w-4 h-4" />
                 Excel
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
