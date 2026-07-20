'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, Table, Loading, Badge, Button, Modal, Input } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  totalRecipients: number;
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  createdAt: string;
}

const statusMap: Record<string, { label: string; color: any }> = {
  draft: { label: 'Borrador', color: 'default' },
  sending: { label: 'Enviando', color: 'warning' },
  sent: { label: 'Enviado', color: 'success' },
  cancelled: { label: 'Cancelado', color: 'danger' },
};

export default function CampaignsPage() {
  const [data, setData] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', subject: '', body: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/campaigns');
      setData(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load() }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Por ahora creamos la campaña como 'draft'
      await api.post('/campaigns', form);
      setModalOpen(false);
      setForm({ name: '', subject: '', body: '' });
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Campaña', render: (c: Campaign) => (
      <div>
        <div className="font-medium text-[var(--text)]">{c.name}</div>
        <div className="text-xs text-[var(--text-secondary)] truncate max-w-[200px]">{c.subject}</div>
      </div>
    )},
    { key: 'status', label: 'Estado', render: (c: Campaign) => {
        const conf = statusMap[c.status] || { label: c.status, color: 'default' };
        return <Badge variant={conf.color}>{conf.label}</Badge>;
    }},
    { key: 'recipients', label: 'Destinatarios', render: (c: Campaign) => c.totalRecipients },
    { key: 'stats', label: 'Rendimiento', render: (c: Campaign) => {
        const openRate = c.totalRecipients > 0 ? Math.round((c.openedCount / c.totalRecipients) * 100) : 0;
        return (
          <div className="flex flex-col gap-1 w-full max-w-[120px]">
            <div className="flex justify-between text-xs text-[var(--text-secondary)]">
              <span>Aperturas</span>
              <span className="font-medium text-[var(--text)]">{openRate}%</span>
            </div>
            <div className="w-full h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--primary)]" style={{ width: `${openRate}%` }} />
            </div>
          </div>
        );
    }},
    { key: 'date', label: 'Fecha', render: (c: Campaign) => <span className="text-[var(--text-secondary)]">{new Date(c.createdAt).toLocaleDateString()}</span> },
    { key: 'actions', label: '', render: (c: Campaign) => (
      <div className="flex items-center gap-2">
        <Button size="sm" variant="secondary" onClick={() => alert('Próximamente: Editor de campaña')}>Editar</Button>
      </div>
    )}
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader 
        title="Campañas de Email" 
        description="Envía newsletters y correos masivos a tus Leads" 
        actions={<Button onClick={() => setModalOpen(true)}>+ Crear Campaña</Button>}
      />

      <Card padding={false}>
        {loading ? <Loading /> : <Table columns={columns} data={data} />}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva Campaña">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Nombre Interno" 
            value={form.name} 
            onChange={e => setForm({...form, name: e.target.value})} 
            required 
            placeholder="Ej. Promo Verano 2026"
          />
          <Input 
            label="Asunto del Correo" 
            value={form.subject} 
            onChange={e => setForm({...form, subject: e.target.value})} 
            required 
            placeholder="Ej. ¡Descubre nuestras nuevas ofertas!"
          />
          
          <div>
            <label className="block text-sm font-medium mb-1">Cuerpo del correo</label>
            <textarea 
              className="block w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-[var(--primary)]"
              rows={6}
              value={form.body}
              onChange={e => setForm({...form, body: e.target.value})}
              placeholder="Hola {{nombre}}, tenemos una oferta para ti..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Guardar Borrador</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
