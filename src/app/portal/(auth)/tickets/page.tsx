'use client';

import { useState, useEffect, useCallback } from 'react';
import { Table, PageHeader, Loading, Card, Badge } from '@/modules/shared';
import { Ticket } from '@/modules/shared/types';

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
  open: { label: 'Abierto', variant: 'success' },
  in_progress: { label: 'En Progreso', variant: 'warning' },
  resolved: { label: 'Resuelto', variant: 'primary' },
  closed: { label: 'Cerrado', variant: 'default' },
};

export default function PortalTicketsPage() {
  const [data, setData] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet('/tickets');
      setData(Array.isArray(res) ? res : []);
    } catch { setData([]) }
    finally { setLoading(false) }
  }, []);

  useEffect(() => { load() }, [load]);

  const columns = [
    { key: 'number', label: '#', render: (t: any) => (
      <span className="font-mono font-medium text-[var(--primary)]">#{t.number}</span>
    )},
    { key: 'subject', label: 'Asunto', render: (t: Ticket) => (
      <span className="font-medium">{t.subject}</span>
    )},
    { key: 'status', label: 'Estado', render: (t: Ticket) => {
      const cfg = statusConfig[t.status] || { label: t.status, variant: 'default' as const };
      return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
    }},
    { key: 'createdAt', label: 'Creado', render: (t: Ticket) => (
      <span className="text-[var(--text-secondary)]">{new Date(t.createdAt).toLocaleDateString()}</span>
    )},
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Mis Tickets" description="Seguimiento de tus solicitudes de soporte" />
      <Card padding={false}>
        {loading ? <Loading /> : <Table columns={columns} data={data} />}
      </Card>
    </div>
  );
}
