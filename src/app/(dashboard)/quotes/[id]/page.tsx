'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Loading, Badge, Card, Table, Modal, Input } from '@/modules/shared';
import { Tabs } from '@/modules/shared/components/ui/tab';
import { api } from '@/modules/shared/services/api';
import { Quote } from '@/modules/shared/types';
import { formatCurrency } from '@/modules/shared/utils/format';
import { ActivityTimeline } from '@/modules/activities/components/activity-timeline';
import { NotesList } from '@/modules/notes/components/notes-list';

const statusConfig: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  draft: { label: 'Borrador', variant: 'default' },
  sent: { label: 'Enviada', variant: 'primary' },
  approved: { label: 'Aprobada', variant: 'success' },
  rejected: { label: 'Rechazada', variant: 'danger' },
  converted: { label: 'Convertida', variant: 'info' },
};

const tabOptions = [
  { id: 'info', label: 'Información' },
  { id: 'items', label: 'Productos' },
  { id: 'payments', label: 'Pagos' },
  { id: 'activity', label: 'Actividad' },
  { id: 'notes', label: 'Notas' },
];

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [paying, setPaying] = useState(false);
  const [sending, setSending] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [approvalReason, setApprovalReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: 0, method: 'transfer', reference: '', notes: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, pays] = await Promise.all([
        api.get<Quote>(`/quotes/${id}`),
        api.get<any[]>(`/payments/quote/${id}`)
      ]);
      setQuote(res);
      setPayments(pays);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load() }, [load]);

  const handleSend = async () => {
    setSending(true);
    try { await api.post(`/quotes/${id}/send`, {}); load(); } catch {} finally { setSending(false); }
  };

  const handleRequestApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post(`/quotes/${id}/request-approval`, { reason: approvalReason });
      setApprovalOpen(false);
      setApprovalReason('');
      load();
    } catch {} finally { setActionLoading(false); }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try { await api.post(`/quotes/${id}/approve`, {}); load(); } catch {} finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try { await api.post(`/quotes/${id}/reject`, {}); load(); } catch {} finally { setActionLoading(false); }
  };

  const handlePay = async () => {
    setPaying(true);
    try {
      const res = await api.post<{ url: string }>(`/quotes/${id}/pay`, {});
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPaying(false);
    }
  };

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/payments', { ...paymentForm, quoteId: id, amount: Number(paymentForm.amount) });
      setPaymentOpen(false);
      setPaymentForm({ amount: 0, method: 'transfer', reference: '', notes: '' });
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const downloadReceipt = async (paymentId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/payments/${paymentId}/receipt`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <Loading />;
  if (!quote) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Cotización no encontrada</p>
      <Button className="mt-4" onClick={() => router.push('/quotes')}>Volver</Button>
    </div>
  );

  const cfg = statusConfig[quote.status] || { label: quote.status, variant: 'default' as const };

  const itemColumns = [
    { key: 'description', label: 'Descripción' },
    { key: 'quantity', label: 'Cantidad' },
    { key: 'unitPrice', label: 'Precio unit.', render: (i: any) => formatCurrency(i.unitPrice, quote.currency) },
    { key: 'discountPercent', label: 'Dto %', render: (i: any) => i.discountPercent ? `${i.discountPercent}%` : '—' },
    { key: 'total', label: 'Total', render: (i: any) => <span className="font-semibold">{formatCurrency(i.total, quote.currency)}</span> },
  ];

  const paymentColumns = [
    { key: 'date', label: 'Fecha', render: (p: any) => new Date(p.createdAt).toLocaleDateString() },
    { key: 'amount', label: 'Monto', render: (p: any) => <span className="font-semibold text-[var(--success)]">{formatCurrency(p.amount, quote.currency)}</span> },
    { key: 'method', label: 'Método', render: (p: any) => <span className="capitalize">{p.method}</span> },
    { key: 'reference', label: 'Referencia', render: (p: any) => p.reference || '—' },
    { key: 'actions', label: '', render: (p: any) => (
      <Button size="sm" variant="secondary" onClick={() => downloadReceipt(p.id)}>
        Descargar Recibo
      </Button>
    )}
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/quotes')} className="p-2 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)] transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)]">{quote.number}</h1>
            <p className="text-sm text-[var(--text-secondary)]">{quote.lead?.name || 'Sin lead'}</p>
          </div>
          <Badge variant={cfg.variant}>{cfg.label}</Badge>
        </div>
        <div className="flex items-center gap-2">
           <p className="text-2xl font-bold text-[var(--text)] mr-4">{formatCurrency(quote.grandTotal, quote.currency)}</p>
          {(quote.status === 'sent' || quote.status === 'approved') && (
            <Button onClick={handlePay} loading={paying} className="bg-indigo-600 hover:bg-indigo-700">
              <svg className="w-4 h-4 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Pagar con Stripe
            </Button>
          )}
          {quote.status === 'draft' && (
            <>
              <Button variant="secondary" onClick={() => router.push(`/quotes/${id}/edit`)}>Editar</Button>
              <Button onClick={handleSend} loading={sending}>Enviar</Button>
            </>
          )}
          {quote.status === 'sent' && !quote.approvalRequest && (
            <Button onClick={() => setApprovalOpen(true)}>Solicitar aprobación</Button>
          )}
          {quote.approvalRequest?.status === 'pending' && (
            <>
              <Button variant="secondary" onClick={handleReject} loading={actionLoading}>Rechazar</Button>
              <Button onClick={handleApprove} loading={actionLoading}>Aprobar</Button>
            </>
          )}
        </div>
      </div>

      <Card padding={false}>
        <Tabs tabs={tabOptions} active={activeTab} onChange={setActiveTab} />

        <div className="p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="p-4 rounded-xl bg-[var(--bg)]">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Estado</p>
                  <p className="mt-1"><Badge variant={cfg.variant}>{cfg.label}</Badge></p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg)]">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Lead</p>
                  <p className="mt-1 text-sm font-medium text-[var(--text)]">{quote.lead?.name || '—'}</p>
                  {quote.lead?.email && <p className="text-xs text-[var(--text-secondary)]">{quote.lead.email}</p>}
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg)]">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Subtotal</p>
                   <p className="mt-1 text-sm font-medium text-[var(--text)]">{formatCurrency(quote.subtotal, quote.currency)}</p>
                </div>
                {quote.discountPercent ? (
                  <div className="p-4 rounded-xl bg-[var(--bg)]">
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Descuento</p>
                     <p className="mt-1 text-sm font-medium text-[var(--text)]">{quote.discountPercent}% ({formatCurrency(quote.discountTotal, quote.currency)})</p>
                  </div>
                ) : null}
                <div className="p-4 rounded-xl bg-[var(--bg)]">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Impuestos</p>
                   <p className="mt-1 text-sm font-medium text-[var(--text)]">{formatCurrency(quote.taxTotal, quote.currency)}</p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg)]">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Total</p>
                   <p className="mt-1 text-lg font-bold text-[var(--text)]">{formatCurrency(quote.grandTotal, quote.currency)}</p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg)]">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Versión</p>
                  <p className="mt-1 text-sm font-medium text-[var(--text)]">v{quote.version}</p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg)]">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Creado</p>
                  <p className="mt-1 text-sm font-medium text-[var(--text)]">
                    {new Date(quote.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
              {quote.notes && (
                <div className="p-4 rounded-xl bg-[var(--bg)]">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Notas</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{quote.notes}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'items' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Productos ({quote.items.length})</h3>
              <Table columns={itemColumns} data={quote.items} />
              <div className="flex justify-end mt-4 pt-4 border-t border-[var(--border)]">
                <div className="text-right space-y-1">
                   <p className="text-sm text-[var(--text-secondary)]">Subtotal: <span className="font-medium">{formatCurrency(quote.subtotal, quote.currency)}</span></p>
                   {quote.discountPercent ? <p className="text-sm text-[var(--text-secondary)]">Descuento: <span className="font-medium">{formatCurrency(quote.discountTotal, quote.currency)}</span></p> : null}
                   <p className="text-sm text-[var(--text-secondary)]">Impuestos: <span className="font-medium">{formatCurrency(quote.taxTotal, quote.currency)}</span></p>
                   <p className="text-lg font-bold text-[var(--text)]">Total: {formatCurrency(quote.grandTotal, quote.currency)}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Historial de Pagos</h3>
                {quote.status !== 'converted' && (
                  <Button onClick={() => {
                    setPaymentForm({ ...paymentForm, amount: quote.grandTotal - payments.reduce((acc, p) => acc + p.amount, 0) });
                    setPaymentOpen(true);
                  }}>
                    + Registrar Pago
                  </Button>
                )}
              </div>
              
              {payments.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-[var(--border)] rounded-xl">
                  <p className="text-[var(--text-secondary)]">No hay pagos registrados aún.</p>
                </div>
              ) : (
                <>
                  <Table columns={paymentColumns} data={payments} />
                  <div className="flex justify-end mt-4 pt-4 border-t border-[var(--border)]">
                    <div className="text-right space-y-1">
                      <p className="text-sm text-[var(--text-secondary)]">Total Cotización: <span className="font-medium">{formatCurrency(quote.grandTotal, quote.currency)}</span></p>
                      <p className="text-sm text-[var(--text-secondary)]">Total Pagado: <span className="font-medium text-[var(--success)]">{formatCurrency(payments.reduce((acc, p) => acc + p.amount, 0), quote.currency)}</span></p>
                      <p className="text-lg font-bold text-[var(--text)]">Restante: {formatCurrency(quote.grandTotal - payments.reduce((acc, p) => acc + p.amount, 0), quote.currency)}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <ActivityTimeline leadId={quote.leadId} />
          )}

          {activeTab === 'notes' && (
            <NotesList relatedType="quote" relatedId={quote.id} />
          )}
        </div>
      </Card>

      <Modal open={approvalOpen} onClose={() => setApprovalOpen(false)} title="Solicitar aprobación">
        <form onSubmit={handleRequestApproval} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
            <textarea value={approvalReason} onChange={(e) => setApprovalReason(e.target.value)} rows={3} required placeholder="¿Por qué necesita aprobación esta cotización?" className="block w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setApprovalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={actionLoading}>Solicitar</Button>
          </div>
        </form>
      </Modal>

      <Modal open={paymentOpen} onClose={() => setPaymentOpen(false)} title="Registrar Pago">
        <form onSubmit={handleRegisterPayment} className="space-y-4">
          <Input 
            label="Monto a pagar" 
            type="number" 
            step="0.01"
            min="0"
            max={quote.grandTotal - payments.reduce((acc, p) => acc + p.amount, 0)}
            value={paymentForm.amount} 
            onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) })} 
            required 
          />
          <div>
            <label className="block text-sm font-medium text-white mb-1">Método de Pago</label>
            <select
              value={paymentForm.method}
              onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
              className="block w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
            >
              <option value="transfer">Transferencia</option>
              <option value="cash">Efectivo</option>
              <option value="card">Tarjeta</option>
              <option value="other">Otro</option>
            </select>
          </div>
          <Input 
            label="Referencia (Opcional)" 
            value={paymentForm.reference} 
            onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })} 
            placeholder="Ej. #Ticket o Ref. Transferencia" 
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas (Opcional)</label>
            <textarea value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} rows={2} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setPaymentOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={actionLoading}>Registrar Pago</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
