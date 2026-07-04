'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Table, PageHeader, Loading, Card, Badge } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';
import { Contract } from '@/modules/shared/types';
import { formatCurrency } from '@/modules/shared/utils/format';

const statusConfig: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  draft: { label: 'Borrador', variant: 'default' },
  sent: { label: 'Enviado', variant: 'primary' },
  accepted: { label: 'Aceptado', variant: 'success' },
  active: { label: 'Activo', variant: 'success' },
  cancelled: { label: 'Cancelado', variant: 'danger' },
  expired: { label: 'Expirado', variant: 'warning' },
};

export default function ContractsPage() {
  const router = useRouter();
  const [data, setData] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Contract[]>('/contracts');
      setData(Array.isArray(res) ? res : []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load() }, [load]);

  const columns = [
    { key: 'number', label: 'Número', render: (c: Contract) => (
      <button onClick={() => router.push(`/contracts/${c.id}`)} className="font-mono font-medium hover:text-[var(--primary)] transition-colors">{c.number}</button>
    )},
    { key: 'lead', label: 'Cliente', render: (c: Contract) => <span className="font-medium">{c.lead?.name || '—'}</span> },
    { key: 'quote', label: 'Cotización', render: (c: Contract) => <span className="text-[var(--text-secondary)]">{c.quote?.number || '—'}</span> },
    { key: 'subscription', label: 'Suscripción', render: (c: Contract) => c.subscription ? (
      <span className="font-medium">{formatCurrency(c.subscription.amount, c.subscription.currency)} / {c.subscription.billingInterval}</span>
    ) : <span className="text-[var(--text-secondary)]">—</span> },
    { key: 'status', label: 'Estado', render: (c: Contract) => { const cfg = statusConfig[c.status] || { label: c.status, variant: 'default' as const }; return <Badge variant={cfg.variant}>{cfg.label}</Badge>; }},
    { key: 'createdAt', label: 'Creado', render: (c: Contract) => <span className="text-[var(--text-secondary)]">{new Date(c.createdAt).toLocaleDateString()}</span> },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Contratos" description="Contratos y suscripciones de ingresos recurrentes" actions={<Button onClick={() => router.push('/contracts/create')}>+ Nuevo Contrato</Button>} />
      <Card padding={false}>
        {loading ? <Loading /> : <Table columns={columns} data={data} />}
      </Card>
    </div>
  );
}
