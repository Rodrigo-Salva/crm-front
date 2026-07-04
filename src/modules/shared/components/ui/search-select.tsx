'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '@/modules/shared/services/api';

interface SearchSelectProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (id: string, name: string) => void;
  endpoint: string;
  searchField?: string;
  displayLabel?: (item: any) => string;
  displaySub?: (item: any) => string;
}

export function SearchSelect({
  label,
  placeholder = 'Buscar...',
  value,
  onChange,
  endpoint,
  searchField = 'search',
  displayLabel = (item) => item.name,
  displaySub = (item) => item.email || '',
}: SearchSelectProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedName, setSelectedName] = useState('');
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ [searchField]: q, limit: '10' });
      const res = await api.get<any>(`${endpoint}?${params}`);
      setResults(Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : []);
    } catch { setResults([]); } finally { setLoading(false); }
  }, [endpoint, searchField]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (query.length < 1) { setResults([]); return; }
    timerRef.current = setTimeout(() => search(query), 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, search]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (item: any) => {
    onChange(item.id, displayLabel(item));
    setSelectedName(displayLabel(item));
    setQuery('');
    setOpen(false);
  };

  const handleClear = () => {
    onChange('', '');
    setSelectedName('');
    setQuery('');
  };

  const handleInputChange = (val: string) => {
    setQuery(val);
    setOpen(true);
    if (!val && value) handleClear();
  };

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{label}</label>
      {!selectedName || query ? (
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder={value ? selectedName || placeholder : placeholder}
            className="block w-full rounded-lg border border-[var(--border)] bg-transparent text-[var(--text)] pl-9 pr-3 py-2.5 text-sm shadow-sm transition-all placeholder:text-gray-400 hover:border-[var(--celeste-400)] focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--sidebar-bg)] text-sm">
          <span className="flex-1 font-medium text-[var(--text)]">{selectedName}</span>
          <button onClick={handleClear} className="p-0.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {open && (results.length > 0 || loading) && (
        <div className="absolute z-50 w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg max-h-60 overflow-y-auto divide-y divide-[var(--border)]">
          {loading ? (
            <div className="p-3 text-sm text-[var(--text-muted)] text-center">Buscando...</div>
          ) : (
            results.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full text-left px-4 py-2 hover:bg-[var(--sidebar-hover)] transition-colors group"
              >
                <div className="font-medium text-[var(--text)] group-hover:text-[var(--primary)] transition-colors">{displayLabel(item)}</div>
                {displaySub(item) && <div className="text-xs text-[var(--text-secondary)] mt-0.5">{displaySub(item)}</div>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

