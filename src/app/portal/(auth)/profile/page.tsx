'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input, Modal } from '@/modules/shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function PortalProfilePage() {
  const router = useRouter();
  const [contact, setContact] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('portal_contact');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('portal_token');
      const res = await fetch(`${API_BASE}/auth/portal/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error');
      setSuccess('Contraseña actualizada exitosamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!contact) return null;

  return (
    <div className="animate-fade-in max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--text)]">Mi Perfil</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Administra tu información personal</p>
      </div>

      <Card>
        <h3 className="text-sm font-semibold text-[var(--text)] mb-4">Información de la cuenta</h3>
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-[var(--text-secondary)]">Nombre:</span>
            <p className="font-medium text-[var(--text)]">{contact.name}</p>
          </div>
          <div>
            <span className="text-[var(--text-secondary)]">Email:</span>
            <p className="font-medium text-[var(--text)]">{contact.email}</p>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-[var(--text)] mb-4">Cambiar contraseña</h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input label="Contraseña actual" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required placeholder="••••••••" />
          <Input label="Nueva contraseña" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="Mínimo 8 caracteres" />
          <Input label="Confirmar contraseña" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Repite la nueva contraseña" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
          <Button type="submit" loading={loading}>Actualizar contraseña</Button>
        </form>
      </Card>
    </div>
  );
}
