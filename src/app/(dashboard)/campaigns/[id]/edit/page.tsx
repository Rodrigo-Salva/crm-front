'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, Input, Loading } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';
import { Campaign } from '@/modules/shared/types';

export default function EditCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', subject: '', body: '', status: 'draft' });

  const load = useCallback(async () => {
    try {
      const res = await api.get<Campaign>(`/campaigns/${id}`);
      setCampaign(res);
      setForm({ name: res.name, subject: res.subject || '', body: res.body || '', status: res.status || 'draft' });
    } catch {} finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try { await api.patch(`/campaigns/${id}`, form); router.push(`/campaigns/${id}`); } catch {} finally { setSaving(false); }
  };

  if (loading) return <Loading />;
  if (!campaign) return <p className="text-center py-20 text-gray-500">Campaña no encontrada</p>;

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)]"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
        <h1 className="text-2xl font-bold text-[var(--text)]">Editar Campaña</h1>
      </div>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Asunto" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cuerpo</label>
            <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={6} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)]">
              <option value="draft">Borrador</option><option value="sending">Enviando</option><option value="sent">Enviada</option><option value="cancelled">Cancelada</option>
            </select>
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
