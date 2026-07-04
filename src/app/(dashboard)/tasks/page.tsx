'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Table, PageHeader, Loading, Card, Badge, Modal, ConfirmDialog, Input, SearchInput } from '@/modules/shared';
import { FilterBar } from '@/modules/shared/components/ui/filter-bar';
import { api } from '@/modules/shared/services/api';
import { Task, TaskStatus, TaskPriority } from '@/modules/shared/types';
import { BatchActionsBar } from '@/modules/shared/components/ui/batch-actions';
import { useSelection } from '@/modules/shared/hooks/use-selection';

const statusConfig: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  pending: { label: 'Pendiente', variant: 'warning' },
  in_progress: { label: 'En progreso', variant: 'primary' },
  completed: { label: 'Completada', variant: 'success' },
};

const priorityConfig: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  low: { label: 'Baja', variant: 'default' },
  medium: { label: 'Media', variant: 'primary' },
  high: { label: 'Alta', variant: 'danger' },
};

const emptyForm = { title: '', description: '', status: TaskStatus.PENDING, priority: TaskPriority.MEDIUM, dueDate: '' };

export default function TasksPage() {
  const router = useRouter();
  const [data, setData] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const sel = useSelection<Task>();
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchEditOpen, setBatchEditOpen] = useState(false);
  const [batchStatus, setBatchStatus] = useState('');
  const [batchSaving, setBatchSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const qs = params.toString();
      const res = await api.get<any>(`/tasks${qs ? `?${qs}` : ''}`);
      setData(Array.isArray(res) ? res : []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [filters, search]);

  useEffect(() => { load() }, [load]);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (item: Task) => { setEditId(item.id); setForm({ title: item.title, description: item.description || '', status: item.status as any, priority: item.priority as any, dueDate: item.dueDate ? item.dueDate.split('T')[0] : '' }); setModalOpen(true); };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try { await api.delete(`/tasks/${deleteId}`); setConfirmOpen(false); setDeleteId(null); load(); } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) { await api.patch(`/tasks/${editId}`, form); } else { await api.post('/tasks', form); }
      setModalOpen(false); load();
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const handleBatchDelete = async () => {
    setBatchLoading(true);
    try {
      await Promise.all(Array.from(sel.selected).map((id) => api.delete(`/tasks/${id}`)));
      sel.clear();
      load();
    } catch {} finally { setBatchLoading(false); }
  };

  const handleBatchEdit = async () => {
    setBatchSaving(true);
    try {
      await Promise.all(Array.from(sel.selected).map((id) => api.patch(`/tasks/${id}`, { status: batchStatus })));
      sel.clear();
      setBatchEditOpen(false);
      load();
    } catch {} finally { setBatchSaving(false); }
  };

  const columns = [
    { key: 'title', label: 'Título', render: (t: Task) => (
      <button onClick={() => router.push(`/tasks/${t.id}`)} className="flex items-center gap-3 text-left hover:text-[var(--primary)] transition-colors">
        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${t.status === 'completed' ? 'bg-[var(--success)] border-[var(--success)]' : 'border-gray-300'}`}>
          {t.status === 'completed' && <svg className="w-full h-full text-white p-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
        </div>
        <span className={`font-medium ${t.status === 'completed' ? 'line-through text-[var(--text-muted)]' : ''}`}>{t.title}</span>
      </button>
    )},
    { key: 'priority', label: 'Prioridad', render: (t: Task) => { const cfg = priorityConfig[t.priority] || { label: t.priority, variant: 'default' as const }; return <Badge variant={cfg.variant}>{cfg.label}</Badge>; }},
    { key: 'status', label: 'Estado', render: (t: Task) => { const cfg = statusConfig[t.status] || { label: t.status, variant: 'default' as const }; return <Badge variant={cfg.variant}>{cfg.label}</Badge>; }},
    { key: 'dueDate', label: 'Vencimiento', render: (t: Task) => (
      <span className={`${t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed' ? 'text-[var(--danger)] font-medium' : 'text-[var(--text-secondary)]'}`}>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}</span>
    )},
    { key: 'actions', label: '', render: (t: Task) => (
      <div className="flex items-center gap-1">
        <button onClick={() => router.push(`/tasks/${t.id}`)} className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)]" title="Ver detalle"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
        <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)]"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
        <button onClick={() => { setDeleteId(t.id); setConfirmOpen(true); }} className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--danger)] hover:bg-red-50"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
      </div>
    )},
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Tareas" description="Gestiona tus tareas y actividades pendientes" actions={<Button onClick={openCreate}>+ Nueva Tarea</Button>} />
      <Card padding={false}>
        <div className="p-4 border-b border-[var(--border)]">
          <div className="flex items-center justify-between gap-4">
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar tareas..." />
            <FilterBar
              fields={[
                { key: 'status', label: 'Estado', type: 'select', options: [
                  { value: 'pending', label: 'Pendiente' }, { value: 'in_progress', label: 'En progreso' },
                  { value: 'completed', label: 'Completada' },
                ]},
                { key: 'priority', label: 'Prioridad', type: 'select', options: [
                  { value: 'low', label: 'Baja' }, { value: 'medium', label: 'Media' },
                  { value: 'high', label: 'Alta' },
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
        {sel.selected.size > 0 && (
          <BatchActionsBar count={sel.selected.size} onDelete={handleBatchDelete} onClear={sel.clear} onEdit={() => { setBatchStatus(''); setBatchEditOpen(true); }} loading={batchLoading} />
        )}
        {loading ? <Loading /> : <Table columns={columns} data={data} selected={sel.selected} onToggle={sel.toggle} onToggleAll={() => sel.toggleAll(data)} allSelected={sel.allSelected(data)} />}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Tarea' : 'Nueva Tarea'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Nombre de la tarea" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Describe la tarea..." className="block w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]">
                <option value="pending">Pendiente</option><option value="in_progress">En progreso</option><option value="completed">Completada</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as any })} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]">
                <option value="low">Baja</option><option value="medium">Media</option><option value="high">Alta</option>
              </select>
            </div>
            <Input label="Fecha de vencimiento" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>{editId ? 'Guardar Cambios' : 'Crear Tarea'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} loading={saving} title="Eliminar Tarea" message="¿Estás seguro? Esta acción no se puede deshacer." />

      <Modal open={batchEditOpen} onClose={() => setBatchEditOpen(false)} title={`Editar ${sel.selected.size} tareas`}>
        <form onSubmit={(e) => { e.preventDefault(); handleBatchEdit(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cambiar estado a</label>
            <select value={batchStatus} onChange={(e) => setBatchStatus(e.target.value)} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)]">
              <option value="">Seleccionar...</option>
              <option value="pending">Pendiente</option>
              <option value="in_progress">En progreso</option>
              <option value="completed">Completada</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setBatchEditOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={batchSaving} disabled={!batchStatus}>Actualizar {sel.selected.size} tareas</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
