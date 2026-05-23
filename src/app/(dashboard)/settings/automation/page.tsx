'use client';

import { useEffect, useState, useCallback } from 'react';
import { PageHeader, Card, Button, Modal, Input, ConfirmDialog, Loading } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';

interface Condition {
  field: string;
  operator: string;
  value: string;
}

interface Action {
  type: string;
  config: Record<string, unknown>;
}

interface Rule {
  id: string;
  name: string;
  event: string;
  conditions: Condition[];
  actions: Action[];
  active: boolean;
  order: number;
}

const EVENTS = [
  { value: 'contact.created', label: 'Contacto creado' },
  { value: 'contact.updated', label: 'Contacto actualizado' },
  { value: 'deal.created', label: 'Negocio creado' },
  { value: 'deal.updated', label: 'Negocio actualizado' },
  { value: 'ticket.created', label: 'Ticket creado' },
  { value: 'ticket.updated', label: 'Ticket actualizado' },
  { value: 'task.created', label: 'Tarea creada' },
  { value: 'task.updated', label: 'Tarea actualizada' },
];

const OPERATORS = [
  { value: 'equals', label: 'Igual a' },
  { value: 'not_equals', label: 'Diferente de' },
  { value: 'greater_than', label: 'Mayor que' },
  { value: 'less_than', label: 'Menor que' },
  { value: 'contains', label: 'Contiene' },
];

const ACTION_TYPES = [
  { value: 'assign_round_robin', label: 'Asignación round robin' },
  { value: 'create_task', label: 'Crear tarea' },
  { value: 'change_stage', label: 'Cambiar etapa' },
  { value: 'notify', label: 'Notificar' },
];

