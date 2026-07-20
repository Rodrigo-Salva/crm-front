'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Table, PageHeader, Loading, Card, Badge, ConfirmDialog } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';
import { Subscription } from '@/modules/shared/types';
import { formatCurrency } from '@/modules/shared/utils/format';
import { FilterBar } from '@/modules/shared/components/ui/filter-bar';

const statusConfig: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  active: { label: 'Activa', variant: 'success' },
  paused: { label: 'Pausada', variant: 'warning' },
  cancelled: { label: 'Cancelada', variant: 'danger' },
  expired: { label: 'Expirada', variant: 'default' },
};

export default function SubscriptionsPage() {
  const router = useRouter();
  const [data, setData] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'pause' | 'cancel' | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // In a real app we would pass filters to backend
      const res = await api.get<any>('/subscriptions');
      setData(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load() }, [load]);

  const handleAction = async () => {
    if (!actionId || !actionType) return;
    setSaving(true);
    try {
      await api.patch(`/subscriptions/${actionId}/${actionType}`, {});
      setConfirmOpen(false);
      setActionId(null);
      setActionType(null);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'contract', label: 'Contrato', render: (s: any) => <button onClick={() => router.push(`/contracts/${s.contractId}`)} className="font-mono font-medium hover:text-[var(--primary)] transition-colors">{s.contract?.number || s.contractId}</button> },
    { key: 'client', label: 'Cliente', render: (s: any) => <span className="font-medium">{s.contract?.lead?.name || '—'}</span> },
    { key: 'amount', label: 'Monto', render: (s: Subscription) => <span className="font-semibold">{formatCurrency(s.amount, s.currency)}</span> },
    { key: 'interval', label: 'Frecuencia', render: (s: Subscription) => <span className="capitalize">{s.billingInterval}</span> },
    { key: 'status', label: 'Estado', render: (s: Subscription) => { const cfg = statusConfig[s.status] || { label: s.status, variant: 'default' as const }; return <Badge variant={cfg.variant}>{cfg.label}</Badge>; }},
    { key: 'nextBillingDate', label: 'Próximo Cobro', render: (s: Subscription) => <span className="text-[var(--text-secondary)]">{new Date(s.nextBillingDate).toLocaleDateString()}</span> },
    { key: 'actions', label: '', render: (s: Subscription) => (
      <div className="flex items-center gap-1">
        {s.status === 'active' && (
          <>
            <Button size="sm" variant="secondary" onClick={() => { setActionId(s.id); setActionType('pause'); setConfirmOpen(true); }}>Pausar</Button>
            <Button size="sm" variant="secondary" onClick={() => { setActionId(s.id); setActionType('cancel'); setConfirmOpen(true); }} className="text-red-500 hover:text-red-600">Cancelar</Button>
          </>
        )}
      </div>
    )},
  ];

  const mrr = data.filter(s => s.status === 'active').reduce((acc, s) => {
    let monthly = s.amount;
    if (s.billingInterval === 'yearly') monthly = s.amount / 12;
    if (s.billingInterval === 'quarterly') monthly = s.amount / 3;
    if (s.billingInterval === 'weekly') monthly = s.amount * 4.33;
    return acc + monthly;
  }, 0);

  const activeCount = data.filter(s => s.status === 'active').length;

  const filteredData = data.filter(s => {
    if (filters.status && s.status !== filters.status) return false;
    return true;
  });

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Suscripciones" description="Control de ingresos recurrentes e igualas" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-[var(--secondary)] to-[var(--card-bg)]">
          <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-semibold mb-1">MRR (Ingreso Recurrente)</p>
          <p className="text-3xl font-bold text-white">{formatCurrency(mrr, 'MXN')}</p>
        </Card>
        <Card className="p-6 bg-[var(--secondary)]">
          <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-semibold mb-1">Suscripciones Activas</p>
          <p className="text-3xl font-bold text-white">{activeCount}</p>
        </Card>
        <Card className="p-6 bg-[var(--secondary)]">
          <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-semibold mb-1">Total Histórico</p>
          <p className="text-3xl font-bold text-white">{data.length}</p>
        </Card>
      </div>

      <Card padding={false}>
        <div className="p-4 border-b border-[var(--border)]">
          <FilterBar
            fields={[
              { key: 'status', label: 'Estado', type: 'select', options: [
                { value: 'active', label: 'Activas' }, { value: 'paused', label: 'Pausadas' }, { value: 'cancelled', label: 'Canceladas' }
              ]},
            ]}
            values={filters}
            onChange={(v) => { setFilters(v) }}
            onClear={() => { setFilters({}) }}
          />
        </div>
        
        {loading ? <Loading /> : <Table columns={columns} data={filteredData} />}
      </Card>

      <ConfirmDialog 
        open={confirmOpen} 
        onClose={() => setConfirmOpen(false)} 
        onConfirm={handleAction} 
        loading={saving} 
        title={actionType === 'cancel' ? 'Cancelar Suscripción' : 'Pausar Suscripción'} 
        message={`¿Estás seguro que deseas ${actionType === 'cancel' ? 'cancelar' : 'pausar'} esta suscripción?`} 
      />
    </div>
  );
}
