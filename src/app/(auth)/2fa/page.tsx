'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/modules/shared';
import { useAuth } from '@/modules/shared/hooks/useAuth';

function TwoFactorForm() {
  const [code, setCode] = useState('');
  const { verify2FA, loading, error } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    
    try {
      await verify2FA(userId, code);
      router.push('/');
    } catch {
      // Error is handled by the hook
    }
  };

  return (
    <div className="w-full max-w-sm animate-fade-in mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#0f172a] mb-4">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Verificación 2FA</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Ingresa el código de 6 dígitos de tu aplicación autenticadora</p>
      </div>

      {error && (
        <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Código de Autenticación</label>
          <div className="relative">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              required
              className="block w-full text-center tracking-[0.5em] font-mono text-xl rounded-xl border border-gray-300 px-4 py-3 shadow-sm transition-all placeholder:text-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
            />
          </div>
        </div>

        <Button type="submit" loading={loading} className="w-full !rounded-xl !py-2.5">
          Verificar
        </Button>
      </form>

      <div className="mt-8 text-center">
        <a href="/login" className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium transition-colors">
          Volver al Login
        </a>
      </div>
    </div>
  );
}

export default function TwoFactorPage() {
  return (
    <div className="flex min-h-full">
      {/* Right side - Form */}
      <div className="w-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-6 py-12">
        <Suspense fallback={<div>Cargando...</div>}>
          <TwoFactorForm />
        </Suspense>
      </div>
    </div>
  );
}
