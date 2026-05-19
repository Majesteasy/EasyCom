import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Upload, CheckCircle, XCircle, Minus } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import api from '@/lib/api';

const STATUS_TABS = ['unmatched', 'matched', 'ignored'];
const STATUS_LABELS = { unmatched: 'Non rapprochés', matched: 'Rapprochés', ignored: 'Ignorés' };

export default function BankReconciliation() {
  const [status, setStatus] = useState('unmatched');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [matchingId, setMatchingId] = useState(null);
  const fileRef = useRef();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['bank-transactions', status],
    queryFn: () => api.get('/accounting/bank-transactions', { params: { status } }).then(r => r.data),
  });

  const { data: txData } = useQuery({
    queryKey: ['transactions-unreconciled'],
    queryFn: () => api.get('/accounting/transactions', { params: { reconciled: false, limit: 200 } }).then(r => r.data),
    enabled: Boolean(matchingId),
  });

  const matchMutation = useMutation({
    mutationFn: ({ bankId, transactionId }) => api.post(`/accounting/bank-transactions/${bankId}/match`, { transactionId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bank-transactions'] }); setMatchingId(null); },
  });

  const ignoreMutation = useMutation({
    mutationFn: (id) => api.post(`/accounting/bank-transactions/${id}/ignore`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bank-transactions'] }),
  });

  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('csv', file);
    setImporting(true);
    setImportResult(null);
    try {
      const { data } = await api.post('/accounting/bank-import', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setImportResult({ ok: true, message: data.message });
      qc.invalidateQueries({ queryKey: ['bank-transactions'] });
    } catch (err) {
      setImportResult({ ok: false, message: err.response?.data?.error || 'Erreur import' });
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Import */}
      <Card>
        <CardBody className="flex items-center gap-4 flex-wrap">
          <div>
            <p className="font-medium text-gray-900 text-sm">Import relevé bancaire CSV</p>
            <p className="text-xs text-gray-400 mt-0.5">Compatible Postfinance, UBS, BCGE, Neon, Revolut Business</p>
          </div>
          <Button onClick={() => fileRef.current.click()} loading={importing} variant="secondary">
            <Upload size={16} /> Importer CSV
          </Button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileImport} />
          {importResult && (
            <div className={`text-sm rounded-lg px-3 py-2 ${importResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {importResult.message}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {STATUS_TABS.map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${status === s ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Description banque</th>
                <th className="px-4 py-3 text-right">Montant CHF</th>
                <th className="px-4 py-3">Référence</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-6 text-gray-400">Chargement…</td></tr>
              ) : data?.rows?.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-6 text-gray-400">
                  {status === 'unmatched' ? 'Aucune ligne non rapprochée — importez un relevé bancaire.' : 'Aucune ligne.'}
                </td></tr>
              ) : data?.rows?.map(bt => (
                <>
                  <tr key={bt.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(bt.transaction_date)}</td>
                    <td className="px-4 py-3 text-gray-800 max-w-xs truncate">{bt.description}</td>
                    <td className={`px-4 py-3 text-right font-medium ${bt.amount >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {bt.amount >= 0 ? '+' : ''}{bt.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{bt.reference || '—'}</td>
                    <td className="px-4 py-3">
                      {status === 'unmatched' && (
                        <div className="flex gap-2">
                          <button onClick={() => setMatchingId(matchingId === bt.id ? null : bt.id)}
                            className="text-xs text-blue-600 hover:underline">Rapprocher</button>
                          <button onClick={() => ignoreMutation.mutate(bt.id)}
                            className="text-xs text-gray-400 hover:underline">Ignorer</button>
                        </div>
                      )}
                      {status === 'matched' && <CheckCircle size={16} className="text-green-500" />}
                      {status === 'ignored' && <Minus size={16} className="text-gray-400" />}
                    </td>
                  </tr>
                  {matchingId === bt.id && (
                    <tr key={`${bt.id}-match`}>
                      <td colSpan={5} className="px-4 pb-3 bg-blue-50">
                        <p className="text-xs font-medium text-blue-800 mb-2">Choisir l'écriture correspondante :</p>
                        <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                          {txData?.rows?.map(tx => (
                            <button key={tx.id}
                              onClick={() => matchMutation.mutate({ bankId: bt.id, transactionId: tx.id })}
                              className="text-left text-xs px-3 py-2 bg-white rounded border hover:border-blue-400 transition-colors">
                              {tx.date} — {tx.description} — <strong>{tx.amount_ht.toFixed(2)} CHF</strong>
                            </button>
                          ))}
                          {!txData?.rows?.length && <p className="text-xs text-gray-500">Aucune écriture non rapprochée.</p>}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
