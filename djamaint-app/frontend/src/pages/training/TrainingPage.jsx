import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatDate } from '@/lib/utils';
import { BookOpen, ExternalLink, Plus, Clock, Award, CheckCircle, Circle, PlayCircle, X, Star } from 'lucide-react';
import api from '@/lib/api';

const TABS = ['Catalogue', 'Mes formations', 'Certifications'];

const CAT_META = {
  fm:      { label: 'Facility Management', color: 'blue',   bg: 'bg-blue-100',   text: 'text-blue-700',   icon: '🏢' },
  elec:    { label: 'Électrotechnique',    color: 'yellow', bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '⚡' },
  normes:  { label: 'Normes & Sécurité',  color: 'red',    bg: 'bg-red-100',    text: 'text-red-700',    icon: '📋' },
  gestion: { label: 'Gestion PME',         color: 'green',  bg: 'bg-green-100',  text: 'text-green-700',  icon: '📊' },
  autre:   { label: 'Autre',              color: 'gray',   bg: 'bg-gray-100',   text: 'text-gray-600',   icon: '📚' },
};

const STATUS_META = {
  planned:   { label: 'Planifiée',   icon: Circle,       color: 'text-gray-400',  bg: 'bg-gray-100 text-gray-600' },
  ongoing:   { label: 'En cours',   icon: PlayCircle,   color: 'text-blue-500',  bg: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Terminée',   icon: CheckCircle,  color: 'text-green-500', bg: 'bg-green-100 text-green-700' },
};

export default function TrainingPage() {
  const [tab, setTab] = useState('Catalogue');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Formation continue</h1>
        <p className="text-sm text-gray-500 mt-0.5">Catalogue ressources gratuites · Suivi personnel · Certifications</p>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-6">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Catalogue'     && <CatalogueTab />}
      {tab === 'Mes formations' && <MesFormationsTab />}
      {tab === 'Certifications' && <CertificationsTab />}
    </div>
  );
}

// ─── Catalogue ───────────────────────────────────────────────────────────────

