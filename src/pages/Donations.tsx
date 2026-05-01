import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { collection, onSnapshot, query, setDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { Plus, Search, HeartHandshake, DollarSign, Package } from 'lucide-react';

export function Donations() {
  const [donations, setDonations] = useState<any[]>([]);
  const [donors, setDonors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    donorName: '', // Simulating either select existing or create new for UX speed
    type: 'money',
    amount: '',
    itemDescription: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const qDonations = query(collection(db, 'donations'));
    const unsubscribeDonations = onSnapshot(qDonations, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDonations(docs.sort((a: any, b: any) => b.createdAt - a.createdAt));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'donations'));

    const qDonors = query(collection(db, 'donors'));
    const unsubscribeDonors = onSnapshot(qDonors, (snapshot) => {
      setDonors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'donors'));

    return () => {
      unsubscribeDonations();
      unsubscribeDonors();
    };
  }, []);

  const handleAddDonation = async (e: FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    try {
      // Very basic donor resolution for the demo
      let donorId = donors.find(d => d.name.toLowerCase() === formData.donorName.toLowerCase())?.id;
      if (!donorId) {
        donorId = doc(collection(db, 'donors')).id;
        await setDoc(doc(db, 'donors', donorId), {
          name: formData.donorName,
          createdAt: Date.now()
        });
      }

      const newId = doc(collection(db, 'donations')).id;
      await setDoc(doc(db, 'donations', newId), {
        donorId,
        type: formData.type,
        amount: formData.type === 'money' ? parseFloat(formData.amount) : 0,
        itemDescription: formData.type === 'in_kind' ? formData.itemDescription : '',
        date: formData.date,
        recordedBy: auth.currentUser.uid,
        createdAt: Date.now()
      });
      setShowAddModal(false);
      setFormData({ donorName: '', type: 'money', amount: '', itemDescription: '', date: new Date().toISOString().split('T')[0] });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'donations');
    }
  };

  const getDonorName = (id: string) => {
    const donor = donors.find(d => d.id === id);
    return donor ? donor.name : 'Inconnu';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Dons et Financements</h1>
          <p className="text-[13px] text-slate-500">Gérez les entrées de fonds et dons en nature.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-[4px] text-[12px] font-semibold hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" />
          Enregistrer un don
        </button>
      </div>

      <div className="bg-white rounded-[6px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Flux des Dons Entrants</div>
          <div className="relative w-[240px]">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrer..."
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-[4px] text-[13px] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left bg-white text-[12px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[12px]">
              <tr>
                <th className="px-4 py-2.5">Donateur</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Détails (Montant / Description)</th>
                <th className="px-4 py-2.5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500 text-[13px]">Chargement...</td></tr>
              ) : donations.length === 0 ? (
                 <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500 text-[13px]">Aucun don enregistré.</td></tr>
              ) : (
                donations.map(don => (
                  <tr key={don.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {getDonorName(don.donorId)}
                    </td>
                    <td className="px-4 py-3">
                      {don.type === 'money' ? (
                         <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-100 text-emerald-800">
                           Espèces
                         </span>
                      ) : (
                         <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-blue-100 text-blue-800">
                           Nature
                         </span>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-slate-700 ${don.type === 'money' ? 'font-mono font-medium' : ''}`}>
                      {don.type === 'money' ? `$${parseFloat(don.amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : don.itemDescription}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(don.date).toLocaleDateString()}
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
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100 flex items-center gap-2 text-emerald-600">
              <HeartHandshake className="w-6 h-6" />
              <h2 className="text-xl font-bold text-gray-900">Enregistrer un Don</h2>
            </div>
            <form onSubmit={handleAddDonation} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du donateur</label>
                <input required type="text" className="w-full border-gray-300 rounded-md border p-2 text-sm focus:ring-emerald-500 focus:border-emerald-500" value={formData.donorName} onChange={e => setFormData({...formData, donorName: e.target.value})} placeholder="Recherché ou créé automatiquement" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type de don</label>
                  <select className="w-full border-gray-300 rounded-md border p-2 text-sm focus:ring-emerald-500 focus:border-emerald-500" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="money">Financier ($)</option>
                    <option value="in_kind">En nature</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input required type="date" className="w-full border-gray-300 rounded-md border p-2 text-sm focus:ring-emerald-500 focus:border-emerald-500" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
              </div>

               {formData.type === 'money' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Montant (USD)</label>
                    <input required type="number" step="0.01" min="0" className="w-full border-gray-300 rounded-md border p-2 text-sm focus:ring-emerald-500 focus:border-emerald-500" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                  </div>
               ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (Nature du don)</label>
                    <textarea required className="w-full border-gray-300 rounded-md border p-2 text-sm focus:ring-emerald-500 focus:border-emerald-500" value={formData.itemDescription} onChange={e => setFormData({...formData, itemDescription: e.target.value})} rows={3}></textarea>
                  </div>
               )}

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">
                  Annuler
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">
                  Valider le don
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
