'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SearchInput, Button, Table, PageHeader, Loading, Card, Badge, Modal, ConfirmDialog, Input, SearchSelect } from '@/modules/shared';
import { FilterBar } from '@/modules/shared/components/ui/filter-bar';
import { api } from '@/modules/shared/services/api';
import { Ticket } from '@/modules/shared/types';
import { BatchActionsBar } from '@/modules/shared/components/ui/batch-actions';
import { useSelection } from '@/modules/shared/hooks/use-selection';

const statusConfig: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  open: { label: 'Abierto', variant: 'success' },
  in_progress: { label: 'En progreso', variant: 'warning' },
  resolved: { label: 'Resuelto', variant: 'primary' },
  closed: { label: 'Cerrado', variant: 'default' },
};

const priorityConfig: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  low: { label: 'Baja', variant: 'default' },
  medium: { label: 'Media', variant: 'primary' },
  high: { label: 'Alta', variant: 'warning' },
  critical: { label: 'Crítica', variant: 'danger' },
};

const emptyForm = { subject: '', description: '', status: 'open' as const, priority: 'medium' as const, leadId: '' };

export default function TicketsPage() {
  const router = useRouter();
  const [data, setData] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const sel = useSelection<Ticket>();
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchEditOpen, setBatchEditOpen] = useState(false);
  const [batchStatus, setBatchStatus] = useState('');
  const [batchSaving, setBatchSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.set('status', filter);
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      if (search) params.set('search', search);
      const qs = params.toString();
      const res = await api.get<any>(`/tickets${qs ? `?${qs}` : ''}`);
      setData(Array.isArray(res) ? res : []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [filter, filters, search]);

  useEffect(() => { load() }, [load]);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (item: Ticket) => { setEditId(item.id); setForm({ subject: item.subject, description: item.description || '', status: item.status as any, priority: item.priority as any, leadId: item.leadId || '' }); setModalOpen(true); };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try { await api.delete(`/tickets/${deleteId}`); setConfirmOpen(false); setDeleteId(null); load(); } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) { await api.patch(`/tickets/${editId}`, form); } else { await api.post('/tickets', form); }
      setModalOpen(false); load();
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const handleBatchDelete = async () => {
    setBatchLoading(true);
    try {
      await Promise.all(Array.from(sel.selected).map((id) => api.delete(`/tickets/${id}`)));
      sel.clear();
      load();
    } catch {} finally { setBatchLoading(false); }
  };

  const handleBatchEdit = async () => {
    setBatchSaving(true);
    try {
      await Promise.all(Array.from(sel.selected).map((id) => api.patch(`/tickets/${id}`, { status: batchStatus })));
      sel.clear();
      setBatchEditOpen(false);
      load();
    } catch {} finally { setBatchSaving(false); }
  };

  const columns = [
    { key: 'number', label: '#', render: (t: any) => <span className="font-mono font-medium text-[var(--primary)]">#{t.number}</span> },
    { key: 'subject', label: 'Asunto', render: (t: Ticket) => (
      <button onClick={() => router.push(`/tickets/${t.id}`)} className="text-left hover:text-[var(--primary)] transition-colors">
        <span className="font-medium">{t.subject}</span>
        {t.lead && <p className="text-xs text-[var(--text-secondary)]">{t.lead.name}</p>}
      </button>
    )},
    { key: 'priority', label: 'Prioridad', render: (t: Ticket) => { const cfg = priorityConfig[t.priority] || { label: t.priority, variant: 'default' as const }; return <Badge variant={cfg.variant}>{cfg.label}</Badge>; }},
    { key: 'status', label: 'Estado', render: (t: Ticket) => { const cfg = statusConfig[t.status] || { label: t.status, variant: 'default' as const }; return <Badge variant={cfg.variant}>{cfg.label}</Badge>; }},
    { key: 'assignee', label: 'Asignado', render: (t: any) => <span className="text-[var(--text-secondary)]">{t.assignee?.name || '—'}</span> },
    { key: '_count', label: 'Msgs', render: (t: any) => <span className="px-2 py-0.5 bg-gray-100 rounded-md text-sm">{t._count?.messages ?? 0}</span> },
    { key: 'createdAt', label: 'Creado', render: (t: Ticket) => <span className="text-[var(--text-secondary)]">{new Date(t.createdAt).toLocaleDateString()}</span> },
    { key: 'actions', label: '', render: (t: Ticket) => (
      <div className="flex items-center gap-1">
        <button onClick={() => router.push(`/tickets/${t.id}`)} className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)]" title="Ver detalle"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
        <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)]"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
        <button onClick={() => { setDeleteId(t.id); setConfirmOpen(true); }} className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--danger)] hover:bg-red-50"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
      </div>
    )},
  ];

  const statusFilters = [
    { value: '', label: 'Todos' }, { value: 'open', label: 'Abiertos' }, { value: 'in_progress', label: 'En progreso' }, { value: 'resolved', label: 'Resueltos' }, { value: 'closed', label: 'Cerrados' },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Tickets" description="Soporte y atención al cliente" actions={<><Button variant="secondary" onClick={() => router.push('/tickets/kanban')}>Kanban</Button><Button onClick={openCreate}>+ Nuevo Ticket</Button></>} />
      <Card padding={false}>
        <div className="p-4 border-b border-[var(--border)] space-y-3">
          <div className="flex items-center justify-between gap-4">
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar..." />
            <FilterBar
              fields={[
                { key: 'priority', label: 'Prioridad', type: 'select', options: [
                  { value: 'low', label: 'Baja' }, { value: 'medium', label: 'Media' },
                  { value: 'high', label: 'Alta' }, { value: 'critical', label: 'Crítica' },
                ]},
                { key: 'dateFrom', label: 'Desde', type: 'date' },
                { key: 'dateTo', label: 'Hasta', type: 'date' },
              ]}
              values={filters}
              onChange={(v) => { setFilters(v) }}
              onClear={() => { setFilters({}) }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((f) => (<Button key={f.value} size="sm" variant={filter === f.value ? 'primary' : 'secondary'} onClick={() => setFilter(f.value)}>{f.label}</Button>))}
          </div>
        </div>
        {sel.selected.size > 0 && (
          <BatchActionsBar count={sel.selected.size} onDelete={handleBatchDelete} onClear={sel.clear} onEdit={() => { setBatchStatus(''); setBatchEditOpen(true); }} loading={batchLoading} />
        )}
        {loading ? <Loading /> : <Table columns={columns} data={data} selected={sel.selected} onToggle={sel.toggle} onToggleAll={() => sel.toggleAll(data)} allSelected={sel.allSelected(data)} />}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Ticket' : 'Nuevo Ticket'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Asunto" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required placeholder="Resumen del ticket" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Describe el problema..." className="block w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]">
                <option value="open">Abierto</option><option value="in_progress">En progreso</option><option value="resolved">Resuelto</option><option value="closed">Cerrado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as any })} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]">
                <option value="low">Baja</option><option value="medium">Media</option><option value="high">Alta</option><option value="critical">Crítica</option>
              </select>
            </div>
            <SearchSelect label="Lead" value={form.leadId} onChange={(id) => setForm({ ...form, leadId: id })} endpoint="/leads" displayLabel={(l) => l.name} displaySub={(l) => l.email || ''} placeholder="Buscar lead por nombre..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>{editId ? 'Guardar Cambios' : 'Crear Ticket'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} loading={saving} title="Eliminar Ticket" message="¿Estás seguro? Esta acción no se puede deshacer." />

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
