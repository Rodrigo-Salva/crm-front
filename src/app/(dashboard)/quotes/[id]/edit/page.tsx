'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Loading } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';
import { QuoteForm, emptyQuoteForm, QuoteFormValue } from '@/modules/quotes/components/quote-form';
import { Quote } from '@/modules/shared/types';

export default function EditQuotePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<QuoteFormValue>(emptyQuoteForm);
  const [status, setStatus] = useState('draft');

  const load = useCallback(async () => {
    try {
      const res = await api.get<Quote>(`/quotes/${id}`);
      setStatus(res.status);
      setForm({
        leadId: res.leadId || '',
        leadName: res.lead?.name || '',
        currency: res.currency,
        notes: res.notes || '',
        discountPercent: res.discountPercent || 0,
        taxPercent: 0,
        items: res.items.map((i) => ({
          productId: i.productId,
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discountPercent: i.discountPercent || 0,
        })),
      });
    } catch {} finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await api.patch(`/quotes/${id}`, {
        leadId: form.leadId,
        currency: form.currency,
        notes: form.notes || undefined,
        discountPercent: form.discountPercent || undefined,
        taxPercent: form.taxPercent || undefined,
        items: form.items.map((i) => ({
          productId: i.productId,
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discountPercent: i.discountPercent || undefined,
        })),
      });
      router.push(`/quotes/${id}`);
    } catch {} finally { setSaving(false); }
  };

  if (loading) return <Loading />;

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)]">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <h1 className="text-2xl font-bold text-[var(--text)]">Editar Cotización</h1>
      </div>
      {status !== 'draft' ? (
        <div className="p-6 rounded-xl bg-[var(--bg)] text-center">
          <p className="text-sm text-[var(--text-secondary)]">Solo las cotizaciones en estado &quot;Borrador&quot; pueden editarse.</p>
          <Button className="mt-4" variant="secondary" onClick={() => router.push(`/quotes/${id}`)}>Volver al detalle</Button>
        </div>
      ) : (
        <QuoteForm value={form} onChange={setForm} onSubmit={handleSubmit} onCancel={() => router.back()} saving={saving} submitLabel="Guardar Cambios" />
      )}
    </div>
  );
}
