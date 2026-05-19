import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { X } from 'lucide-react';
import api from '@/lib/api';

const PAYMENT_METHODS = [
  { value: 'bank', label: 'Virement bancaire' },
  { value: 'card', label: 'Carte' },
  { value: 'cash', label: 'Espèces' },
  { value: 'twint', label: 'TWINT' },
  { value: 'other', label: 'Autre' },
];

export default function TransactionModal({ initial, onClose, onSaved }) {
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState({
    type: initial?.type || 'revenue',
    date: initial?.date || new Date().toISOString().slice(0, 10),
    description: initial?.description || '',
    categoryCode: initial?.category_code || '',
    amountHt: initial?.amount_ht || '',
    vatRate: initial?.vat_rate ?? 8.1,
    paymentMethod: initial?.payment_method || 'bank',
    reference: initial?.reference || '',
    notes: initial?.notes || '',
  });
  const [errors, setErrors] = useState({});

  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/accounting/categories').then(r => r.data),
  });

  const cats = catData?.categories?.[form.type] || [];

  // Auto-fill TVA when category changes
  useEffect(() => {
    const cat = cats.find(c => c.code === form.categoryCode);
    if (cat) setForm(f => ({ ...f, vatRate: cat.vatRate }));
  }, [form.categoryCode]);

  const amountTtc = form.amountHt
    ? (parseFloat(form.amountHt) * (1 + parseFloat(form.vatRate) / 100)).toFixed(2)
    : '';

  const mutation = useMutation({
    mutationFn: (data) => isEdit
      ? api.patch(`/accounting/transactions/${initial.id}`, data)
      : api.post('/accounting/transactions', data),
    onSuccess: () => { onSaved(); onClose(); },
    onError: (err) => setErrors({ global: err.response?.data?.error || 'Erreur' }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.description.trim()) errs.description = 'Requis';
    if (!form.categoryCode) errs.categoryCode = 'Requis';
    if (!form.amountHt || isNaN(parseFloat(form.amountHt))) errs.amountHt = 'Montant invalide';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    mutation.mutate({ ...form, amountHt: parseFloat(form.amountHt), vatRate: parseFloat(form.vatRate) });
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-900">{isEdit ? 'Modifier' : 'Nouvelle écriture'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 flex flex-col gap-4">
          {/* Type */}
          <div className="flex gap-2">
            {['revenue', 'expense'].map(t => (
              <button key={t} type="button"
                onClick={() => setForm(f => ({ ...f, type: t, categoryCode: '' }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${form.type === t
                  ? t === 'revenue' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-600'}`}>
                {t === 'revenue' ? '↑ Recette' : '↓ Dépense'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Date" type="date" value={form.date} onChange={set('date')} required />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Catégorie</label>
              <select value={form.categoryCode} onChange={set('categoryCode')}
                className={`rounded-lg border px-3 py-2 text-sm ${errors.categoryCode ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-1 focus:ring-blue-500`}>
                <option value="">— Choisir —</option>
                {cats.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
              {errors.categoryCode && <p className="text-xs text-red-600">{errors.categoryCode}</p>}
            </div>
          </div>

          <Input label="Description" value={form.description} onChange={set('description')} error={errors.description} required placeholder="Ex : Intervention maintenance HVAC — Cornavin SA" />

          <div className="grid grid-cols-3 gap-3">
            <Input label="Montant HT (CHF)" type="number" step="0.01" min="0" value={form.amountHt} onChange={set('amountHt')} error={errors.amountHt} required />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">TVA %</label>
              <select value={form.vatRate} onChange={set('vatRate')}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                {[0, 2.6, 3.8, 8.1].map(r => <option key={r} value={r}>{r}%</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">TTC (CHF)</label>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">{amountTtc || '—'}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Mode de paiement</label>
              <select value={form.paymentMethod} onChange={set('paymentMethod')}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <Input label="Référence / N° facture" value={form.reference} onChange={set('reference')} placeholder="F-2025-001" />
          </div>

          <Input label="Notes (optionnel)" value={form.notes} onChange={set('notes')} placeholder="Informations complémentaires" />

          {errors.global && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{errors.global}</p>}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Annuler</Button>
            <Button type="submit" loading={mutation.isPending} className="flex-1">
              {isEdit ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
