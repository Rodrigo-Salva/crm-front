'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Card, Modal, Input, Loading } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';

interface TimeEntry {
  id: string;
  taskId: string;
  duration: number;
  description?: string;
  date: string;
  userName?: string;
  createdAt: string;
}

interface TimeTrackingProps {
  taskId: string;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function TimeTracking({ taskId }: TimeTrackingProps) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayString);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<TimeEntry[]>('/time-entries?taskId=' + taskId);
      setEntries(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => { load() }, [load]);

  const totalMinutes = entries.reduce((sum, e) => sum + e.duration, 0);

  const openModal = () => {
    setDuration('');
    setDescription('');
    setDate(todayString());
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/time-entries', {
        taskId,
        duration: Number(duration),
        description,
        date,
      });
      setModalOpen(false);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete('/time-entries/' + id);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-secondary)]">
          Total:{' '}
          <span className="font-semibold text-[var(--text)]">
            {formatDuration(totalMinutes)}
          </span>
        </p>
        <Button size="sm" onClick={openModal}>Registrar tiempo</Button>
      </div>

      {entries.length === 0 && (
        <p className="text-sm text-[var(--text-muted)] py-8 text-center">
          Sin registros de tiempo
        </p>
      )}

      <div className="space-y-2">
        {entries.map((entry) => (
          <Card key={entry.id} className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <span className="text-sm font-semibold text-[var(--text)] whitespace-nowrap">
                {formatDuration(entry.duration)}
              </span>
              <div className="flex-1 min-w-0">
                {entry.description && (
                  <p className="text-sm text-[var(--text)] truncate">{entry.description}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  {entry.userName && <span>{entry.userName}</span>}
                  <span>{new Date(entry.date).toLocaleDateString('es-MX')}</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(entry.id)}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          </Card>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar tiempo">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Duración (minutos)"
            type="number"
            min={1}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
            placeholder="Ej: 120"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe el trabajo realizado..."
              className="block w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
            />
          </div>
          <Input
            label="Fecha"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Guardar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
