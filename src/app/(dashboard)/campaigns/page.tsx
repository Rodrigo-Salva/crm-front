'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SearchInput, Button, Table, PageHeader, Loading, Card, Badge, Modal, ConfirmDialog, Input } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';
import { Campaign, Lead } from '@/modules/shared/types';
import { BatchActionsBar } from '@/modules/shared/components/ui/batch-actions';
import { useSelection } from '@/modules/shared/hooks/use-selection';

const statusConfig: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  draft: { label: 'Borrador', variant: 'default' },
  sending: { label: 'Enviando', variant: 'warning' },
  sent: { label: 'Enviada', variant: 'success' },
  cancelled: { label: 'Cancelada', variant: 'danger' },
};

const emptyForm = { name: '', subject: '', body: '' };



function RecipientPicker({ selectedIds, onChange }: { selectedIds: string[]; onChange: (ids: string[]) => void }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', source: '', careerId: '', modalityId: '' });
  const [careers, setCareers] = useState<any[]>([]);
  const [modalities, setModalities] = useState<any[]>([]);

  useEffect(() => {
    api.get<any[]>('/careers').then(setCareers).catch(() => {});
    api.get<any[]>('/modalities').then(setModalities).catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({ limit: '100' });
    if (search) params.set('search', search);
    if (filters.status) params.set('status', filters.status);
    if (filters.source) params.set('source', filters.source);
    if (filters.careerId) params.set('careerId', filters.careerId);
    if (filters.modalityId) params.set('modalityId', filters.modalityId);
    
    api.get<any>(`/leads?${params.toString()}`).then((res) => {
      setLeads(Array.isArray(res?.data) ? res.data : []);
    }).catch(() => {});
  }, [search, filters]);

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };

  const selectAll = () => {
    const newIds = Array.from(new Set([...selectedIds, ...leads.map(l => l.id)]));
    onChange(newIds);
  };

  const deselectAll = () => {
    const leadIds = new Set(leads.map(l => l.id));
    onChange(selectedIds.filter(id => !leadIds.has(id)));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">Destinatarios ({selectedIds.length} seleccionados)</label>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" type="button" onClick={selectAll}>Seleccionar filtrados</Button>
          <Button size="sm" variant="secondary" type="button" onClick={deselectAll}>Deseleccionar filtrados</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <select className="rounded-md border border-[var(--border)] bg-transparent text-sm px-2 py-1 text-white" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="" className="bg-[var(--card-bg)] text-white">Cualquier Estado</option><option value="new" className="bg-[var(--card-bg)] text-white">Nuevo</option><option value="contacted" className="bg-[var(--card-bg)] text-white">Contactado</option><option value="qualified" className="bg-[var(--card-bg)] text-white">Calificado</option><option value="lost" className="bg-[var(--card-bg)] text-white">Perdido</option>
        </select>
        <select className="rounded-md border border-[var(--border)] bg-transparent text-sm px-2 py-1 text-white" value={filters.source} onChange={(e) => setFilters({ ...filters, source: e.target.value })}>
          <option value="" className="bg-[var(--card-bg)] text-white">Cualquier Origen</option><option value="web" className="bg-[var(--card-bg)] text-white">Web</option><option value="facebook" className="bg-[var(--card-bg)] text-white">Facebook</option><option value="whatsapp" className="bg-[var(--card-bg)] text-white">WhatsApp</option>
        </select>
        <select className="rounded-md border border-[var(--border)] bg-transparent text-sm px-2 py-1 text-white" value={filters.careerId} onChange={(e) => setFilters({ ...filters, careerId: e.target.value })}>
          <option value="" className="bg-[var(--card-bg)] text-white">Cualquier Carrera</option>{careers.map(c => <option key={c.id} value={c.id} className="bg-[var(--card-bg)] text-white">{c.name}</option>)}
        </select>
        <select className="rounded-md border border-[var(--border)] bg-transparent text-sm px-2 py-1 text-white" value={filters.modalityId} onChange={(e) => setFilters({ ...filters, modalityId: e.target.value })}>
          <option value="" className="bg-[var(--card-bg)] text-white">Cualquier Modalidad</option>{modalities.map(m => <option key={m.id} value={m.id} className="bg-[var(--card-bg)] text-white">{m.name}</option>)}
        </select>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Buscar lead..." />
      <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-[var(--border)] divide-y divide-[var(--border)]">
        {leads.length === 0 ? (
          <p className="text-xs text-[var(--text-secondary)] text-center py-4">Sin leads</p>
        ) : (
          leads.map((l) => (
            <label key={l.id} className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--secondary)]/50 cursor-pointer">
              <input type="checkbox" checked={selectedIds.includes(l.id)} onChange={() => toggle(l.id)} />
              <span className="flex-1">{l.name}</span>
              <span className="text-xs text-[var(--text-secondary)]">{l.email}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  const router = useRouter();
  const [data, setData] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', subject: '', body: '', templateId: '' });
  const [leadIds, setLeadIds] = useState<string[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const sel = useSelection<Campaign>();
  const [batchLoading, setBatchLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const qs = params.toString();
      const [res, tpls] = await Promise.all([
        api.get<any>(`/campaigns${qs ? `?${qs}` : ''}`),
        api.get<any[]>('/email/templates')
      ]);
      setData(Array.isArray(res) ? res : []);
      setTemplates(tpls);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load() }, [load]);

  const openCreate = () => { setEditId(null); setForm({ name: '', subject: '', body: '', templateId: '' }); setLeadIds([]); setModalOpen(true); };
  const openEdit = async (item: Campaign) => {
    setEditId(item.id);
    setForm({ name: item.name, subject: item.subject, body: item.body, templateId: (item as any).templateId || '' });
    setLeadIds([]);
    setModalOpen(true);
    try {
      const full = await api.get<Campaign>(`/campaigns/${item.id}`);
      setLeadIds((full.recipients || []).map((r) => r.leadId));
    } catch {}
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try { await api.delete(`/campaigns/${deleteId}`); setConfirmOpen(false); setDeleteId(null); load(); } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (leadIds.length === 0) return;
    setSaving(true);
    try {
      if (editId) {
        await api.patch(`/campaigns/${editId}`, { ...form, leadIds });
      } else {
        await api.post('/campaigns', { ...form, leadIds });
      }
      setModalOpen(false); load();
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const handleSend = async (id: string) => {
    try { await api.post(`/campaigns/${id}/send`, {}); load(); } catch (err) { console.error(err); }
  };

  const handleBatchDelete = async () => {
    setBatchLoading(true);
    try {
      await Promise.all(Array.from(sel.selected).map((id) => api.delete(`/campaigns/${id}`)));
      sel.clear();
      load();
    } catch {} finally { setBatchLoading(false); }
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
        {c.status === 'draft' && (
          <>
            <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)]"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
            <button onClick={() => { setDeleteId(c.id); setConfirmOpen(true); }} className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--danger)] hover:bg-red-50"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
            <Button size="sm" onClick={() => handleSend(c.id)}>Enviar</Button>
          </>
        )}
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
        {sel.selected.size > 0 && (
          <BatchActionsBar count={sel.selected.size} onDelete={handleBatchDelete} onClear={sel.clear} loading={batchLoading} />
        )}
        {loading ? <Loading /> : <Table columns={columns} data={data} selected={sel.selected} onToggle={sel.toggle} onToggleAll={() => sel.toggleAll(data)} allSelected={sel.allSelected(data)} />}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Campaña' : 'Nueva Campaña'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Nombre de la campaña" />
          
          <div>
            <label className="block text-sm font-medium text-white mb-1">Plantilla de Email (Opcional)</label>
            <select
              value={form.templateId}
              onChange={(e) => {
                const tpl = templates.find(t => t.id === e.target.value);
                setForm({ 
                  ...form, 
                  templateId: e.target.value,
                  subject: tpl ? tpl.subject : form.subject,
                  body: tpl ? tpl.body : form.body
                });
              }}
              className="block w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
            >
              <option value="">Ninguna (Escribir manualmente)</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <Input label="Asunto" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required placeholder="Asunto del email" />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cuerpo del mensaje</label>
            <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={6} placeholder="Contenido del email..." className="block w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]" />
          </div>
          
          <RecipientPicker selectedIds={leadIds} onChange={setLeadIds} />
          {leadIds.length === 0 && (
            <p className="text-xs text-red-400">Selecciona al menos un destinatario.</p>
          )}
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
