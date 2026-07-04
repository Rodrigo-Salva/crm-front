'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/modules/shared/services/api';
import { QuoteForm, emptyQuoteForm, QuoteFormValue } from '@/modules/quotes/components/quote-form';
import { Quote } from '@/modules/shared/types';

export default function CreateQuotePage() {
  const router = useRouter();
  const [form, setForm] = useState<QuoteFormValue>(emptyQuoteForm);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await api.post<Quote>('/quotes', {
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
      router.push(`/quotes/${res.id}`);
    } catch {} finally { setSaving(false); }
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)]">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <h1 className="text-2xl font-bold text-[var(--text)]">Nueva Cotización</h1>
      </div>
      <QuoteForm value={form} onChange={setForm} onSubmit={handleSubmit} onCancel={() => router.back()} saving={saving} submitLabel="Crear Cotización" />
    </div>
  );
}
