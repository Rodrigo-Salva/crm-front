'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, PageHeader, Loading, Badge, Card, Modal, Input, SearchSelect } from '@/modules/shared';
import { Tabs } from '@/modules/shared/components/ui/tab';
import { api } from '@/modules/shared/services/api';
import { Ticket } from '@/modules/shared/types';
import { ActivityTimeline } from '@/modules/activities/components/activity-timeline';
import { NotesList } from '@/modules/notes/components/notes-list';
import { AuditTimeline } from '@/modules/audit/components/audit-timeline';
import { FileAttachments } from '@/modules/uploads/components/file-attachments';

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

function renderSlaBadge(deadline: string) {
  const remainingHours = Math.round((new Date(deadline).getTime() - Date.now()) / 3600000);
  if (remainingHours < 0) return <Badge variant="danger">Vencido</Badge>;
  if (remainingHours <= 4) return <Badge variant="warning">{remainingHours}h restantes</Badge>;
  return <Badge variant="success">{remainingHours}h restantes</Badge>;
}

const tabOptions = [
  { id: 'info', label: 'Información' },
  { id: 'activity', label: 'Actividad' },
  { id: 'notes', label: 'Notas' },
  { id: 'history', label: 'Historial' },
  { id: 'files', label: 'Archivos' },
];

const emptyForm = { subject: '', description: '', status: 'open' as const, priority: 'medium' as const, leadId: '' };

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [customFieldsLoading, setCustomFieldsLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Ticket>(`/tickets/${id}`);
      setTicket(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load() }, [load]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<any[]>('/custom-fields?entity=ticket');
        setCustomFields(res);
      } catch (err) {
        console.error(err);
      } finally {
        setCustomFieldsLoading(false);
      }
    })();
  }, []);

  const openEdit = () => {
    if (!ticket) return;
    setForm({ subject: ticket.subject, description: ticket.description || '', status: ticket.status as any, priority: ticket.priority as any, leadId: ticket.leadId || '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/tickets/${id}`, form);
      setModalOpen(false);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;
  if (!ticket) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Ticket no encontrado</p>
      <Button className="mt-4" onClick={() => router.push('/tickets')}>Volver</Button>
    </div>
  );

  const sc = statusConfig[ticket.status] || { label: ticket.status, variant: 'default' as const };
  const pc = priorityConfig[ticket.priority] || { label: ticket.priority, variant: 'default' as const };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/tickets')} className="p-2 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)] transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)]">#{ticket.number} - {ticket.subject}</h1>
            <p className="text-sm text-[var(--text-secondary)]">{ticket.lead?.name || 'Sin lead'}</p>
          </div>
          <div className="flex gap-2">
            <Badge variant={pc.variant}>{pc.label}</Badge>
            <Badge variant={sc.variant}>{sc.label}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.push(`/tickets/${id}/edit`)}>Editar</Button>
          <Button variant="secondary" onClick={openEdit}>Editar Rápido</Button>
        </div>
      </div>

      <Card padding={false}>
        <Tabs tabs={tabOptions} active={activeTab} onChange={setActiveTab} />

        <div className="p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              {ticket.description && (
                <div className="p-4 rounded-xl bg-[var(--bg)]">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-2">Descripción</p>
                  <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{ticket.description}</p>
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
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Lead</p>
                  <p className="mt-1 text-sm font-medium text-[var(--text)]">{ticket.lead?.name || '—'}</p>
                  {ticket.lead?.email && <p className="text-xs text-[var(--text-secondary)]">{ticket.lead.email}</p>}
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg)]">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Asignado a</p>
                  <p className="mt-1 text-sm font-medium text-[var(--text)]">{ticket.assignee?.name || '—'}</p>
                </div>
                {ticket.slaDeadline && (
                  <div className="p-4 rounded-xl bg-[var(--bg)]">
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">SLA de resolución</p>
                    <p className="mt-1">{renderSlaBadge(ticket.slaDeadline)}</p>
                  </div>
                )}
                {ticket.firstResponseDeadline && !ticket.firstRespondedAt && (
                  <div className="p-4 rounded-xl bg-[var(--bg)]">
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">SLA de primera respuesta</p>
                    <p className="mt-1">{renderSlaBadge(ticket.firstResponseDeadline)}</p>
                  </div>
                )}
                <div className="p-4 rounded-xl bg-[var(--bg)]">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Mensajes</p>
                  <p className="mt-1 text-sm font-medium text-[var(--text)]">{ticket._count?.messages ?? 0} mensajes</p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg)]">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Creado</p>
                  <p className="mt-1 text-sm font-medium text-[var(--text)]">
                    {new Date(ticket.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>

              {!customFieldsLoading && customFields.length > 0 && (
                <div>
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-3">Campos personalizados</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {customFields.map((field) => (
                      <div key={field.name} className="p-4 rounded-xl bg-[var(--bg)]">
                        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">{field.label || field.name}</p>
                        <p className="mt-1 text-sm font-medium text-[var(--text)]">
                          {ticket.customFields?.[field.name] ?? '—'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <ActivityTimeline leadId={ticket.leadId} />
          )}

          {activeTab === 'notes' && (
            <NotesList relatedType="ticket" relatedId={ticket.id} />
          )}

          {activeTab === 'history' && (
            <AuditTimeline entity="ticket" entityId={ticket.id} />
          )}

          {activeTab === 'files' && <FileAttachments entity="ticket" entityId={ticket.id} />}
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Editar Ticket">
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
            <Button type="submit" loading={saving}>Guardar Cambios</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
