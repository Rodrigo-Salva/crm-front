'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loading, Badge } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';
import { PlaybookRun } from '@/modules/shared/types';

const runStatusConfig: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  active: { label: 'Activo', variant: 'primary' },
  completed: { label: 'Completado', variant: 'success' },
  cancelled: { label: 'Cancelado', variant: 'danger' },
};

const taskStatusConfig: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  pending: { label: 'Pendiente', variant: 'default' },
  in_progress: { label: 'En progreso', variant: 'primary' },
  completed: { label: 'Completada', variant: 'success' },
};

export function PlaybookRunsList({ leadId }: { leadId: string }) {
  const [runs, setRuns] = useState<PlaybookRun[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<PlaybookRun[]>(`/playbooks/runs?leadId=${leadId}`);
      setRuns(Array.isArray(res) ? res : []);
    } catch { setRuns([]); } finally { setLoading(false); }
  }, [leadId]);

  useEffect(() => { load() }, [load]);

  if (loading) return <Loading />;

  if (runs.length === 0) {
    return (
      <div className="text-center py-10 border border-dashed border-[var(--border)] rounded-xl">
        <p className="text-[var(--text-secondary)]">Este lead no tiene playbooks activados todavía.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {runs.map((run) => {
        const cfg = runStatusConfig[run.status] || { label: run.status, variant: 'default' as const };
        return (
          <div key={run.id} className="p-4 rounded-xl bg-[var(--bg)]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-[var(--text)]">{run.playbook.name}</p>
                <p className="text-xs text-[var(--text-secondary)]">Iniciado el {new Date(run.startedAt).toLocaleDateString()}</p>
              </div>
              <Badge variant={cfg.variant}>{cfg.label}</Badge>
            </div>
            <div className="space-y-2">
              {run.tasks.map((task) => {
                const tCfg = taskStatusConfig[task.status] || { label: task.status, variant: 'default' as const };
                return (
                  <div key={task.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--border)]">
                    <div>
                      <p className="text-sm text-[var(--text)]">{task.title}</p>
                      {task.dueDate && <p className="text-xs text-[var(--text-secondary)]">Vence: {new Date(task.dueDate).toLocaleDateString()}</p>}
                    </div>
                    <Badge variant={tCfg.variant}>{tCfg.label}</Badge>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
