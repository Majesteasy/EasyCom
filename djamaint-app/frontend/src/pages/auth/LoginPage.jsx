import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardBody } from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();

  const [step, setStep] = useState('credentials'); // 'credentials' | '2fa'
  const [userId, setUserId] = useState(null);
  const [form, setForm] = useState({ email: '', password: '', token: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCredentials = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email: form.email, password: form.password });
      if (data.requireTotp) {
        setUserId(data.userId);
        setStep('2fa');
      } else {
        setTokens(data.accessToken, data.refreshToken);
        setUser(data.user);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handle2FA = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login/2fa', { userId, token: form.token });
      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Code invalide');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white text-2xl font-bold shadow-lg mb-4">
            DJ
          </div>
          <h1 className="text-2xl font-bold text-gray-900">DJA.MAINT</h1>
          <p className="text-gray-500 text-sm mt-1">Facility Management — Genève</p>
        </div>

        <Card>
          <CardBody className="p-8">
            {step === 'credentials' ? (
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Connexion</h2>
                <form onSubmit={handleCredentials} className="flex flex-col gap-4">
                  <Input
                    label="Email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    required
                  />
                  <Input
                    label="Mot de passe"
                    type="password"
                    autoComplete="current-password"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required
                  />
                  {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
                  <Button type="submit" loading={loading} className="w-full mt-2">
                    Se connecter
                  </Button>
                </form>
              </>
            ) : (
              <>
                <button
                  onClick={() => { setStep('credentials'); setError(''); }}
                  className="text-sm text-blue-600 hover:underline mb-4 flex items-center gap-1"
                >
                  ← Retour
                </button>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Double authentification</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Ouvrez Authy ou Google Authenticator et entrez le code à 6 chiffres.
                </p>
                <form onSubmit={handle2FA} className="flex flex-col gap-4">
                  <Input
                    label="Code 2FA"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    className="text-center text-2xl tracking-widest font-mono"
                    value={form.token}
                    onChange={e => setForm(f => ({ ...f, token: e.target.value.replace(/\D/g, '') }))}
                    required
                  />
                  {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
                  <Button type="submit" loading={loading} className="w-full">
                    Vérifier
                  </Button>
                </form>
              </>
            )}
          </CardBody>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-6">
          Hébergé en Suisse · Données chiffrées AES-256
        </p>
      </div>
    </div>
  );
}
