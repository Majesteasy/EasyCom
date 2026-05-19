import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, TrendingUp, Trophy, XCircle, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { formatCHF, formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import LeadModal from './LeadModal';

const COLUMNS = [
  { key: 'setting', label: 'Setting', color: 'border-gray-300', headerBg: 'bg-gray-100', badge: 'bg-gray-200 text-gray-700' },
  { key: 'qualification', label: 'Qualification', color: 'border-blue-300', headerBg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-700' },
  { key: 'proposition', label: 'Proposition', color: 'border-yellow-300', headerBg: 'bg-yellow-50', badge: 'bg-yellow-100 text-yellow-700' },
  { key: 'closing', label: 'Closing', color: 'border-orange-300', headerBg: 'bg-orange-50', badge: 'bg-orange-100 text-orange-700' },
];

const PROB_COLORS = {
  10: 'text-gray-500', 25: 'text-blue-600', 50: 'text-yellow-600', 75: 'text-orange-600', 100: 'text-green-600',
};

export default function PipelinePage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['pipeline-board'],
    queryFn: () => api.get('/pipeline/board').then(r => r.data),
    refetchInterval: 30000,
  });

  const moveMut = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/pipeline/${id}/move`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipeline-board'] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`/pipeline/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipeline-board'] }),
  });

  const columns = data?.columns || {};
  const stats = data?.stats || {};
  const totalPipeline = Object.values(columns).reduce((s, col) => s + (col.total_value || 0), 0);

  function handleDrop(e, targetStatus) {
    const id = e.dataTransfer.getData('leadId');
    if (id) moveMut.mutate({ id, status: targetStatus });
  }

  function handleDragOver(e) { e.preventDefault(); }

  if (isLoading) {
    return <div className="p-6 text-center text-gray-400">Chargement du pipeline...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline commercial</h1>
          <p className="text-sm text-gray-500 mt-1">{stats.total ?? 0} opportunités totales</p>
        </div>
        <Button onClick={() => setModal('new')}><Plus size={16} className="mr-2" />Nouveau lead</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-3">
          <TrendingUp size={20} className="text-blue-600" />
          <div>
            <p className="text-xs text-gray-500">Pipeline actif</p>
            <p className="text-lg font-bold text-gray-900">{formatCHF(totalPipeline)}</p>
          </div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 flex items-center gap-3">
          <Trophy size={20} className="text-green-600" />
          <div>
            <p className="text-xs text-gray-500">Gagné ({stats.won_count ?? 0})</p>
            <p className="text-lg font-bold text-gray-900">{formatCHF(stats.won_value ?? 0)}</p>
          </div>
        </div>
        <div className="bg-red-50 rounded-xl p-4 flex items-center gap-3">
          <XCircle size={20} className="text-red-500" />
          <div>
            <p className="text-xs text-gray-500">Perdus</p>
            <p className="text-lg font-bold text-gray-900">{stats.lost_count ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-4 gap-4 min-h-96">
        {COLUMNS.map(col => {
          const colData = columns[col.key] || { leads: [], total_value: 0 };
          return (
            <div key={col.key}
              className={`border-t-2 ${col.color} rounded-xl bg-gray-50/80 flex flex-col`}
              onDrop={e => handleDrop(e, col.key)}
              onDragOver={handleDragOver}
            >
              {/* Column Header */}
              <div className={`${col.headerBg} rounded-t-xl px-3 py-2.5 border-b border-gray-200`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-gray-800">{col.label}</span>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${col.badge}`}>
                    {colData.leads.length}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{formatCHF(colData.total_value)}</p>
              </div>

              {/* Cards */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-320px)]">
                {colData.leads.map(lead => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onEdit={() => setModal(lead)}
                    onDelete={() => { if (confirm('Supprimer ce lead ?')) deleteMut.mutate(lead.id); }}
                    onMove={(status) => moveMut.mutate({ id: lead.id, status })}
                    columns={COLUMNS}
                  />
                ))}
                {colData.leads.length === 0 && (
                  <div className="text-center text-gray-300 text-xs py-8">Glisser un lead ici</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <LeadModal
          lead={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); qc.invalidateQueries({ queryKey: ['pipeline-board'] }); }}
        />
      )}
    </div>
  );
}

function LeadCard({ lead, onEdit, onDelete, onMove, columns }) {
  const [showMove, setShowMove] = useState(false);

  function handleDragStart(e) {
    e.dataTransfer.setData('leadId', lead.id);
  }

  return (
    <div draggable onDragStart={handleDragStart}
      className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-sm text-gray-900 leading-tight">{lead.client_name}</p>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={onEdit} className="p-1 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600"><Pencil size={12} /></button>
          <button onClick={onDelete} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
        </div>
      </div>

      {lead.contact_name && <p className="text-xs text-gray-500 mt-0.5">{lead.contact_name}</p>}

      <div className="flex items-center justify-between mt-2">
        <span className="font-mono text-sm font-bold text-gray-800">{formatCHF(lead.value_chf || 0)}</span>
        <span className={`text-xs font-semibold ${PROB_COLORS[lead.probability] || 'text-gray-500'}`}>
          {lead.probability}%
        </span>
      </div>

      {lead.next_action && (
        <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
          {lead.next_action}
          {lead.next_action_date && <span className="ml-1 text-gray-400">• {formatDate(lead.next_action_date)}</span>}
        </div>
      )}

      {/* Move buttons */}
      <div className="mt-2 flex gap-1">
        {columns.filter(c => c.key !== lead.status).map(c => (
          <button key={c.key} onClick={() => onMove(c.key)}
            className="flex-1 text-xs py-0.5 rounded border border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-600 transition-colors">
            → {c.label}
          </button>
        ))}
        <button onClick={() => onMove('won')} className="text-xs py-0.5 px-1 rounded border border-green-200 text-green-600 hover:bg-green-50">Gagné</button>
        <button onClick={() => onMove('lost')} className="text-xs py-0.5 px-1 rounded border border-red-200 text-red-500 hover:bg-red-50">Perdu</button>
      </div>
    </div>
  );
}
