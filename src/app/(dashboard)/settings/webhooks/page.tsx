'use client';

import { useState, useEffect } from 'react';
import { Button, PageHeader, Card, Modal, Input, Loading } from '@/modules/shared';
import { ConfirmDialog } from '@/modules/shared/components/ui/confirm-dialog';
import { api } from '@/modules/shared/services/api';

const EVENT_OPTIONS = [
  { value: 'contact.created', label: 'Contacto creado' },
  { value: 'contact.updated', label: 'Contacto actualizado' },
  { value: 'deal.created', label: 'Negocio creado' },
  { value: 'deal.updated', label: 'Negocio actualizado' },
  { value: 'deal.stage_changed', label: 'Etapa de negocio cambiada' },
  { value: 'ticket.created', label: 'Ticket creado' },
  { value: 'ticket.updated', label: 'Ticket actualizado' },
];

export default function WebhooksSettingsPage() {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ url: '', events: [] as string[], secret: '' });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<any[]>('/webhooks');
      setWebhooks(Array.isArray(res) ? res : []);
    } catch {}
    finally { setLoading(false) }
  };

  useEffect(() => { load() }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ url: '', events: [], secret: '' });
    setTestResult(null);
    setModalOpen(true);
  };

  const openEdit = (wh: any) => {
    setEditing(wh);
    setForm({ url: wh.url, events: wh.events as string[], secret: wh.secret || '' });
    setTestResult(null);
    setModalOpen(true);
  };

  const toggleEvent = (event: string) => {
    setForm((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/webhooks/${editing.id}`, form);
      } else {
        await api.post('/webhooks', form);
      }
      setModalOpen(false);
      load();
    } catch {}
    finally { setSaving(false) }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/webhooks/${id}`);
      setDeleteConfirm(null);
      load();
    } catch {}
  };

  const handleToggleActive = async (wh: any) => {
    try {
      await api.patch(`/webhooks/${wh.id}`, { active: !wh.active });
      load();
    } catch {}
  };

  const handleTest = async () => {
    setTestResult(null);
    try {
      const res = await fetch(form.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(form.secret ? { 'X-Webhook-Secret': form.secret } : {}) },
        body: JSON.stringify({ event: 'test', payload: { message: 'Prueba desde CRM Pro' }, timestamp: new Date().toISOString() }),
      });
      setTestResult(`✅ Éxito (${res.status})`);
    } catch (err: any) {
      setTestResult(`❌ Error: ${err.message}`);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Webhooks" description="Envía eventos a servicios externos" />
        <Button onClick={openCreate}>+ Nuevo Webhook</Button>
      </div>

      {webhooks.length === 0 ? (
        <Card>
          <p className="text-sm text-[var(--text-secondary)] text-center py-12">Sin webhooks configurados</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {webhooks.map((wh) => (
            <Card key={wh.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-2 h-2 rounded-full ${wh.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text)] truncate">{wh.url}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(wh.events as string[]).map((ev: string) => {
                        const opt = EVENT_OPTIONS.find((o) => o.value === ev);
                        return (
                          <span key={ev} className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                            {opt?.label || ev}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <button
                    onClick={() => handleToggleActive(wh)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${wh.active ? 'bg-[var(--primary)]' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${wh.active ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                  </button>
                  <button onClick={() => openEdit(wh)} className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-gray-100 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button onClick={() => setDeleteConfirm(wh.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Webhook' : 'Nuevo Webhook'}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="URL del Webhook" type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required placeholder="https://ejemplo.com/webhook" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Eventos</label>
            <div className="grid grid-cols-2 gap-2">
              {EVENT_OPTIONS.map((ev) => (
                <label key={ev.value} className="flex items-center gap-2 p-2 rounded-lg border border-[var(--border)] cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="checkbox" checked={form.events.includes(ev.value)} onChange={() => toggleEvent(ev.value)} className="rounded border-gray-300" />
                  <span className="text-sm text-[var(--text)]">{ev.label}</span>
                </label>
              ))}
            </div>
          </div>
          <Input label="Secreto (opcional)" type="text" value={form.secret} onChange={(e) => setForm({ ...form, secret: e.target.value })} placeholder="Para firmar solicitudes" />
          <div className="flex gap-2">
            <Button variant="secondary" type="button" onClick={handleTest} size="sm">Probar conexión</Button>
            {testResult && <span className="text-sm self-center">{testResult}</span>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>{editing ? 'Guardar Cambios' : 'Crear Webhook'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteConfirm}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
        title="Eliminar webhook"
        message="¿Estás seguro de eliminar este webhook? Las integraciones dejarán de funcionar."
      />
    </div>
  );
}
