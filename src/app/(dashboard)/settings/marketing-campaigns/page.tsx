'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { PageHeader, Card, Button, Modal, Input, ConfirmDialog, Loading } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';
import { formatCurrency } from '@/modules/shared/utils/format';
import type { MarketingCampaign } from '@/modules/shared/types';

export default function MarketingCampaignsPage() {
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<MarketingCampaign | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [channel, setChannel] = useState('');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<MarketingCampaign[]>('/marketing-campaigns');
      setCampaigns(data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const openCreate = () => {
    setEditing(null);
    setName(''); setChannel(''); setBudget(''); setStartDate(''); setEndDate(''); setNotes('');
    setShowModal(true);
  };

  const openEdit = (c: MarketingCampaign) => {
    setEditing(c);
    setName(c.name);
    setChannel(c.channel || '');
    setBudget(c.budget ? String(c.budget) : '');
    setStartDate(c.startDate ? c.startDate.slice(0, 10) : '');
    setEndDate(c.endDate ? c.endDate.slice(0, 10) : '');
    setNotes(c.notes || '');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const payload = {
      name,
      channel: channel || undefined,
      budget: budget ? Number(budget) : 0,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      notes: notes || undefined,
    };
    try {
      if (editing) {
        await api.patch(`/marketing-campaigns/${editing.id}`, payload);
      } else {
        await api.post('/marketing-campaigns', payload);
      }
      setShowModal(false);
      await fetchCampaigns();
    } catch {} finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/marketing-campaigns/${deleteId}`);
      setDeleteId(null);
      await fetchCampaigns();
    } catch {}
  };

  if (loading) return <Loading />;

  return (
    <div className="animate-fade-in">
      <PageHeader backHref="/settings" backLabel="Volver a Configuración"
        title="Campañas de Marketing"
        description="Vincula leads a campañas para medir el ROI de tu inversión"
        actions={<Button onClick={openCreate}>+ Nueva campaña</Button>}
      />

      <Card padding={false}>
        {campaigns.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)] text-center py-12">No hay campañas configuradas</p>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {campaigns.map((c) => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[var(--secondary)]/50 transition-colors">
                <div className="flex-1">
                  <Link href={`/settings/marketing-campaigns/${c.id}`} className="text-sm font-medium text-[var(--text)] hover:text-[var(--primary)]">
                    {c.name}
                  </Link>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {c.channel || 'Sin canal'} · Presupuesto: {formatCurrency(c.budget || 0)} · {c._count?.leads ?? 0} leads
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>Editar</Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleteId(c.id)} className="text-red-500">Eliminar</Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar campaña' : 'Nueva campaña'}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ej: Facebook Ads Junio" />
          <Input label="Canal" value={channel} onChange={(e) => setChannel(e.target.value)} placeholder="Ej: Facebook Ads, Google Ads, Referidos" />
          <Input label="Presupuesto" type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="0" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Fecha inicio" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input label="Fecha fin" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">Notas</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--text)]" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Eliminar campaña" message="¿Estás seguro? Los leads vinculados quedarán sin campaña asignada." />
    </div>
  );
}
