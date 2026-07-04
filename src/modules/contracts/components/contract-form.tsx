'use client';

import { useState } from 'react';
import { Button, Card, Input } from '@/modules/shared';
import { SearchSelect } from '@/modules/shared/components/ui/search-select';
import { Currency } from '@/modules/shared/types';

const CURRENCIES: Currency[] = ['MXN', 'USD', 'EUR', 'CAD', 'GBP', 'ARS', 'CLP', 'COP', 'PEN', 'BRL'];
const INTERVALS = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'yearly', label: 'Anual' },
];

export interface ContractFormValue {
  quoteId: string;
  quoteLabel: string;
  content: string;
  billingInterval: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  amount: number;
  currency: Currency;
  startDate: string;
}

export const emptyContractForm: ContractFormValue = {
  quoteId: '',
  quoteLabel: '',
  content: '',
  billingInterval: 'monthly',
  amount: 0,
  currency: 'MXN',
  startDate: new Date().toISOString().slice(0, 10),
};

interface ContractFormProps {
  value: ContractFormValue;
  onChange: (value: ContractFormValue) => void;
  onSubmit: () => void;
  onCancel: () => void;
  saving: boolean;
  submitLabel: string;
}

export function ContractForm({ value, onChange, onSubmit, onCancel, saving, submitLabel }: ContractFormProps) {
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.quoteId) { setError('Selecciona una cotización aprobada o convertida'); return; }
    if (!value.content.trim()) { setError('El contenido del contrato es obligatorio'); return; }
    if (!value.amount || value.amount <= 0) { setError('El monto de la suscripción debe ser mayor a 0'); return; }
    setError('');
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SearchSelect
            label="Cotización (aprobada o convertida)"
            placeholder="Buscar cotización..."
            value={value.quoteId}
            onChange={(id, name) => onChange({ ...value, quoteId: id, quoteLabel: name })}
            endpoint="/quotes"
            displayLabel={(q) => q.number}
            displaySub={(q) => q.lead?.name || ''}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de inicio</label>
            <input
              type="date"
              value={value.startDate}
              onChange={(e) => onChange({ ...value, startDate: e.target.value })}
              className="block w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
            />
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-[var(--text)] mb-4">Términos de facturación recurrente</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia</label>
            <select
              value={value.billingInterval}
              onChange={(e) => onChange({ ...value, billingInterval: e.target.value as ContractFormValue['billingInterval'] })}
              className="block w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
            >
              {INTERVALS.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
            </select>
          </div>
          <Input label="Monto por ciclo" type="number" min="0" step="0.01" value={String(value.amount)} onChange={(e) => onChange({ ...value, amount: Number(e.target.value) || 0 })} />
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Contenido del contrato</label>
        <textarea
          value={value.content}
          onChange={(e) => onChange({ ...value, content: e.target.value })}
          rows={10}
          placeholder="Términos y condiciones del contrato..."
          className="block w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] font-mono"
        />
      </Card>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={saving}>{submitLabel}</Button>
      </div>
    </form>
  );
}
