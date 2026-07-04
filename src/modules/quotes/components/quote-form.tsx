'use client';

import { useState } from 'react';
import { Button, Card, Input } from '@/modules/shared';
import { SearchSelect } from '@/modules/shared/components/ui/search-select';
import { formatCurrency } from '@/modules/shared/utils/format';
import { Currency } from '@/modules/shared/types';

const CURRENCIES: Currency[] = ['MXN', 'USD', 'EUR', 'CAD', 'GBP', 'ARS', 'CLP', 'COP', 'PEN', 'BRL'];

export interface QuoteFormItem {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
}

export interface QuoteFormValue {
  leadId: string;
  leadName: string;
  currency: Currency;
  notes: string;
  discountPercent: number;
  taxPercent: number;
  items: QuoteFormItem[];
}

export const emptyQuoteForm: QuoteFormValue = {
  leadId: '',
  leadName: '',
  currency: 'MXN',
  notes: '',
  discountPercent: 0,
  taxPercent: 0,
  items: [{ description: '', quantity: 1, unitPrice: 0, discountPercent: 0 }],
};

interface QuoteFormProps {
  value: QuoteFormValue;
  onChange: (value: QuoteFormValue) => void;
  onSubmit: () => void;
  onCancel: () => void;
  saving: boolean;
  submitLabel: string;
}

export function QuoteForm({ value, onChange, onSubmit, onCancel, saving, submitLabel }: QuoteFormProps) {
  const [error, setError] = useState('');

  const updateItem = (index: number, patch: Partial<QuoteFormItem>) => {
    const items = value.items.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChange({ ...value, items });
  };

  const addItem = () => {
    onChange({ ...value, items: [...value.items, { description: '', quantity: 1, unitPrice: 0, discountPercent: 0 }] });
  };

  const removeItem = (index: number) => {
    onChange({ ...value, items: value.items.filter((_, i) => i !== index) });
  };

  const itemTotal = (item: QuoteFormItem) => item.quantity * item.unitPrice * (1 - (item.discountPercent || 0) / 100);
  const subtotal = value.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const itemDiscount = value.items.reduce((sum, i) => sum + (i.quantity * i.unitPrice * (i.discountPercent || 0)) / 100, 0);
  const headerDiscount = subtotal * ((value.discountPercent || 0) / 100);
  const discountTotal = itemDiscount + headerDiscount;
  const taxableAmount = subtotal - discountTotal;
  const taxTotal = taxableAmount * ((value.taxPercent || 0) / 100);
  const grandTotal = taxableAmount + taxTotal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.leadId) { setError('Selecciona un lead'); return; }
    if (value.items.length === 0 || value.items.some((i) => !i.description.trim())) {
      setError('Cada producto necesita una descripción');
      return;
    }
    setError('');
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SearchSelect
            label="Lead"
            placeholder="Buscar lead..."
            value={value.leadId}
            onChange={(id, name) => onChange({ ...value, leadId: id, leadName: name })}
            endpoint="/leads"
            displayLabel={(item) => item.name}
            displaySub={(item) => item.email || ''}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
            <select
              value={value.currency}
              onChange={(e) => onChange({ ...value, currency: e.target.value as Currency })}
              className="block w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
            >
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--text)]">Productos</h3>
          <Button type="button" variant="secondary" onClick={addItem}>+ Agregar producto</Button>
        </div>
        <div className="space-y-3">
          {value.items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 rounded-lg bg-[var(--bg)]">
              <div className="col-span-12 md:col-span-4">
                <SearchSelect
                  label="Producto (opcional)"
                  placeholder="Buscar producto..."
                  value={item.productId || ''}
                  onChange={(id, name) => updateItem(index, {
                    productId: id || undefined,
                    description: name || item.description,
                  })}
                  endpoint="/products"
                  displayLabel={(p) => p.name}
                  displaySub={(p) => p.sku || ''}
                />
              </div>
              <div className="col-span-12 md:col-span-3">
                <Input label="Descripción" value={item.description} onChange={(e) => updateItem(index, { description: e.target.value })} required placeholder="Descripción del producto/servicio" />
              </div>
              <div className="col-span-4 md:col-span-1">
                <Input label="Cant." type="number" min="0" step="1" value={String(item.quantity)} onChange={(e) => updateItem(index, { quantity: Number(e.target.value) || 0 })} />
              </div>
              <div className="col-span-4 md:col-span-2">
                <Input label="Precio unit." type="number" min="0" step="0.01" value={String(item.unitPrice)} onChange={(e) => updateItem(index, { unitPrice: Number(e.target.value) || 0 })} />
              </div>
              <div className="col-span-3 md:col-span-1">
                <Input label="Dto %" type="number" min="0" max="100" step="1" value={String(item.discountPercent)} onChange={(e) => updateItem(index, { discountPercent: Number(e.target.value) || 0 })} />
              </div>
              <div className="col-span-1 flex justify-end">
                <button type="button" onClick={() => removeItem(index)} disabled={value.items.length === 1} className="p-2 rounded-lg text-gray-400 hover:text-[var(--danger)] hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
              <div className="col-span-12 text-right text-xs text-[var(--text-secondary)]">
                Total línea: <span className="font-medium">{formatCurrency(itemTotal(item), value.currency)}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Input label="Descuento general %" type="number" min="0" max="100" step="1" value={String(value.discountPercent)} onChange={(e) => onChange({ ...value, discountPercent: Number(e.target.value) || 0 })} />
          <Input label="Impuesto %" type="number" min="0" max="100" step="1" value={String(value.taxPercent)} onChange={(e) => onChange({ ...value, taxPercent: Number(e.target.value) || 0 })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
          <textarea value={value.notes} onChange={(e) => onChange({ ...value, notes: e.target.value })} rows={3} placeholder="Notas adicionales..." className="block w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]" />
        </div>
        <div className="flex justify-end mt-4 pt-4 border-t border-[var(--border)]">
          <div className="text-right space-y-1">
            <p className="text-sm text-[var(--text-secondary)]">Subtotal: <span className="font-medium">{formatCurrency(subtotal, value.currency)}</span></p>
            {discountTotal > 0 && <p className="text-sm text-[var(--text-secondary)]">Descuento: <span className="font-medium">{formatCurrency(discountTotal, value.currency)}</span></p>}
            <p className="text-sm text-[var(--text-secondary)]">Impuestos: <span className="font-medium">{formatCurrency(taxTotal, value.currency)}</span></p>
            <p className="text-lg font-bold text-[var(--text)]">Total: {formatCurrency(grandTotal, value.currency)}</p>
          </div>
        </div>
      </Card>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={saving}>{submitLabel}</Button>
      </div>
    </form>
  );
}
