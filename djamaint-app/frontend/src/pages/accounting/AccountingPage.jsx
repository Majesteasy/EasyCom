import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCHF, formatDate } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, Plus, Upload, Download, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import TransactionModal from './TransactionModal';
import BankReconciliation from './BankReconciliation';
import VatPanel from './VatPanel';

const TABS = ['Journal', 'Rapprochement', 'TVA', 'Bilan'];

export default function AccountingPage() {
  const [tab, setTab] = useState('Journal');
  const [showModal, setShowModal] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [filters, setFilters] = useState({ type: '', dateFrom: '', dateTo: '' });
  const year = new Date().getFullYear();

  const qc = useQueryClient();

  const { data: kpis } = useQuery({
    queryKey: ['accounting-kpis'],
    queryFn: () => api.get('/accounting/kpis').then(r => r.data),
  });

  const { data: chart } = useQuery({
    queryKey: ['accounting-chart', year],
    queryFn: () => api.get(`/accounting/chart?year=${year}`).then(r => r.data),
  });

  const { data: txData, isLoading } = useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => api.get('/accounting/transactions', { params: filters }).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/accounting/transactions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  });

  const handleExport = async () => {
    const params = new URLSearchParams(filters).toString();
    const res = await api.get(`/accounting/export?${params}`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a'); a.href = url;
    a.download = `djamaint_compta_${year}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const net = kpis?.month ? kpis.month.revenue - kpis.month.expenses : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comptabilité</h1>
          <p className="text-sm text-gray-500 mt-0.5">Journal EI — exercice {year}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExport}>
            <Download size={16} /> Export CSV
          </Button>
          <Button onClick={() => { setEditTx(null); setShowModal(true); }}>
            <Plus size={16} /> Nouvelle écriture
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Recettes (mois)" value={formatCHF(kpis?.month?.revenue || 0)} icon={TrendingUp} color="green" />
        <KpiCard label="Dépenses (mois)" value={formatCHF(kpis?.month?.expenses || 0)} icon={TrendingDown} color="red" />
        <KpiCard label="Résultat net" value={formatCHF(net)} icon={Minus} color={net >= 0 ? 'blue' : 'red'} />
        <KpiCard label="Non rapprochés" value={kpis?.unreconciled ?? '—'} icon={AlertCircle} color="yellow" sub="transactions" />
      </div>

      {/* Graphique */}
      {chart && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Recettes vs Dépenses {year} (CHF HT)</h2>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chart} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => formatCHF(v)} />
                <Legend />
                <Bar dataKey="revenue"  name="Recettes"  fill="#16a34a" radius={[3,3,0,0]} />
                <Bar dataKey="expenses" name="Dépenses"  fill="#dc2626" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Journal' && (
        <>
          {/* Filtres */}
          <Card className="mb-4">
            <CardBody className="flex flex-wrap gap-3 items-end">
              <div className="flex gap-2">
                {['', 'revenue', 'expense'].map(v => (
                  <button key={v} onClick={() => setFilters(f => ({ ...f, type: v }))}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filters.type === v ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {v === '' ? 'Tout' : v === 'revenue' ? '↑ Recettes' : '↓ Dépenses'}
                  </button>
                ))}
              </div>
              <Input type="date" label="Du" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} className="w-36" />
              <Input type="date" label="Au"  value={filters.dateTo}   onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}   className="w-36" />
              <Button variant="ghost" onClick={() => setFilters({ type: '', dateFrom: '', dateTo: '' })}>
                <RefreshCw size={14} /> Réinitialiser
              </Button>
            </CardBody>
          </Card>

          {/* Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Catégorie</th>
                    <th className="px-4 py-3 text-right">HT (CHF)</th>
                    <th className="px-4 py-3 text-right">TVA</th>
                    <th className="px-4 py-3 text-right">TTC (CHF)</th>
                    <th className="px-4 py-3">Mode</th>
                    <th className="px-4 py-3">Rappr.</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={9} className="text-center py-8 text-gray-400">Chargement…</td></tr>
                  ) : txData?.rows?.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-8 text-gray-400">Aucune écriture. Ajoutez votre première transaction.</td></tr>
                  ) : txData?.rows?.map(tx => (
                    <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(tx.date)}</td>
                      <td className="px-4 py-3 text-gray-800 max-w-xs truncate">{tx.description}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5">{tx.category_code}</span>
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${tx.type === 'revenue' ? 'text-green-700' : 'text-red-700'}`}>
                        {tx.type === 'revenue' ? '+' : '-'}{tx.amount_ht.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400 text-xs">{tx.vat_rate}%</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-800">{tx.amount_ttc.toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs capitalize">{tx.payment_method || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${tx.reconciled ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {tx.reconciled ? '✓' : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => { setEditTx(tx); setShowModal(true); }} className="text-xs text-blue-600 hover:underline">Modifier</button>
                          <button onClick={() => { if(confirm('Supprimer ?')) deleteMutation.mutate(tx.id); }} className="text-xs text-red-500 hover:underline ml-2">Suppr.</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {txData?.total > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
                {txData.total} écriture(s)
              </div>
            )}
          </Card>
        </>
      )}

      {tab === 'Rapprochement' && <BankReconciliation />}
      {tab === 'TVA' && <VatPanel />}
      {tab === 'Bilan' && <BilanPanel year={year} />}

      {showModal && (
        <TransactionModal
          initial={editTx}
          onClose={() => { setShowModal(false); setEditTx(null); }}
          onSaved={() => { qc.invalidateQueries({ queryKey: ['transactions'] }); qc.invalidateQueries({ queryKey: ['accounting-kpis'] }); }}
        />
      )}
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, color, sub }) {
  const cols = { green:'bg-green-50 text-green-600', red:'bg-red-50 text-red-600', blue:'bg-blue-50 text-blue-600', yellow:'bg-yellow-50 text-yellow-600' };
  return (
    <Card>
      <CardBody className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${cols[color]}`}><Icon size={20} /></div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-lg font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400">{sub}</p>}
        </div>
      </CardBody>
    </Card>
  );
}

function BilanPanel({ year }) {
  const { data, isLoading } = useQuery({
    queryKey: ['bilan', year],
    queryFn: () => api.get(`/accounting/bilan?year=${year}`).then(r => r.data),
  });
  if (isLoading) return <div className="py-8 text-center text-gray-400">Chargement…</div>;
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader><h2 className="font-semibold text-green-700">Recettes {year}</h2></CardHeader>
        <CardBody className="flex flex-col gap-2">
          {data.revenues.map(r => (
            <div key={r.category_code} className="flex justify-between text-sm">
              <span className="text-gray-600">{r.category_code}</span>
              <span className="font-medium">{formatCHF(r.total)}</span>
            </div>
          ))}
          <div className="border-t pt-2 mt-2 flex justify-between font-bold text-green-700">
            <span>Total recettes</span><span>{formatCHF(data.totalRevenue)}</span>
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardHeader><h2 className="font-semibold text-red-700">Dépenses {year}</h2></CardHeader>
        <CardBody className="flex flex-col gap-2">
          {data.expenses.map(r => (
            <div key={r.category_code} className="flex justify-between text-sm">
              <span className="text-gray-600">{r.category_code}</span>
              <span className="font-medium">{formatCHF(r.total)}</span>
            </div>
          ))}
          <div className="border-t pt-2 mt-2 flex justify-between font-bold text-red-700">
            <span>Total dépenses</span><span>{formatCHF(data.totalExpenses)}</span>
          </div>
        </CardBody>
      </Card>
      <Card className="md:col-span-2">
        <CardBody className="flex flex-wrap gap-6 items-center">
          <div>
            <p className="text-xs text-gray-500">Bénéfice brut</p>
            <p className={`text-2xl font-bold ${data.netResult >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCHF(data.netResult)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">AVS estimée (~10%)</p>
            <p className="text-lg font-semibold text-gray-700">- {formatCHF(data.avsEstimate)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Revenu net estimé</p>
            <p className="text-2xl font-bold text-blue-700">{formatCHF(data.netAfterAvs)}</p>
          </div>
          {data.netResult >= 100_000 && (
            <div className="ml-auto bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
              ⚡ CA ≥ CHF 100'000 — Étudiez la transition <strong>EI → Sàrl</strong>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
