import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCHF } from '@/lib/utils';
import { Calculator, ExternalLink } from 'lucide-react';
import api from '@/lib/api';

const QUARTERS = [1, 2, 3, 4];
const QUARTER_LABELS = { 1: 'T1 (Jan–Mar)', 2: 'T2 (Avr–Jun)', 3: 'T3 (Jul–Sep)', 4: 'T4 (Oct–Déc)' };

export default function VatPanel() {
  const qc = useQueryClient();
  const year = new Date().getFullYear();
  const currentQ = Math.ceil((new Date().getMonth() + 1) / 3);
  const [computing, setComputing] = useState(null);

  const { data: periods } = useQuery({
    queryKey: ['vat-periods'],
    queryFn: () => api.get('/accounting/vat').then(r => r.data),
  });

  const computeMutation = useMutation({
    mutationFn: ({ year, quarter }) => api.post('/accounting/vat/compute', { year, quarter }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vat-periods'] }); setComputing(null); },
  });

  const getPeriod = (q) => periods?.find(p => p.year === year && p.quarter === q);

  const statusColors = { open: 'bg-yellow-100 text-yellow-700', submitted: 'bg-blue-100 text-blue-700', paid: 'bg-green-100 text-green-700' };
  const statusLabels = { open: 'À déclarer', submitted: 'Déclarée', paid: 'Payée' };

  return (
    <div className="flex flex-col gap-6">
      {/* Info TVA */}
      <Card className="border-blue-200 bg-blue-50">
        <CardBody className="flex gap-4 items-start">
          <div className="text-2xl">ℹ️</div>
          <div>
            <p className="text-sm font-semibold text-blue-900">TVA suisse — EI DJA.MAINT</p>
            <p className="text-sm text-blue-700 mt-1">
              Seuil d'assujettissement : <strong>CHF 100'000</strong> de CA/an. Taux standard : <strong>8.1%</strong>.
              Déclarations trimestrielles à soumettre à l'AFC via
              {' '}<a href="https://www.estv.admin.ch" target="_blank" rel="noopener" className="underline font-medium">estv.admin.ch</a>.
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Grille par trimestre */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {QUARTERS.map(q => {
          const p = getPeriod(q);
          const isCurrentOrPast = q <= currentQ;

          return (
            <Card key={q} className={q === currentQ ? 'ring-2 ring-blue-400' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{QUARTER_LABELS[q]} {year}</h3>
                  {q === currentQ && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Trimestre en cours</span>}
                  {p && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[p.status]}`}>{statusLabels[p.status]}</span>}
                </div>
              </CardHeader>
              <CardBody>
                {p ? (
                  <div className="flex flex-col gap-2 text-sm">
                    <Row label="CA HT" value={formatCHF(p.revenue_ht)} />
                    <Row label="TVA collectée" value={formatCHF(p.vat_collected)} className="text-green-700" />
                    <Row label="Charges HT" value={formatCHF(p.expenses_ht)} />
                    <Row label="TVA déductible" value={formatCHF(p.vat_deductible)} className="text-red-700" />
                    <div className="border-t pt-2 mt-1">
                      <Row label="TVA à reverser AFC" value={formatCHF(p.vat_due)} className={`font-bold text-base ${p.vat_due > 0 ? 'text-red-700' : 'text-green-700'}`} />
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button variant="secondary" className="flex-1 text-xs" onClick={() => computeMutation.mutate({ year, quarter: q })}>
                        <Calculator size={14} /> Recalculer
                      </Button>
                      <a href="https://www.estv.admin.ch" target="_blank" rel="noopener"
                        className="flex-1 flex items-center justify-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                        <ExternalLink size={14} /> Déclarer AFC
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-400 mb-3">Non calculé</p>
                    {isCurrentOrPast && (
                      <Button onClick={() => computeMutation.mutate({ year, quarter: q })}
                        loading={computeMutation.isPending}
                        className="text-sm">
                        <Calculator size={14} /> Calculer la TVA
                      </Button>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>
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
