'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button, Input, PageHeader } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';
import { useAuth } from '@/modules/shared/hooks/useAuth';

export default function SecuritySettingsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const forced = searchParams.get('force') === '1';
  const [qrCode, setQrCode] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const generateQr = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get<{ qrCode: string }>('/auth/2fa/generate');
      setQrCode(res.qrCode);
    } catch (err: any) {
      setError('Error al generar código QR');
    } finally {
      setLoading(false);
    }
  };

  const enable2fa = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post<{ success: boolean; token: string }>('/auth/2fa/enable', { code });
      if (res.token) {
        localStorage.setItem('token', res.token);
      }
      setSuccess('Autenticación de 2 Factores habilitada correctamente.');
      setQrCode('');
      if (forced) {
        setTimeout(() => router.push('/'), 1500);
      }
    } catch (err: any) {
      setError('Código incorrecto. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader 
        title="Seguridad de la Cuenta" 
        description="Gestiona la configuración de seguridad y la autenticación de dos factores (2FA)."
        backHref="/settings"
        backLabel="Volver a Configuración"
      />

      {forced && !success && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500">
          Tu rol requiere autenticación de dos factores obligatoria. Debes configurarla para poder usar el resto del sistema.
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400">
          {success}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
          {error}
        </div>
      )}

      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        <h2 className="text-lg font-medium text-[var(--text)] mb-4">Autenticación de Dos Factores (2FA)</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-2xl">
          Protege tu cuenta con una capa adicional de seguridad. Al iniciar sesión, deberás introducir un código generado por tu aplicación autenticadora.
        </p>

        {!qrCode && !success && (
          <Button onClick={generateQr} loading={loading}>
            Configurar 2FA
          </Button>
        )}

        {qrCode && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="bg-[var(--secondary)] p-4 rounded-xl border border-[var(--border)]">
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
              </div>
              <div className="space-y-4 flex-1">
                <h3 className="font-medium text-[var(--text)]">1. Escanea el código QR</h3>
                <p className="text-sm text-[var(--text-muted)]">
                  Usa una aplicación como Google Authenticator o Authy para escanear el código QR.
                </p>
                
                <h3 className="font-medium text-[var(--text)] mt-6">2. Ingresa el código generado</h3>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Input
                      label="Código de 6 dígitos"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                    />
                  </div>
                  <Button onClick={enable2fa} loading={loading} disabled={code.length !== 6}>
                    Verificar y Activar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

