import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { X, Plus, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { formatCHF } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const VAT_RATES = [
  { label: '8.1% — Standard (FM/services)', value: 8.1 },
  { label: '2.6% — Réduit (alimentation)', value: 2.6 },
  { label: '3.8% — Hébergement', value: 3.8 },
  { label: '0% — Exonéré', value: 0 },
];

const emptyItem = () => ({ description: '', quantity: 1, unit_price: 0, vat_rate: 8.1 });

export default function InvoiceModal({ invoice, onClose, onSaved }) {
  const isEdit = !!invoice;
  const isReadOnly = isEdit && invoice.status !== 'draft';

  const [clientId, setClientId] = useState(invoice?.client_id || '');
  const [number, setNumber] = useState(invoice?.number || '');
  const [issueDate, setIssueDate] = useState(invoice?.issue_date || today());
  const [vatRate, setVatRate] = useState(invoice?.vat_rate ?? 8.1);
  const [items, setItems] = useState(
    invoice?.items?.length ? invoice.items : [emptyItem()]
  );
  const [notes, setNotes] = useState(invoice?.notes || '');
  const [paymentTerms, setPaymentTerms] = useState(invoice?.payment_terms ?? 30);

  const { data: clientsData } = useQuery({
    queryKey: ['clients', 'all'],
    queryFn: () => api.get('/clients', { params: { limit: 500 } }).then(r => r.data),
  });

  const { data: nextNum } = useQuery({
    queryKey: ['nextInvoiceNumber'],
    queryFn: () => api.get('/invoices/next-number').then(r => r.data.number),
    enabled: !isEdit,
  });

  useEffect(() => { if (nextNum && !isEdit) setNumber(nextNum); }, [nextNum, isEdit]);

  const subtotalHt = items.reduce((s, it) => s + ((Number(it.quantity) || 0) * (Number(it.unit_price) || 0)), 0);
  const vatAmt = Math.round(subtotalHt * (vatRate / 100) * 100) / 100;
  const totalTtc = Math.round((subtotalHt + vatAmt) * 100) / 100;

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? api.put(`/invoices/${invoice.id}`, data) : api.post('/invoices', data),
    onSuccess: () => onSaved(),
    onError: (err) => alert(err.response?.data?.error || 'Erreur'),
  });

  function submit(e) {
    e.preventDefault();
    if (!clientId) return alert('Sélectionnez un client');
    if (items.some(it => !it.description.trim())) return alert('Toutes les lignes doivent avoir une description');
    mutation.mutate({
      client_id: clientId, number, issue_date: issueDate,
      vat_rate: vatRate, payment_terms: paymentTerms, notes,
      items: items.map(it => ({ ...it, quantity: Number(it.quantity), unit_price: Number(it.unit_price) })),
    });
  }

  function updateItem(idx, field, value) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  }

  function addItem() { setItems(prev => [...prev, emptyItem()]); }
  function removeItem(idx) { setItems(prev => prev.filter((_, i) => i !== idx)); }

  const clients = clientsData?.clients || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? `Facture ${invoice.number}` : 'Nouvelle facture'}
            {isReadOnly && <span className="ml-2 text-sm font-normal text-gray-500">(lecture seule)</span>}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={20} /></button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-5">
          {/* En-tête */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
              <select value={clientId} onChange={e => setClientId(e.target.value)} disabled={isReadOnly}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50">
                <option value="">Sélectionner...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
              </select>
            </div>
            <Input label="Numéro *" value={number} onChange={e => setNumber(e.target.value)} disabled={isReadOnly} />
            <Input label="Date d'émission *" type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} disabled={isReadOnly} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Taux TVA</label>
              <select value={vatRate} onChange={e => setVatRate(Number(e.target.value))} disabled={isReadOnly}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50">
                {VAT_RATES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conditions de paiement</label>
              <select value={paymentTerms} onChange={e => setPaymentTerms(Number(e.target.value))} disabled={isReadOnly}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50">
                <option value={0}>À réception</option>
                <option value={10}>10 jours</option>
                <option value={20}>20 jours</option>
                <option value={30}>30 jours net</option>
                <option value={45}>45 jours</option>
                <option value={60}>60 jours</option>
              </select>
            </div>
          </div>

          {/* Lignes */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Prestations</h3>
              {!isReadOnly && (
                <button type="button" onClick={addItem} className="text-blue-600 text-sm font-medium flex items-center gap-1 hover:text-blue-700">
                  <Plus size={14} />Ajouter une ligne
                </button>
              )}
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Description</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-600 w-20">Qté</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-600 w-28">Prix unit. HT</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-600 w-28">Total HT</th>
                    {!isReadOnly && <th className="w-10" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2">
                        <input type="text" value={it.description} onChange={e => updateItem(idx, 'description', e.target.value)}
                          disabled={isReadOnly} placeholder="Prestation FM, matériel..."
                          className="w-full border-0 bg-transparent focus:outline-none focus:ring-0 disabled:text-gray-500" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" value={it.quantity} min="0.01" step="0.5"
                          onChange={e => updateItem(idx, 'quantity', e.target.value)}
                          disabled={isReadOnly}
                          className="w-full text-right border-0 bg-transparent focus:outline-none disabled:text-gray-500" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" value={it.unit_price} min="0" step="0.01"
                          onChange={e => updateItem(idx, 'unit_price', e.target.value)}
                          disabled={isReadOnly}
                          className="w-full text-right border-0 bg-transparent focus:outline-none disabled:text-gray-500" />
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-gray-700">
                        {formatCHF((Number(it.quantity) || 0) * (Number(it.unit_price) || 0))}
                      </td>
                      {!isReadOnly && (
                        <td className="px-2 py-2 text-center">
                          {items.length > 1 && (
                            <button type="button" onClick={() => removeItem(idx)} className="text-gray-400 hover:text-red-500">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Totaux */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Sous-total HT</span><span className="font-mono">{formatCHF(subtotalHt)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>TVA {vatRate}%</span><span className="font-mono">{formatCHF(vatAmt)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2">
                <span>Total TTC</span><span className="font-mono text-lg">{formatCHF(totalTtc)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Conditions</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} disabled={isReadOnly}
              placeholder="Délai de paiement, coordonnées bancaires, conditions..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-50" />
          </div>

          {/* QR suisse info */}
          <div className="bg-blue-50 rounded-lg px-4 py-3 text-sm text-blue-700">
            Facture QR Swiss (standard 2022) — L'IBAN configuré dans vos paramètres sera utilisé pour le QR code de paiement.
          </div>

          {!isReadOnly && (
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Annuler</Button>
              <Button type="submit" className="flex-1" loading={mutation.isPending}>
                {isEdit ? 'Enregistrer' : 'Créer la facture'}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
