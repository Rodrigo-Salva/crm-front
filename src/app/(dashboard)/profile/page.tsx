'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { PageHeader, Card, Button, Input, Loading } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';

interface Me {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Super administrador',
  admin: 'Administrador',
  seller: 'Vendedor',
  reader: 'Solo lectura',
};

export default function ProfilePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get<Me>('/auth/me');
      setMe(res);
      setName(res.name);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveName = async (e: FormEvent) => {
    e.preventDefault();
    setSavingName(true);
    try {
      const updated = await api.patch<Me>('/auth/me', { name });
      setMe(updated);
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem('user', JSON.stringify({ ...parsed, name: updated.name }));
      }
    } catch {} finally {
      setSavingName(false);
    }
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }

    setChangingPassword(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      setPasswordSuccess('Contraseña actualizada correctamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err?.message || 'Error al cambiar la contraseña');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) return <Loading />;
  if (!me) return <p className="text-center py-20 text-gray-500">No se pudo cargar tu perfil</p>;

  return (
    <div className="animate-fade-in max-w-2xl space-y-6">
      <PageHeader title="Mi Perfil" description="Administra tu información personal y contraseña" />

      <Card>
        <h3 className="text-sm font-semibold text-[var(--text)] mb-4">Información de la cuenta</h3>
        <form onSubmit={saveName} className="space-y-4">
          <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required />
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Email</label>
            <p className="text-sm text-[var(--text)] py-2">{me.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Rol</label>
            <p className="text-sm text-[var(--text)] py-2">{ROLE_LABELS[me.role] || me.role}</p>
          </div>
          <Button type="submit" loading={savingName}>Guardar nombre</Button>
        </form>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-[var(--text)] mb-4">Cambiar contraseña</h3>
        {passwordError && (
          <div className="mb-4 p-3 rounded-lg text-sm bg-red-500/10 text-red-400 border border-red-500/20">{passwordError}</div>
        )}
        {passwordSuccess && (
          <div className="mb-4 p-3 rounded-lg text-sm bg-green-500/10 text-green-400 border border-green-500/20">{passwordSuccess}</div>
        )}
        <form onSubmit={changePassword} className="space-y-4">
          <Input
            label="Contraseña actual"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <Input
            label="Nueva contraseña"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <Input
            label="Confirmar nueva contraseña"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <Button type="submit" loading={changingPassword}>Cambiar contraseña</Button>
        </form>
      </Card>
    </div>
  );
}
