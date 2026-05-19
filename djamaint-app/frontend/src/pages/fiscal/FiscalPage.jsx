import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCHF } from '@/lib/utils';
import { Calculator, Calendar, BookOpen, ExternalLink, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '@/lib/api';

const TABS = ['Simulateur', 'Calendrier', 'Déductions'];

export default function FiscalPage() {
  const [tab, setTab] = useState('Simulateur');

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fiscalité EI Genève</h1>
        <p className="text-sm text-gray-500 mt-0.5">Simulateur · Calendrier AFC · Guide déductions</p>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-6">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Simulateur' && <SimulateurFiscal />}
      {tab === 'Calendrier' && <CalendrierFiscal />}
      {tab === 'Déductions' && <GuideDeductions />}
    </div>
  );
}

function SimulateurFiscal() {
  const [form, setForm] = useState({ revenue: '', expenses: '', pilier3a: '' });
  const [result, setResult] = useState(null);

  // Simulation auto depuis données réelles
  const { data: current } = useQuery({
    queryKey: ['fiscal-current'],
    queryFn: () => api.get('/fiscal/simulate/current').then(r => r.data),
  });

  const mutation = useMutation({
    mutationFn: (data) => api.post('/fiscal/simulate', data),
    onSuccess: (res) => setResult(res.data),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({ revenue: parseFloat(form.revenue), expenses: parseFloat(form.expenses), pilier3a: parseFloat(form.pilier3a) || 0 });
  };

  const useCurrentData = () => {
    if (current?.bilan) {
      setForm({ revenue: current.bilan.totalRevenue.toFixed(2), expenses: current.bilan.totalExpenses.toFixed(2), pilier3a: '' });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Formulaire */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2"><Calculator size={16} /> Simulateur fiscal EI</h2>
            {current?.bilan && (
              <Button variant="ghost" className="text-xs" onClick={useCurrentData}>
                Utiliser données réelles {current.year}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="Chiffre d'affaires annuel HT (CHF)" type="number" step="100" min="0"
              value={form.revenue} onChange={e => setForm(f => ({ ...f, revenue: e.target.value }))} required
              placeholder="Ex: 80000" />
            <Input label="Charges déductibles totales (CHF)" type="number" step="100" min="0"
              value={form.expenses} onChange={e => setForm(f => ({ ...f, expenses: e.target.value }))} required
              placeholder="Ex: 25000" />
            <div>
              <Input label="3e pilier 3a versé (CHF)" type="number" step="100" min="0" max="7056"
                value={form.pilier3a} onChange={e => setForm(f => ({ ...f, pilier3a: e.target.value }))}
                placeholder={`Max CHF 7'056`} />
              <p className="text-xs text-gray-400 mt-1">Déductible du revenu imposable (max CHF 7'056/an)</p>
            </div>
            <Button type="submit" loading={mutation.isPending} className="w-full">Calculer</Button>
          </form>
        </CardBody>
      </Card>

      {/* Résultat */}
      <div className="flex flex-col gap-4">
        {result ? (
          <>
            <ResultRow label="Bénéfice brut" value={formatCHF(result.grossBenefit)} color={result.grossBenefit >= 0 ? 'green' : 'red'} />
            <Card>
              <CardBody className="flex flex-col gap-2 text-sm">
                <p className="font-semibold text-gray-700 mb-1">Cotisations sociales</p>
                <Row label={`AVS/AI/APG (10.6%)`} value={`- ${formatCHF(result.avsTotal)}`} className="text-red-700" />
                <Row label={`AC (2.2%)`} value={`- ${formatCHF(result.acTotal)}`} className="text-red-700" />
                <Row label="3e pilier déductible" value={`- ${formatCHF(result.pilier3aDeductible)}`} className="text-blue-700" />
              </CardBody>
            </Card>
            <Card>
              <CardBody className="flex flex-col gap-2 text-sm">
                <p className="font-semibold text-gray-700 mb-1">Impôts GE (estimé)</p>
                <Row label="Revenu imposable" value={formatCHF(result.taxableIncome)} />
                <Row label="Impôts canton + IFD (estimé)" value={`- ${formatCHF(result.taxEstimate)}`} className="text-red-700" />
              </CardBody>
            </Card>
            <ResultRow label="Revenu net disponible" value={formatCHF(result.netDisposable)} color="blue" large />

            {result.warning && (
              <div className="flex gap-2 items-start bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                {result.warning}
              </div>
            )}
            {result.sarlRecommended && (
              <div className="flex gap-2 items-start bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <CheckCircle size={16} className="shrink-0 mt-0.5" />
                CA ≥ CHF 100'000 — Transition <strong>EI → Sàrl</strong> recommandée (Art. 777 CO). Consulter un fiduciaire.
              </div>
            )}
            {!result.vatLiable && (
              <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                TVA : CA sous le seuil de CHF 100'000 — pas d'assujettissement obligatoire.
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Entrez vos chiffres et cliquez sur Calculer
          </div>
        )}
      </div>
    </div>
  );
}

function CalendrierFiscal() {
  const { data: events, isLoading } = useQuery({
    queryKey: ['fiscal-calendar'],
    queryFn: () => api.get('/fiscal/calendar').then(r => r.data),
  });

  const typeColors = {
    vat:     'bg-blue-100 text-blue-700',
    tax:     'bg-purple-100 text-purple-700',
    avs:     'bg-orange-100 text-orange-700',
    pilier3a:'bg-green-100 text-green-700',
  };
  const typeLabels = { vat: 'TVA', tax: 'Impôts', avs: 'AVS', pilier3a: '3e Pilier' };

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold flex items-center gap-2"><Calendar size={16} /> Calendrier fiscal AFC Genève</h2>
      </CardHeader>
      <CardBody>
        {isLoading ? <p className="text-gray-400 text-sm">Chargement…</p> : (
          <div className="flex flex-col gap-3">
            {events?.map((e, i) => (
              <div key={i} className={`flex items-start gap-4 p-3 rounded-lg border ${e.overdue ? 'border-red-200 bg-red-50' : e.daysRemaining <= 30 ? 'border-amber-200 bg-amber-50' : 'border-gray-100 bg-gray-50'}`}>
                <div className="text-center w-16 shrink-0">
                  <p className="text-xs text-gray-400">{e.date.slice(0, 7)}</p>
                  <p className={`text-sm font-bold ${e.overdue ? 'text-red-700' : e.daysRemaining <= 30 ? 'text-amber-700' : 'text-gray-700'}`}>
                    {e.overdue ? 'Passée' : `J-${e.daysRemaining}`}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{e.label}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[e.type] || 'bg-gray-100 text-gray-600'}`}>
                    {typeLabels[e.type] || e.type}
                  </span>
                </div>
                {e.link && (
                  <a href={e.link} target="_blank" rel="noopener" className="text-blue-600 hover:text-blue-800">
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function GuideDeductions() {
  const { data } = useQuery({
    queryKey: ['fiscal-deductions'],
    queryFn: () => api.get('/fiscal/deductions').then(r => r.data),
  });

  return (
    <div className="flex flex-col gap-4">
      <Card className="border-green-200 bg-green-50">
        <CardBody className="text-sm text-green-800">
          <p className="font-semibold">💡 3e pilier 3a — plafond {new Date().getFullYear()} : <strong>CHF {data?.pilier3aMax?.toLocaleString('fr-CH')}</strong></p>
          <p className="mt-1">À verser avant le 31 décembre sur un compte bancaire ou d'assurance 3a. Entièrement déductible du revenu imposable.</p>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data?.deductions?.map((d, i) => (
          <Card key={i}>
            <CardBody>
              <p className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <BookOpen size={14} className="text-blue-500" /> {d.category}
              </p>
              <p className="text-sm text-gray-600 mt-1">{d.rules}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardBody className="flex flex-wrap gap-3">
          {[
            { label: 'AFC Genève', href: 'https://www.ge.ch/afc' },
            { label: 'AFC Fédérale (TVA)', href: 'https://www.estv.admin.ch' },
            { label: 'Caisse AVS GE (CGC)', href: 'https://www.cgcglobal.ch' },
            { label: 'SUVA', href: 'https://www.suva.ch' },
            { label: 'OCPM (permis G)', href: 'https://www.ge.ch/ocpm' },
          ].map(l => (
            <a key={l.href} href={l.href} target="_blank" rel="noopener"
              className="flex items-center gap-1 text-sm text-blue-600 hover:underline bg-blue-50 px-3 py-1.5 rounded-lg">
              <ExternalLink size={13} /> {l.label}
            </a>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}

function ResultRow({ label, value, color, large }) {
  const cols = { green: 'text-green-700 bg-green-50 border-green-200', red: 'text-red-700 bg-red-50 border-red-200', blue: 'text-blue-700 bg-blue-50 border-blue-200' };
  return (
    <div className={`flex justify-between items-center border rounded-xl px-4 py-3 ${cols[color]}`}>
      <span className={`font-medium ${large ? 'text-base' : 'text-sm'}`}>{label}</span>
      <span className={`font-bold ${large ? 'text-xl' : 'text-base'}`}>{value}</span>
    </div>
  );
}

function Row({ label, value, className = 'text-gray-700' }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500">{label}</span>
      <span className={className}>{value}</span>
    </div>
  );
}
