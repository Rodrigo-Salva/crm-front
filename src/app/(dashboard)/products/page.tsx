'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Table, SearchInput, PageHeader, Loading, Card, Badge, Modal, ConfirmDialog, Input } from '@/modules/shared';
import { FilterBar } from '@/modules/shared/components/ui/filter-bar';
import { api } from '@/modules/shared/services/api';
import { Product } from '@/modules/shared/types';
import { formatCurrency, CURRENCIES } from '@/modules/shared/utils/format';
import { BatchActionsBar } from '@/modules/shared/components/ui/batch-actions';
import { useSelection } from '@/modules/shared/hooks/use-selection';

const emptyForm = { name: '', description: '', price: 0, unit: '', category: '', sku: '', active: true, currency: 'MXN' };

export default function ProductsPage() {
  const router = useRouter();
  const [data, setData] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const sel = useSelection<Product>();
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchEditOpen, setBatchEditOpen] = useState(false);
  const [batchStatus, setBatchStatus] = useState('');
  const [batchSaving, setBatchSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('category', search);
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const qs = params.toString();
      const res = await api.get<any>(`/products${qs ? `?${qs}` : ''}`);
      setData(Array.isArray(res) ? res : []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [search, filters]);

  useEffect(() => { load() }, [load]);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (item: Product) => { setEditId(item.id); setForm({ name: item.name, description: item.description || '', price: item.price, unit: item.unit, category: item.category || '', sku: item.sku || '', active: item.active, currency: item.currency }); setModalOpen(true); };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try { await api.delete(`/products/${deleteId}`); setConfirmOpen(false); setDeleteId(null); load(); } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) { await api.patch(`/products/${editId}`, form); } else { await api.post('/products', form); }
      setModalOpen(false); load();
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const handleBatchDelete = async () => {
    setBatchLoading(true);
    try {
      await Promise.all(Array.from(sel.selected).map((id) => api.delete(`/products/${id}`)));
      sel.clear();
      load();
    } catch {} finally { setBatchLoading(false); }
  };

  const handleBatchEdit = async () => {
    setBatchSaving(true);
    try {
      await Promise.all(Array.from(sel.selected).map((id) => api.patch(`/products/${id}`, { active: batchStatus === 'true' })));
      sel.clear();
      setBatchEditOpen(false);
      load();
    } catch {} finally { setBatchSaving(false); }
  };

  const columns = [
    { key: 'name', label: 'Nombre', render: (p: Product) => (
      <button onClick={() => router.push(`/products/${p.id}`)} className="text-left hover:text-[var(--primary)] transition-colors">
        <span className="font-medium">{p.name}</span>
        {p.description && <p className="text-xs text-[var(--text-secondary)] truncate max-w-[200px]">{p.description}</p>}
      </button>
    )},
    { key: 'sku', label: 'SKU', render: (p: Product) => <span className="text-[var(--text-secondary)]">{p.sku || '—'}</span> },
    { key: 'category', label: 'Categoría', render: (p: Product) => p.category || '—' },
    { key: 'price', label: 'Precio', render: (p: Product) => <span className="font-semibold">{formatCurrency(p.price, p.currency)}</span> },
    { key: 'unit', label: 'Unidad', render: (p: Product) => <span className="text-[var(--text-secondary)]">{p.unit}</span> },
    { key: 'active', label: 'Estado', render: (p: Product) => p.active ? <Badge variant="success">Activo</Badge> : <Badge variant="default">Inactivo</Badge> },
    { key: 'actions', label: '', render: (p: Product) => (
      <div className="flex items-center gap-1">
        <button onClick={() => router.push(`/products/${p.id}`)} className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)]" title="Ver detalle"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)]"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
        <button onClick={() => { setDeleteId(p.id); setConfirmOpen(true); }} className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--danger)] hover:bg-red-50"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
      </div>
    )},
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Productos" description="Catálogo de productos y servicios" actions={<Button onClick={openCreate}>+ Nuevo Producto</Button>} />
      <Card padding={false}>
        <div className="p-4 border-b border-[var(--border)] space-y-3">
          <div className="flex items-center justify-between gap-4">
            <SearchInput value={search} onChange={setSearch} placeholder="Filtrar por categoría..." />
            <FilterBar
              fields={[
                { key: 'category', label: 'Categoría', type: 'text' },
                { key: 'active', label: 'Estado', type: 'select', options: [
                  { value: 'true', label: 'Activo' }, { value: 'false', label: 'Inactivo' },
                ]},
              ]}
              values={filters}
              onChange={(v) => { setFilters(v) }}
              onClear={() => { setFilters({}) }}
            />
          </div>
        </div>
        {sel.selected.size > 0 && (
          <BatchActionsBar count={sel.selected.size} onDelete={handleBatchDelete} onClear={sel.clear} onEdit={() => { setBatchStatus(''); setBatchEditOpen(true); }} loading={batchLoading} />
        )}
        {loading ? <Loading /> : <Table columns={columns} data={data} selected={sel.selected} onToggle={sel.toggle} onToggleAll={() => sel.toggleAll(data)} allSelected={sel.allSelected(data)} />}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Producto' : 'Nuevo Producto'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Nombre del producto" />
            <Input label="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="COD-001" />
            <Input label="Precio" type="number" value={String(form.price)} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required placeholder="0.00" />
            <div>
              <label className="block text-sm font-medium mb-1">Moneda</label>
              <select className="block w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}>
                {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <Input label="Unidad" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} required placeholder="Ej: pieza, hora, licencia" />
            <Input label="Categoría" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ej: Software" />
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
                <span className="text-sm font-medium text-gray-700">Producto activo</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Descripción del producto" className="block w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>{editId ? 'Guardar Cambios' : 'Crear Producto'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} loading={saving} title="Eliminar Producto" message="¿Estás seguro? Esta acción no se puede deshacer." />

      <Modal open={batchEditOpen} onClose={() => setBatchEditOpen(false)} title={`Editar ${sel.selected.size} productos`}>
        <form onSubmit={(e) => { e.preventDefault(); handleBatchEdit(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cambiar estado a</label>
            <select value={batchStatus} onChange={(e) => setBatchStatus(e.target.value)} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)]">
              <option value="">Seleccionar...</option>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setBatchEditOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={batchSaving} disabled={!batchStatus}>Actualizar {sel.selected.size} productos</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
