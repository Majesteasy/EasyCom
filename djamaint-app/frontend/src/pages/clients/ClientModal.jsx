import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X } from 'lucide-react';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const CANTONS = ['AG','AI','AR','BE','BL','BS','FR','GE','GL','GR','JU','LU','NE','NW','OW','SG','SH','SO','SZ','TG','TI','UR','VD','VS','ZG','ZH'];

const EMPTY = {
  company_name: '', contact_first_name: '', contact_last_name: '',
  email: '', phone: '', address_line1: '', address_line2: '',
  postal_code: '', city: '', canton: 'GE', country: 'Suisse',
  vat_number: '', iban: '', payment_terms: 30,
  status: 'active', source: '', notes: '',
};

export default function ClientModal({ client, onClose, onSaved }) {
  const isEdit = !!client;
  const [form, setForm] = useState(isEdit ? { ...EMPTY, ...client } : { ...EMPTY });
  const [errors, setErrors] = useState({});

  const mutation = useMutation({
    mutationFn: (data) => isEdit
      ? api.put(`/clients/${client.id}`, data)
      : api.post('/clients', data),
    onSuccess: () => onSaved(),
    onError: (err) => {
      const errs = err.response?.data?.errors;
      if (errs) setErrors(Object.fromEntries(errs.map(e => [e.field, e.message])));
      else alert(err.response?.data?.error || 'Erreur');
    },
  });

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: undefined }));
  }

  function submit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.company_name.trim()) errs.company_name = 'Requis';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    mutation.mutate(form);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Modifier le client' : 'Nouveau client'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-5">
          {/* Société */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Informations société</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Input label="Raison sociale *" value={form.company_name} onChange={e => set('company_name', e.target.value)} error={errors.company_name} />
              </div>
              <Input label="Prénom contact" value={form.contact_first_name} onChange={e => set('contact_first_name', e.target.value)} />
              <Input label="Nom contact" value={form.contact_last_name} onChange={e => set('contact_last_name', e.target.value)} />
              <Input label="Email" type="email" value={form.email} onChange={e => set('email', e.target.value)} error={errors.email} />
              <Input label="Téléphone" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
          </section>

          {/* Adresse */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Adresse</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Input label="Adresse ligne 1" value={form.address_line1} onChange={e => set('address_line1', e.target.value)} />
              </div>
              <div className="col-span-2">
                <Input label="Adresse ligne 2" value={form.address_line2} onChange={e => set('address_line2', e.target.value)} />
              </div>
              <Input label="NPA" value={form.postal_code} onChange={e => set('postal_code', e.target.value)} />
              <Input label="Ville" value={form.city} onChange={e => set('city', e.target.value)} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Canton</label>
                <select value={form.canton} onChange={e => set('canton', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {CANTONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <Input label="Pays" value={form.country} onChange={e => set('country', e.target.value)} />
            </div>
          </section>

          {/* Facturation */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Facturation</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="N° TVA (CHE-...)" value={form.vat_number} onChange={e => set('vat_number', e.target.value)} />
              <Input label="IBAN client" value={form.iban} onChange={e => set('iban', e.target.value)} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conditions de paiement</label>
                <select value={form.payment_terms} onChange={e => set('payment_terms', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value={0}>À réception</option>
                  <option value={10}>10 jours</option>
                  <option value={20}>20 jours</option>
                  <option value={30}>30 jours</option>
                  <option value={45}>45 jours</option>
                  <option value={60}>60 jours</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select value={form.status} onChange={e => set('status', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="active">Actif</option>
                  <option value="prospect">Prospect</option>
                  <option value="inactive">Inactif</option>
                </select>
              </div>
            </div>
          </section>

          {/* Source & Notes */}
          <section className="grid grid-cols-2 gap-4">
            <Input label="Source" placeholder="Bouche-à-oreille, LinkedIn..." value={form.source} onChange={e => set('source', e.target.value)} />
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes internes</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          </section>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Annuler</Button>
            <Button type="submit" className="flex-1" loading={mutation.isPending}>
              {isEdit ? 'Enregistrer' : 'Créer le client'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
