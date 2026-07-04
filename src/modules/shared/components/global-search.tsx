'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/modules/shared/services/api';

interface SearchResult {
  type: 'company' | 'ticket' | 'product' | 'lead' | 'quote' | 'campaign' | 'task';
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
      const [companies, tickets, products, leads, quotes, campaigns, tasks] = await Promise.all([
        api.get<any>(`/companies?search=${encodeURIComponent(q)}&limit=5`).catch(() => ({ data: [] })),
        api.get<any>(`/tickets?search=${encodeURIComponent(q)}&limit=5`).catch(() => ({ data: [] })),
        api.get<any>(`/products?search=${encodeURIComponent(q)}&limit=5`).catch(() => ({ data: [] })),
        api.get<any>(`/leads?search=${encodeURIComponent(q)}&limit=5`).catch(() => ({ data: [] })),
        api.get<any>(`/quotes?search=${encodeURIComponent(q)}`).catch(() => []),
        api.get<any>(`/campaigns?search=${encodeURIComponent(q)}`).catch(() => []),
        api.get<any>(`/tasks?search=${encodeURIComponent(q)}&limit=5`).catch(() => []),
      ]);

      const items: SearchResult[] = [
        ...(Array.isArray(companies?.data) ? companies.data.map((c: any) => ({ type: 'company' as const, id: c.id, label: c.name, subtitle: c.industry || '', href: `/companies/${c.id}` })) : []),
        ...(Array.isArray(tickets?.data) ? tickets.data.map((t: any) => ({ type: 'ticket' as const, id: t.id, label: t.subject || t.title, subtitle: t.status || '', href: `/tickets/${t.id}` })) : []),
        ...(Array.isArray(products?.data) ? products.data.map((p: any) => ({ type: 'product' as const, id: p.id, label: p.name, subtitle: `$${p.price}`, href: `/products/${p.id}` })) : []),
        ...(Array.isArray(leads?.data) ? leads.data.map((l: any) => ({ type: 'lead' as const, id: l.id, label: l.name, subtitle: l.email || l.company || '', href: `/leads/${l.id}` })) : []),
        ...(Array.isArray(quotes) ? quotes.map((q: any) => ({ type: 'quote' as const, id: q.id, label: q.number, subtitle: q.lead?.name || '', href: `/quotes/${q.id}` })) : []),
        ...(Array.isArray(campaigns) ? campaigns.map((c: any) => ({ type: 'campaign' as const, id: c.id, label: c.name, subtitle: c.subject || '', href: `/campaigns/${c.id}` })) : []),
        ...(Array.isArray(tasks) ? tasks.map((t: any) => ({ type: 'task' as const, id: t.id, label: t.title, subtitle: t.status || '', href: `/tasks/${t.id}` })) : []),
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
    company: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    ticket: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z',
    product: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    lead: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
    quote: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    campaign: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
    task: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--input)] border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--sidebar-hover)] transition-colors w-80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <span className="flex-1 text-left">Buscar en CRM...</span>
        <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-[var(--card-bg)] border border-[var(--border)] rounded">Ctrl+K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={() => { setOpen(false); setQuery(''); }}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-xl bg-[var(--card-bg)] rounded-xl shadow-2xl border border-[var(--border)] overflow-hidden animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 border-b border-[var(--border)]">
              <svg className="w-5 h-5 text-[var(--text-secondary)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar leads, cotizaciones..." className="flex-1 h-12 text-sm bg-transparent outline-none text-[var(--text)] placeholder:text-[var(--text-secondary)]" />
              {loading && <div className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />}
              <kbd className="text-[10px] text-[var(--text-secondary)] bg-[var(--sidebar-hover)] px-1.5 py-0.5 rounded border border-[var(--border)]">ESC</kbd>
            </div>

            {results.length > 0 && (
              <div className="max-h-80 overflow-y-auto p-2">
                {results.slice(0, 10).map((r) => (
                  <button key={`${r.type}-${r.id}`} onClick={() => navigate(r.href)} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-[var(--sidebar-hover)] transition-colors text-left">
                    <div className="w-8 h-8 rounded-lg bg-[var(--sidebar-hover)] flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={typeIcons[r.type]} /></svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--text)] truncate">{r.label}</p>
                      <p className="text-xs text-[var(--text-secondary)] truncate">{r.subtitle}</p>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] bg-[var(--sidebar-hover)] border border-[var(--border)] px-1.5 py-0.5 rounded">{r.type}</span>
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
                Busca en empresas, tickets, productos, leads, cotizaciones, campañas y tareas
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

