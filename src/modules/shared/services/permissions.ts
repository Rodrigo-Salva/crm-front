import { api } from './api';
import { UserRole } from '../types';

export type Permission = 'create' | 'read' | 'update' | 'delete' | 'export' | 'manage_users' | 'manage_settings';

const ALL_PERMISSIONS: Permission[] = ['create', 'read', 'update', 'delete', 'export', 'manage_users', 'manage_settings'];

const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: 'Superadmin',
  admin: 'Admin',
  seller: 'Vendedor',
  reader: 'Solo lectura',
};

export { ALL_PERMISSIONS, ROLE_LABELS };

export async function fetchRolePermissions(tenantId?: string): Promise<{ role: UserRole; permission: string }[]> {
  try {
    return await api.get<{ role: UserRole; permission: string }[]>('/role-permissions');
  } catch {
    return [];
  }
}

export async function setRolePermission(role: UserRole, permission: string, enabled: boolean): Promise<void> {
  await api.post('/role-permissions', { role, permission, enabled });
}

export function hasPermission(role: UserRole | undefined, permission: Permission, permissions?: { role: UserRole; permission: string }[]): boolean {
  if (!role) return false;
  if (role === 'superadmin') return true;
  if (!permissions) return false;
  return permissions.some((p) => p.role === role && p.permission === permission);
}

export function can(role: UserRole | undefined, permission: Permission, permissions?: { role: UserRole; permission: string }[]): boolean {
  return hasPermission(role, permission, permissions);
}
