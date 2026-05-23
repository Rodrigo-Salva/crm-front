'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SearchInput, Button, Table, PageHeader, Loading, Card, Badge, Modal, ConfirmDialog, Input } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';
import { Campaign } from '@/modules/shared/types';

const statusConfig: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  draft: { label: 'Borrador', variant: 'default' },
  sending: { label: 'Enviando', variant: 'warning' },
  sent: { label: 'Enviada', variant: 'success' },
  cancelled: { label: 'Cancelada', variant: 'danger' },
};

const emptyForm = { name: '', subject: '', body: '' };

export default function CampaignsPage() {
  const router = useRouter();
  const [data, setData] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const qs = params.toString();
      const res = await api.get<any>(`/campaigns${qs ? `?${qs}` : ''}`);
      setData(Array.isArray(res) ? res : []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load() }, [load]);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (item: Campaign) => { setEditId(item.id); setForm({ name: item.name, subject: item.subject, body: item.body }); setModalOpen(true); };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try { await api.delete(`/campaigns/${deleteId}`); setConfirmOpen(false); setDeleteId(null); load(); } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) { await api.patch(`/campaigns/${editId}`, form); } else { await api.post('/campaigns', form); }
      setModalOpen(false); load();
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const handleSend = async (id: string) => {
    try { await api.post(`/campaigns/${id}/send`, {}); load(); } catch (err) { console.error(err); }
  };

  const columns = [
    { key: 'name', label: 'Nombre', render: (c: Campaign) => (
      <button onClick={() => router.push(`/campaigns/${c.id}`)} className="text-left hover:text-[var(--primary)] transition-colors">
        <span className="font-medium">{c.name}</span>
        <p className="text-xs text-[var(--text-secondary)]">{c.subject}</p>
      </button>
    )},
    { key: 'status', label: 'Estado', render: (c: Campaign) => { const cfg = statusConfig[c.status] || { label: c.status, variant: 'default' as const }; return <Badge variant={cfg.variant}>{cfg.label}</Badge>; }},
    { key: 'totalRecipients', label: 'Destinatarios', render: (c: Campaign) => <span className="font-medium">{c._count?.recipients ?? c.totalRecipients}</span> },
    { key: 'sentCount', label: 'Enviados', render: (c: Campaign) => <span className="font-medium">{c.sentCount}</span> },
    { key: 'createdAt', label: 'Creado', render: (c: Campaign) => <span className="text-[var(--text-secondary)]">{new Date(c.createdAt).toLocaleDateString()}</span> },
    { key: 'actions', label: '', render: (c: Campaign) => (
      <div className="flex items-center gap-1">
        <button onClick={() => router.push(`/campaigns/${c.id}`)} className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)]" title="Ver detalle"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
        <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)]"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
        <button onClick={() => { setDeleteId(c.id); setConfirmOpen(true); }} className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--danger)] hover:bg-red-50"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
        {c.status === 'draft' && <Button size="sm" onClick={() => handleSend(c.id)}>Enviar</Button>}
      </div>
    )},
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Campañas" description="Gestiona tus campañas de email marketing" actions={<Button onClick={openCreate}>+ Nueva Campaña</Button>} />
      <Card padding={false}>
        <div className="p-4 border-b border-[var(--border)]">
          <div className="flex items-center justify-between gap-4">
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar..." />
          </div>
        </div>
        {loading ? <Loading /> : <Table columns={columns} data={data} />}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Campaña' : 'Nueva Campaña'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Nombre de la campaña" />
          <Input label="Asunto" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required placeholder="Asunto del email" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cuerpo del mensaje</label>
            <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={6} placeholder="Contenido del email..." className="block w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>{editId ? 'Guardar Cambios' : 'Crear Campaña'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} loading={saving} title="Eliminar Campaña" message="¿Estás seguro? Esta acción no se puede deshacer." />
    </div>
  );
}
