import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardBody } from '@/components/ui/Card';
import api from '@/lib/api';

export default function SetupTotpPage() {
  const navigate = useNavigate();
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('setup'); // 'setup' | 'verify'

  useEffect(() => {
    api.post('/auth/2fa/setup')
      .then(({ data }) => { setQrCode(data.qrCodeUrl); setSecret(data.secret); })
      .catch(() => setError('Erreur lors de la génération du QR code'));
  }, []);

  const handleEnable = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/2fa/enable', { token });
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
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white text-2xl font-bold shadow-lg mb-4">DJ</div>
          <h1 className="text-2xl font-bold text-gray-900">DJA.MAINT</h1>
        </div>

        <Card>
          <CardBody className="p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Activer la double authentification</h2>
            <p className="text-sm text-gray-500 mb-6">
              Scannez ce QR code avec <strong>Authy</strong> ou <strong>Google Authenticator</strong>.
            </p>

            {qrCode && (
              <div className="flex justify-center mb-6">
                <img src={qrCode} alt="QR Code 2FA" className="w-48 h-48 rounded-lg border border-gray-200" />
              </div>
            )}

            <details className="mb-6">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                Saisie manuelle (clé secrète)
              </summary>
              <code className="block mt-2 text-xs bg-gray-100 rounded px-3 py-2 break-all font-mono">{secret}</code>
            </details>

            <form onSubmit={handleEnable} className="flex flex-col gap-4">
              <Input
                label="Code de vérification (6 chiffres)"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                className="text-center text-2xl tracking-widest font-mono"
                value={token}
                onChange={e => setToken(e.target.value.replace(/\D/g, ''))}
                required
              />
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <Button type="submit" loading={loading} className="w-full">
                Activer et continuer
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
