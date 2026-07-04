import { api } from '@/modules/shared/services/api';

export interface Activity {
  id: string;
  type: 'call' | 'meeting' | 'email' | 'note' | 'task';
  subject: string;
  description?: string;
  dueDate?: string;
  done: boolean;
  leadId?: string;
  owner?: { id: string; name: string; email: string };
  lead?: { id: string; name: string };
  createdAt: string;
}

export const activityApi = {
  list: (params?: { leadId?: string }) => {
    const query = new URLSearchParams();
    if (params?.leadId) query.set('leadId', params.leadId);
    const qs = query.toString();
    return api.get<Activity[]>(`/activities${qs ? `?${qs}` : ''}`);
  },
  create: (data: {
    type: string;
    subject: string;
    description?: string;
    dueDate?: string;
    leadId?: string;
    reminderMinutesBefore?: number;
  }) => api.post<Activity>('/activities', data),
  update: (id: string, data: Partial<Activity> & { reminderMinutesBefore?: number | null }) =>
    api.patch<Activity>(`/activities/${id}`, data),
  remove: (id: string) => api.delete(`/activities/${id}`),
};
