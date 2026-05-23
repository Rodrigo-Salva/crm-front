'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SearchInput, Button, Table, PageHeader, Loading, Card, Badge, ConfirmDialog } from '@/modules/shared';
import { FilterBar } from '@/modules/shared/components/ui/filter-bar';
import { api } from '@/modules/shared/services/api';
import { Quote } from '@/modules/shared/types';
import { formatCurrency } from '@/modules/shared/utils/format';

const statusConfig: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  draft: { label: 'Borrador', variant: 'default' },
  sent: { label: 'Enviada', variant: 'primary' },
  approved: { label: 'Aprobada', variant: 'success' },
  rejected: { label: 'Rechazada', variant: 'danger' },
  converted: { label: 'Convertida', variant: 'info' },
};

export default function QuotesPage() {
  const router = useRouter();
  const [data, setData] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      if (search) params.set('search', search);
      const qs = params.toString();
      const res = await api.get<any>(`/quotes${qs ? `?${qs}` : ''}`);
      setData(Array.isArray(res) ? res : []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [filters, search]);

  useEffect(() => { load() }, [load]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try { await api.delete(`/quotes/${deleteId}`); setConfirmOpen(false); setDeleteId(null); load(); } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const columns = [
    { key: 'number', label: 'Número', render: (q: Quote) => <button onClick={() => router.push(`/quotes/${q.id}`)} className="font-mono font-medium hover:text-[var(--primary)] transition-colors">{q.number}</button> },
    { key: 'contact', label: 'Cliente', render: (q: any) => <span className="font-medium">{q.contact?.name || '—'}</span> },
    { key: 'deal', label: 'Negocio', render: (q: any) => <span className="text-[var(--text-secondary)]">{q.deal?.title || '—'}</span> },
    { key: 'grandTotal', label: 'Total', render: (q: Quote) => <span className="font-semibold">{formatCurrency(q.grandTotal, q.currency)}</span> },
    { key: 'status', label: 'Estado', render: (q: Quote) => { const cfg = statusConfig[q.status] || { label: q.status, variant: 'default' as const }; return <Badge variant={cfg.variant}>{cfg.label}</Badge>; }},
    { key: 'version', label: 'Versión', render: (q: Quote) => <span className="text-[var(--text-secondary)]">v{q.version}</span> },
    { key: 'createdAt', label: 'Creado', render: (q: Quote) => <span className="text-[var(--text-secondary)]">{new Date(q.createdAt).toLocaleDateString()}</span> },
    { key: 'actions', label: '', render: (q: Quote) => (
      <div className="flex items-center gap-1">
        <button onClick={() => router.push(`/quotes/${q.id}`)} className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)]" title="Ver detalle"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
        <button onClick={() => { setDeleteId(q.id); setConfirmOpen(true); }} className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--danger)] hover:bg-red-50"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
      </div>
    )},
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Cotizaciones" description="Gestiona tus cotizaciones y presupuestos" />
      <Card padding={false}>
        <div className="p-4 border-b border-[var(--border)]">
          <div className="flex items-center justify-between gap-4">
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar..." />
            <FilterBar
              fields={[
                { key: 'status', label: 'Estado', type: 'select', options: [
                  { value: 'draft', label: 'Borrador' }, { value: 'sent', label: 'Enviada' },
                  { value: 'approved', label: 'Aprobada' }, { value: 'rejected', label: 'Rechazada' },
                  { value: 'converted', label: 'Convertida' },
                ]},
                { key: 'dateFrom', label: 'Desde', type: 'date' },
                { key: 'dateTo', label: 'Hasta', type: 'date' },
              ]}
              values={filters}
              onChange={(v) => { setFilters(v) }}
              onClear={() => { setFilters({}) }}
            />
          </div>
        </div>
        {loading ? <Loading /> : <Table columns={columns} data={data} />}
      </Card>

      <ConfirmDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} loading={saving} title="Eliminar Cotización" message="¿Estás seguro? Esta acción no se puede deshacer." />
    </div>
  );
}
