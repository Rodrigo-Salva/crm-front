'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, Input, Loading } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';
import { Contact } from '@/modules/shared/types';

export default function EditContactPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', companyName: '', position: '', status: 'new' });

  const load = useCallback(async () => {
    try {
      const res = await api.get<Contact>(`/contacts/${id}`);
      setContact(res);
      setForm({ name: res.name, email: res.email, phone: res.phone || '', companyName: res.companyName || '', position: res.position || '', status: res.status });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load() }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/contacts/${id}`, form);
      router.push(`/contacts/${id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;
  if (!contact) return <p className="text-center py-20 text-gray-500">Contacto no encontrado</p>;

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)] transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-[var(--text)]">Editar Contacto</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Nombre completo" />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="correo@ejemplo.com" />
            <Input label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+52 555 123 4567" />
            <Input label="Empresa" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="Nombre de empresa" />
            <Input label="Cargo" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="Ej: CEO" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]">
                <option value="new">Nuevo</option>
                <option value="contacted">Contactado</option>
                <option value="qualified">Calificado</option>
                <option value="lost">Perdido</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => router.back()}>Cancelar</Button>
            <Button type="submit" loading={saving}>Guardar Cambios</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
