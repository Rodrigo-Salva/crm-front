'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, Table, Loading, Badge, Button } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';
import { formatCurrency } from '@/modules/shared/utils/format';
import { useAuth } from '@/modules/shared/hooks/useAuth';

interface Commission {
  id: string;
  userId: string;
  contractId: string;
  amount: number;
  currency: string;
  percentage: number;
  status: 'pending' | 'paid';
  paidAt?: string;
  createdAt: string;
  user?: { id: string; name: string };
  contract?: { id: string; number: string; lead?: { name: string } };
}

export default function CommissionsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/commissions');
      setData(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handlePay = async (id: string) => {
    setPayingId(id);
    try {
      await api.patch(`/commissions/${id}/pay`, {});
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setPayingId(null);
    }
  };

  const myCommissions = user?.role === 'seller' ? data.filter(c => c.userId === user.id) : data;

  const totalEarned = myCommissions.reduce((acc, c) => acc + c.amount, 0);
  const totalPaid = myCommissions.filter(c => c.status === 'paid').reduce((acc, c) => acc + c.amount, 0);
  const totalPending = totalEarned - totalPaid;

  const columns = [
    { key: 'date', label: 'Fecha', render: (c: Commission) => new Date(c.createdAt).toLocaleDateString() },
    { key: 'contract', label: 'Contrato', render: (c: Commission) => <span className="font-mono text-sm">{c.contract?.number || '—'}</span> },
    { key: 'client', label: 'Cliente', render: (c: Commission) => <span className="font-medium">{c.contract?.lead?.name || '—'}</span> },
    ...(user?.role !== 'seller' ? [{ key: 'seller', label: 'Vendedor', render: (c: Commission) => c.user?.name || '—' }] : []),
    { key: 'percentage', label: '%', render: (c: Commission) => `${c.percentage}%` },
    { key: 'amount', label: 'Monto', render: (c: Commission) => <span className="font-bold text-green-600">{formatCurrency(c.amount, c.currency as any)}</span> },
    { key: 'status', label: 'Estado', render: (c: Commission) => (
      <Badge variant={c.status === 'paid' ? 'success' : 'warning'}>
        {c.status === 'paid' ? 'Pagada' : 'Pendiente'}
      </Badge>
    )},
    { key: 'actions', label: '', render: (c: Commission) => (
      <div className="flex items-center">
        {user?.role === 'admin' && c.status === 'pending' && (
          <Button size="sm" variant="secondary" loading={payingId === c.id} onClick={() => handlePay(c.id)}>
            Marcar Pagada
          </Button>
        )}
      </div>
    )}
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader 
        title={user?.role === 'seller' ? 'Mis Comisiones' : 'Comisiones de Ventas'} 
        description="Gestión y pago de comisiones por contratos cerrados" 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-[var(--secondary)] text-white">
          <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)] font-semibold mb-1">Total Ganado (Mes)</p>
          <p className="text-3xl font-bold">{formatCurrency(totalEarned, 'MXN')}</p>
        </Card>
        <Card className="p-6 border border-green-500/30">
          <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-1">Ya Pagado</p>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(totalPaid, 'MXN')}</p>
        </Card>
        <Card className="p-6 border border-orange-500/30 bg-orange-50/50 dark:bg-orange-900/10">
          <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-1">Por Cobrar</p>
          <p className="text-3xl font-bold text-orange-600">{formatCurrency(totalPending, 'MXN')}</p>
        </Card>
      </div>

      <Card padding={false}>
        {loading ? <Loading /> : <Table columns={columns} data={myCommissions} />}
      </Card>
    </div>
  );
}
