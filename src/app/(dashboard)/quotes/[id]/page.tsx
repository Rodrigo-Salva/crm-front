'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, PageHeader, Loading, Badge, Card, Table, Modal, Input } from '@/modules/shared';
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
  { id: 'activity', label: 'Actividad' },
  { id: 'notes', label: 'Notas' },
];

const emptyForm = { status: 'draft' as 'draft' | 'sent' | 'approved' | 'rejected' | 'converted', notes: '', currency: '' };

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Quote>(`/quotes/${id}`);
      setQuote(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load() }, [load]);

  const openEdit = () => {
    if (!quote) return;
    setForm({ status: quote.status as any, notes: quote.notes || '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/quotes/${id}`, form);
      setModalOpen(false);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
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
            <p className="text-sm text-[var(--text-secondary)]">{quote.contact?.name || 'Sin contacto'}</p>
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
          <Button variant="secondary" onClick={() => router.push(`/quotes/${id}/edit`)}>Editar</Button>
          <Button variant="secondary" onClick={openEdit}>Editar Rápido</Button>
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
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Contacto</p>
                  <p className="mt-1 text-sm font-medium text-[var(--text)]">{quote.contact?.name || '—'}</p>
                  {quote.contact?.email && <p className="text-xs text-[var(--text-secondary)]">{quote.contact.email}</p>}
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg)]">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Negocio</p>
                  <p className="mt-1 text-sm font-medium text-[var(--text)]">{quote.deal?.title || '—'}</p>
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

          {activeTab === 'activity' && (
            <ActivityTimeline contactId={quote.contactId} />
          )}

          {activeTab === 'notes' && (
            <NotesList relatedType="quote" relatedId={quote.id} />
          )}
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Editar Cotización">
        <form onSubmit={handleSubmit} className="space-y-4">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
             <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]">
               <option value="draft">Borrador</option><option value="sent">Enviada</option><option value="approved">Aprobada</option><option value="rejected">Rechazada</option><option value="converted">Convertida</option>
             </select>
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
             <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value as any })} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]">
               <option value="MXN">MXN</option>
               <option value="USD">USD</option>
               <option value="EUR">EUR</option>
               <option value="CAD">CAD</option>
               <option value="GBP">GBP</option>
               <option value="ARS">ARS</option>
               <option value="CLP">CLP</option>
               <option value="COP">COP</option>
               <option value="PEN">PEN</option>
               <option value="BRL">BRL</option>
             </select>
           </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Notas adicionales..." className="block w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Guardar Cambios</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
