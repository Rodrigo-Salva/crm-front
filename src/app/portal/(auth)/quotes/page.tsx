'use client';

import { useState, useEffect, useCallback } from 'react';
import { Table, PageHeader, Loading, Card, Badge } from '@/modules/shared';
import { Quote } from '@/modules/shared/types';
import { formatCurrency } from '@/modules/shared/utils/format';

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
  sent: { label: 'Enviada', variant: 'primary' },
  approved: { label: 'Aprobada', variant: 'success' },
  rejected: { label: 'Rechazada', variant: 'danger' },
  converted: { label: 'Convertida', variant: 'info' },
};

export default function PortalQuotesPage() {
  const [data, setData] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet('/quotes');
      setData(Array.isArray(res) ? res : []);
    } catch { setData([]) }
    finally { setLoading(false) }
  }, []);

  useEffect(() => { load() }, [load]);

  

  const columns = [
    { key: 'number', label: 'Número', render: (q: Quote) => (
      <span className="font-mono font-medium">{q.number}</span>
    )},
     { key: 'grandTotal', label: 'Total', render: (q: Quote) => (
       <span className="font-semibold">{formatCurrency(q.grandTotal, q.currency)}</span>
     )},
    { key: 'status', label: 'Estado', render: (q: Quote) => {
      const cfg = statusConfig[q.status] || { label: q.status, variant: 'default' as const };
      return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
    }},
    { key: 'createdAt', label: 'Fecha', render: (q: Quote) => (
      <span className="text-[var(--text-secondary)]">{new Date(q.createdAt).toLocaleDateString()}</span>
    )},
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Mis Cotizaciones" description="Consulta el estado de tus cotizaciones" />
      <Card padding={false}>
        {loading ? <Loading /> : <Table columns={columns} data={data} />}
      </Card>
    </div>
  );
}
