import { api } from '@/modules/shared/services/api';

export interface AuditLog {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  userId: string;
  user?: { id: string; name: string; email: string };
  createdAt: string;
}

export const auditApi = {
  list: (limit = 50) => api.get<AuditLog[]>(`/audit-logs?limit=${limit}`),
  findByEntity: (entity: string, entityId: string) =>
    api.get<AuditLog[]>(`/audit-logs/${entity}/${entityId}`),
};
