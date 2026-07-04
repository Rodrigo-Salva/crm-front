'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Loading, Badge, Card, Table } from '@/modules/shared';
import { Tabs } from '@/modules/shared/components/ui/tab';
import { api } from '@/modules/shared/services/api';
import { Contract, Invoice } from '@/modules/shared/types';
import { formatCurrency } from '@/modules/shared/utils/format';

const statusConfig: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  draft: { label: 'Borrador', variant: 'default' },
  sent: { label: 'Enviado', variant: 'primary' },
  accepted: { label: 'Aceptado', variant: 'success' },
  active: { label: 'Activo', variant: 'success' },
  cancelled: { label: 'Cancelado', variant: 'danger' },
  expired: { label: 'Expirado', variant: 'warning' },
};

const invoiceStatusConfig: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  pending: { label: 'Pendiente', variant: 'default' },
  sent: { label: 'Enviada', variant: 'primary' },
  paid: { label: 'Pagada', variant: 'success' },
  overdue: { label: 'Vencida', variant: 'danger' },
  cancelled: { label: 'Cancelada', variant: 'warning' },
};

const tabOptions = [
  { id: 'info', label: 'Información' },
  { id: 'invoices', label: 'Facturas' },
  { id: 'signature', label: 'Firma' },
];

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [sending, setSending] = useState(false);
  const [sendingInvoiceId, setSendingInvoiceId] = useState<string | null>(null);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Contract>(`/contracts/${id}`);
      setContract(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load() }, [load]);

  const handleSend = async () => {
    setSending(true);
    try { await api.post(`/contracts/${id}/send`, {}); load(); } catch {} finally { setSending(false); }
  };

  const handleSendInvoice = async (invoiceId: string) => {
    setSendingInvoiceId(invoiceId);
    try { await api.post(`/invoices/${invoiceId}/send`, {}); load(); } catch {} finally { setSendingInvoiceId(null); }
  };

  const handleGenerateInvoiceNow = async () => {
    if (!contract?.subscription) return;
    setGeneratingInvoice(true);
    try { await api.post(`/subscriptions/${contract.subscription.id}/generate-invoice`, {}); load(); } catch {} finally { setGeneratingInvoice(false); }
  };

  if (loading) return <Loading />;
  if (!contract) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Contrato no encontrado</p>
      <Button className="mt-4" onClick={() => router.push('/contracts')}>Volver</Button>
    </div>
  );

  const cfg = statusConfig[contract.status] || { label: contract.status, variant: 'default' as const };
  const invoices = contract.subscription?.invoices || [];

  const invoiceColumns = [
    { key: 'number', label: 'Número', render: (i: Invoice) => <span className="font-mono font-medium">{i.number}</span> },
    { key: 'amount', label: 'Monto', render: (i: Invoice) => <span className="font-semibold">{formatCurrency(i.amount, i.currency)}</span> },
    { key: 'status', label: 'Estado', render: (i: Invoice) => { const c = invoiceStatusConfig[i.status] || { label: i.status, variant: 'default' as const }; return <Badge variant={c.variant}>{c.label}</Badge>; } },
    { key: 'dueDate', label: 'Vence', render: (i: Invoice) => new Date(i.dueDate).toLocaleDateString() },
    { key: 'actions', label: '', render: (i: Invoice) => (
      <div className="flex items-center gap-2">
        {(i.status === 'pending' || i.status === 'overdue') && (
          <Button size="sm" variant="secondary" loading={sendingInvoiceId === i.id} onClick={() => handleSendInvoice(i.id)}>Enviar</Button>
        )}
      </div>
    )},
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/contracts')} className="p-2 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)] transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)]">{contract.number}</h1>
            <p className="text-sm text-[var(--text-secondary)]">{contract.lead?.name || 'Sin lead'}</p>
          </div>
          <Badge variant={cfg.variant}>{cfg.label}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {contract.status === 'draft' && (
            <Button onClick={handleSend} loading={sending}>Enviar al cliente</Button>
          )}
        </div>
      </div>

      <Card padding={false}>
        <Tabs tabs={tabOptions} active={activeTab} onChange={setActiveTab} />

        <div className="p-6">
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="p-4 rounded-xl bg-[var(--bg)]">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Estado</p>
                <p className="mt-1"><Badge variant={cfg.variant}>{cfg.label}</Badge></p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg)]">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Cliente</p>
                <p className="mt-1 text-sm font-medium text-[var(--text)]">{contract.lead?.name || '—'}</p>
                {contract.lead?.email && <p className="text-xs text-[var(--text-secondary)]">{contract.lead.email}</p>}
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg)]">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Cotización</p>
                <p className="mt-1 text-sm font-medium text-[var(--text)]">{contract.quote?.number || '—'}</p>
              </div>
              {contract.subscription && (
                <>
                  <div className="p-4 rounded-xl bg-[var(--bg)]">
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Suscripción</p>
                    <p className="mt-1 text-sm font-medium text-[var(--text)]">{formatCurrency(contract.subscription.amount, contract.subscription.currency)} / {contract.subscription.billingInterval}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--bg)]">
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Próxima facturación</p>
                    <p className="mt-1 text-sm font-medium text-[var(--text)]">{new Date(contract.subscription.nextBillingDate).toLocaleDateString()}</p>
                    {contract.subscription.status === 'active' && (
                      <Button size="sm" variant="secondary" className="mt-2" loading={generatingInvoice} onClick={handleGenerateInvoiceNow}>
                        Generar factura ahora
                      </Button>
                    )}
                  </div>
                </>
              )}
              <div className="p-4 rounded-xl bg-[var(--bg)]">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Creado</p>
                <p className="mt-1 text-sm font-medium text-[var(--text)]">
                  {new Date(contract.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div className="md:col-span-2 lg:col-span-3 p-4 rounded-xl bg-[var(--bg)]">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-2">Contenido del contrato</p>
                <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{contract.content}</p>
              </div>
            </div>
          )}

          {activeTab === 'invoices' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Facturas ({invoices.length})</h3>
              {invoices.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-[var(--border)] rounded-xl">
                  <p className="text-[var(--text-secondary)]">Aún no se ha generado ninguna factura.</p>
                </div>
              ) : (
                <Table columns={invoiceColumns} data={invoices} />
              )}
            </div>
          )}

          {activeTab === 'signature' && (
            <div className="space-y-4">
              {contract.status === 'accepted' || contract.status === 'active' ? (
                <div className="p-4 rounded-xl bg-[var(--bg)] space-y-2">
                  <p className="text-sm font-semibold text-[var(--success)]">Contrato aceptado por el cliente</p>
                  <p className="text-xs text-[var(--text-secondary)]">Fecha: {contract.acceptedAt ? new Date(contract.acceptedAt).toLocaleString() : '—'}</p>
                  <p className="text-xs text-[var(--text-secondary)]">IP: {contract.acceptedIp || '—'}</p>
                  <p className="text-xs text-[var(--text-secondary)] break-all">Hash del documento (SHA-256): {contract.documentHash || '—'}</p>
                </div>
              ) : (
                <div className="text-center py-10 border border-dashed border-[var(--border)] rounded-xl">
                  <p className="text-[var(--text-secondary)]">
                    {contract.status === 'draft' ? 'Envía el contrato para que el cliente pueda aceptarlo desde su portal.' : 'Esperando aceptación del cliente desde el portal.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
