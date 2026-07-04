'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Table, PageHeader, Loading, Card, Badge } from '@/modules/shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function apiGet(path: string) {
  const token = localStorage.getItem('portal_token');
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Unauthorized');
  return res.json();
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  draft: { label: 'Borrador', variant: 'default' },
  sent: { label: 'Pendiente de firma', variant: 'primary' },
  accepted: { label: 'Aceptado', variant: 'success' },
  active: { label: 'Activo', variant: 'success' },
  cancelled: { label: 'Cancelado', variant: 'danger' },
  expired: { label: 'Expirado', variant: 'warning' },
};

export default function PortalContractsPage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet('/contracts');
      setData(Array.isArray(res) ? res : []);
    } catch { setData([]) }
    finally { setLoading(false) }
  }, []);

  useEffect(() => { load() }, [load]);

  const columns = [
    { key: 'number', label: 'Número', render: (c: any) => (
      <button onClick={() => router.push(`/portal/contracts/${c.id}`)} className="font-mono font-medium hover:text-[var(--primary)] transition-colors">{c.number}</button>
    )},
    { key: 'status', label: 'Estado', render: (c: any) => {
      const cfg = statusConfig[c.status] || { label: c.status, variant: 'default' as const };
      return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
    }},
    { key: 'createdAt', label: 'Fecha', render: (c: any) => (
      <span className="text-[var(--text-secondary)]">{new Date(c.createdAt).toLocaleDateString()}</span>
    )},
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Mis Contratos" description="Consulta y firma tus contratos" />
      <Card padding={false}>
        {loading ? <Loading /> : <Table columns={columns} data={data} />}
      </Card>
    </div>
  );
}
