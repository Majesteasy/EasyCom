import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FileText, CheckCircle, Clock, AlertTriangle, Send, CreditCard } from 'lucide-react';
import api from '@/lib/api';
import { formatCHF, formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import InvoiceModal from './InvoiceModal';

const STATUS_LABELS = { draft: 'Brouillon', sent: 'Envoyée', paid: 'Payée', overdue: 'En retard', cancelled: 'Annulée' };
const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-400 line-through',
};

export default function FacturationPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(null);

  const { data: statsData } = useQuery({
    queryKey: ['invoiceStats'],
    queryFn: () => api.get('/invoices/stats').then(r => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', statusFilter],
    queryFn: () => api.get('/invoices', { params: { status: statusFilter || undefined, limit: 100 } }).then(r => r.data),
  });

  const sendMut = useMutation({
    mutationFn: (id) => api.post(`/invoices/${id}/send`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });

  const payMut = useMutation({
    mutationFn: (id) => api.post(`/invoices/${id}/pay`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices', 'invoiceStats'] }),
  });

  const invoices = data?.invoices || [];
  const s = statsData || {};

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facturation</h1>
          <p className="text-sm text-gray-500 mt-1">{data?.total ?? 0} facture{(data?.total ?? 0) !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setModal('new')}><Plus size={16} className="mr-2" />Nouvelle facture</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<FileText size={18} className="text-gray-600" />} label="Brouillons" value={s.drafts ?? 0} bg="bg-gray-50" />
        <StatCard icon={<Send size={18} className="text-blue-600" />} label="En attente" value={formatCHF(s.outstanding ?? 0)} bg="bg-blue-50" />
        <StatCard icon={<AlertTriangle size={18} className="text-red-600" />} label="En retard" value={s.overdue ?? 0} bg="bg-red-50" />
        <StatCard icon={<CheckCircle size={18} className="text-green-600" />} label="CA encaissé (année)" value={formatCHF(s.revenue_ytd ?? 0)} bg="bg-green-50" />
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {['', 'draft', 'sent', 'overdue', 'paid'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s === '' ? 'Toutes' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">Chargement...</div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <FileText size={40} className="mx-auto mb-3 opacity-30" />
            <p>Aucune facture</p>
            <Button className="mt-4" onClick={() => setModal('new')}>Créer la première facture</Button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Numéro</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Client</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Émission</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Échéance</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Montant TTC</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium text-gray-900">{inv.number}</td>
                  <td className="px-4 py-3 text-gray-700">{inv.client_name}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(inv.issue_date)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(inv.due_date)}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900">{formatCHF(inv.total_ttc)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[inv.status]}`}>
                      {STATUS_LABELS[inv.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      {inv.status === 'draft' && (
                        <button onClick={() => sendMut.mutate(inv.id)}
                          className="px-2 py-1 rounded text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium">
                          <Send size={12} className="inline mr-1" />Envoyer
                        </button>
                      )}
                      {inv.status === 'sent' && (
                        <button onClick={() => payMut.mutate(inv.id)}
                          className="px-2 py-1 rounded text-xs bg-green-50 text-green-700 hover:bg-green-100 font-medium">
                          <CreditCard size={12} className="inline mr-1" />Payée
                        </button>
                      )}
                      <button onClick={() => setModal(inv)}
                        className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium">
                        Voir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <InvoiceModal
          invoice={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); qc.invalidateQueries({ queryKey: ['invoices', 'invoiceStats'] }); }}
        />
      )}
    </div>
  );
}

function StatCard({ icon, label, value, bg }) {
  return (
    <div className={`${bg} rounded-xl p-4 flex items-center gap-3`}>
      <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm">{icon}</div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-lg font-bold text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
