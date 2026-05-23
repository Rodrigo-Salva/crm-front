'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/modules/shared';
import { activityApi, Activity } from '../services/activity-api';

const typeIcons: Record<string, string> = {
  call: '📞',
  meeting: '🤝',
  email: '📧',
  note: '📝',
  task: '✅',
};

const typeLabels: Record<string, string> = {
  call: 'Llamada',
  meeting: 'Reunión',
  email: 'Email',
  note: 'Nota',
  task: 'Tarea',
};

interface Props {
  contactId?: string;
  dealId?: string;
}

export function ActivityTimeline({ contactId, dealId }: Props) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'note', subject: '', description: '' });

  const load = useCallback(async () => {
    try {
      const res = await activityApi.list({ contactId, dealId });
      setActivities(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [contactId, dealId]);

  useEffect(() => { load() }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await activityApi.create({ ...form, contactId, dealId });
      setForm({ type: 'note', subject: '', description: '' });
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
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="note">Nota</option>
            <option value="call">Llamada</option>
            <option value="meeting">Reunión</option>
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
            placeholder="Descripción (opcional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            rows={3}
          />
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
            <div key={a.id} className="flex gap-3 bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-xl">{typeIcons[a.type]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 uppercase">{typeLabels[a.type]}</span>
                  {a.type === 'task' && (
                    <button onClick={() => toggleDone(a)} className="text-xs">
                      {a.done ? '✅' : '⬜'}
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
