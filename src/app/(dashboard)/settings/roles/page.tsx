'use client';

import { useEffect, useState, useCallback } from 'react';
import { PageHeader, Card, Button, Loading } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';
import { UserRole } from '@/modules/shared/types';
import { Permission, ALL_PERMISSIONS, ROLE_LABELS, fetchRolePermissions, setRolePermission } from '@/modules/shared/services/permissions';

const ROLES: UserRole[] = ['superadmin', 'admin', 'seller', 'reader'];

const PERMISSION_LABELS: Record<Permission, string> = {
  create: 'Crear',
  read: 'Leer',
  update: 'Editar',
  delete: 'Eliminar',
  export: 'Exportar',
  manage_users: 'Gestionar usuarios',
  manage_settings: 'Configuración',
};

export default function RolesPage() {
  const [permissions, setPermissions] = useState<{ role: UserRole; permission: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [twoFactorRoles, setTwoFactorRoles] = useState<string[]>([]);
  const [savingTwoFactor, setSavingTwoFactor] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchRolePermissions();
    setPermissions(data);
    try {
      const settings = await api.get<Record<string, string>>('/tenant-settings');
      setTwoFactorRoles((settings.twoFactorRequiredRoles || '').split(',').map((r) => r.trim()).filter(Boolean));
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleTwoFactorRole = async (role: UserRole, enabled: boolean) => {
    setSavingTwoFactor(true);
    const next = enabled ? [...twoFactorRoles, role] : twoFactorRoles.filter((r) => r !== role);
    try {
      await api.put('/tenant-settings', { twoFactorRequiredRoles: next.join(',') });
      setTwoFactorRoles(next);
    } finally {
      setSavingTwoFactor(false);
    }
  };

  const toggle = async (role: UserRole, permission: string, enabled: boolean) => {
    const key = `${role}:${permission}`;
    setSaving(key);
    try {
      await setRolePermission(role, permission, enabled);
      setPermissions((prev) =>
        enabled
          ? [...prev.filter((p) => !(p.role === role && p.permission === permission)), { role, permission }]
          : prev.filter((p) => !(p.role === role && p.permission === permission))
      );
    } finally {
      setSaving(null);
    }
  };

  const isEnabled = (role: UserRole, permission: string) => {
    if (role === 'superadmin') return true;
    return permissions.some((p) => p.role === role && p.permission === permission);
  };

  if (loading) return <Loading />;

  return (
    <div className="animate-fade-in">
      <PageHeader backHref="/settings" backLabel="Volver a Configuración"
        title="Roles y permisos"
        description="Activa o desactiva permisos por cada rol. Los cambios se guardan automáticamente."
      />

      <div className="overflow-x-auto bg-[var(--card-bg)] rounded-xl border border-[var(--border)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--secondary)]/50">
              <th className="text-left py-3 px-4 text-[var(--text-secondary)] font-medium">Permiso</th>
              {ROLES.map((r) => (
                <th key={r} className="text-center py-3 px-4 text-[var(--text-secondary)] font-medium min-w-[120px]">
                  {ROLE_LABELS[r]}
                  {r === 'superadmin' && <p className="text-[10px] text-blue-500 font-normal">siempre activo</p>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL_PERMISSIONS.map((perm) => (
              <tr key={perm} className="border-b border-[var(--border)] hover:bg-[var(--secondary)]/30">
                <td className="py-3 px-4 text-[var(--text)] font-medium">
                  {PERMISSION_LABELS[perm]}
                  <p className="text-xs text-[var(--text-secondary)] font-normal">{perm}</p>
                </td>
                {ROLES.map((role) => {
                  const enabled = isEnabled(role, perm);
                  const key = `${role}:${perm}`;
                  const isSaving = saving === key;

                  if (role === 'superadmin') {
                    return (
                      <td key={role} className="text-center py-3 px-4">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </span>
                      </td>
                    );
                  }

                  return (
                    <td key={role} className="text-center py-3 px-4">
                      <button
                        onClick={() => toggle(role, perm, !enabled)}
                        disabled={isSaving}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 ${
                          enabled ? 'bg-[var(--primary)]' : 'bg-gray-200'
                        } ${isSaving ? 'opacity-50' : ''}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-[var(--card-bg)] transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {ROLES.map((r) => {
          const enabledPerms = ALL_PERMISSIONS.filter((p) => isEnabled(r, p));
          return (
            <Card key={r}>
              <h3 className="text-sm font-semibold text-[var(--text)]">{ROLE_LABELS[r]}</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                {enabledPerms.length} de {ALL_PERMISSIONS.length} permisos
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                {enabledPerms.map((p) => (
                  <span key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">{p}</span>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 bg-[var(--card-bg)] rounded-xl border border-[var(--border)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        <h3 className="text-sm font-semibold text-[var(--text)] mb-1">2FA obligatorio</h3>
        <p className="text-xs text-[var(--text-secondary)] mb-4">
          Los roles marcados deberán configurar la autenticación de dos factores antes de poder usar el sistema.
        </p>
        <div className="flex flex-wrap gap-4">
          {ROLES.map((role) => (
            <label key={role} className="flex items-center gap-2 text-sm text-[var(--text)]">
              <input
                type="checkbox"
                checked={twoFactorRoles.includes(role)}
                disabled={savingTwoFactor}
                onChange={(e) => toggleTwoFactorRole(role, e.target.checked)}
                className="rounded border-[var(--border)]"
              />
              {ROLE_LABELS[role]}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}


