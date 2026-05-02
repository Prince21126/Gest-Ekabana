import { FileText, Download, PieChart, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Composant gérant la génération de rapports de données
export function Reports() {
  // Seul le directeur a accès à cette page (protection supplémentaire via Layout)
  const { role } = useAuth();
  
  // Indique si le code est actuellement entrain de travailler pour assembler et exporter un document
  const [isExporting, setIsExporting] = useState(false);

  // Sécurité: Forcer la redirection des requêtes inattendues hors directeur
  if (role !== 'director') {
    return <Navigate to="/" />;
  }

  // Tableau statique listant les différents types de rapports que l'on peut générer et l'interface visuelle des cartes (design object)
  const reports = [
    {
      id: "donations",
      title: "Rapport Mensuel des Dons",
      description: "Aperçu complet des dons financiers et matériels reçus.",
      icon: PieChart,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
      animation: "group-hover:scale-110 group-hover:rotate-[360deg] transition-all duration-700 ease-in-out" // Animation tourbillonnante
    },
    {
      id: "children_active",
      title: "Registre des Enfants Actifs",
      description: "Liste de tous les enfants actuellement pris en charge par l'orphelinat.",
      icon: FileSpreadsheet,
      color: "text-sky-500",
      bg: "bg-sky-50",
      animation: "group-hover:-translate-y-1.5 group-hover:scale-110 transition-all duration-300" // Animation saut et grossissement
    },
    {
      id: "children_all",
      title: "Historique des Mouvements",
      description: "Admissions, adoptions et transferts effectués dans l'orphelinat.",
      icon: FileText,
      color: "text-purple-500",
      bg: "bg-purple-50",
      animation: "group-hover:translate-x-1 transition-all duration-300" // Glissement horizontal
    }
  ];

  /* 
   * Fonction asynchrone clé "generateData"
   * Interroge Firestore de façon ciblée une fois un document cliqué, et transforme
   * les collections JSON en matrice Array<Array>(Lignes Excel ou Ligne de Tableau html).
   */
  const generateData = async (reportId: string): Promise<{headers: string[], rows: any[][]}> => {
    let headers: string[] = []; // Colonnes du tables
    let rows: any[][] = []; // Le lignes de données matricées

    // Génération du tableau des dons
    if (reportId === 'donations') {
      // 1. Récupération des dons et des donateurs (jointure client-side)
      const qs = await getDocs(query(collection(db, 'donations')));
      const docs = qs.docs.map(d => d.data());
      
      const donorsQs = await getDocs(query(collection(db, 'donors')));
      const donors = donorsQs.docs.map(d => ({id: d.id, ...(d.data() as any)}));
      
      // 2. Définir les en-têtes du rapport des dons
      headers = ['Date', 'Donateur', 'Type', 'Montant', 'Devise', 'Methode', 'Description', 'Reçu Par'];
      
      // 3. Mettre en forme visuelle la requête et trier
      rows = docs.sort((a,b) => b.createdAt - a.createdAt).map(d => {
        // Obtenir le vrai nom du donateur ou inconnu (Left Join)
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
    // Génération des tableaux relatifs aux registres d'enfants (soit Actifs, soit Tout historique)
    else if (reportId === 'children_active' || reportId === 'children_all') {
      // 1. Requeter Firestore pour avoir la liste
      const qs = await getDocs(query(collection(db, 'children')));
      let docs = qs.docs.map(d => d.data());
      
      // 2. Si c'est seulement les enfants internes (actives), filter localement le JSON récupéré
      if (reportId === 'children_active') {
        docs = docs.filter(d => d.status === 'active');
      }

      // 3. Spécifier les en-têtes
      headers = ['Date Admission', 'Nom', 'Prénom', 'Sexe', 'Naissance', 'Statut', 'Classe', 'Statut Parents'];
      
      // 4. Mapper en rows
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

    return { headers, rows }; // on renvoie le pack de config du document
  };

  /*
   * Gestionnaire pour traiter l'export en convertissant en CSV local et téléchargement (Excel), ou PDF formaté HTML 
   */
  const handleExport = async (format: string, reportId: string, title: string) => {
    setIsExporting(true); // Verrouiller les clics pendant la génération
    try {
      // Lancer la fabrique de données matricée qui extrait Firestore
      const { headers, rows } = await generateData(reportId);
      
      // LOGIQUE POUR EXCEL (Génère un CSV encodé format excel .csv)
      if (format === 'excel') {
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // Ajout du BOM BOM pour Excel sinon caractères spéciaux (é, etc) buggent
        
        // Applatir Header \r\n (new line csv)
        csvContent += headers.join(';') + "\r\n";
        
        // Itération sur le format row csv (séparation ;)
        rows.forEach(rowArray => {
          let row = rowArray.map(item => `"${String(item).replace(/"/g, '""')}"`).join(';');
          csvContent += row + "\r\n";
        });

        // Encoder, forcer le téléchargement sur le navigateur du client
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${title.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } 
      // LOGIQUE POUR PDF
      else if (format === 'pdf') {
        const doc = new jsPDF();
        
        doc.setFontSize(16);
        doc.text(`${title} - Gest-Ekabana`, 14, 15);
        doc.setFontSize(10);
        doc.text(`Date de génération: ${new Date().toLocaleString()}`, 14, 22);

        autoTable(doc, {
          head: [headers],
          body: rows,
          startY: 30,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [51, 65, 85] },
        });

        doc.save(`${title.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      }
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la génération du rapport.");
    } finally {
      // Déverouiller la page
      setIsExporting(false);
    }
  };

  return (
    // Cadre global : gère lui-même son fade in (entrée depuis bas vers le haut)
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* En-Tete */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h1 className="text-xl font-bold tracking-tight text-slate-900">
             Reporting & PDF 
             {/* Affiche un petit pill bleu pulsant si une tache de téléchargement longue en local est cours */}
             {isExporting && <span className="ml-3 text-[12px] font-normal text-blue-600 bg-blue-50 px-2 py-1 rounded-full animate-pulse">Génération en cours...</span>}
           </h1>
          <p className="text-[13px] text-slate-500">Générez des rapports pdf ou excel pour les partenaires et réunions.</p>
        </div>
      </div>

      {/* Grid contenant tous les documents téléchargeables. (Généré dynamiquement map du tableau "reports") */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reports.map((report, idx) => (
          // Conteneur de document. Ajoute un effet Stagger : entre un par un (delay en cascade) 
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 + 0.1, duration: 0.4 }} // Cascade basée sur index
            key={idx} 
            className="group bg-white rounded-[12px] border border-slate-200 shadow-sm p-6 flex flex-col hover:shadow-md transition-all duration-300 hover:border-slate-300"
          >
            {/* Icône du rapport */}
            <div className={`w-12 h-12 rounded-[8px] ${report.bg} flex items-center justify-center mb-4 transition-colors`}>
              <report.icon className={`w-6 h-6 ${report.color} ${report.animation}`} />
            </div>
            
            {/* Textes Descriptions rapport */}
            <h3 className="text-[15px] font-bold text-slate-900 mb-2">{report.title}</h3>
            <p className="text-slate-500 text-[13px] flex-1 mb-6 leading-relaxed">{report.description}</p>
            
            {/* Boutons d'exportations du rapport visé */}
            <div className="flex items-center gap-3 mt-auto">
               <button 
                onClick={() => handleExport('pdf', report.id, report.title)}
                disabled={isExporting} // Grisé si un autre télécharge (eviter surcharge mémoire)
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-[12px] font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-[6px] transition-colors focus:ring-2 focus:ring-red-500/20 outline-none disabled:opacity-50"
               >
                 <Download className="w-4 h-4" />
                 PDF
               </button>
               <button 
                onClick={() => handleExport('excel', report.id, report.title)}
                disabled={isExporting} // Grisé si un autre télécharge
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