export default function AutomationPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Rule | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<any[]>('/automation-rules');
      setRules(data as Rule[]);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const handleToggle = async (rule: Rule) => {
    setToggling(rule.id);
    try {
      await api.patch(`/automation-rules/${rule.id}`, { active: !rule.active });
      setRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, active: !r.active } : r));
    } catch {} finally { setToggling(null); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/automation-rules/${deleteId}`);
      setDeleteId(null);
      setRules((prev) => prev.filter((r) => r.id !== deleteId));
    } catch {}
  };

  if (loading) return <Loading />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Automatización"
        description="Reglas y flujos automáticos"
        actions={<Button onClick={() => { setEditing(null); setShowModal(true); }}>+ Nueva regla</Button>}
      />

      {rules.length === 0 ? (
        <Card><p className="text-sm text-[var(--text-secondary)] text-center py-12">No hay reglas de automatización configuradas</p></Card>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-medium text-[var(--text)]">{rule.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      {EVENTS.find((e) => e.value === rule.event)?.label || rule.event}
                    </span>
                    {!rule.active && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Inactiva</span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    {rule.conditions?.length || 0} condición(es) · {rule.actions?.length || 0} acción(es)
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleToggle(rule)}
                    disabled={toggling === rule.id}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 ${
                      rule.active ? 'bg-[var(--primary)]' : 'bg-gray-200'
                    } ${toggling === rule.id ? 'opacity-50' : ''}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${rule.active ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(rule); setShowModal(true); }}>Editar</Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteId(rule.id)} className="text-red-500!">Eliminar</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <RuleModal
        open={showModal}
        rule={editing}
        onClose={() => { setShowModal(false); setEditing(null); }}
        onSave={async (form) => {
          setSaving(true);
          try {
            if (editing) {
              const updated = await api.patch<any>(`/automation-rules/${editing.id}`, form);
              setRules((prev) => prev.map((r) => r.id === editing.id ? { ...r, ...updated } : r));
            } else {
              const created = await api.post<any>('/automation-rules', form);
              setRules((prev) => [...prev, created as Rule]);
            }
            setShowModal(false);
            setEditing(null);
          } catch {} finally { setSaving(false); }
        }}
        saving={saving}
      />

      <ConfirmDialog
        open={!!deleteId}
        title="Eliminar regla"
        message="¿Estás seguro de eliminar esta regla de automatización?"
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}

function RuleModal({
  open, rule, onClose, onSave, saving,
}: {
  open: boolean;
  rule: Rule | null;
  onClose: () => void;
  onSave: (data: Partial<Rule>) => Promise<void>;
  saving: boolean;
}) {
  const [name, setName] = useState('');
  const [event, setEvent] = useState('contact.created');
  const [conditions, setConditions] = useState<Condition[]>([{ field: '', operator: 'equals', value: '' }]);
  const [actions, setActions] = useState<Action[]>([{ type: 'assign_round_robin', config: {} }]);
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (rule) {
      setName(rule.name);
      setEvent(rule.event);
      setConditions(rule.conditions?.length ? rule.conditions : [{ field: '', operator: 'equals', value: '' }]);
      setActions(rule.actions?.length ? rule.actions : [{ type: 'assign_round_robin', config: {} }]);
      setActive(rule.active);
    } else {
      setName('');
      setEvent('contact.created');
      setConditions([{ field: '', operator: 'equals', value: '' }]);
      setActions([{ type: 'assign_round_robin', config: {} }]);
      setActive(true);
    }
  }, [rule, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onSave({
      name,
      event,
      conditions: conditions.filter((c) => c.field && c.value),
      actions: actions.filter((a) => a.type),
      active,
    });
  };

  const updateCondition = (i: number, field: keyof Condition, value: string) => {
    setConditions((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };

  const addCondition = () => {
    setConditions((prev) => [...prev, { field: '', operator: 'equals', value: '' }]);
  };

  const removeCondition = (i: number) => {
    setConditions((prev) => prev.filter((_, idx) => idx !== i));
  };

  const updateAction = (i: number, field: keyof Action, value: unknown) => {
    setActions((prev) => {
      const next: Action[] = [...prev];
      if (field === 'type') {
        next[i] = { type: value as string, config: {} };
      } else {
        next[i] = { ...next[i], [field]: value } as Action;
      }
      return next;
    });
  };

  const addAction = () => {
    setActions((prev) => [...prev, { type: 'assign_round_robin', config: {} }]);
  };

  const removeAction = (i: number) => {
    setActions((prev) => prev.filter((_, idx) => idx !== i));
  };

  return (
    <Modal open={open} onClose={onClose} title={rule ? 'Editar regla' : 'Nueva regla'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ej: Asignar lead automáticamente" />

        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1">Evento</label>
          <select
            value={event}
            onChange={(e) => setEvent(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
          >
            {EVENTS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-[var(--text)]">Condiciones</label>
            <Button type="button" variant="outline" size="sm" onClick={addCondition}>+ Añadir</Button>
          </div>
          <div className="space-y-2">
            {conditions.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  placeholder="Campo"
                  value={c.field}
                  onChange={(e) => updateCondition(i, 'field', e.target.value)}
                  className="flex-1 h-9 px-2 rounded-lg border border-[var(--border)] bg-white text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
                <select
                  value={c.operator}
                  onChange={(e) => updateCondition(i, 'operator', e.target.value)}
                  className="h-9 px-2 rounded-lg border border-[var(--border)] bg-white text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                >
                  {OPERATORS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <input
                  placeholder="Valor"
                  value={c.value}
                  onChange={(e) => updateCondition(i, 'value', e.target.value)}
                  className="flex-1 h-9 px-2 rounded-lg border border-[var(--border)] bg-white text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
                <button type="button" onClick={() => removeCondition(i)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-[var(--text)]">Acciones</label>
            <Button type="button" variant="outline" size="sm" onClick={addAction}>+ Añadir</Button>
          </div>
          <div className="space-y-2">
            {actions.map((a, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  value={a.type}
                  onChange={(e) => updateAction(i, 'type', e.target.value)}
                  className="flex-1 h-9 px-2 rounded-lg border border-[var(--border)] bg-white text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                >
                  {ACTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <input
                  placeholder='Config {"key":"value"}'
                  value={JSON.stringify(a.config)}
                  onChange={(e) => {
                    try {
                      updateAction(i, 'config', JSON.parse(e.target.value));
                    } catch {
                      updateAction(i, 'config', e.target.value as unknown as Record<string, unknown>);
                    }
                  }}
                  className="flex-[2] h-9 px-2 rounded-lg border border-[var(--border)] bg-white text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
                <button type="button" onClick={() => removeAction(i)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="rounded border-[var(--border)]"
          />
          <span className="text-sm text-[var(--text)]">Regla activa</span>
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
        </div>
      </form>
    </Modal>
  );
}
