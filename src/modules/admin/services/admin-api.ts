import { api } from '@/modules/shared/services/api';
import { Tenant } from '../types';

const BASE = '/admin/tenants';

export const adminApi = {
  listTenants: () => api.get<Tenant[]>(BASE),
  getTenant: (id: string) => api.get<Tenant>(`${BASE}/${id}`),
  createTenant: (data: { name: string; slug?: string; domain?: string }) =>
    api.post<Tenant>(BASE, data),
  updateTenant: (id: string, data: Partial<Tenant>) =>
    api.patch<Tenant>(`${BASE}/${id}`, data),
};
