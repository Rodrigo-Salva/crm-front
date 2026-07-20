'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Table, Loading, Badge, Button } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';
import { formatCurrency } from '@/modules/shared/utils/format';

interface Reward {
  id: string;
  referredLead?: { name: string };
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

export default function PortalReferralsPage() {
  const [data, setData] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [referralLink, setReferralLink] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem('portal_contact');
      const contact = stored ? JSON.parse(stored) : null;
      if (contact?.id) {
         setReferralLink(`${window.location.origin}/portal/register?ref=${contact.id}`);
         // Pedimos las recompensas
         const res = await api.get<any>('/referral-rewards/my-rewards');
         setData(Array.isArray(res) ? res : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData() }, [loadData]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    alert('Enlace copiado al portapapeles');
  };

  const columns = [
    { key: 'contact', label: 'Amigo Referido', render: (r: Reward) => <span className="font-medium text-[var(--text)]">{r.referredLead?.name || 'Desconocido'}</span> },
    { key: 'amount', label: 'Recompensa', render: (r: Reward) => <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(r.amount)}</span> },
    { key: 'status', label: 'Estado', render: (r: Reward) => {
        const conf = statusMap[r.status] || { label: r.status, color: 'default' };
        return <Badge variant={conf.color}>{conf.label}</Badge>;
    }},
    { key: 'date', label: 'Fecha', render: (r: Reward) => <span className="text-[var(--text-secondary)]">{new Date(r.createdAt).toLocaleDateString()}</span> },
  ];

  const totalEarned = data.filter(d => d.status === 'paid').reduce((sum, d) => sum + d.amount, 0);
  const totalPending = data.filter(d => d.status === 'pending').reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)] mb-1">Invita y Gana</h1>
        <p className="text-[var(--text-secondary)] text-sm">Comparte tu enlace personal y gana dinero o descuentos por cada amigo que contrate nuestros servicios.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <h3 className="text-sm font-semibold text-[var(--text)] mb-4 uppercase tracking-wider">Tu Enlace Personal</h3>
          <div className="flex gap-2">
            <input 
              type="text" 
              readOnly 
              value={referralLink} 
              className="flex-1 rounded-lg border border-[var(--border)] px-3 py-2 text-sm bg-[var(--bg)] text-[var(--text-secondary)] outline-none"
            />
            <Button onClick={copyToClipboard}>Copiar</Button>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-2">Envíale este enlace a tus amigos. Cuando se registren y contraten, ¡ambos ganan!</p>
        </Card>

        <Card className="flex flex-col justify-center">
           <div className="text-center">
              <p className="text-sm text-[var(--text-secondary)]">Total Ganado</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 my-1">{formatCurrency(totalEarned)}</p>
              {totalPending > 0 && <p className="text-xs text-orange-500 font-medium">{formatCurrency(totalPending)} pendientes de pago</p>}
           </div>
        </Card>
      </div>

      <h2 className="text-lg font-bold text-[var(--text)] mt-8 mb-4">Tus Recompensas</h2>
      <Card padding={false}>
        {loading ? <Loading /> : (
          data.length === 0 ? (
             <div className="p-8 text-center text-[var(--text-secondary)]">Aún no tienes referidos. ¡Comparte tu enlace para empezar a ganar!</div>
          ) : (
            <Table columns={columns} data={data} />
          )
        )}
      </Card>
    </div>
  );
}
