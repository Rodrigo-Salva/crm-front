'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Table, PageHeader, Loading, Card, Badge, Modal, ConfirmDialog, Input } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';
import { Project } from '@/modules/shared/types';
import { useSelection } from '@/modules/shared/hooks/use-selection';

const emptyForm = { name: '', description: '', status: 'planning', leadId: '', ownerId: '' };

const STATUS_MAP: Record<string, { label: string; color: "default" | "success" | "warning" | "danger" }> = {
  planning: { label: 'Planificación', color: 'default' },
  in_progress: { label: 'En Progreso', color: 'success' },
  on_hold: { label: 'En Pausa', color: 'warning' },
  completed: { label: 'Completado', color: 'success' },
  cancelled: { label: 'Cancelado', color: 'danger' },
};

export default function ProjectsPage() {
  const router = useRouter();
  const [data, setData] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const sel = useSelection<Project>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<any>(`/projects`);
      setData(Array.isArray(res) ? res : []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load() }, [load]);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (item: Project) => { setEditId(item.id); setForm({ name: item.name, description: item.description || '', status: item.status, leadId: item.leadId || '', ownerId: item.ownerId || '' }); setModalOpen(true); };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try { await api.delete(`/projects/${deleteId}`); setConfirmOpen(false); setDeleteId(null); load(); } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.leadId) delete (payload as any).leadId;
      if (!payload.ownerId) delete (payload as any).ownerId;

      if (editId) { await api.patch(`/projects/${editId}`, payload); } else { await api.post('/projects', payload); }
      setModalOpen(false); load();
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const columns = [
    { key: 'name', label: 'Nombre', render: (p: Project) => (
      <div className="text-left">
        <button onClick={() => router.push(`/projects/${p.id}`)} className="font-medium text-gray-900 hover:text-[var(--primary)] transition-colors text-left">
          {p.name}
        </button>
        {p.description && <p className="text-xs text-[var(--text-secondary)] truncate max-w-[200px]">{p.description}</p>}
      </div>
    )},
    { key: 'status', label: 'Estado', render: (p: Project) => {
        const status = STATUS_MAP[p.status] || { label: p.status, color: 'default' };
        return <Badge variant={status.color}>{status.label}</Badge>;
    }},
    { key: 'lead', label: 'Lead/Cliente', render: (p: Project) => <span className="text-[var(--text-secondary)]">{p.lead?.name || '—'}</span> },
    { key: 'owner', label: 'Responsable', render: (p: Project) => <span className="text-[var(--text-secondary)]">{p.owner?.name || '—'}</span> },
    { key: 'actions', label: '', render: (p: Project) => (
      <div className="flex items-center gap-1">
        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)]"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
        <button onClick={() => { setDeleteId(p.id); setConfirmOpen(true); }} className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--danger)] hover:bg-red-50"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
      </div>
    )},
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Proyectos" description="Gestión de proyectos y servicios en curso" actions={<Button onClick={openCreate}>+ Nuevo Proyecto</Button>} />
      <Card padding={false}>
        {loading ? <Loading /> : <Table columns={columns} data={data} />}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Proyecto' : 'Nuevo Proyecto'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Nombre del proyecto" />
            <div>
              <label className="block text-sm font-medium mb-1">Estado</label>
              <select className="block w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {Object.entries(STATUS_MAP).map(([val, conf]) => (
                  <option key={val} value={val}>{conf.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Descripción..." className="block w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>{editId ? 'Guardar Cambios' : 'Crear Proyecto'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} loading={saving} title="Eliminar Proyecto" message="¿Estás seguro? Esta acción no se puede deshacer." />
    </div>
  );
}
