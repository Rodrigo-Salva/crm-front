'use client';

import { useState } from 'react';
import { Button } from './button';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterField {
  key: string;
  label: string;
  type: 'select' | 'date' | 'text';
  options?: FilterOption[];
}

interface FilterBarProps {
  fields: FilterField[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  onClear: () => void;
}

export function FilterBar({ fields, values, onChange, onClear }: FilterBarProps) {
  const [open, setOpen] = useState(false);
  const hasFilters = Object.values(values).some((v) => v);

  const update = (key: string, val: string) => {
    onChange({ ...values, [key]: val });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen(!open)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${hasFilters ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--celeste-400)] hover:text-[var(--text)]'}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filtros
          {hasFilters && <span className="w-2 h-2 rounded-full bg-[var(--card-bg)]" />}
        </button>
        {hasFilters && (
          <button onClick={onClear} className="text-xs text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors">
            Limpiar filtros
          </button>
        )}
      </div>

      {open && (
        <div className="flex flex-wrap gap-3 p-4 bg-[var(--card-bg)] rounded-lg border border-[var(--border)]">
          {fields.map((field) => (
            <div key={field.key} className="min-w-[160px]">
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">{field.label}</label>
              {field.type === 'select' && field.options ? (
                <select
                  value={values[field.key] || ''}
                  onChange={(e) => update(field.key, e.target.value)}
                  className="block w-full rounded-md border border-[var(--border)] px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
                >
                  <option value="">Todos</option>
                  {field.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : field.type === 'date' ? (
                <input
                  type="date"
                  value={values[field.key] || ''}
                  onChange={(e) => update(field.key, e.target.value)}
                  className="block w-full rounded-md border border-[var(--border)] px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
                />
              ) : (
                <input
                  type="text"
                  value={values[field.key] || ''}
                  onChange={(e) => update(field.key, e.target.value)}
                  placeholder={field.label}
                  className="block w-full rounded-md border border-[var(--border)] px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

