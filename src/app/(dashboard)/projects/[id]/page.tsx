'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Loading, Badge, Card, Table, Modal, Input } from '@/modules/shared';
import { Tabs } from '@/modules/shared/components/ui/tab';
import { api } from '@/modules/shared/services/api';
import { Project } from '@/modules/shared/types';
import { formatCurrency } from '@/modules/shared/utils/format';
import { useAuth } from '@/modules/shared/hooks/useAuth';

interface TimeEntry {
  id: string;
  projectId: string;
  userId: string;
  description: string;
  hours: number;
  date: string;
  createdAt: string;
  user?: { id: string; name: string };
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  planning: { label: 'Planificación', variant: 'default' },
  in_progress: { label: 'En Progreso', variant: 'primary' },
  on_hold: { label: 'En Pausa', variant: 'warning' },
  completed: { label: 'Completado', variant: 'success' },
  cancelled: { label: 'Cancelado', variant: 'danger' },
};

const tabOptions = [
  { id: 'info', label: 'Información' },
  { id: 'time', label: 'Horas Registradas' },
];

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ description: '', hours: 1, date: new Date().toISOString().split('T')[0] });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Project>(`/projects/${id}`);
      setProject(res);
      
      // Intentamos cargar las horas del proyecto si existe el endpoint
      try {
        const timeRes = await api.get<TimeEntry[]>(`/time-tracking?projectId=${id}`);
        setTimeEntries(Array.isArray(timeRes) ? timeRes : []);
      } catch (err) {
        console.warn('El módulo time-tracking podría no estar disponible aún', err);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load() }, [load]);

  const handleLogTime = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/time-tracking', { ...form, projectId: id, userId: user?.id });
      setModalOpen(false);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;
  if (!project) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Proyecto no encontrado</p>
      <Button className="mt-4" onClick={() => router.push('/projects')}>Volver</Button>
    </div>
  );

  const cfg = statusConfig[project.status] || { label: project.status, variant: 'default' as const };
  const totalHours = timeEntries.reduce((acc, t) => acc + t.hours, 0);

  const timeColumns = [
    { key: 'date', label: 'Fecha', render: (t: TimeEntry) => new Date(t.date || t.createdAt).toLocaleDateString() },
    { key: 'user', label: 'Usuario', render: (t: TimeEntry) => <span className="font-medium">{t.user?.name || '—'}</span> },
    { key: 'description', label: 'Descripción', render: (t: TimeEntry) => <span className="text-[var(--text-secondary)]">{t.description}</span> },
    { key: 'hours', label: 'Horas', render: (t: TimeEntry) => <span className="font-bold">{t.hours} h</span> },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/projects')} className="p-2 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)] transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)]">{project.name}</h1>
            <p className="text-sm text-[var(--text-secondary)]">{project.lead?.name || 'Sin cliente asignado'}</p>
          </div>
          <Badge variant={cfg.variant}>{cfg.label}</Badge>
        </div>
      </div>

      <Card padding={false}>
        <Tabs tabs={tabOptions} active={activeTab} onChange={setActiveTab} />

        <div className="p-6">
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="p-4 rounded-xl bg-[var(--bg)]">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Estado</p>
                <p className="mt-1"><Badge variant={cfg.variant}>{cfg.label}</Badge></p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg)]">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Responsable</p>
                <p className="mt-1 text-sm font-medium text-[var(--text)]">{project.owner?.name || '—'}</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg)]">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Horas Totales</p>
                <p className="mt-1 text-xl font-bold text-[var(--text)]">{totalHours} h</p>
              </div>
              
              <div className="md:col-span-2 lg:col-span-3 p-4 rounded-xl bg-[var(--bg)]">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-2">Descripción</p>
                <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{project.description || 'Sin descripción'}</p>
              </div>
            </div>
          )}

          {activeTab === 'time' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-[var(--text)]">Horas Invertidas: {totalHours} h</h3>
                <Button onClick={() => { setForm({ description: '', hours: 1, date: new Date().toISOString().split('T')[0] }); setModalOpen(true); }}>
                  Registrar Tiempo
                </Button>
              </div>
              {timeEntries.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-[var(--border)] rounded-xl">
                  <p className="text-[var(--text-secondary)]">Aún no se ha registrado tiempo en este proyecto.</p>
                </div>
              ) : (
                <Table columns={timeColumns} data={timeEntries} />
              )}
            </div>
          )}
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar Horas">
        <form onSubmit={handleLogTime} className="space-y-4">
          <Input label="Fecha" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
          <Input label="Horas invertidas" type="number" step="0.5" min="0.5" value={form.hours as any} onChange={e => setForm({...form, hours: parseFloat(e.target.value)})} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción de la tarea</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={3} placeholder="¿En qué trabajaste?" className="block w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Guardar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
