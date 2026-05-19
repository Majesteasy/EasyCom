import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { X } from 'lucide-react';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const STATUSES = [
  { value: 'setting', label: 'Setting', prob: 10 },
  { value: 'qualification', label: 'Qualification', prob: 25 },
  { value: 'proposition', label: 'Proposition', prob: 50 },
  { value: 'closing', label: 'Closing', prob: 75 },
  { value: 'won', label: 'Gagné', prob: 100 },
  { value: 'lost', label: 'Perdu', prob: 0 },
];

const SOURCES = ['Bouche-à-oreille', 'LinkedIn', 'Site web', 'Appel entrant', 'Email', 'Partenaire', 'Salon professionnel', 'Autre'];

const EMPTY = {
  client_name: '', contact_name: '', contact_email: '', contact_phone: '',
  status: 'setting', value_chf: '', probability: 10,
  expected_close_date: '', source: '', notes: '', next_action: '', next_action_date: '',
  lost_reason: '',
};

export default function LeadModal({ lead, onClose, onSaved }) {
  const isEdit = !!lead;
  const [form, setForm] = useState(isEdit ? { ...EMPTY, ...lead } : { ...EMPTY });
  const [errors, setErrors] = useState({});

  const { data: clientsData } = useQuery({
    queryKey: ['clients', 'all'],
    queryFn: () => api.get('/clients', { params: { limit: 500 } }).then(r => r.data),
  });

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? api.put(`/pipeline/${lead.id}`, data) : api.post('/pipeline', data),
    onSuccess: () => onSaved(),
    onError: (err) => {
      const errs = err.response?.data?.errors;
      if (errs) setErrors(Object.fromEntries(errs.map(e => [e.field, e.message])));
      else alert(err.response?.data?.error || 'Erreur');
    },
  });

  function set(field, value) {
    setForm(f => {
      const next = { ...f, [field]: value };
      // Auto-update probability when status changes
      if (field === 'status') {
        const s = STATUSES.find(s => s.value === value);
        if (s) next.probability = s.prob;
      }
      return next;
    });
    setErrors(e => ({ ...e, [field]: undefined }));
  }

  function submit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.client_name.trim()) errs.client_name = 'Requis';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    mutation.mutate({
      ...form,
      value_chf: form.value_chf === '' ? 0 : Number(form.value_chf),
      probability: Number(form.probability),
    });
  }

  const clients = clientsData?.clients || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Modifier le lead' : 'Nouveau lead'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={20} /></button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input label="Société / Prospect *" value={form.client_name} onChange={e => set('client_name', e.target.value)} error={errors.client_name} />
            </div>

            {/* Lier à un client existant */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Lier à un client existant (optionnel)</label>
              <select value={form.client_id || ''} onChange={e => set('client_id', e.target.value || null)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Nouveau prospect —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
              </select>
            </div>

            <Input label="Nom contact" value={form.contact_name} onChange={e => set('contact_name', e.target.value)} />
            <Input label="Tél contact" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} />
            <div className="col-span-2">
              <Input label="Email contact" type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Étape</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <Input label="Valeur CHF" type="number" min="0" step="100"
              value={form.value_chf} onChange={e => set('value_chf', e.target.value)} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Probabilité %</label>
              <input type="range" min="0" max="100" step="5" value={form.probability}
                onChange={e => set('probability', e.target.value)}
                className="w-full mt-2" />
              <div className="text-center text-sm font-bold text-blue-600">{form.probability}%</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Date clôture estimée" type="date" value={form.expected_close_date}
              onChange={e => set('expected_close_date', e.target.value)} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <select value={form.source} onChange={e => set('source', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">—</option>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Prochaine action" value={form.next_action} onChange={e => set('next_action', e.target.value)}
              placeholder="Envoyer devis, appeler..." />
            <Input label="Date prochaine action" type="date" value={form.next_action_date}
              onChange={e => set('next_action_date', e.target.value)} />
          </div>

          {form.status === 'lost' && (
            <Input label="Raison de perte" value={form.lost_reason} onChange={e => set('lost_reason', e.target.value)}
              placeholder="Prix, concurrent, pas de budget..." />
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Annuler</Button>
            <Button type="submit" className="flex-1" loading={mutation.isPending}>
              {isEdit ? 'Enregistrer' : 'Créer le lead'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
