import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { collection, onSnapshot, query, setDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { Plus, Search, User as UserIcon } from 'lucide-react';

export function ChildrenList() {
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'M',
    status: 'active'
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
        createdBy: auth.currentUser.uid,
        createdAt: Date.now()
      });
      setShowAddModal(false);
      setFormData({ firstName: '', lastName: '', dateOfBirth: '', gender: 'M', status: 'active' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'children');
    }
  };

  const filteredChildren = children.filter(c => 
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Enfants</h1>
          <p className="text-[13px] text-slate-500">Gérez le registre des enfants de l'orphelinat.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-[4px] text-[12px] font-semibold hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Ajouter un enfant
        </button>
      </div>

      <div className="bg-white rounded-[6px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Registre Récent des Enfants</div>
          <div className="relative w-[240px]">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom..."
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-[4px] text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left bg-white text-[12px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[12px]">
              <tr>
                <th className="px-4 py-2.5">ID</th>
                <th className="px-4 py-2.5">Nom Complet</th>
                <th className="px-4 py-2.5">Âge / Date de naissance</th>
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
                      <div className="text-[11px] text-slate-500">{child.gender === 'M' ? 'Garçon' : 'Fille'}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {new Date(child.dateOfBirth).toLocaleDateString()}
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

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Nouveau Dossier Enfant</h2>
            </div>
            <form onSubmit={handleAddChild} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                  <input required type="text" className="w-full border-gray-300 rounded-md border p-2 text-sm focus:ring-blue-500 focus:border-blue-500" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input required type="text" className="w-full border-gray-300 rounded-md border p-2 text-sm focus:ring-blue-500 focus:border-blue-500" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sexe</label>
                  <select className="w-full border-gray-300 rounded-md border p-2 text-sm focus:ring-blue-500 focus:border-blue-500" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                    <option value="M">Garçon</option>
                    <option value="F">Fille</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                  <input required type="date" className="w-full border-gray-300 rounded-md border p-2 text-sm focus:ring-blue-500 focus:border-blue-500" value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Annuler
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
