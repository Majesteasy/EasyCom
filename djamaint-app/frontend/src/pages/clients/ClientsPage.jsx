import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Download, Users, TrendingUp, Building2, Pencil, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { formatCHF } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ClientModal from './ClientModal';

const STATUS_LABELS = { active: 'Actif', inactive: 'Inactif', prospect: 'Prospect' };
const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-600',
  prospect: 'bg-blue-100 text-blue-800',
};

export default function ClientsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(null); // null | 'new' | client object

  const { data, isLoading } = useQuery({
    queryKey: ['clients', search, statusFilter],
    queryFn: () => api.get('/clients', { params: { search: search || undefined, status: statusFilter || undefined, limit: 200 } }).then(r => r.data),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`/clients/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
    onError: (err) => alert(err.response?.data?.error || 'Erreur suppression'),
  });

  const clients = data?.clients || [];
  const activeCount = clients.filter(c => c.status === 'active').length;
  const totalRevenue = clients.reduce((s, c) => s + (c.total_revenue || 0), 0);

  function handleExport() {
    window.open('/api/clients/export.csv', '_blank');
  }

  function handleDelete(c) {
    if (confirm(`Supprimer le client "${c.company_name}" ?`)) deleteMut.mutate(c.id);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">{data?.total ?? 0} client{(data?.total ?? 0) !== 1 ? 's' : ''} au total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExport}><Download size={16} className="mr-2" />Export CSV</Button>
          <Button onClick={() => setModal('new')}><Plus size={16} className="mr-2" />Nouveau client</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard icon={<Users size={20} className="text-blue-600" />} label="Clients actifs" value={activeCount} bg="bg-blue-50" />
        <KpiCard icon={<Building2 size={20} className="text-purple-600" />} label="Total clients" value={data?.total ?? 0} bg="bg-purple-50" />
        <KpiCard icon={<TrendingUp size={20} className="text-green-600" />} label="CA total facturé" value={formatCHF(totalRevenue)} bg="bg-green-50" />
      </div>

      {/* Filtres */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="prospect">Prospects</option>
          <option value="inactive">Inactifs</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">Chargement...</div>
        ) : clients.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p>Aucun client trouvé</p>
            <Button className="mt-4" onClick={() => setModal('new')}>Ajouter le premier client</Button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Société</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email / Tél</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Ville</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">CA facturé</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.company_name}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {[c.contact_first_name, c.contact_last_name].filter(Boolean).join(' ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div>{c.email || '—'}</div>
                    {c.phone && <div className="text-xs text-gray-400">{c.phone}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.city || '—'}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-800">{formatCHF(c.total_revenue || 0)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[c.status]}`}>
                      {STATUS_LABELS[c.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => setModal(c)} className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(c)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 size={15} />
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
        <ClientModal
          client={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); qc.invalidateQueries({ queryKey: ['clients'] }); }}
        />
      )}
    </div>
  );
}

function KpiCard({ icon, label, value, bg }) {
  return (
    <div className={`${bg} rounded-xl p-4 flex items-center gap-4`}>
      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">{icon}</div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
