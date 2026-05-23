'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, Input, Loading } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';
import { Company } from '@/modules/shared/types';

export default function EditCompanyPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', industry: '', website: '', phone: '', address: '' });

  const load = useCallback(async () => {
    try {
      const res = await api.get<Company>(`/companies/${id}`);
      setCompany(res);
      setForm({ name: res.name, industry: res.industry || '', website: res.website || '', phone: res.phone || '', address: res.address || '' });
    } catch {} finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try { await api.patch(`/companies/${id}`, form); router.push(`/companies/${id}`); } catch {} finally { setSaving(false); }
  };

  if (loading) return <Loading />;
  if (!company) return <p className="text-center py-20 text-gray-500">Empresa no encontrada</p>;

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)]"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
        <h1 className="text-2xl font-bold text-[var(--text)]">Editar Empresa</h1>
      </div>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="Industria" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
            <Input label="Sitio web" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            <Input label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="Dirección" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="col-span-2" />
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
