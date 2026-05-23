'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, Input, Loading } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';
import { Task, TaskStatus, TaskPriority } from '@/modules/shared/types';

const emptyForm = { title: '', description: '', status: TaskStatus.PENDING, priority: TaskPriority.MEDIUM, dueDate: '' };

export default function EditTaskPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    try {
      const res = await api.get<Task>(`/tasks/${id}`);
      setTask(res);
      setForm({ title: res.title, description: res.description || '', status: res.status as any, priority: res.priority as any, dueDate: res.dueDate ? res.dueDate.split('T')[0] : '' });
    } catch {} finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try { await api.patch(`/tasks/${id}`, form); router.push(`/tasks/${id}`); } catch {} finally { setSaving(false); }
  };

  if (loading) return <Loading />;
  if (!task) return <p className="text-center py-20 text-gray-500">Tarea no encontrada</p>;

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)]"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
        <h1 className="text-2xl font-bold text-[var(--text)]">Editar Tarea</h1>
      </div>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)]">
                <option value="pending">Pendiente</option><option value="in_progress">En progreso</option><option value="completed">Completada</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as any })} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)]">
                <option value="low">Baja</option><option value="medium">Media</option><option value="high">Alta</option>
              </select>
            </div>
            <Input label="Fecha de vencimiento" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => router.back()}>Cancelar</Button>
            <Button type="submit" loading={saving}>Guardar Cambios</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
