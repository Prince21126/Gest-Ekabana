import { FileText, Download, PieChart, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useState } from 'react';

export function Reports() {
  const { role } = useAuth();
  const [isExporting, setIsExporting] = useState(false);

  if (role !== 'director') {
    return <Navigate to="/" />;
  }

  const reports = [
    {
      id: "donations",
      title: "Rapport Mensuel des Dons",
      description: "Aperçu complet des dons financiers et matériels reçus.",
      icon: PieChart,
      color: "text-emerald-500",
      bg: "bg-emerald-50"
    },
    {
      id: "children_active",
      title: "Registre des Enfants Actifs",
      description: "Liste de tous les enfants actuellement pris en charge par l'orphelinat.",
      icon: FileSpreadsheet,
      color: "text-blue-500",
      bg: "bg-blue-50"
    },
    {
      id: "children_all",
      title: "Historique des Mouvements",
      description: "Admissions, adoptions et transferts effectués dans l'orphelinat.",
      icon: FileText,
      color: "text-purple-500",
      bg: "bg-purple-50"
    }
  ];

  const generateData = async (reportId: string): Promise<{headers: string[], rows: any[][]}> => {
    let headers: string[] = [];
    let rows: any[][] = [];

    if (reportId === 'donations') {
      const qs = await getDocs(query(collection(db, 'donations')));
      const docs = qs.docs.map(d => d.data());
      
      const donorsQs = await getDocs(query(collection(db, 'donors')));
      const donors = donorsQs.docs.map(d => ({id: d.id, ...d.data()}));
      
      headers = ['Date', 'Donateur', 'Type', 'Montant', 'Devise', 'Methode', 'Description', 'Reçu Par'];
      rows = docs.sort((a,b) => b.createdAt - a.createdAt).map(d => {
        const donor = donors.find(x => x.id === d.donorId);
        return [
          new Date(d.date || d.createdAt).toLocaleDateString(),
          donor ? donor.name : 'Inconnu',
          d.type === 'money' ? 'Financier' : 'Nature',
          d.amount || '-',
          d.currency || '-',
          d.paymentMethod || '-',
          d.itemDescription || '-',
          d.receivedBy || '-'
        ];
      });
    } 
    else if (reportId === 'children_active' || reportId === 'children_all') {
      const qs = await getDocs(query(collection(db, 'children')));
      let docs = qs.docs.map(d => d.data());
      
      if (reportId === 'children_active') {
        docs = docs.filter(d => d.status === 'active');
      }

      headers = ['Date Admission', 'Nom', 'Prénom', 'Sexe', 'Naissance', 'Statut', 'Classe', 'Statut Parents'];
      rows = docs.sort((a,b) => b.createdAt - a.createdAt).map(d => [
        new Date(d.createdAt).toLocaleDateString(),
        d.lastName || '',
        d.firstName || '',
        d.gender === 'M' ? 'Garçon' : 'Fille',
        d.dateOfBirth || '',
        d.status === 'active' ? 'Interne' : (d.status === 'adopted' ? 'Adopté' : 'Transféré'),
        d.schoolClass || '',
        d.parentsStatus === 'alive' ? 'Vivants' : d.parentsStatus === 'deceased' ? 'Décédés' : d.parentsStatus === 'father_only' ? 'Père uniquement' : d.parentsStatus === 'mother_only' ? 'Mère uniquement' : 'Inconnus'
      ]);
    }

    return { headers, rows };
  };

  const handleExport = async (format: string, reportId: string, title: string) => {
    setIsExporting(true);
    try {
      const { headers, rows } = await generateData(reportId);
      
      if (format === 'excel') {
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // BOM for excel
        csvContent += headers.join(';') + "\r\n";
        rows.forEach(rowArray => {
          let row = rowArray.map(item => `"${String(item).replace(/"/g, '""')}"`).join(';');
          csvContent += row + "\r\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${title.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (format === 'pdf') {
        // Create printable window
        const printWindow = window.open('', '', 'height=600,width=800');
        if (!printWindow) return;
        
        let html = `
          <html><head><title>${title}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #333; }
            h1 { color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
            p { color: #64748b; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
            th { background-color: #f8fafc; color: #475569; font-weight: bold; }
            tr:nth-child(even) { background-color: #f1f5f9; }
          </style>
          </head><body>
          <h1>${title} - Gest-Ekabana</h1>
          <p>Date de génération: ${new Date().toLocaleString()}</p>
          <table>
            <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
            <tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
          </table>
          <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
          </body></html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
      }
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la génération du rapport.");
    } finally {
      setIsExporting(false);
    }
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
           <h1 className="text-xl font-bold tracking-tight text-slate-900">
             Reporting & PDF 
             {isExporting && <span className="ml-3 text-[12px] font-normal text-blue-600 bg-blue-50 px-2 py-1 rounded-full animate-pulse">Génération en cours...</span>}
           </h1>
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
                onClick={() => handleExport('pdf', report.id, report.title)}
                disabled={isExporting}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-[12px] font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-[6px] transition-colors focus:ring-2 focus:ring-red-500/20 outline-none disabled:opacity-50"
               >
                 <Download className="w-4 h-4" />
                 PDF
               </button>
               <button 
                onClick={() => handleExport('excel', report.id, report.title)}
                disabled={isExporting}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-[12px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-[6px] transition-colors focus:ring-2 focus:ring-emerald-500/20 outline-none disabled:opacity-50"
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
