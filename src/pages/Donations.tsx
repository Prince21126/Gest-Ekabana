import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { collection, onSnapshot, query, setDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { Plus, Search, HeartHandshake, DollarSign, Package, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function Donations() {
  const [donations, setDonations] = useState<any[]>([]);
  const [donors, setDonors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedDonor, setSelectedDonor] = useState<any | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    donorName: '', 
    donorEmail: '',
    donorPhone: '',
    donorAddress: '',
    type: 'money',
    currency: 'USD',
    amount: '',
    itemDescription: '',
    date: new Date().toISOString().split('T')[0],
    receivedBy: auth.currentUser?.displayName || auth.currentUser?.email || '',
    paymentMethod: 'cash'
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
          email: formData.donorEmail,
          phone: formData.donorPhone,
          address: formData.donorAddress,
          createdAt: Date.now()
        });
      }

      const newId = doc(collection(db, 'donations')).id;
      await setDoc(doc(db, 'donations', newId), {
        donorId,
        type: formData.type,
        currency: formData.type === 'money' ? formData.currency : null,
        amount: formData.type === 'money' ? parseFloat(formData.amount) : 0,
        itemDescription: formData.type === 'in_kind' ? formData.itemDescription : '',
        date: formData.date,
        receivedBy: formData.receivedBy,
        paymentMethod: formData.type === 'money' ? formData.paymentMethod : null,
        recordedBy: auth.currentUser.uid,
        createdAt: Date.now()
      });
      setShowAddModal(false);
      setFormData({ donorName: '', donorEmail: '', donorPhone: '', donorAddress: '', type: 'money', currency: 'USD', amount: '', itemDescription: '', date: new Date().toISOString().split('T')[0], receivedBy: auth.currentUser?.displayName || auth.currentUser?.email || '', paymentMethod: 'cash' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'donations');
    }
  };

  const getDonor = (id: string) => {
    return donors.find(d => d.id === id);
  };

  const filteredDonations = donations.filter(don => {
    const donorName = getDonor(don.donorId)?.name || 'Inconnu';
    const matchName = searchTerm === '' || 
      donorName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      don.itemDescription?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchFilter = filterType === 'all' ? true : don.type === filterType;
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
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Dons et Financements</h1>
          <p className="text-[13px] text-slate-500">Gérez les entrées de fonds et dons en nature.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-[6px] text-[12px] font-bold hover:bg-emerald-700 hover:shadow-md transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Enregistrer un don
        </button>
      </div>

      <div className="bg-white rounded-[6px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 bg-slate-50/30">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Flux des Dons Entrants</div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center bg-white border border-slate-200 rounded-[6px] pl-2 pr-1 py-1 shadow-sm focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all w-full sm:w-[240px]">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Filtrer..."
                className="w-full px-2 py-1 text-[13px] focus:outline-none bg-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative shrink-0">
              <select 
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="appearance-none bg-white border border-slate-200 rounded-[6px] pl-8 pr-8 py-2 text-[13px] font-medium text-slate-700 shadow-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
              >
                <option value="all">Tous les dons</option>
                <option value="money">Financiers</option>
                <option value="in_kind">En Nature</option>
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
                <th className="px-4 py-2.5">Donateur</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Détails (Montant / Description)</th>
                <th className="px-4 py-2.5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500 text-[13px]">Chargement...</td></tr>
              ) : filteredDonations.length === 0 ? (
                 <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500 text-[13px]">Aucun don trouvé.</td></tr>
              ) : (
                filteredDonations.map(don => (
                  <tr key={don.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {getDonor(don.donorId) ? (
                        <button
                          onClick={() => setSelectedDonor(getDonor(don.donorId))}
                          className="text-blue-600 hover:text-blue-800 hover:underline focus:outline-none transition-colors"
                        >
                          {getDonor(don.donorId).name}
                        </button>
                      ) : (
                        'Inconnu'
                      )}
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
                      {don.type === 'money' ? `${parseFloat(don.amount).toLocaleString(undefined, {minimumFractionDigits: don.currency === 'USD' ? 2 : 0, maximumFractionDigits: don.currency === 'USD' ? 2 : 0})} ${don.currency || 'USD'}` : don.itemDescription}
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

       <AnimatePresence>
       {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-[12px] shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-emerald-50/50 rounded-t-[12px] text-emerald-700 shrink-0">
               <div className="bg-emerald-100 p-2 rounded-full">
                 <HeartHandshake className="w-6 h-6" />
               </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Enregistrer un Don</h2>
                <p className="text-[13px] text-slate-600 mt-0.5">Veuillez remplir tous les champs ci-dessous.</p>
              </div>
            </div>
            <form onSubmit={handleAddDonation} className="p-7 space-y-6 text-[13px] overflow-y-auto">
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 tracking-wide uppercase mb-1.5">Nom du donateur<span className="text-red-500 ml-1">*</span></label>
                <input required type="text" className="w-full border-slate-300 rounded-[6px] border px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-shadow bg-slate-50 hover:bg-slate-100 focus:bg-white" value={formData.donorName} onChange={e => setFormData({...formData, donorName: e.target.value})} placeholder="Recherché ou créé automatiquement" />
              </div>
              
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-[8px] space-y-4">
                <p className="text-[11px] uppercase tracking-wider text-slate-600 font-bold border-b border-slate-200 pb-2">Infos Nouvel Enregistrement</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 tracking-wide mb-1.5">Email<span className="text-red-500 ml-1">*</span></label>
                    <input required type="email" placeholder="Obligatoire" className="w-full border-slate-300 rounded-[6px] border px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-shadow bg-white" value={formData.donorEmail} onChange={e => setFormData({...formData, donorEmail: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 tracking-wide mb-1.5">Téléphone<span className="text-red-500 ml-1">*</span></label>
                    <input required type="text" placeholder="Obligatoire" className="w-full border-slate-300 rounded-[6px] border px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-shadow bg-white" value={formData.donorPhone} onChange={e => setFormData({...formData, donorPhone: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 tracking-wide mb-1.5">Adresse Complète<span className="text-red-500 ml-1">*</span></label>
                  <input required type="text" placeholder="Obligatoire" className="w-full border-slate-300 rounded-[6px] border px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-shadow bg-white" value={formData.donorAddress} onChange={e => setFormData({...formData, donorAddress: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 tracking-wide uppercase mb-1.5">Type de don<span className="text-red-500 ml-1">*</span></label>
                  <select required className="w-full border-slate-300 rounded-[6px] border px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-shadow bg-slate-50 hover:bg-slate-100 focus:bg-white" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="money">Financier ($)</option>
                    <option value="in_kind">En nature</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 tracking-wide uppercase mb-1.5">Date<span className="text-red-500 ml-1">*</span></label>
                  <input required type="date" className="w-full border-slate-300 rounded-[6px] border px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-shadow bg-slate-50 hover:bg-slate-100 focus:bg-white" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
              </div>

               {formData.type === 'money' ? (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[12px] font-semibold text-slate-700 tracking-wide uppercase mb-1.5">Devise<span className="text-red-500 ml-1">*</span></label>
                        <select required className="w-full border-slate-300 rounded-[6px] border px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-shadow bg-slate-50 hover:bg-slate-100 focus:bg-white" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})}>
                          <option value="USD">Dollar Américain (USD)</option>
                          <option value="CDF">Franc Congolais (CDF)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[12px] font-semibold text-slate-700 tracking-wide uppercase mb-1.5">Montant<span className="text-red-500 ml-1">*</span></label>
                        <input required type="number" step="0.01" min="0" placeholder="ex: 150.00" className="w-full border-slate-300 rounded-[6px] border px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-shadow bg-slate-50 hover:bg-slate-100 focus:bg-white" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[12px] font-semibold text-slate-700 tracking-wide uppercase mb-1.5">Moyen de paiement<span className="text-red-500 ml-1">*</span></label>
                        <select required className="w-full border-slate-300 rounded-[6px] border px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-shadow bg-slate-50 hover:bg-slate-100 focus:bg-white" value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})}>
                          <option value="cash">Espèces</option>
                          <option value="mobile_money">Mobile Money (M-Pesa, Airtel...)</option>
                          <option value="bank_transfer">Virement Bancaire</option>
                          <option value="check">Chèque</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[12px] font-semibold text-slate-700 tracking-wide uppercase mb-1.5">Reçu par<span className="text-red-500 ml-1">*</span></label>
                        <input required type="text" className="w-full border-slate-300 rounded-[6px] border px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-shadow bg-slate-50 hover:bg-slate-100 focus:bg-white" value={formData.receivedBy} onChange={e => setFormData({...formData, receivedBy: e.target.value})} />
                      </div>
                    </div>
                  </div>
               ) : (
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 tracking-wide uppercase mb-1.5">Description (Nature du don)<span className="text-red-500 ml-1">*</span></label>
                    <textarea required placeholder="Décrivez le don..." className="w-full border-slate-300 rounded-[6px] border px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-shadow bg-slate-50 hover:bg-slate-100 focus:bg-white resize-none" value={formData.itemDescription} onChange={e => setFormData({...formData, itemDescription: e.target.value})} rows={3}></textarea>
                  </div>
               )}

              <div className="pt-5 flex justify-end gap-3 border-t border-slate-100 shrink-0">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-[13px] font-bold text-slate-700 bg-white border border-slate-300 rounded-[6px] hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all shadow-sm">
                  Annuler
                </button>
                <button type="submit" className="px-6 py-2.5 text-[13px] font-bold text-white bg-emerald-600 border border-transparent rounded-[6px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 hover:bg-emerald-700 hover:shadow-md hover:-translate-y-0.5 transition-all">
                  Valider le don
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      <AnimatePresence>
      {selectedDonor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-[12px] shadow-2xl max-w-sm w-full"
          >
            <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-blue-50/50 rounded-t-[12px]">
               <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 shadow-sm border border-blue-200">
                 <HeartHandshake className="w-5 h-5" />
               </div>
               <div>
                 <h2 className="text-lg font-bold text-slate-900 leading-tight">Profil Donateur</h2>
                 <p className="text-[12px] text-slate-500 font-medium tracking-wide">Informations de contact</p>
               </div>
            </div>
            <div className="p-6 space-y-5 text-[13px]">
              <div>
                <span className="block text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-1">Nom Complet</span>
                <span className="font-semibold text-slate-900 text-[15px]">{selectedDonor.name}</span>
              </div>
              <div>
                <span className="block text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-1">Email</span>
                <span className="text-slate-700">{selectedDonor.email || 'Non renseigné'}</span>
              </div>
              <div>
                <span className="block text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-1">Téléphone</span>
                <span className="text-slate-700">{selectedDonor.phone || 'Non renseigné'}</span>
              </div>
              <div>
                <span className="block text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-1">Adresse</span>
                <span className="text-slate-700">{selectedDonor.address || 'Non renseignée'}</span>
              </div>
               <div>
                <span className="block text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-1">Date d'enregistrement</span>
                <span className="text-slate-700">{selectedDonor.createdAt ? new Date(selectedDonor.createdAt).toLocaleDateString() : 'Inconnue'}</span>
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 bg-slate-50 rounded-b-[12px] flex justify-end">
              <button 
                onClick={() => setSelectedDonor(null)} 
                className="px-5 py-2 text-[13px] font-bold text-slate-700 bg-white border border-slate-300 rounded-[6px] shadow-sm hover:bg-slate-100 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>
    </motion.div>
  );
}
