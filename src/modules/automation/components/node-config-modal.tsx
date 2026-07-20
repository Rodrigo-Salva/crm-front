'use client';

import { useState, useEffect } from 'react';
import { Button, Modal, Input } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';
import { EVENTS, OPERATORS, ACTION_TYPES, CONDITION_FIELDS, Condition, AutomationNode } from '../constants';

interface NodeConfigModalProps {
  open: boolean;
  node: AutomationNode | null;
  onClose: () => void;
  onSave: (data: { actionType?: string; config: Record<string, any> }) => Promise<void>;
  onDelete?: () => void;
  saving: boolean;
}

export function NodeConfigModal({ open, node, onClose, onSave, onDelete, saving }: NodeConfigModalProps) {
  const [event, setEvent] = useState('lead.created');
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [actionType, setActionType] = useState('assign_round_robin');
  const [actionConfig, setActionConfig] = useState<Record<string, any>>({});
  const [minutes, setMinutes] = useState(5);

  const [careers, setCareers] = useState<any[]>([]);
  const [modalities, setModalities] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  useEffect(() => {
    if (!open) return;
    api.get<any[]>('/careers').then((res) => setCareers(Array.isArray(res) ? res : [])).catch(() => {});
    api.get<any[]>('/modalities').then((res) => setModalities(Array.isArray(res) ? res : [])).catch(() => {});
    api.get<any[]>('/pipeline-stages').then((res) => setStages(Array.isArray(res) ? res : [])).catch(() => {});
    api.get<any[]>('/users').then((res) => setUsers(Array.isArray(res) ? res : [])).catch(() => {});
    api.get<any[]>('/teams').then((res) => setTeams(Array.isArray(res) ? res : [])).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!node) return;
    const config = node.config || {};
    if (node.type === 'trigger' || node.type === 'condition') {
      setEvent(config.event || 'lead.created');
      setConditions(config.conditions?.length ? config.conditions : []);
    } else if (node.type === 'action') {
      setActionType(node.actionType || 'assign_round_robin');
      setActionConfig(config);
    } else if (node.type === 'wait') {
      setMinutes(config.minutes ?? 5);
    }
  }, [node, open]);

  if (!node) return null;

  const updateCondition = (i: number, field: keyof Condition, value: string) => {
    setConditions((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };
  const addCondition = () => setConditions((prev) => [...prev, { field: '', operator: 'equals', value: '' }]);
  const removeCondition = (i: number) => setConditions((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (node.type === 'trigger') {
      await onSave({ config: { event, conditions: conditions.filter((c) => c.field && c.value) } });
    } else if (node.type === 'condition') {
      await onSave({ config: { conditions: conditions.filter((c) => c.field && c.value) } });
    } else if (node.type === 'action') {
      await onSave({ actionType, config: actionConfig });
    } else {
      await onSave({ config: { minutes } });
    }
  };

  const title = node.type === 'trigger' ? 'Disparador' : node.type === 'condition' ? 'Condición' : node.type === 'action' ? 'Acción' : 'Esperar';

  return (
    <Modal open={open} onClose={onClose} title={title} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {node.type === 'trigger' && (
          <>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">Evento</label>
              <select
                value={event}
                onChange={(e) => setEvent(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                {EVENTS.map((ev) => <option key={ev.value} value={ev.value}>{ev.label}</option>)}
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
                    <select
                      value={c.field}
                      onChange={(e) => updateCondition(i, 'field', e.target.value)}
                      className="flex-1 h-9 px-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-sm text-[var(--text)]"
                    >
                      {CONDITION_FIELDS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                    <select
                      value={c.operator}
                      onChange={(e) => updateCondition(i, 'operator', e.target.value)}
                      className="w-32 h-9 px-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-sm text-[var(--text)]"
                    >
                      {OPERATORS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    {c.field === 'careerId' ? (
                      <select value={c.value} onChange={(e) => updateCondition(i, 'value', e.target.value)} className="flex-1 h-9 px-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-sm text-[var(--text)]">
                        <option value="">Selecciona carrera...</option>
                        {careers.map((c2) => <option key={c2.id} value={c2.id}>{c2.name}</option>)}
                      </select>
                    ) : c.field === 'modalityId' ? (
                      <select value={c.value} onChange={(e) => updateCondition(i, 'value', e.target.value)} className="flex-1 h-9 px-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-sm text-[var(--text)]">
                        <option value="">Selecciona modalidad...</option>
                        {modalities.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    ) : c.field === 'status' ? (
                      <select value={c.value} onChange={(e) => updateCondition(i, 'value', e.target.value)} className="flex-1 h-9 px-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-sm text-[var(--text)]">
                        <option value="">Selecciona etapa...</option>
                        {stages.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                    ) : (
                      <input
                        placeholder="Valor de la condición"
                        value={c.value}
                        onChange={(e) => updateCondition(i, 'value', e.target.value)}
                        className="flex-1 h-9 px-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-sm text-[var(--text)]"
                      />
                    )}
                    <button type="button" onClick={() => removeCondition(i)} className="p-1 text-gray-400 hover:text-red-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {node.type === 'condition' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-[var(--text)]">¿Cuándo continúa por &quot;Sí&quot;?</label>
              <Button type="button" variant="outline" size="sm" onClick={addCondition}>+ Añadir</Button>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mb-2">
              Si se cumple lo de abajo, el flujo sigue por la salida &quot;Sí&quot;. Si no, sigue por &quot;No&quot;.
            </p>
            <div className="space-y-2">
              {conditions.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select
                    value={c.field}
                    onChange={(e) => updateCondition(i, 'field', e.target.value)}
                    className="flex-1 h-9 px-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-sm text-[var(--text)]"
                  >
                    {CONDITION_FIELDS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                  <select
                    value={c.operator}
                    onChange={(e) => updateCondition(i, 'operator', e.target.value)}
                    className="w-32 h-9 px-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-sm text-[var(--text)]"
                  >
                    {OPERATORS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  {c.field === 'careerId' ? (
                    <select value={c.value} onChange={(e) => updateCondition(i, 'value', e.target.value)} className="flex-1 h-9 px-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-sm text-[var(--text)]">
                      <option value="">Selecciona carrera...</option>
                      {careers.map((c2) => <option key={c2.id} value={c2.id}>{c2.name}</option>)}
                    </select>
                  ) : c.field === 'modalityId' ? (
                    <select value={c.value} onChange={(e) => updateCondition(i, 'value', e.target.value)} className="flex-1 h-9 px-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-sm text-[var(--text)]">
                      <option value="">Selecciona modalidad...</option>
                      {modalities.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  ) : c.field === 'status' ? (
                    <select value={c.value} onChange={(e) => updateCondition(i, 'value', e.target.value)} className="flex-1 h-9 px-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-sm text-[var(--text)]">
                      <option value="">Selecciona etapa...</option>
                      {stages.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  ) : (
                    <input
                      placeholder="Valor de la condición"
                      value={c.value}
                      onChange={(e) => updateCondition(i, 'value', e.target.value)}
                      className="flex-1 h-9 px-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-sm text-[var(--text)]"
                    />
                  )}
                  <button type="button" onClick={() => removeCondition(i)} className="p-1 text-gray-400 hover:text-red-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {node.type === 'action' && (
          <>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">Tipo de acción</label>
              <select
                value={actionType}
                onChange={(e) => { setActionType(e.target.value); setActionConfig({}); }}
                className="w-full h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                {ACTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            {(actionType === 'assign_round_robin' || actionType === 'assign_workload') && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--text)] mb-1">Repartir entre</label>
                  <select
                    value={actionConfig.teamId ? 'team' : 'role'}
                    onChange={(e) => {
                      if (e.target.value === 'role') {
                        const { teamId, ...rest } = actionConfig;
                        setActionConfig({ ...rest, role: rest.role || 'seller' });
                      } else {
                        const { role, ...rest } = actionConfig;
                        setActionConfig({ ...rest, teamId: teams[0]?.id || '' });
                      }
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--text)]"
                  >
                    <option value="role">Rol</option>
                    <option value="team">Equipo</option>
                  </select>
                </div>

                {actionConfig.teamId ? (
                  <div>
                    <label className="block text-sm font-medium text-[var(--text)] mb-1">Equipo</label>
                    <select
                      value={actionConfig.teamId || ''}
                      onChange={(e) => setActionConfig({ ...actionConfig, teamId: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--text)]"
                    >
                      <option value="">Selecciona equipo...</option>
                      {teams.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.members?.length ?? 0})</option>)}
                    </select>
                  </div>
                ) : (
                  <Input label="Rol" placeholder="Ej: seller" value={actionConfig.role || ''} onChange={(e) => setActionConfig({ ...actionConfig, role: e.target.value })} />
                )}
              </div>
            )}

            {actionType === 'create_task' && (
              <div className="space-y-3">
                <Input label="Título" placeholder="Seguimiento: {{lead.name}}" value={actionConfig.title || ''} onChange={(e) => setActionConfig({ ...actionConfig, title: e.target.value })} />
                <Input label="Vence en" type="date" value={actionConfig.dueDate ? new Date(actionConfig.dueDate).toISOString().split('T')[0] : ''} onChange={(e) => setActionConfig({ ...actionConfig, dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })} />
              </div>
            )}

            {actionType === 'change_stage' && (
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1">Etapa</label>
                <select value={actionConfig.stage || ''} onChange={(e) => setActionConfig({ ...actionConfig, stage: e.target.value })} className="w-full h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--text)]">
                  <option value="">Selecciona etapa...</option>
                  {stages.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
            )}

            {actionType === 'notify' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--text)] mb-1">Usuario</label>
                  <select value={actionConfig.userId || ''} onChange={(e) => setActionConfig({ ...actionConfig, userId: e.target.value })} className="w-full h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--text)]">
                    <option value="">Selecciona usuario...</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <Input label="Mensaje" placeholder="Título / Texto" value={actionConfig.title || ''} onChange={(e) => setActionConfig({ ...actionConfig, title: e.target.value })} />
              </div>
            )}
          </>
        )}

        {node.type === 'wait' && (
          <Input label="Minutos de espera" type="number" min="1" value={String(minutes)} onChange={(e) => setMinutes(Number(e.target.value) || 1)} />
        )}

        <div className="flex justify-between gap-3 pt-2">
          {onDelete && <Button type="button" variant="ghost" className="text-red-500!" onClick={onDelete}>Eliminar nodo</Button>}
          <div className="flex gap-3 ml-auto">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" loading={saving}>Guardar</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
