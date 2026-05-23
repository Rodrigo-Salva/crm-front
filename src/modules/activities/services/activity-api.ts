import { api } from '@/modules/shared/services/api';

export interface Activity {
  id: string;
  type: 'call' | 'meeting' | 'email' | 'note' | 'task';
  subject: string;
  description?: string;
  dueDate?: string;
  done: boolean;
  contactId?: string;
  dealId?: string;
  owner?: { id: string; name: string; email: string };
  contact?: { id: string; name: string };
  createdAt: string;
}

export const activityApi = {
  list: (params?: { contactId?: string; dealId?: string }) => {
    const query = new URLSearchParams();
    if (params?.contactId) query.set('contactId', params.contactId);
    if (params?.dealId) query.set('dealId', params.dealId);
    const qs = query.toString();
    return api.get<Activity[]>(`/activities${qs ? `?${qs}` : ''}`);
  },
  create: (data: {
    type: string;
    subject: string;
    description?: string;
    dueDate?: string;
    contactId?: string;
    dealId?: string;
  }) => api.post<Activity>('/activities', data),
  update: (id: string, data: Partial<Activity>) => api.patch<Activity>(`/activities/${id}`, data),
  remove: (id: string) => api.delete(`/activities/${id}`),
};
