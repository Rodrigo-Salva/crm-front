'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, Card, Button, Modal, Input, ConfirmDialog, Loading, Badge } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';
import { EVENTS, Automation } from '@/modules/automation/constants';

export default function AutomationListPage() {
  const router = useRouter();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [event, setEvent] = useState('lead.created');
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchAutomations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Automation[]>('/automations');
      setAutomations(Array.isArray(data) ? data : []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAutomations(); }, [fetchAutomations]);

  const handleToggle = async (automation: Automation) => {
    setToggling(automation.id);
    try {
      await api.patch(`/automations/${automation.id}`, { active: !automation.active });
      setAutomations((prev) => prev.map((a) => a.id === automation.id ? { ...a, active: !a.active } : a));
    } catch {} finally { setToggling(null); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/automations/${deleteId}`);
      setDeleteId(null);
      setAutomations((prev) => prev.filter((a) => a.id !== deleteId));
    } catch {}
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const created = await api.post<Automation>('/automations', { name, event });
      router.push(`/settings/automation/${created.id}`);
    } catch {} finally { setCreating(false); }
  };

  const getTriggerEvent = (automation: Automation) => {
    const triggerNode = automation.nodes?.find((n) => n.type === 'trigger');
    return triggerNode?.config?.event;
  };

  if (loading) return <Loading />;

  return (
    <div className="animate-fade-in">
      <PageHeader backHref="/settings" backLabel="Volver a Configuración"
        title="Automatización"
        description="Flujos automáticos tipo constructor visual: disparador → acciones encadenadas"
        actions={<Button onClick={() => { setName(''); setEvent('lead.created'); setShowModal(true); }}>+ Nueva automatización</Button>}
      />

      {automations.length === 0 ? (
        <Card><p className="text-sm text-[var(--text-secondary)] text-center py-12">No hay automatizaciones configuradas</p></Card>
      ) : (
        <div className="space-y-3">
          {automations.map((automation) => {
            const triggerEvent = getTriggerEvent(automation);
            return (
              <div key={automation.id} className="cursor-pointer" onClick={() => router.push(`/settings/automation/${automation.id}`)}>
              <Card>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-medium text-[var(--text)]">{automation.name}</h3>
                      {triggerEvent && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                          {EVENTS.find((e) => e.value === triggerEvent)?.label || triggerEvent}
                        </span>
                      )}
                      {!automation.active && <Badge variant="default">Inactiva</Badge>}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">{automation.nodes?.length || 0} nodo(s)</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleToggle(automation)}
                      disabled={toggling === automation.id}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 ${
                        automation.active ? 'bg-[var(--primary)]' : 'bg-gray-200'
                      } ${toggling === automation.id ? 'opacity-50' : ''}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-[var(--card-bg)] transition-transform ${automation.active ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(automation.id)} className="text-red-500!">Eliminar</Button>
                  </div>
                </div>
              </Card>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nueva automatización">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ej: Asignar lead automáticamente" />
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">Evento disparador</label>
            <select value={event} onChange={(e) => setEvent(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--text)]">
              {EVENTS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit" loading={creating}>Crear y editar</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Eliminar automatización"
        message="¿Estás seguro de eliminar esta automatización? Se perderán todos sus nodos y conexiones."
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
