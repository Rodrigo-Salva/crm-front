'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/modules/shared/services/api';

interface SearchResult {
  type: 'contact' | 'deal' | 'company' | 'ticket' | 'product';
  id: string;
  label: string;
  subtitle: string;
  href: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setOpen((p) => !p); }
      if (e.key === 'Escape') { setOpen(false); setQuery(''); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const [contacts, deals, companies, tickets, products] = await Promise.all([
        api.get<any>(`/contacts?search=${encodeURIComponent(q)}&limit=5`).catch(() => ({ data: [] })),
        api.get<any>(`/deals?search=${encodeURIComponent(q)}&limit=5`).catch(() => ({ data: [] })),
        api.get<any>(`/companies?search=${encodeURIComponent(q)}&limit=5`).catch(() => ({ data: [] })),
        api.get<any>(`/tickets?search=${encodeURIComponent(q)}&limit=5`).catch(() => ({ data: [] })),
        api.get<any>(`/products?search=${encodeURIComponent(q)}&limit=5`).catch(() => ({ data: [] })),
      ]);

      const items: SearchResult[] = [
        ...(Array.isArray(contacts?.data) ? contacts.data.map((c: any) => ({ type: 'contact' as const, id: c.id, label: c.name, subtitle: c.email || '', href: `/contacts/${c.id}` })) : []),
        ...(Array.isArray(deals?.data) ? deals.data.map((d: any) => ({ type: 'deal' as const, id: d.id, label: d.title, subtitle: d.contact?.name || `$${d.value}`, href: `/deals/${d.id}` })) : []),
        ...(Array.isArray(companies?.data) ? companies.data.map((c: any) => ({ type: 'company' as const, id: c.id, label: c.name, subtitle: c.industry || '', href: `/companies/${c.id}` })) : []),
        ...(Array.isArray(tickets?.data) ? tickets.data.map((t: any) => ({ type: 'ticket' as const, id: t.id, label: t.subject || t.title, subtitle: t.status || '', href: `/tickets/${t.id}` })) : []),
        ...(Array.isArray(products?.data) ? products.data.map((p: any) => ({ type: 'product' as const, id: p.id, label: p.name, subtitle: `$${p.price}`, href: `/products/${p.id}` })) : []),
      ];
      setResults(items);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const navigate = (href: string) => {
    setOpen(false); setQuery('');
    router.push(href);
  };

  const typeIcons: Record<string, string> = {
    contact: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    deal: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    company: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    ticket: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z',
    product: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-gray-100 transition-colors w-80">
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <span className="flex-1 text-left">Buscar en CRM...</span>
        <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-white border border-[var(--border)] rounded">Ctrl+K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={() => { setOpen(false); setQuery(''); }}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-[var(--border)] overflow-hidden animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 border-b border-[var(--border)]">
              <svg className="w-5 h-5 text-[var(--text-secondary)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar contactos, negocios, empresas..." className="flex-1 h-12 text-sm bg-transparent outline-none text-[var(--text)] placeholder:text-[var(--text-secondary)]" />
              {loading && <div className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />}
              <kbd className="text-[10px] text-[var(--text-secondary)] bg-gray-50 px-1.5 py-0.5 rounded border">ESC</kbd>
            </div>

            {results.length > 0 && (
              <div className="max-h-80 overflow-y-auto p-2">
                {results.slice(0, 10).map((r) => (
                  <button key={`${r.type}-${r.id}`} onClick={() => navigate(r.href)} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={typeIcons[r.type]} /></svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--text)] truncate">{r.label}</p>
                      <p className="text-xs text-[var(--text-secondary)] truncate">{r.subtitle}</p>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] bg-gray-50 px-1.5 py-0.5 rounded">{r.type}</span>
                  </button>
                ))}
              </div>
            )}

            {query && !loading && results.length === 0 && (
              <div className="p-8 text-center text-sm text-[var(--text-secondary)]">
                Sin resultados para "{query}"
              </div>
            )}

            {!query && (
              <div className="p-4 text-center text-xs text-[var(--text-secondary)]">
                Busca en contactos, negocios, empresas, tickets y productos
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
