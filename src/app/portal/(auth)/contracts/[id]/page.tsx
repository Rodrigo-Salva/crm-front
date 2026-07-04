'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Loading, Card } from '@/modules/shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function apiGet(path: string) {
  const token = localStorage.getItem('portal_token');
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Unauthorized');
  return res.json();
}

async function apiPost(path: string) {
  const token = localStorage.getItem('portal_token');
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Request failed');
  return res.json();
}

const statusColor: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-50 text-blue-700',
  accepted: 'bg-green-50 text-green-700',
  active: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
  expired: 'bg-yellow-50 text-yellow-700',
};

const statusLabel: Record<string, string> = {
  draft: 'Borrador',
  sent: 'Pendiente de firma',
  accepted: 'Aceptado',
  active: 'Activo',
  cancelled: 'Cancelado',
  expired: 'Expirado',
};

export default function PortalContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    apiGet(`/contracts/${id}`).then(setContract)
      .catch(() => router.push('/portal/contracts'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load() }, [id]);

  const handleAccept = async () => {
    setAccepting(true);
    setError('');
    try {
      await apiPost(`/contracts/${id}/accept`);
      load();
    } catch {
      setError('No se pudo aceptar el contrato. Intenta de nuevo.');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) return <Loading />;
  if (!contract) return null;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/portal/contracts')} className="p-2 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-gray-100 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-[var(--text)]">Contrato {contract.number}</h1>
        </div>
        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${statusColor[contract.status] || 'bg-gray-100 text-gray-700'}`}>
          {statusLabel[contract.status] || contract.status}
        </span>
      </div>

      <Card>
        <h3 className="text-sm font-semibold text-[var(--text)] mb-3">Contenido del contrato</h3>
        <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{contract.content}</p>
      </Card>

      {(contract.status === 'accepted' || contract.status === 'active') ? (
        <Card>
          <p className="text-sm font-semibold text-[var(--success)]">Ya aceptaste este contrato</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Fecha: {contract.acceptedAt ? new Date(contract.acceptedAt).toLocaleString() : '—'}
          </p>
        </Card>
      ) : contract.status === 'sent' ? (
        <Card>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Al hacer clic en "Aceptar contrato" confirmas que has leído y aceptas los términos anteriores. Se registrará tu aceptación con fecha, hora e IP.
          </p>
          {error && <p className="text-sm text-[var(--danger)] mb-3">{error}</p>}
          <Button onClick={handleAccept} loading={accepting}>Aceptar contrato</Button>
        </Card>
      ) : (
        <Card>
          <p className="text-sm text-[var(--text-secondary)]">Este contrato aún no ha sido enviado para firma.</p>
        </Card>
      )}
    </div>
  );
}
