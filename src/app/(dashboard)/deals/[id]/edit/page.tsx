'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, Input, Loading, SearchSelect } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';
import { Deal } from '@/modules/shared/types';

export default function EditDealPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', value: 0, stage: 'lead', contactId: '', expectedCloseDate: '' });

  const load = useCallback(async () => {
    try {
      const res = await api.get<Deal>(`/deals/${id}`);
      setDeal(res);
      setForm({ title: res.title, value: res.value, stage: res.stage, contactId: res.contactId, expectedCloseDate: res.expectedCloseDate || '' });
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
      await api.patch(`/deals/${id}`, form);
      router.push(`/deals/${id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;
  if (!deal) return <p className="text-center py-20 text-gray-500">Negocio no encontrado</p>;

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)] transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-[var(--text)]">Editar Negocio</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Nombre del negocio" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Valor" type="number" value={String(form.value)} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} required placeholder="0.00" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Etapa</label>
              <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]">
                <option value="lead">Lead</option><option value="qualified">Calificado</option><option value="proposal">Propuesta</option><option value="negotiation">Negociación</option><option value="closed_won">Ganado</option><option value="closed_lost">Perdido</option>
              </select>
            </div>
            <SearchSelect label="Contacto" value={form.contactId} onChange={(id) => setForm({ ...form, contactId: id })} endpoint="/contacts" placeholder="Buscar contacto por nombre..." displaySub={(c) => c.email} />
            <Input label="Fecha cierre" type="date" value={form.expectedCloseDate} onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })} />
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
