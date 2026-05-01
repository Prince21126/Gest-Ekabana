import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { collection, onSnapshot, query, setDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { Plus, Search, User as UserIcon, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function ChildrenList() {
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Form state
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

  useEffect(() => {
    const qChildren = query(collection(db, 'children'));
    const unsubscribe = onSnapshot(qChildren, (snapshot) => {
      const kids = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChildren(kids);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'children'));

    return () => unsubscribe();
  }, []);

  const handleAddChild = async (e: FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    try {
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
        createdBy: auth.currentUser.uid,
        createdAt: Date.now()
      });
      setShowAddModal(false);
      setFormData({ firstName: '', lastName: '', dateOfBirth: '', gender: 'M', status: 'active', schoolClass: '', fatherName: '', motherName: '', parentsStatus: 'alive', medicalNotes: '', socialNotes: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'children');
    }
  };

  const calculateAge = (dobString: string) => {
    if (!dobString) return 'N/A';
    const dob = new Date(dobString);
    const diff_ms = Date.now() - dob.getTime();
    const age_dt = new Date(diff_ms); 
    return Math.abs(age_dt.getUTCFullYear() - 1970);
  };

  const filteredChildren = children.filter(c => {
    const matchName = `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filterType === 'all' ? true : 
                        filterType === 'boys' ? c.gender === 'M' :
                        filterType === 'girls' ? c.gender === 'F' :
                        filterType === 'active' ? c.status === 'active' : true;
    return matchName && matchFilter;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
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

      <div className="bg-white rounded-[6px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 bg-slate-50/30">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Registre Récent des Enfants</div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
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
            
            <div className="relative shrink-0">
              <select 
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="appearance-none bg-white border border-slate-200 rounded-[6px] pl-8 pr-8 py-2 text-[13px] font-medium text-slate-700 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
              >
                <option value="all">Tous les enfants</option>
                <option value="active">Actifs (Internes)</option>
                <option value="boys">Garçons</option>
                <option value="girls">Filles</option>
              </select>
              <Filter className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left bg-white text-[12px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[12px]">
              <tr>
                <th className="px-4 py-2.5">ID</th>
                <th className="px-4 py-2.5">Nom Complet</th>
                <th className="px-4 py-2.5">Âge</th>
                <th className="px-4 py-2.5">Statut</th>
                <th className="px-4 py-2.5">Date d'admission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-[13px]">Chargement...</td></tr>
              ) : filteredChildren.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-[13px]">Aucun enfant trouvé.</td></tr>
              ) : (
                filteredChildren.map(child => (
                  <tr key={child.id} className="hover:bg-slate-50 transition cursor-pointer">
                    <td className="px-4 py-3 font-mono font-medium text-slate-700">#{child.id.substring(0, 6).toUpperCase()}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{child.firstName} {child.lastName}</div>
                      <div className="text-[11px] text-slate-500">{child.gender === 'M' ? 'Garçon' : 'Fille'} {child.schoolClass ? `• ${child.schoolClass}` : ''}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {calculateAge(child.dateOfBirth)} ans
                    </td>
                    <td className="px-4 py-3">
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
              <h2 className="text-xl font-bold text-slate-900">Créer un Dossier Enfant</h2>
              <p className="text-[13px] text-slate-600 mt-1">Veuillez renseigner toutes les informations de l'enfant ci-dessous (tous les champs sont obligatoires).</p>
            </div>
            <form onSubmit={handleAddChild} className="p-7 space-y-8 text-[13px] bg-white">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 tracking-wide uppercase mb-1.5">Scolarité (Classe)<span className="text-red-500 ml-1">*</span></label>
                    <input required type="text" placeholder="ex: Primaire 4" className="w-full border-slate-300 rounded-[6px] border px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow bg-slate-50 hover:bg-slate-100 focus:bg-white" value={formData.schoolClass} onChange={e => setFormData({...formData, schoolClass: e.target.value})} />
                  </div>
                </div>

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

              <div className="pt-5 mt-5 flex justify-end gap-3 border-t border-slate-100 bg-slate-50/50 -mx-7 -mb-7 p-5 rounded-b-[12px]">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-[13px] font-bold text-slate-700 bg-white border border-slate-300 rounded-[6px] hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all shadow-sm">
                  Annuler
                </button>
                <button type="submit" className="px-7 py-2.5 text-[13px] font-bold text-white bg-blue-600 border border-transparent rounded-[6px] shadow-sm hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all">
                  Enregistrer ce dossier
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      </AnimatePresence>
    </motion.div>
  );
}
