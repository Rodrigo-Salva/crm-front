'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Table, PageHeader, Loading, Card, Badge } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';
import { Invoice } from '@/modules/shared/types';
import { formatCurrency } from '@/modules/shared/utils/format';
import { FilterBar } from '@/modules/shared/components/ui/filter-bar';

const invoiceStatusConfig: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  pending: { label: 'Pendiente', variant: 'default' },
  sent: { label: 'Enviada', variant: 'primary' },
  paid: { label: 'Pagada', variant: 'success' },
  overdue: { label: 'Vencida', variant: 'danger' },
  cancelled: { label: 'Cancelada', variant: 'warning' },
};

export default function InvoicesPage() {
  const router = useRouter();
  const [data, setData] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/invoices');
      setData(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load() }, [load]);

  const handleSend = async (invoiceId: string) => {
    setSendingId(invoiceId);
    try {
      await api.post(`/invoices/${invoiceId}/send`, {});
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setSendingId(null);
    }
  };

  const columns = [
    { key: 'number', label: 'Número', render: (i: Invoice) => <span className="font-mono font-medium">{i.number}</span> },
    { key: 'client', label: 'Cliente', render: (i: any) => <span className="font-medium">{i.subscription?.contract?.lead?.name || '—'}</span> },
    { key: 'amount', label: 'Monto', render: (i: Invoice) => <span className="font-semibold">{formatCurrency(i.amount, i.currency)}</span> },
    { key: 'status', label: 'Estado', render: (i: Invoice) => { const cfg = invoiceStatusConfig[i.status] || { label: i.status, variant: 'default' as const }; return <Badge variant={cfg.variant}>{cfg.label}</Badge>; }},
    { key: 'dueDate', label: 'Vence', render: (i: Invoice) => <span className="text-[var(--text-secondary)]">{new Date(i.dueDate).toLocaleDateString()}</span> },
    { key: 'sentAt', label: 'Enviado', render: (i: Invoice) => <span className="text-[var(--text-secondary)]">{i.sentAt ? new Date(i.sentAt).toLocaleDateString() : '—'}</span> },
    { key: 'actions', label: '', render: (i: Invoice) => (
      <div className="flex items-center gap-1">
        {(i.status === 'pending' || i.status === 'overdue') && (
          <Button size="sm" variant="secondary" loading={sendingId === i.id} onClick={() => handleSend(i.id)}>Enviar/Reintentar</Button>
        )}
      </div>
    )},
  ];

  const filteredData = data.filter(i => {
    if (filters.status && i.status !== filters.status) return false;
    return true;
  });

  const totalPending = data.filter(i => i.status === 'pending' || i.status === 'overdue').reduce((acc, i) => acc + i.amount, 0);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Facturación" description="Gestiona todas tus facturas y comprobantes emitidos" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-gradient-to-br from-[var(--secondary)] to-[var(--card-bg)] border border-red-500/20">
          <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-semibold mb-1">Monto por Cobrar (Pendiente/Vencido)</p>
          <p className="text-3xl font-bold text-red-400">{formatCurrency(totalPending, 'MXN')}</p>
        </Card>
        <Card className="p-6 bg-[var(--secondary)]">
          <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-semibold mb-1">Total Facturas Emitidas</p>
          <p className="text-3xl font-bold text-white">{data.length}</p>
        </Card>
      </div>

      <Card padding={false}>
        <div className="p-4 border-b border-[var(--border)]">
          <FilterBar
            fields={[
              { key: 'status', label: 'Estado', type: 'select', options: [
                { value: 'pending', label: 'Pendiente' }, { value: 'sent', label: 'Enviada' }, { value: 'paid', label: 'Pagada' }, { value: 'overdue', label: 'Vencida' }, { value: 'cancelled', label: 'Cancelada' }
              ]},
            ]}
            values={filters}
            onChange={(v) => { setFilters(v) }}
            onClear={() => { setFilters({}) }}
          />
        </div>
        
        {loading ? <Loading /> : <Table columns={columns} data={filteredData} />}
      </Card>
    </div>
  );
}
