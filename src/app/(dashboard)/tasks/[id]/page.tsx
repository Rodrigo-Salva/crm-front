'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, PageHeader, Loading, Badge, Card, Modal, Input } from '@/modules/shared';
import { Tabs } from '@/modules/shared/components/ui/tab';
import { api } from '@/modules/shared/services/api';
import { Task, TaskStatus, TaskPriority } from '@/modules/shared/types';
import { ActivityTimeline } from '@/modules/activities/components/activity-timeline';
import { NotesList } from '@/modules/notes/components/notes-list';
import { TimeTracking } from '@/modules/time-tracking/components/time-tracking';

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

const tabOptions = [
  { id: 'info', label: 'Información' },
  { id: 'activity', label: 'Actividad' },
  { id: 'notes', label: 'Notas' },
  { id: 'time', label: 'Tiempo' },
];

const emptyForm = { title: '', description: '', status: TaskStatus.PENDING, priority: TaskPriority.MEDIUM, dueDate: '' };

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Task>(`/tasks/${id}`);
      setTask(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load() }, [load]);

  const openEdit = () => {
    if (!task) return;
    setForm({ title: task.title, description: task.description || '', status: task.status, priority: task.priority, dueDate: task.dueDate ? task.dueDate.split('T')[0] : '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/tasks/${id}`, form);
      setModalOpen(false);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;
  if (!task) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Tarea no encontrada</p>
      <Button className="mt-4" onClick={() => router.push('/tasks')}>Volver</Button>
    </div>
  );

  const sc = statusConfig[task.status] || { label: task.status, variant: 'default' as const };
  const pc = priorityConfig[task.priority] || { label: task.priority, variant: 'default' as const };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/tasks')} className="p-2 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)] transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)]">{task.title}</h1>
          </div>
          <div className="flex gap-2">
            <Badge variant={pc.variant}>{pc.label}</Badge>
            <Badge variant={sc.variant}>{sc.label}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.push(`/tasks/${id}/edit`)}>Editar</Button>
          <Button variant="secondary" onClick={openEdit}>Editar Rápido</Button>
        </div>
      </div>

      <Card padding={false}>
        <Tabs tabs={tabOptions} active={activeTab} onChange={setActiveTab} />

        <div className="p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              {task.description && (
                <div className="p-4 rounded-xl bg-[var(--bg)]">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-2">Descripción</p>
                  <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{task.description}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="p-4 rounded-xl bg-[var(--bg)]">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Estado</p>
                  <p className="mt-1"><Badge variant={sc.variant}>{sc.label}</Badge></p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg)]">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Prioridad</p>
                  <p className="mt-1"><Badge variant={pc.variant}>{pc.label}</Badge></p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg)]">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Vencimiento</p>
                  <p className="mt-1 text-sm font-medium text-[var(--text)]">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg)]">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Creado</p>
                  <p className="mt-1 text-sm font-medium text-[var(--text)]">
                    {new Date(task.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <ActivityTimeline />
          )}

          {activeTab === 'notes' && (
            <NotesList relatedType="task" relatedId={task.id} />
          )}

          {activeTab === 'time' && <TimeTracking taskId={task.id} />}
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Editar Tarea">
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
            <Button type="submit" loading={saving}>Guardar Cambios</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
