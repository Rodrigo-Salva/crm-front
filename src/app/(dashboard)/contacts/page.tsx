'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Table, Pagination, SearchInput, PageHeader, Loading, Card, Badge, Modal, ConfirmDialog, Input } from '@/modules/shared';
import { FilterBar } from '@/modules/shared/components/ui/filter-bar';
import { BatchActionsBar } from '@/modules/shared/components/ui/batch-actions';
import { useSelection } from '@/modules/shared/hooks/use-selection';
import { exportToCSV } from '@/modules/shared/services/export-utils';
import { api } from '@/modules/shared/services/api';
import { Contact } from '@/modules/shared/types';

const statusConfig: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  new: { label: 'Nuevo', variant: 'primary' },
  contacted: { label: 'Contactado', variant: 'warning' },
  qualified: { label: 'Calificado', variant: 'success' },
  lost: { label: 'Perdido', variant: 'danger' },
};

const emptyForm = { name: '', email: '', phone: '', companyName: '', position: '', status: 'new' };

export default function ContactsPage() {
  const router = useRouter();
  const [data, setData] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [batchLoading, setBatchLoading] = useState(false);
  const sel = useSelection<Contact>();
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [customFieldDefs, setCustomFieldDefs] = useState<any[]>([]);
  const [customFields, setCustomFields] = useState<Record<string, any>>({});
  const [batchEditOpen, setBatchEditOpen] = useState(false);
  const [batchStatus, setBatchStatus] = useState('new');
  const [batchSaving, setBatchSaving] = useState(false);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const res = await api.get<any>(`/contacts?${params}`);
      setData(Array.isArray(res.data) ? res.data : []);
      setTotal(res.total ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, filters]);

  useEffect(() => { load() }, [load]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setCustomFields({});
    setModalOpen(true);
    api.get<any[]>('/custom-fields?entity=contact').then(setCustomFieldDefs).catch(() => {});
  };

  const openEdit = (item: Contact) => {
    setEditId(item.id);
    setForm({ name: item.name, email: item.email, phone: item.phone || '', companyName: item.companyName || '', position: item.position || '', status: item.status });
    setCustomFields(item.customFields || {});
    setModalOpen(true);
    api.get<any[]>('/custom-fields?entity=contact').then(setCustomFieldDefs).catch(() => {});
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      await api.delete(`/contacts/${deleteId}`);
      setConfirmOpen(false);
      setDeleteId(null);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleBatchDelete = async () => {
    setBatchLoading(true);
    try {
      await Promise.all(Array.from(sel.selected).map((id) => api.delete(`/contacts/${id}`)));
      sel.clear();
      load();
    } catch {
    } finally {
      setBatchLoading(false);
    }
  };

  const handleBatchEdit = async () => {
    setBatchSaving(true);
    try {
      await Promise.all(
        Array.from(sel.selected).map((id) => api.patch(`/contacts/${id}`, { status: batchStatus })),
      );
      sel.clear();
      setBatchEditOpen(false);
      load();
    } catch {
    } finally {
      setBatchSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...form, customFields };
      if (editId) {
        await api.patch(`/contacts/${editId}`, body);
      } else {
        await api.post('/contacts', body);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Nombre', render: (c: Contact) => (
      <button onClick={() => router.push(`/contacts/${c.id}`)} className="flex items-center gap-3 hover:text-[var(--primary)] transition-colors">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--celeste-400)] to-[var(--celeste-600)] text-white flex items-center justify-center text-xs font-bold">
          {c.name.charAt(0).toUpperCase()}
        </div>
        <span className="font-medium">{c.name}</span>
      </button>
    )},
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Teléfono', render: (c: Contact) => <span className="text-[var(--text-secondary)]">{c.phone || '—'}</span> },
    { key: 'companyName', label: 'Empresa', render: (c: Contact) => <span className="text-[var(--text-secondary)]">{c.companyName || '—'}</span> },
    { key: 'status', label: 'Estado', render: (c: Contact) => {
      const cfg = statusConfig[c.status] || { label: c.status, variant: 'default' as const };
      return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
    }},
    { key: 'createdAt', label: 'Creado', render: (c: Contact) => <span className="text-[var(--text-secondary)]">{new Date(c.createdAt).toLocaleDateString()}</span> },
    { key: 'actions', label: '', render: (c: Contact) => (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => router.push(`/contacts/${c.id}`)} className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)] transition-colors" title="Ver detalle">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
        </button>
        <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)] transition-colors" title="Editar">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        </button>
        <button onClick={() => { setDeleteId(c.id); setConfirmOpen(true); }} className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--danger)] hover:bg-red-50 transition-colors" title="Eliminar">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
    )},
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Contactos" description="Gestiona tus contactos y leads" actions={<><Button size="sm" variant="outline" onClick={() => exportToCSV(data, [{ key: 'name', label: 'Nombre' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Teléfono' }, { key: 'companyName', label: 'Empresa' }, { key: 'position', label: 'Cargo' }, { key: 'status', label: 'Estado' }], 'contactos')}>Exportar CSV</Button><Button onClick={openCreate}>+ Nuevo Contacto</Button></>} />

      <Card padding={false}>
        <div className="p-4 border-b border-[var(--border)] space-y-3">
          <div className="flex items-center justify-between gap-4">
            <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Buscar por nombre, email o empresa..." />
            <FilterBar
              fields={[
                { key: 'status', label: 'Estado', type: 'select', options: [
                  { value: 'new', label: 'Nuevo' }, { value: 'contacted', label: 'Contactado' },
                  { value: 'qualified', label: 'Calificado' }, { value: 'lost', label: 'Perdido' },
                ]},
                { key: 'dateFrom', label: 'Desde', type: 'date' },
                { key: 'dateTo', label: 'Hasta', type: 'date' },
              ]}
              values={filters}
              onChange={(v) => { setFilters(v); setPage(1) }}
              onClear={() => { setFilters({}); setPage(1) }}
            />
          </div>
        </div>
        {loading ? <Loading /> : <>
          {sel.selected.size > 0 && <BatchActionsBar count={sel.selected.size} onDelete={handleBatchDelete} onClear={sel.clear} onEdit={() => { setBatchStatus('new'); setBatchEditOpen(true); }} loading={batchLoading} />}
          <Table columns={columns} data={data} selected={sel.selected} onToggle={sel.toggle} onToggleAll={() => sel.toggleAll(data)} allSelected={sel.allSelected(data)} />
          <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
        </>}
      </Card>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Contacto' : 'Nuevo Contacto'}>
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
          {customFieldDefs.length > 0 && (
            <div className="border-t border-[var(--border)] pt-4 mt-2">
              <h4 className="text-sm font-semibold text-[var(--text)] mb-3">Campos personalizados</h4>
              <div className="grid grid-cols-2 gap-4">
                {customFieldDefs.map((f: any) => (
                  <div key={f.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}{f.required ? ' *' : ''}</label>
                    {f.type === 'select' ? (
                      <select value={customFields[f.name] || ''} onChange={(e) => setCustomFields({ ...customFields, [f.name]: e.target.value })} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)]">
                        <option value="">Seleccionar...</option>
                        {(f.options || []).map((o: string) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : f.type === 'boolean' ? (
                      <input type="checkbox" checked={!!customFields[f.name]} onChange={(e) => setCustomFields({ ...customFields, [f.name]: e.target.checked })} className="rounded border-gray-300 mt-2" />
                    ) : f.type === 'number' ? (
                      <input type="number" value={customFields[f.name] || ''} onChange={(e) => setCustomFields({ ...customFields, [f.name]: e.target.value })} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)]" />
                    ) : (
                      <input type={f.type === 'date' ? 'date' : 'text'} value={customFields[f.name] || ''} onChange={(e) => setCustomFields({ ...customFields, [f.name]: e.target.value })} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)]" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>{editId ? 'Guardar Cambios' : 'Crear Contacto'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} loading={saving} title="Eliminar Contacto" message="¿Estás seguro? Esta acción no se puede deshacer." />

      <Modal open={batchEditOpen} onClose={() => setBatchEditOpen(false)} title={`Editar ${sel.selected.size} contactos`}>
        <form onSubmit={(e) => { e.preventDefault(); handleBatchEdit(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cambiar estado a</label>
            <select value={batchStatus} onChange={(e) => setBatchStatus(e.target.value)} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)]">
              <option value="new">Nuevo</option><option value="contacted">Contactado</option><option value="qualified">Calificado</option><option value="lost">Perdido</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setBatchEditOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={batchSaving}>Actualizar {sel.selected.size} contactos</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
