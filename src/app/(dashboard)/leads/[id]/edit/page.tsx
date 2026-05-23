'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, Input, Loading } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';
import { Lead } from '@/modules/shared/types';

const sourceOptions = ['web', 'referral', 'phone', 'email', 'event', 'partner', 'other'];
const statusOptions = ['new', 'contacted', 'qualified', 'converted', 'lost'];

export default function EditLeadPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', source: 'web', status: 'new', notes: '' });

  const load = useCallback(async () => {
    try {
      const res = await api.get<Lead>(`/leads/${id}`);
      setLead(res);
      setForm({ name: res.name, email: res.email || '', phone: res.phone || '', company: res.company || '', source: res.source, status: res.status, notes: res.notes || '' });
    } catch {} finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try { await api.patch(`/leads/${id}`, form); router.push(`/leads/${id}`); } catch {} finally { setSaving(false); }
  };

  if (loading) return <Loading />;
  if (!lead) return <p className="text-center py-20 text-gray-500">Lead no encontrado</p>;

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)]"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
        <h1 className="text-2xl font-bold text-[var(--text)]">Editar Lead</h1>
      </div>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Nombre completo" />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="correo@ejemplo.com" />
            <Input label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+52 555 123 4567" />
            <Input label="Empresa" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Nombre de empresa" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Origen</label>
              <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]">
                {sourceOptions.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]">
                {statusOptions.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={4} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] placeholder:text-gray-400" placeholder="Notas adicionales..." />
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
