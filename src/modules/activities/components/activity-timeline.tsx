'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/modules/shared';
import { activityApi, Activity } from '../services/activity-api';

const typeIcons: Record<string, string> = {
  call: 'ðŸ“ž',
  meeting: 'ðŸ¤',
  email: 'ðŸ“§',
  note: 'ðŸ“',
  task: 'âœ…',
};

const typeLabels: Record<string, string> = {
  call: 'Llamada',
  meeting: 'ReuniÃ³n',
  email: 'Email',
  note: 'Nota',
  task: 'Tarea',
};

interface Props {
  leadId?: string;
}

export function ActivityTimeline({ leadId }: Props) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'note', subject: '', description: '', dueDate: '', reminderMinutesBefore: '' });

  const load = useCallback(async () => {
    try {
      const res = await activityApi.list({ leadId });
      setActivities(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => { load() }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await activityApi.create({
        type: form.type,
        subject: form.subject,
        description: form.description,
        leadId,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
        reminderMinutesBefore: form.dueDate && form.reminderMinutesBefore ? Number(form.reminderMinutesBefore) : undefined,
      });
      setForm({ type: 'note', subject: '', description: '', dueDate: '', reminderMinutesBefore: '' });
      setShowForm(false);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleDone = async (activity: Activity) => {
    try {
      await activityApi.update(activity.id, { done: !activity.done });
      load();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Actividades</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : 'Nueva Actividad'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[var(--card-bg)] rounded-lg border border-gray-200 p-4 space-y-3">
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="note">Nota</option>
            <option value="call">Llamada</option>
            <option value="meeting">ReuniÃ³n</option>
            <option value="email">Email</option>
            <option value="task">Tarea</option>
          </select>
          <input
            required
            placeholder="Asunto"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <textarea
            placeholder="DescripciÃ³n (opcional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            rows={3}
          />
          <input
            type="datetime-local"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value, reminderMinutesBefore: e.target.value ? form.reminderMinutesBefore : '' })}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <select
            value={form.reminderMinutesBefore}
            onChange={(e) => setForm({ ...form, reminderMinutesBefore: e.target.value })}
            disabled={!form.dueDate}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="">Sin recordatorio</option>
            <option value="15">Recordarme 15 minutos antes</option>
            <option value="30">Recordarme 30 minutos antes</option>
            <option value="60">Recordarme 1 hora antes</option>
            <option value="1440">Recordarme 1 dia antes</option>
          </select>
          <Button type="submit" size="sm">Guardar</Button>
        </form>
      )}

      {loading ? (
        <div className="text-gray-500 text-sm">Cargando...</div>
      ) : activities.length === 0 ? (
        <div className="text-gray-400 text-sm py-4 text-center">Sin actividades registradas</div>
      ) : (
        <div className="space-y-3">
          {activities.map((a) => (
            <div key={a.id} className="flex gap-3 bg-[var(--card-bg)] rounded-lg border border-gray-200 p-4">
              <div className="text-xl">{typeIcons[a.type]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 uppercase">{typeLabels[a.type]}</span>
                  {a.type === 'task' && (
                    <button onClick={() => toggleDone(a)} className="text-xs">
                      {a.done ? 'âœ…' : 'â¬œ'}
                    </button>
                  )}
                </div>
                <p className={`text-sm font-medium ${a.done ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                  {a.subject}
                </p>
                {a.description && <p className="text-sm text-gray-500 mt-1">{a.description}</p>}
                <p className="text-xs text-gray-400 mt-1">{new Date(a.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

