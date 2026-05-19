import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { formatCHF, formatDate } from '@/lib/utils';
import { TrendingUp, Users, FileText, AlertCircle, Wrench, Clock } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

// Données de démo jusqu'à connexion API réelle
const DEMO_KPI = {
  caMonth: 14250,
  caPending: 8400,
  activeClients: 12,
  relances: 3,
  interventionsMonth: 18,
};

const DEMO_CHART = [
  { month: 'Jan', ca: 9800 }, { month: 'Fév', ca: 11200 }, { month: 'Mar', ca: 8900 },
  { month: 'Avr', ca: 13400 }, { month: 'Mai', ca: 14250 }, { month: 'Jun', ca: 0 },
];

const DEMO_INVOICES = [
  { id: 'F-2025-018', client: 'Immeuble Cornavin SA', amount: 3200, status: 'pending', date: '2025-04-28' },
  { id: 'F-2025-017', client: 'SCI DVMA IMMO', amount: 1850, status: 'paid', date: '2025-04-15' },
  { id: 'F-2025-016', client: 'Résidence Les Acacias', amount: 4200, status: 'overdue', date: '2025-03-30' },
];

const statusBadge = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  overdue: 'bg-red-100 text-red-700',
};
const statusLabel = { paid: 'Payée', pending: 'En attente', overdue: 'En retard' };

function KpiCard({ icon: Icon, label, value, color = 'blue', sub }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <Card>
      <CardBody className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          <Icon size={22} />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </CardBody>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting}, {user?.firstName} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Intl.DateTimeFormat('fr-CH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <KpiCard icon={TrendingUp} label="CA du mois" value={formatCHF(DEMO_KPI.caMonth)} color="blue" sub="Mai 2025" />
        <KpiCard icon={FileText} label="Factures en attente" value={formatCHF(DEMO_KPI.caPending)} color="yellow" />
        <KpiCard icon={Users} label="Clients actifs" value={DEMO_KPI.activeClients} color="green" />
        <KpiCard icon={AlertCircle} label="Relances" value={DEMO_KPI.relances} color="red" sub="à envoyer" />
        <KpiCard icon={Wrench} label="Interventions" value={DEMO_KPI.interventionsMonth} color="purple" sub="ce mois" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graphique CA */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Chiffre d'affaires mensuel (CHF)</h2>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={DEMO_CHART} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${v / 1000}k`} />
                <Tooltip formatter={v => formatCHF(v)} />
                <Bar dataKey="ca" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Agenda du jour */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock size={16} /> Agenda du jour
            </h2>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            {[
              { time: '08:30', title: 'Inspection Cornavin', type: 'Intervention' },
              { time: '11:00', title: 'Appel client Les Acacias', type: 'Appel' },
              { time: '14:00', title: 'Devis Rue de Rive', type: 'Devis' },
            ].map((item, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="text-xs font-mono text-gray-400 w-12 shrink-0 mt-0.5">{item.time}</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.title}</p>
                  <span className="text-xs text-blue-600 bg-blue-50 rounded px-1.5 py-0.5">{item.type}</span>
                </div>
              </div>
            ))}
            <p className="text-xs text-gray-400 text-center mt-2">Connectez Google Calendar pour synchroniser</p>
          </CardBody>
        </Card>

        {/* Dernières factures */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Dernières factures</h2>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
                  <th className="px-6 py-2 font-medium">N°</th>
                  <th className="px-6 py-2 font-medium">Client</th>
                  <th className="px-6 py-2 font-medium">Montant</th>
                  <th className="px-6 py-2 font-medium">Statut</th>
                  <th className="px-6 py-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_INVOICES.map(inv => (
                  <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-3 font-mono text-xs text-gray-600">{inv.id}</td>
                    <td className="px-6 py-3 text-gray-800">{inv.client}</td>
                    <td className="px-6 py-3 font-medium">{formatCHF(inv.amount)}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadge[inv.status]}`}>
                        {statusLabel[inv.status]}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-500">{formatDate(inv.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Alertes */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500" /> Alertes
            </h2>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            {[
              { msg: 'F-2025-016 en retard de 18 jours', type: 'danger' },
              { msg: '3 relances à envoyer ce jour', type: 'warning' },
              { msg: 'Stock filtre HVAC < seuil minimum', type: 'warning' },
            ].map((alert, i) => (
              <div key={i} className={`text-sm rounded-lg px-3 py-2 ${
                alert.type === 'danger' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
              }`}>
                {alert.msg}
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