function CatalogueTab() {
  const [catFilter, setCatFilter] = useState('');
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['training-catalog', catFilter],
    queryFn: () => api.get('/training/catalog', { params: catFilter ? { category: catFilter } : {} }).then(r => r.data),
  });

  const addMutation = useMutation({
    mutationFn: (id) => api.post(`/training/catalog/${id}/add`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-trainings'] }); },
    onError: (err) => alert(err.response?.data?.error || 'Erreur'),
  });

  const items = data?.items || [];

  return (
    <>
      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {Object.entries(CAT_META).filter(([k]) => k !== 'autre').map(([k, m]) => (
          <button key={k} onClick={() => setCatFilter(catFilter === k ? '' : k)}
            className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${catFilter === k ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
            <span className="text-2xl">{m.icon}</span>
            <div>
              <p className="text-xs font-semibold text-gray-700">{m.label}</p>
              <p className="text-xs text-gray-400">{items.filter(i => i.category === k).length} ressources</p>
            </div>
          </button>
        ))}
      </div>

      {catFilter && (
        <button onClick={() => setCatFilter('')} className="mb-4 text-sm text-blue-600 hover:underline flex items-center gap-1">
          <X size={14} /> Effacer filtre
        </button>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map(item => (
          <Card key={item.id} className="flex flex-col">
            <CardBody className="flex flex-col gap-3 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{CAT_META[item.category]?.icon}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CAT_META[item.category]?.bg} ${CAT_META[item.category]?.text}`}>
                    {CAT_META[item.category]?.label}
                  </span>
                </div>
                {item.free
                  ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium shrink-0">Gratuit</span>
                  : <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium shrink-0">Payant</span>
                }
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 text-sm leading-snug">{item.title}</h3>
                <p className="text-xs text-blue-600 font-medium mt-0.5">{item.provider}</p>
              </div>

              <p className="text-xs text-gray-500 flex-1 leading-relaxed">{item.description}</p>

              {item.priceNote && (
                <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">ℹ️ {item.priceNote}</p>
              )}

              <div className="flex items-center gap-1 text-xs text-gray-400">
                {item.language && <span className="bg-gray-100 rounded px-1.5 py-0.5">{item.language}</span>}
                {item.format && <span className="bg-gray-100 rounded px-1.5 py-0.5">{item.format}</span>}
              </div>

              <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100">
                <a href={item.url} target="_blank" rel="noopener"
                  className="flex-1 flex items-center justify-center gap-1 text-xs px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                  <ExternalLink size={13} /> Ouvrir
                </a>
                <Button className="flex-1 text-xs py-2"
                  onClick={() => addMutation.mutate(item.id)}
                  loading={addMutation.isPending && addMutation.variables === item.id}>
                  <Plus size={13} /> Ajouter
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </>
  );
}

// ─── Mes formations ──────────────────────────────────────────────────────────

function MesFormationsTab() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const { data: stats } = useQuery({
    queryKey: ['training-stats'],
    queryFn: () => api.get('/training/stats').then(r => r.data),
  });

  const { data: trainings = [], isLoading } = useQuery({
    queryKey: ['my-trainings', statusFilter],
    queryFn: () => api.get('/training/my', { params: statusFilter ? { status: statusFilter } : {} }).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/training/my/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-trainings'] }); qc.invalidateQueries({ queryKey: ['training-stats'] }); },
  });

  const statusUpdate = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/training/my/${id}`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-trainings'] }); qc.invalidateQueries({ queryKey: ['training-stats'] }); },
  });

  const totalHours = stats?.hoursYear || 0;
  const TARGET_HOURS = 40; // objectif formation annuel

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats?.byStatus?.find(s => s.status === 'ongoing')?.count || 0}</div>
            <div className="text-xs text-gray-500 mt-1">En cours</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats?.byStatus?.find(s => s.status === 'completed')?.count || 0}</div>
            <div className="text-xs text-gray-500 mt-1">Terminées</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-gray-700">{totalHours.toFixed(0)}h</div>
            <div className="text-xs text-gray-500 mt-1">Heures {new Date().getFullYear()}</div>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full">
              <div className="h-1.5 bg-blue-500 rounded-full transition-all" style={{ width: `${Math.min(100, (totalHours / TARGET_HOURS) * 100)}%` }} />
            </div>
            <div className="text-xs text-gray-400 mt-1">Objectif {TARGET_HOURS}h</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats?.certificates || 0}</div>
            <div className="text-xs text-gray-500 mt-1">Certifications</div>
          </CardBody>
        </Card>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {['', 'ongoing', 'planned', 'completed'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${statusFilter === s ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
              {s === '' ? 'Toutes' : STATUS_META[s]?.label}
            </button>
          ))}
        </div>
        <Button onClick={() => { setEditItem(null); setShowModal(true); }}>
          <Plus size={15} /> Ajouter
        </Button>
      </div>

      {isLoading ? <p className="text-gray-400 text-sm py-8 text-center">Chargement…</p> : trainings.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucune formation. Parcourez le catalogue pour commencer.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {trainings.map(t => {
            const sm = STATUS_META[t.status];
            const cm = CAT_META[t.category];
            const StatusIcon = sm.icon;
            return (
              <Card key={t.id}>
                <CardBody className="flex items-start gap-4">
                  <StatusIcon size={20} className={`${sm.color} shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-gray-900 text-sm">{t.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${cm?.bg} ${cm?.text}`}>{cm?.icon} {cm?.label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${sm.bg}`}>{sm.label}</span>
                      {t.certificate_obtained ? <Award size={14} className="text-amber-500" title="Certification obtenue" /> : null}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{t.provider}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                      {t.hours && <span><Clock size={11} className="inline mr-1" />{t.hours}h</span>}
                      {t.start_date && <span>Début : {formatDate(t.start_date)}</span>}
                      {t.end_date   && <span>Fin : {formatDate(t.end_date)}</span>}
                      {t.certificate_name && <span className="text-amber-600">🏅 {t.certificate_name}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {t.url && (
                      <a href={t.url} target="_blank" rel="noopener"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <ExternalLink size={15} />
                      </a>
                    )}
                    {/* Cycle rapide de statut */}
                    {t.status === 'planned' && (
                      <button onClick={() => statusUpdate.mutate({ id: t.id, status: 'ongoing' })}
                        className="text-xs px-2 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                        Démarrer
                      </button>
                    )}
                    {t.status === 'ongoing' && (
                      <button onClick={() => statusUpdate.mutate({ id: t.id, status: 'completed' })}
                        className="text-xs px-2 py-1 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors">
                        Terminer
                      </button>
                    )}
                    <button onClick={() => { setEditItem(t); setShowModal(true); }}
                      className="text-xs px-2 py-1 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                      Modifier
                    </button>
                    <button onClick={() => { if (confirm('Supprimer ?')) deleteMutation.mutate(t.id); }}
                      className="text-xs px-2 py-1 rounded-lg text-red-400 hover:bg-red-50 transition-colors">
                      <X size={13} />
                    </button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {showModal && (
        <TrainingModal
          initial={editItem}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSaved={() => { qc.invalidateQueries({ queryKey: ['my-trainings'] }); qc.invalidateQueries({ queryKey: ['training-stats'] }); }}
        />
      )}
    </>
  );
}

// ─── Certifications ──────────────────────────────────────────────────────────

function CertificationsTab() {
  const { data: trainings = [] } = useQuery({
    queryKey: ['my-trainings-certs'],
    queryFn: () => api.get('/training/my', { params: { status: 'completed' } }).then(r => r.data),
  });

  const certs = trainings.filter(t => t.certificate_obtained);

  return (
    <div className="flex flex-col gap-4">
      <Card className="border-amber-200 bg-amber-50">
        <CardBody className="flex gap-3 items-center">
          <Award size={24} className="text-amber-500 shrink-0" />
          <div>
            <p className="font-semibold text-amber-900">{certs.length} certification{certs.length !== 1 ? 's' : ''} obtenue{certs.length !== 1 ? 's' : ''}</p>
            <p className="text-xs text-amber-700 mt-0.5">Ajoutez vos certifications en modifiant une formation terminée.</p>
          </div>
        </CardBody>
      </Card>

      {certs.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Award size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">Aucune certification encore. Terminez une formation et cochez "Certification obtenue".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certs.map(t => (
            <Card key={t.id} className="border-amber-200">
              <CardBody className="flex gap-3 items-start">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-2xl shrink-0">🏅</div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{t.certificate_name || t.title}</p>
                  <p className="text-xs text-gray-500">{t.provider}</p>
                  {t.end_date && <p className="text-xs text-gray-400 mt-1">Obtenu le {formatDate(t.end_date)}</p>}
                  <span className={`mt-2 inline-block text-xs px-2 py-0.5 rounded-full ${CAT_META[t.category]?.bg} ${CAT_META[t.category]?.text}`}>
                    {CAT_META[t.category]?.icon} {CAT_META[t.category]?.label}
                  </span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────

function TrainingModal({ initial, onClose, onSaved }) {
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState({
    title: initial?.title || '',
    provider: initial?.provider || '',
    category: initial?.category || 'fm',
    status: initial?.status || 'planned',
    url: initial?.url || '',
    hours: initial?.hours || '',
    startDate: initial?.start_date || '',
    endDate: initial?.end_date || '',
    certificateObtained: Boolean(initial?.certificate_obtained),
    certificateName: initial?.certificate_name || '',
    notes: initial?.notes || '',
  });

  const mutation = useMutation({
    mutationFn: (data) => isEdit
      ? api.patch(`/training/my/${initial.id}`, data)
      : api.post('/training/my', data),
    onSuccess: () => { onSaved(); onClose(); },
  });

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const setCheck = k => e => setForm(f => ({ ...f, [k]: e.target.checked }));

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({ ...form, hours: form.hours ? parseFloat(form.hours) : undefined });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
          <h2 className="font-semibold text-gray-900">{isEdit ? 'Modifier' : 'Ajouter une formation'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 flex flex-col gap-4">
          <Input label="Titre" value={form.title} onChange={set('title')} required placeholder="Ex : MOOC FM — Coursera" />
          <Input label="Organisme / Plateforme" value={form.provider} onChange={set('provider')} required placeholder="Ex : IFMA, OpenClassrooms…" />

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Catégorie</label>
              <select value={form.category} onChange={set('category')} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                {Object.entries(CAT_META).map(([k, m]) => <option key={k} value={k}>{m.icon} {m.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Statut</label>
              <select value={form.status} onChange={set('status')} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                {Object.entries(STATUS_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
              </select>
            </div>
          </div>

          <Input label="URL (optionnel)" type="url" value={form.url} onChange={set('url')} placeholder="https://…" />

          <div className="grid grid-cols-3 gap-3">
            <Input label="Heures" type="number" step="0.5" min="0" value={form.hours} onChange={set('hours')} placeholder="Ex : 8" />
            <Input label="Début" type="date" value={form.startDate} onChange={set('startDate')} />
            <Input label="Fin" type="date" value={form.endDate} onChange={set('endDate')} />
          </div>

          <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
            <input type="checkbox" id="cert" checked={form.certificateObtained} onChange={setCheck('certificateObtained')} className="w-4 h-4" />
            <label htmlFor="cert" className="text-sm font-medium text-amber-800">Certification / attestation obtenue</label>
          </div>

          {form.certificateObtained && (
            <Input label="Nom de la certification" value={form.certificateName} onChange={set('certificateName')} placeholder="Ex : IFMA FMP, CFC Électricien…" />
          )}

          <Input label="Notes (optionnel)" value={form.notes} onChange={set('notes')} placeholder="Remarques, lien PDF certificat…" />

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Annuler</Button>
            <Button type="submit" loading={mutation.isPending} className="flex-1">{isEdit ? 'Enregistrer' : 'Ajouter'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
