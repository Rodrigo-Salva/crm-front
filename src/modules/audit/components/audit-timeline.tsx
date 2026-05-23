'use client';

import { useEffect, useState } from 'react';
import { auditApi, AuditLog } from '../services/audit-api';
import { Loading } from '@/modules/shared/components/ui/loading';

const actionLabels: Record<string, string> = {
  created: 'Creó',
  updated: 'Actualizó',
  deleted: 'Eliminó',
  status_changed: 'Cambió estado',
  assigned: 'Asignó',
};

export function AuditTimeline({ entity, entityId }: { entity: string; entityId: string }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auditApi.findByEntity(entity, entityId).then(setLogs).catch(() => {}).finally(() => setLoading(false));
  }, [entity, entityId]);

  if (loading) return <Loading />;
  if (!logs.length) return <p className="text-sm text-[var(--text-secondary)] py-4 text-center">Sin actividad registrada</p>;

  return (
    <div className="space-y-4 py-2">
      {logs.map((log) => (
        <div key={log.id} className="flex gap-3 text-sm">
          <div className="w-2 h-2 mt-1.5 rounded-full bg-[var(--primary)] shrink-0" />
          <div>
            <p className="text-[var(--text)]">
              <span className="font-medium">{log.user?.name || 'Sistema'}</span>
              {' '}{actionLabels[log.action] || log.action}
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              {new Date(log.createdAt).toLocaleString('es-MX')}
            </p>
            {log.changes && (
              <div className="mt-1 space-y-1">
                {Object.entries(log.changes).map(([field, val]) => (
                  <p key={field} className="text-xs text-[var(--text-secondary)]">
                    {field}: <span className="line-through">{String(val.old)}</span> → {String(val.new)}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
