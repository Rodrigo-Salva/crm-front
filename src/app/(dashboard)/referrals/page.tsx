'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, Table, Loading, Badge, Button } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';
import { formatCurrency } from '@/modules/shared/utils/format';

interface Reward {
  id: string;
  referrerLead?: { id: string; name: string };
  referredLead?: { id: string; name: string };
  quote?: { number: string; grandTotal: number };
  baseAmount: number;
  rate: number;
  amount: number;
  status: string;
  createdAt: string;
  paidAt?: string;
}

const statusMap: Record<string, { label: string; color: any }> = {
  pending: { label: 'Pendiente', color: 'warning' },
  paid: { label: 'Pagado', color: 'success' },
  cancelled: { label: 'Cancelado', color: 'danger' },
};

export default function ReferralsAdminPage() {
  const [data, setData] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/referral-rewards');
      setData(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load() }, [load]);

  const handlePay = async (id: string) => {
    if(!confirm('¿Marcar esta recompensa como pagada?')) return;
    try {
      await api.patch(`/referral-rewards/${id}`, { status: 'paid' });
      load();
    } catch (err) {
      console.error(err);
      alert('Error al actualizar');
    }
  };

  const columns = [
    { key: 'referrer', label: 'Promotor (Cliente)', render: (r: Reward) => (
      <span className="font-medium text-[var(--primary)] cursor-pointer hover:underline">{r.referrerLead?.name || 'Desconocido'}</span>
    )},
    { key: 'referred', label: 'Amigo Referido', render: (r: Reward) => (
      <span className="text-[var(--text)]">{r.referredLead?.name || 'Desconocido'}</span>
    )},
    { key: 'quote', label: 'Venta Origen', render: (r: Reward) => (
      <div className="text-xs">
        <span className="font-mono text-[var(--text-secondary)]">{r.quote?.number}</span>
        <div className="text-[var(--text)] mt-0.5">{formatCurrency(r.quote?.grandTotal || 0)}</div>
      </div>
    )},
    { key: 'amount', label: 'Recompensa', render: (r: Reward) => (
      <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(r.amount)}</span>
    )},
    { key: 'status', label: 'Estado', render: (r: Reward) => {
        const conf = statusMap[r.status] || { label: r.status, color: 'default' };
        return <Badge variant={conf.color}>{conf.label}</Badge>;
    }},
    { key: 'actions', label: '', render: (r: Reward) => (
      <div className="flex items-center gap-2">
        {r.status === 'pending' && (
          <Button size="sm" onClick={() => handlePay(r.id)}>Marcar Pagado</Button>
        )}
      </div>
    )}
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader 
        title="Programa de Referidos" 
        description="Administra las recompensas de tus clientes promotores." 
      />

      <Card padding={false}>
        {loading ? <Loading /> : <Table columns={columns} data={data} />}
      </Card>
    </div>
  );
}
