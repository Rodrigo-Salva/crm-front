'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Table, Pagination, SearchInput, PageHeader, Loading, Card, Badge, Modal, ConfirmDialog, Input, SearchSelect } from '@/modules/shared';
import { FilterBar } from '@/modules/shared/components/ui/filter-bar';
import { api } from '@/modules/shared/services/api';
import { Deal } from '@/modules/shared/types';
import { BatchActionsBar } from '@/modules/shared/components/ui/batch-actions';
import { useSelection } from '@/modules/shared/hooks/use-selection';
import { formatCurrency, CURRENCIES } from '@/modules/shared/utils/format';

const stageConfig: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  lead: { label: 'Lead', variant: 'default' },
  qualified: { label: 'Calificado', variant: 'primary' },
  proposal: { label: 'Propuesta', variant: 'warning' },
  negotiation: { label: 'Negociación', variant: 'info' },
  closed_won: { label: 'Ganado', variant: 'success' },
  closed_lost: { label: 'Perdido', variant: 'danger' },
};

const emptyForm = { title: '', value: 0, stage: 'lead', contactId: '', expectedCloseDate: '', currency: 'MXN' as const };

export default function DealsPage() {
  const router = useRouter();
  const [data, setData] = useState<Deal[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const limit = 20;
  const sel = useSelection<Deal>();
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchEditOpen, setBatchEditOpen] = useState(false);
  const [batchStatus, setBatchStatus] = useState('');
  const [batchSaving, setBatchSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const res = await api.get<any>(`/deals?${params}`);
      setData(Array.isArray(res.data) ? res.data : []);
      setTotal(res.total ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, filters]);

  useEffect(() => { load() }, [load]);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (item: Deal) => { setEditId(item.id); setForm({ title: item.title, value: item.value, stage: item.stage, contactId: item.contactId, expectedCloseDate: item.expectedCloseDate || '', currency: item.currency }); setModalOpen(true); };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try { await api.delete(`/deals/${deleteId}`); setConfirmOpen(false); setDeleteId(null); load(); } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) { await api.patch(`/deals/${editId}`, form); } else { await api.post('/deals', form); }
      setModalOpen(false); load();
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const handleBatchDelete = async () => {
    setBatchLoading(true);
    try {
      await Promise.all(Array.from(sel.selected).map((id) => api.delete(`/deals/${id}`)));
      sel.clear();
      load();
    } catch {} finally { setBatchLoading(false); }
  };

  const handleBatchEdit = async () => {
    setBatchSaving(true);
    try {
      await Promise.all(Array.from(sel.selected).map((id) => api.patch(`/deals/${id}`, { stage: batchStatus })));
      sel.clear();
      setBatchEditOpen(false);
      load();
    } catch {} finally { setBatchSaving(false); }
  };

  const columns = [
    { key: 'title', label: 'Título', render: (d: Deal) => (
      <button onClick={() => router.push(`/deals/${d.id}`)} className="text-left hover:text-[var(--primary)] transition-colors">
        <span className="font-medium">{d.title}</span>
        {d.contact && <p className="text-xs text-[var(--text-secondary)]">{d.contact.name}</p>}
      </button>
    )},
    { key: 'value', label: 'Valor', render: (d: Deal) => <span className="font-semibold">{formatCurrency(d.value, d.currency)}</span> },
    { key: 'stage', label: 'Etapa', render: (d: Deal) => { const cfg = stageConfig[d.stage] || { label: d.stage, variant: 'default' as const }; return <Badge variant={cfg.variant}>{cfg.label}</Badge>; }},
    { key: 'contact', label: 'Contacto', render: (d: any) => <span className="text-[var(--text-secondary)]">{d.contact?.name || '—'}</span> },
    { key: 'createdAt', label: 'Creado', render: (d: Deal) => <span className="text-[var(--text-secondary)]">{new Date(d.createdAt).toLocaleDateString()}</span> },
    { key: 'actions', label: '', render: (d: Deal) => (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => router.push(`/deals/${d.id}`)} className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)]" title="Ver detalle"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
        <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)]" title="Editar"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
        <button onClick={() => { setDeleteId(d.id); setConfirmOpen(true); }} className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--danger)] hover:bg-red-50" title="Eliminar"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
      </div>
    )},
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Negocios" description="Gestiona tus oportunidades de venta" actions={<Button onClick={openCreate}>+ Nuevo Negocio</Button>} />
      <Card padding={false}>
        <div className="p-4 border-b border-[var(--border)] space-y-3">
          <div className="flex items-center justify-between gap-4">
            <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Buscar negocios..." />
            <FilterBar
              fields={[
                { key: 'stage', label: 'Etapa', type: 'select', options: [
                  { value: 'lead', label: 'Lead' }, { value: 'qualified', label: 'Calificado' },
                  { value: 'proposal', label: 'Propuesta' }, { value: 'negotiation', label: 'Negociación' },
                  { value: 'closed_won', label: 'Ganado' }, { value: 'closed_lost', label: 'Perdido' },
                ]},
                { key: 'dateFrom', label: 'Desde', type: 'date' },
                { key: 'dateTo', label: 'Hasta', type: 'date' },
              ]}
              values={filters}
              onChange={(v) => { setFilters(v); setPage(1) }}
              onClear={() => { setFilters({}); setPage(1) }}
            />
          </div>
        </div>
        {sel.selected.size > 0 && (
          <BatchActionsBar count={sel.selected.size} onDelete={handleBatchDelete} onClear={sel.clear} onEdit={() => { setBatchStatus(''); setBatchEditOpen(true); }} loading={batchLoading} />
        )}
        {loading ? <Loading /> : <><Table columns={columns} data={data} selected={sel.selected} onToggle={sel.toggle} onToggleAll={() => sel.toggleAll(data)} allSelected={sel.allSelected(data)} /><Pagination page={page} limit={limit} total={total} onPageChange={setPage} /></>}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Negocio' : 'Nuevo Negocio'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Nombre del negocio" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Valor" type="number" step="0.01" value={String(form.value)} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} required placeholder="0.00" />
            <div>
              <label className="block text-sm font-medium mb-1">Moneda</label>
              <select className="block w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Etapa</label>
              <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]">
                <option value="lead">Lead</option><option value="qualified">Calificado</option><option value="proposal">Propuesta</option><option value="negotiation">Negociación</option><option value="closed_won">Ganado</option><option value="closed_lost">Perdido</option>
              </select>
            </div>
            <SearchSelect label="Contacto" value={form.contactId} onChange={(id) => setForm({ ...form, contactId: id })} endpoint="/contacts" placeholder="Buscar contacto por nombre..." displaySub={(c) => c.email} />
            <Input label="Fecha cierre" type="date" value={form.expectedCloseDate} onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>{editId ? 'Guardar Cambios' : 'Crear Negocio'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} loading={saving} title="Eliminar Negocio" message="¿Estás seguro? Esta acción no se puede deshacer." />

      <Modal open={batchEditOpen} onClose={() => setBatchEditOpen(false)} title={`Editar ${sel.selected.size} registros`}>
        <form onSubmit={(e) => { e.preventDefault(); handleBatchEdit(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cambiar estado/etapa a</label>
            <select value={batchStatus} onChange={(e) => setBatchStatus(e.target.value)} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)]">
              <option value="">Seleccionar...</option>
              <option value="open">Abierto</option>
              <option value="in_progress">En progreso</option>
              <option value="closed">Cerrado</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setBatchEditOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={batchSaving}>Actualizar {sel.selected.size} registros</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
