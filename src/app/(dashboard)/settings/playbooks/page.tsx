'use client';

import { useEffect, useState, useCallback } from 'react';
import { PageHeader, Card, Button, Input, Modal, ConfirmDialog, Loading, Badge } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';
import { Playbook, PlaybookStep } from '@/modules/shared/types';

const TRIGGERS = [
  { value: 'contract_accepted', label: 'Contrato aceptado (onboarding)' },
  { value: 'renewal_upcoming', label: 'Renovación próxima' },
];

type StepForm = Omit<PlaybookStep, 'id' | 'playbookId'>;

const emptyStep: StepForm = { title: '', description: '', dayOffset: 0, order: 0 };

export default function PlaybooksSettingsPage() {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Playbook | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Playbook[]>('/playbooks');
      setPlaybooks(Array.isArray(res) ? res : []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data: { name: string; trigger: string; active: boolean; steps: StepForm[] }) => {
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/playbooks/${editing.id}`, data);
      } else {
        await api.post('/playbooks', data);
      }
      setShowModal(false);
      setEditing(null);
      await load();
    } catch {} finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/playbooks/${deleteId}`);
      setDeleteId(null);
      await load();
    } catch {}
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        backHref="/settings"
        backLabel="Volver a Configuración"
        title="Playbooks"
        description="Secuencias de tareas automáticas para onboarding y renovaciones"
        actions={<Button onClick={() => { setEditing(null); setShowModal(true); }}>+ Nuevo playbook</Button>}
      />

      {loading ? <Loading /> : playbooks.length === 0 ? (
        <Card><p className="text-sm text-[var(--text-secondary)] text-center py-8">No hay playbooks configurados</p></Card>
      ) : (
        <div className="space-y-3">
          {playbooks.map((p) => (
            <Card key={p.id}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-[var(--text)]">{p.name}</h3>
                    <Badge variant={p.active ? 'success' : 'default'}>{p.active ? 'Activo' : 'Inactivo'}</Badge>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {TRIGGERS.find((t) => t.value === p.trigger)?.label || p.trigger} · {p.steps.length} paso(s)
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(p); setShowModal(true); }}>Editar</Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteId(p.id)} className="text-red-500">Eliminar</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <PlaybookModal
        open={showModal}
        playbook={editing}
        onClose={() => { setShowModal(false); setEditing(null); }}
        onSave={handleSave}
        saving={saving}
      />

      <ConfirmDialog
        open={!!deleteId}
        title="Eliminar playbook"
        message="¿Estás seguro de eliminar este playbook? Los runs ya iniciados no se verán afectados."
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}

function PlaybookModal({
  open, playbook, onClose, onSave, saving,
}: {
  open: boolean;
  playbook: Playbook | null;
  onClose: () => void;
  onSave: (data: { name: string; trigger: string; active: boolean; steps: StepForm[] }) => Promise<void>;
  saving: boolean;
}) {
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState('contract_accepted');
  const [active, setActive] = useState(true);
  const [steps, setSteps] = useState<StepForm[]>([{ ...emptyStep }]);

  useEffect(() => {
    if (playbook) {
      setName(playbook.name);
      setTrigger(playbook.trigger);
      setActive(playbook.active);
      setSteps(playbook.steps.length ? playbook.steps.map((s) => ({ title: s.title, description: s.description, dayOffset: s.dayOffset, order: s.order })) : [{ ...emptyStep }]);
    } else {
      setName(''); setTrigger('contract_accepted'); setActive(true); setSteps([{ ...emptyStep }]);
    }
  }, [playbook, open]);

  const updateStep = (index: number, patch: Partial<StepForm>) => {
    setSteps(steps.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const addStep = () => setSteps([...steps, { ...emptyStep, order: steps.length }]);
  const removeStep = (index: number) => setSteps(steps.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      name,
      trigger,
      active,
      steps: steps.map((s, i) => ({ ...s, order: i })),
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={playbook ? 'Editar playbook' : 'Nuevo playbook'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required />
        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1">Se dispara cuando</label>
          <select value={trigger} onChange={(e) => setTrigger(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--text)]">
            {TRIGGERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="rounded border-[var(--border)]" />
          <span className="text-sm text-[var(--text)]">Activo</span>
        </label>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--text)]">Pasos</h3>
            <Button type="button" variant="secondary" size="sm" onClick={addStep}>+ Agregar paso</Button>
          </div>
          {steps.map((step, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 rounded-lg bg-[var(--bg)]">
              <div className="col-span-12 md:col-span-6">
                <Input label="Título de la tarea" value={step.title} onChange={(e) => updateStep(index, { title: e.target.value })} required />
              </div>
              <div className="col-span-8 md:col-span-4">
                <Input label="Descripción (opcional)" value={step.description || ''} onChange={(e) => updateStep(index, { description: e.target.value })} />
              </div>
              <div className="col-span-3 md:col-span-1">
                <Input label="Día" type="number" min="0" step="1" value={String(step.dayOffset)} onChange={(e) => updateStep(index, { dayOffset: Number(e.target.value) || 0 })} />
              </div>
              <div className="col-span-1 flex justify-end">
                <button type="button" onClick={() => removeStep(index)} disabled={steps.length === 1} className="p-2 rounded-lg text-gray-400 hover:text-[var(--danger)] hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={saving}>Guardar</Button>
        </div>
      </form>
    </Modal>
  );
}
