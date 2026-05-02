import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { collection, onSnapshot, query, setDoc, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { Plus, Search, User as UserIcon, Filter, Edit2, X, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Composant gérant la liste des enfants (affichage, ajout, modification et détails)
export function ChildrenList() {
  // États de la liste de données et de l'interface
  const [children, setChildren] = useState<any[]>([]); // Liste des enfants
  const [loading, setLoading] = useState(true); // Indicateur de chargement
  const [showAddModal, setShowAddModal] = useState(false); // État Modal "Ajout/Modification"
  const [editingChildId, setEditingChildId] = useState<string | null>(null); // Stocke l'ID à modifier, null si c'est un ajout
  const [viewingChild, setViewingChild] = useState<any | null>(null); // Stocke l'enfant pour la vue détaillée (Modal "Détails")
  
  // États pour les filtres et recherche
  const [searchTerm, setSearchTerm] = useState(''); // Terme de la barre de recherche
  const [statusFilter, setStatusFilter] = useState('all'); // Type de filtrage actif
  const [genderFilter, setGenderFilter] = useState('all'); 
  const [parentsFilter, setParentsFilter] = useState('all'); 

  // État local pour gérer tous les champs du formulaire d'un enfant
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'M',
    status: 'active',
    schoolClass: '',
    fatherName: '',
    motherName: '',
    parentsStatus: 'alive',
    medicalNotes: '',
    socialNotes: ''
  });

  // Abonnement aux données en temps réel depuis Firebase/Firestore
  useEffect(() => {
    const qChildren = query(collection(db, 'children'));
    const unsubscribe = onSnapshot(qChildren, (snapshot) => {
      const kids = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChildren(kids); // On met à jour l'état local avec la nouvelle liste
      setLoading(false); // Fin du chargement
    }, (error) => handleFirestoreError(error, OperationType.GET, 'children'));

    // Lors du démontage de la page, on se désabonne de Firebase
    return () => unsubscribe();
  }, []);

  // Fonction pour soumettre le formulaire (Ajout OU Modification)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); // Empêcher la soumission classique du formulaire
    if (!auth.currentUser) return; // Sécurité : aucun envoi non authentifié
    
    try {
      if (editingChildId) {
        // En cas de modification : on met à jour le document sélectionné
        await updateDoc(doc(db, 'children', editingChildId), {
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          status: formData.status,
          schoolClass: formData.schoolClass,
          fatherName: formData.fatherName,
          motherName: formData.motherName,
          parentsStatus: formData.parentsStatus,
          medicalNotes: formData.medicalNotes,
          socialNotes: formData.socialNotes,
          updatedAt: Date.now() // Timestamps d'update
        });
      } else {
        // En cas de création : on génère un nouvel ID document et on le remplit
        const newId = doc(collection(db, 'children')).id;
        await setDoc(doc(db, 'children', newId), {
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          status: formData.status,
          schoolClass: formData.schoolClass,
          fatherName: formData.fatherName,
          motherName: formData.motherName,
          parentsStatus: formData.parentsStatus,
          medicalNotes: formData.medicalNotes,
          socialNotes: formData.socialNotes,
          createdBy: auth.currentUser.uid, // Qui a créé ceci
          createdAt: Date.now() // Timestamp de création
        });
      }
      closeModal(); // On ferme le modal après une sauvegarde réussie
    } catch (error) {
      // Gestion centralisée des erreurs de Base de Données
      handleFirestoreError(error, editingChildId ? OperationType.UPDATE : OperationType.CREATE, 'children');
    }
  };

  // Fermer proprement les fenêtres de formulaire et nettoyer les variables temporaires
  const closeModal = () => {
    setShowAddModal(false);
    setEditingChildId(null);
    setFormData({ firstName: '', lastName: '', dateOfBirth: '', gender: 'M', status: 'active', schoolClass: '', fatherName: '', motherName: '', parentsStatus: 'alive', medicalNotes: '', socialNotes: '' });
  };

  // Préparer la fenêtre d'édition avec les données de l'enfant sélectionné
  const openEditModal = (child: any) => {
    setFormData({
      firstName: child.firstName || '',
      lastName: child.lastName || '',
      dateOfBirth: child.dateOfBirth || '',
      gender: child.gender || 'M',
      status: child.status || 'active',
      schoolClass: child.schoolClass || '',
      fatherName: child.fatherName || '',
      motherName: child.motherName || '',
      parentsStatus: child.parentsStatus || 'alive',
      medicalNotes: child.medicalNotes || '',
      socialNotes: child.socialNotes || ''
    });
    setEditingChildId(child.id);
    setShowAddModal(true); // Ouvre le formulaire
  };

  // Calcul mathématique de l'âge d'un enfant en fonction de sa date de naissance
  const calculateAge = (dobString: string) => {
    if (!dobString) return 'N/A';
    const dob = new Date(dobString);
    const diff_ms = Date.now() - dob.getTime();
    const age_dt = new Date(diff_ms); 
    return Math.abs(age_dt.getUTCFullYear() - 1970);
  };

  // Fonction de filtre qui calcule quels enfants afficher en fonction de la barre de recherche
  // et du système de tri (sexe ou statut actif/inactif)
  const filteredChildren = children.filter(c => {
    const matchName = `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchGender = genderFilter === 'all' || c.gender === genderFilter;
    const matchParents = parentsFilter === 'all' || c.parentsStatus === parentsFilter;
    
    return matchName && matchStatus && matchGender && matchParents;
  });

  return (
    // Conteneur principal avec animation d'apparition
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* En-tête : Titre et bouton d'ajout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Enfants</h1>
          <p className="text-[13px] text-slate-500">Gérez le registre des enfants de l'orphelinat.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-[6px] text-[12px] font-bold hover:bg-blue-700 hover:shadow-md transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Ajouter un enfant
        </button>
      </div>

      {/* Conteneur de la liste et des filtres */}
      <div className="bg-white rounded-[6px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Barre de recherche et filtres */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 bg-slate-50/30">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Registre Récent des Enfants</div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Champ de recherche */}
            <div className="flex items-center bg-white border border-slate-200 rounded-[6px] pl-2 pr-1 py-1 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all w-full sm:w-[240px]">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Rechercher par nom..."
                className="w-full px-2 py-1 text-[13px] focus:outline-none bg-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Menus déroulants des filtres multiples */}
            <div className="flex flex-wrap gap-2 shrink-0">
              <div className="relative">
                <select 
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 rounded-[6px] pl-8 pr-8 py-2 text-[13px] font-medium text-slate-700 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                >
                  <option value="all">Tous (Statut)</option>
                  <option value="active">Actifs (Internes)</option>
                  <option value="adopted">Adoptés</option>
                  <option value="transferred">Transférés</option>
                </select>
                <Filter className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>

              <div className="relative">
                <select 
                  value={genderFilter}
                  onChange={e => setGenderFilter(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 rounded-[6px] pl-3 pr-8 py-2 text-[13px] font-medium text-slate-700 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                >
                  <option value="all">Tous (Sexe)</option>
                  <option value="M">Garçons</option>
                  <option value="F">Filles</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>

              <div className="relative hidden sm:block">
                <select 
                  value={parentsFilter}
                  onChange={e => setParentsFilter(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 rounded-[6px] pl-3 pr-8 py-2 text-[13px] font-medium text-slate-700 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer w-32 truncate"
                >
                  <option value="all">Tous (Parents)</option>
                  <option value="alive">Vivants</option>
                  <option value="deceased">Décédés</option>
                  <option value="father_only">Père uni.</option>
                  <option value="mother_only">Mère uni.</option>
                  <option value="unknown">Inconnus</option>
                  <option value="other">Tuteur</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tableau affichant la liste des enfants */}
        <div className="overflow-x-auto">
          <table className="w-full text-left bg-white text-[12px]">
            {/* Entêtes du tableau */}
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[12px]">
              <tr>
                <th className="px-4 py-2.5">ID</th>
                <th className="px-4 py-2.5">Nom Complet</th>
                <th className="px-4 py-2.5">Âge</th>
                <th className="px-4 py-2.5">Statut</th>
                <th className="px-4 py-2.5">Date d'admission</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            {/* Corps du tableau */}
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                // État de chargement
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-[13px]">Chargement...</td></tr>
              ) : filteredChildren.length === 0 ? (
                // Aucun résultat trouvé suite au filtrage ou si la base de données est vide
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-[13px]">Aucun enfant trouvé.</td></tr>
              ) : (
                // Boucle sur les enfants filtrés
                filteredChildren.map(child => (
                  <tr key={child.id} onClick={() => setViewingChild(child)} className="hover:bg-slate-50 transition cursor-pointer">
                    <td className="px-4 py-3 font-mono font-medium text-slate-700">#{child.id.substring(0, 6).toUpperCase()}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{child.firstName} {child.lastName}</div>
                      <div className="text-[11px] text-slate-500">{child.gender === 'M' ? 'Garçon' : 'Fille'} {child.schoolClass ? `• ${child.schoolClass}` : ''}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {calculateAge(child.dateOfBirth)} ans
                    </td>
                    <td className="px-4 py-3">
                      {/* Affichages dynamiques des "badges" de couleurs en fonction du statut de l'enfant */}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        child.status === 'active' ? 'bg-blue-100 text-blue-800' :
                        child.status === 'adopted' ? 'bg-green-100 text-green-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {child.status === 'active' ? 'Interne' : child.status === 'adopted' ? 'Adopté' : 'Transféré'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {new Date(child.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {/* Bouton pour modifier le dossier de l'enfant, e.stopPropagation empêche l'ouverture du modal de détail */}
                      <button onClick={(e) => { e.stopPropagation(); openEditModal(child); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-[4px] transition">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal d'Ajout ou de Modification avec animations entrantes/sortantes */}
      <AnimatePresence>
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-[12px] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 rounded-t-[12px]">
              {/* Le titre change selon si on édite un enfant existant ou si on en crée un nouveau */}
              <h2 className="text-xl font-bold text-slate-900">{editingChildId ? "Modifier le Dossier" : "Créer un Dossier Enfant"}</h2>
              <p className="text-[13px] text-slate-600 mt-1">Veuillez renseigner toutes les informations de l'enfant ci-dessous (tous les champs sont obligatoires).</p>
            </div>
            
            {/* Formulaire contenant les détails de l'enfant */}
            <form onSubmit={handleSubmit} className="p-7 space-y-8 text-[13px] bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Section : Identité */}
                <div className="space-y-4">
                  <h3 className="font-bold text-[14px] text-slate-800 border-b border-slate-200 pb-2">Identité</h3>
                  
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[12px] font-semibold text-slate-700 tracking-wide uppercase mb-1.5">Prénom<span className="text-red-500 ml-1">*</span></label>
                      <input required type="text" className="w-full border-slate-300 rounded-[6px] border px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow bg-slate-50 hover:bg-slate-100 focus:bg-white" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-slate-700 tracking-wide uppercase mb-1.5">Nom<span className="text-red-500 ml-1">*</span></label>
                      <input required type="text" className="w-full border-slate-300 rounded-[6px] border px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow bg-slate-50 hover:bg-slate-100 focus:bg-white" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[12px] font-semibold text-slate-700 tracking-wide uppercase mb-1.5">Sexe<span className="text-red-500 ml-1">*</span></label>
                      <select required className="w-full border-slate-300 rounded-[6px] border px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 hover:bg-slate-100 focus:bg-white transition-shadow" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                        <option value="M">Garçon</option>
                        <option value="F">Fille</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-slate-700 tracking-wide uppercase mb-1.5">Date de naissance<span className="text-red-500 ml-1">*</span></label>
                      <input required type="date" className="w-full border-slate-300 rounded-[6px] border px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow bg-slate-50 hover:bg-slate-100 focus:bg-white" value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[12px] font-semibold text-slate-700 tracking-wide uppercase mb-1.5">Scolarité (Classe)<span className="text-red-500 ml-1">*</span></label>
                      <input required type="text" placeholder="ex: Primaire 4" className="w-full border-slate-300 rounded-[6px] border px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow bg-slate-50 hover:bg-slate-100 focus:bg-white" value={formData.schoolClass} onChange={e => setFormData({...formData, schoolClass: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-slate-700 tracking-wide uppercase mb-1.5">Statut de l'enfant<span className="text-red-500 ml-1">*</span></label>
                      <select required className="w-full border-slate-300 rounded-[6px] border px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 hover:bg-slate-100 focus:bg-white transition-shadow" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                        <option value="active">Actif (Interne)</option>
                        <option value="adopted">Adopté</option>
                        <option value="transferred">Transféré</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section : Informations Familiales */}
                <div className="space-y-5">
                  <h3 className="font-bold text-[14px] text-slate-800 border-b border-slate-200 pb-2">Informations Familiales</h3>
                  
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 tracking-wide uppercase mb-1.5">Statut des Parents<span className="text-red-500 ml-1">*</span></label>
                    <select required className="w-full border-slate-300 rounded-[6px] border px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 hover:bg-slate-100 focus:bg-white transition-shadow" value={formData.parentsStatus} onChange={e => setFormData({...formData, parentsStatus: e.target.value})}>
                      <option value="alive">Vivants</option>
                      <option value="father_only">Père uniquement (en vie)</option>
                      <option value="mother_only">Mère uniquement (en vie)</option>
                      <option value="deceased">Décédés</option>
                      <option value="unknown">Inconnus</option>
                      <option value="other">Autre / Géré par un tuteur</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[12px] font-semibold text-slate-700 tracking-wide uppercase mb-1.5">Nom du Père<span className="text-red-500 ml-1">*</span></label>
                      <input required type="text" placeholder="Non connu = Inconnu" className="w-full border-slate-300 rounded-[6px] border px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow bg-slate-50 hover:bg-slate-100 focus:bg-white" value={formData.fatherName} onChange={e => setFormData({...formData, fatherName: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-slate-700 tracking-wide uppercase mb-1.5">Nom de la Mère<span className="text-red-500 ml-1">*</span></label>
                      <input required type="text" placeholder="Non connu = Inconnu" className="w-full border-slate-300 rounded-[6px] border px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow bg-slate-50 hover:bg-slate-100 focus:bg-white" value={formData.motherName} onChange={e => setFormData({...formData, motherName: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section : Observations Médicales et Sociales */}
              <div className="space-y-5">
                <h3 className="font-bold text-[14px] text-slate-800 border-b border-slate-200 pb-2">Observations (Médicales et Sociales)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 tracking-wide uppercase mb-1.5">Informations Médicales<span className="text-red-500 ml-1">*</span></label>
                    <textarea required placeholder="Allergies, vaccins, etc. (Obligatoire)" rows={3} className="w-full border-slate-300 rounded-[6px] border px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow bg-slate-50 hover:bg-slate-100 focus:bg-white resize-none" value={formData.medicalNotes} onChange={e => setFormData({...formData, medicalNotes: e.target.value})}></textarea>
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 tracking-wide uppercase mb-1.5">Notes Sociales<span className="text-red-500 ml-1">*</span></label>
                    <textarea required placeholder="Historique de l'enfant (Obligatoire)" rows={3} className="w-full border-slate-300 rounded-[6px] border px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow bg-slate-50 hover:bg-slate-100 focus:bg-white resize-none" value={formData.socialNotes} onChange={e => setFormData({...formData, socialNotes: e.target.value})}></textarea>
                  </div>
                </div>
              </div>

              {/* Actions du modal (Boutons Annuler et Enregistrer) */}
              <div className="pt-5 mt-5 flex justify-end gap-3 border-t border-slate-100 bg-slate-50/50 -mx-7 -mb-7 p-5 rounded-b-[12px]">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 text-[13px] font-bold text-white bg-red-600 rounded-[6px] hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all shadow-sm">
                  Annuler
                </button>
                <button type="submit" className="px-7 py-2.5 text-[13px] font-bold text-white bg-blue-600 border border-transparent rounded-[6px] shadow-sm hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all">
                  {editingChildId ? "Valider les modifications" : "Enregistrer ce dossier"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal consultatif "Vue Détaillée de l'enfant" */}
      {viewingChild && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-[12px] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* En-tête de la vue détaillée avec Bouton fermer en forme de croix */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 rounded-t-[12px] flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{viewingChild.firstName} {viewingChild.lastName}</h2>
                <p className="text-[13px] text-slate-600 mt-1">Dossier Enfant #{viewingChild.id.substring(0, 8).toUpperCase()}</p>
              </div>
              <button onClick={() => setViewingChild(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Contenu détaillé du dossier */}
            <div className="p-7 space-y-8 text-[13px] bg-white">
              
              {/* Résumé des informations principales (carrés gris) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-[11px] text-slate-500 uppercase font-semibold mb-1">Âge</div>
                  <div className="font-medium text-slate-900">{calculateAge(viewingChild.dateOfBirth)} ans</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-[11px] text-slate-500 uppercase font-semibold mb-1">Sexe</div>
                  <div className="font-medium text-slate-900">{viewingChild.gender === 'M' ? 'Garçon' : 'Fille'}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-[11px] text-slate-500 uppercase font-semibold mb-1">Statut</div>
                  <div className="font-medium text-slate-900">
                    {viewingChild.status === 'active' ? 'Interne' : viewingChild.status === 'adopted' ? 'Adopté' : 'Transféré'}
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-[11px] text-slate-500 uppercase font-semibold mb-1">Scolarité</div>
                  <div className="font-medium text-slate-900">{viewingChild.schoolClass || 'Non scolarisé'}</div>
                </div>
              </div>

              {/* Sections d'informations détaillées */}
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-[14px] text-slate-800 border-b border-slate-200 pb-2 mb-3 mt-4">Informations Familiales</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                    <div>
                      <div className="text-slate-500 mb-1">Statut des parents</div>
                      <div className="font-medium bg-slate-50 px-3 py-2 rounded-[6px] border border-slate-100">
                        {viewingChild.parentsStatus === 'alive' ? 'Vivants' : 
                         viewingChild.parentsStatus === 'deceased' ? 'Décédés' : 
                         viewingChild.parentsStatus === 'father_only' ? 'Père uniquement (en vie)' :
                         viewingChild.parentsStatus === 'mother_only' ? 'Mère uniquement (en vie)' :
                         viewingChild.parentsStatus === 'unknown' ? 'Inconnus' : 'Autre / Tuteur'}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 mb-1">Nom du Père</div>
                      <div className="font-medium bg-slate-50 px-3 py-2 rounded-[6px] border border-slate-100">{viewingChild.fatherName || 'Inconnu'}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 mb-1">Nom de la Mère</div>
                      <div className="font-medium bg-slate-50 px-3 py-2 rounded-[6px] border border-slate-100">{viewingChild.motherName || 'Inconnu'}</div>
                    </div>
                  </div>
                </div>

                {/* Dossier médical avec mise en valeur visuelle (Rouge clair) */}
                <div>
                   <h3 className="font-bold text-[14px] text-rose-800 border-b border-rose-200 pb-2 mb-3 mt-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-rose-500" />
                      Dossier Médical Détaillé
                   </h3>
                   <div className="bg-rose-50/50 text-rose-900 p-5 rounded-[8px] border border-rose-100 whitespace-pre-wrap leading-relaxed min-h-[80px] shadow-inner font-medium">
                     {viewingChild.medicalNotes || "Aucune note médicale enregistrée. Cliquez sur Modifier pour ajouter des détails ou des antécédents."}
                   </div>
                </div>

                {/* Notes sociales */}
                <div>
                   <h3 className="font-bold text-[14px] text-slate-800 border-b border-slate-200 pb-2 mb-3 mt-4">Notes Sociales & Historique</h3>
                   <div className="bg-slate-50 text-slate-700 p-4 rounded-[6px] border border-slate-100 whitespace-pre-wrap leading-relaxed min-h-[80px]">
                     {viewingChild.socialNotes || "Aucune note sociale enregistrée."}
                   </div>
                </div>
              </div>
              
              {/* Bouton pour passer en mode édition et refermer cette fenêtre de consultation */}
              <div className="pt-5 mt-7 flex justify-end gap-3 border-t border-slate-100">
                 <button 
                   onClick={() => {
                     setViewingChild(null); // On ferme la vue actuelle
                     openEditModal(viewingChild); // On ouvre l'éditeur
                   }} 
                   className="flex items-center gap-2 px-6 py-2.5 text-[13px] font-bold text-white bg-blue-600 border border-transparent rounded-[6px] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-sm"
                 >
                   <Edit2 className="w-4 h-4" />
                   Modifier le dossier
                 </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>
    </motion.div>
  );
}
