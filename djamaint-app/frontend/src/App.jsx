import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginPage from './pages/auth/LoginPage';
import SetupTotpPage from './pages/auth/SetupTotpPage';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/dashboard/DashboardPage';
import ClientsPage from './pages/clients/ClientsPage';
import FacturationPage from './pages/facturation/FacturationPage';
import PipelinePage from './pages/pipeline/PipelinePage';
import AccountingPage from './pages/accounting/AccountingPage';
import FiscalPage from './pages/fiscal/FiscalPage';
import TrainingPage from './pages/training/TrainingPage';
import AgentsPage from './pages/agents/AgentsPage';
import { useAuthStore } from './store/authStore';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/setup-2fa" element={<SetupTotpPage />} />
          <Route path="/" element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="comptabilite" element={<AccountingPage />} />
            <Route path="fiscalite" element={<FiscalPage />} />
            <Route path="formation" element={<TrainingPage />} />
            <Route path="agents" element={<AgentsPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="facturation" element={<FacturationPage />} />
            <Route path="pipeline" element={<PipelinePage />} />
            {/* Modules à venir */}
            <Route path="interventions" element={<ComingSoon title="Interventions" />} />
            <Route path="coffre" element={<ComingSoon title="Coffre sécurisé" />} />
            <Route path="parametres" element={<ComingSoon title="Paramètres" />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function ComingSoon({ title }) {
  return (
    <div className="flex items-center justify-center min-h-screen text-center p-6">
      <div>
        <div className="text-4xl mb-4">🚧</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-500 text-sm">Ce module sera disponible dans le prochain sprint.</p>
      </div>
    </div>
  );
}
