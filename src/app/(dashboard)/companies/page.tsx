'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Table, Pagination, SearchInput, PageHeader, Loading, Card, Modal, ConfirmDialog, Input } from '@/modules/shared';
import { FilterBar } from '@/modules/shared/components/ui/filter-bar';
import { api } from '@/modules/shared/services/api';
import { Company } from '@/modules/shared/types';
import { BatchActionsBar } from '@/modules/shared/components/ui/batch-actions';
import { useSelection } from '@/modules/shared/hooks/use-selection';

const emptyForm = { name: '', industry: '', website: '', phone: '', address: '' };

export default function CompaniesPage() {
  const router = useRouter();
  const [data, setData] = useState<Company[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const limit = 20;
  const sel = useSelection<Company>();
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchEditOpen, setBatchEditOpen] = useState(false);
  const [batchStatus, setBatchStatus] = useState('');
  const [batchSaving, setBatchSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const res = await api.get<any>(`/companies?${params}`);
      setData(Array.isArray(res.data) ? res.data : []);
      setTotal(res.total ?? 0);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load() }, [load]);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (item: Company) => { setEditId(item.id); setForm({ name: item.name, industry: item.industry || '', website: item.website || '', phone: item.phone || '', address: item.address || '' }); setModalOpen(true); };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try { await api.delete(`/companies/${deleteId}`); setConfirmOpen(false); setDeleteId(null); load(); } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) { await api.patch(`/companies/${editId}`, form); } else { await api.post('/companies', form); }
      setModalOpen(false); load();
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const handleBatchDelete = async () => {
    setBatchLoading(true);
    try {
      await Promise.all(Array.from(sel.selected).map((id) => api.delete(`/companies/${id}`)));
      sel.clear();
      load();
    } catch {} finally { setBatchLoading(false); }
  };

  const handleBatchEdit = async () => {
    setBatchSaving(true);
    try {
      await Promise.all(Array.from(sel.selected).map((id) => api.patch(`/companies/${id}`, { stage: batchStatus })));
      sel.clear();
      setBatchEditOpen(false);
      load();
    } catch {} finally { setBatchSaving(false); }
  };

  const columns = [
    { key: 'name', label: 'Nombre', render: (c: Company) => (
      <button onClick={() => router.push(`/companies/${c.id}`)} className="flex items-center gap-3 hover:text-[var(--primary)] transition-colors">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 text-white flex items-center justify-center text-xs font-bold">{c.name.charAt(0).toUpperCase()}</div>
        <span className="font-medium">{c.name}</span>
      </button>
    )},
    { key: 'industry', label: 'Industria', render: (c: Company) => <span className="text-[var(--text-secondary)]">{c.industry || '—'}</span> },
    { key: 'website', label: 'Sitio web', render: (c: Company) => c.website || '—' },
    { key: 'phone', label: 'Teléfono', render: (c: Company) => c.phone || '—' },
    { key: '_count', label: 'Leads', render: (c: any) => <span className="px-2 py-0.5 bg-gray-100 rounded-md text-sm">{c._count?.leads ?? '—'}</span> },
    { key: 'createdAt', label: 'Creado', render: (c: Company) => <span className="text-[var(--text-secondary)]">{new Date(c.createdAt).toLocaleDateString()}</span> },
    { key: 'actions', label: '', render: (c: Company) => (
      <div className="flex items-center gap-1">
        <button onClick={() => router.push(`/companies/${c.id}`)} className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)]" title="Ver detalle"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
        <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)]"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
        <button onClick={() => { setDeleteId(c.id); setConfirmOpen(true); }} className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--danger)] hover:bg-red-50"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
      </div>
    )},
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Empresas" description="Gestiona tus cuentas y organizaciones" actions={<Button onClick={openCreate}>+ Nueva Empresa</Button>} />
      <Card padding={false}>
        <div className="p-4 border-b border-[var(--border)] space-y-3">
          <div className="flex items-center justify-between gap-4">
            <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Buscar empresas..." />
            <FilterBar
              fields={[
                { key: 'dateFrom', label: 'Desde', type: 'date' },
                { key: 'dateTo', label: 'Hasta', type: 'date' },
              ]}
              values={filters}
              onChange={(v) => { setFilters(v); setPage(1) }}
              onClear={() => { setFilters({}); setPage(1) }}
            />
          </div>
        </div>
        {sel.selected.size > 0 && (
          <BatchActionsBar count={sel.selected.size} onDelete={handleBatchDelete} onClear={sel.clear} onEdit={() => { setBatchStatus(''); setBatchEditOpen(true); }} loading={batchLoading} />
        )}
        {loading ? <Loading /> : <><Table columns={columns} data={data} selected={sel.selected} onToggle={sel.toggle} onToggleAll={() => sel.toggleAll(data)} allSelected={sel.allSelected(data)} /><Pagination page={page} limit={limit} total={total} onPageChange={setPage} /></>}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Empresa' : 'Nueva Empresa'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Nombre de la empresa" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Industria" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="Ej: Tecnología" />
            <Input label="Sitio web" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://ejemplo.com" />
            <Input label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+52 555 123 4567" />
            <Input label="Dirección" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Dirección completa" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>{editId ? 'Guardar Cambios' : 'Crear Empresa'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} loading={saving} title="Eliminar Empresa" message="¿Estás seguro? Esta acción no se puede deshacer." />

      <Modal open={batchEditOpen} onClose={() => setBatchEditOpen(false)} title={`Editar ${sel.selected.size} registros`}>
        <form onSubmit={(e) => { e.preventDefault(); handleBatchEdit(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cambiar estado/etapa a</label>
            <select value={batchStatus} onChange={(e) => setBatchStatus(e.target.value)} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)]">
              <option value="">Seleccionar...</option>
              <option value="open">Abierto</option>
              <option value="in_progress">En progreso</option>
              <option value="closed">Cerrado</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setBatchEditOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={batchSaving}>Actualizar {sel.selected.size} registros</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
