'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Table, SearchInput, PageHeader, Loading, Card, Modal, ConfirmDialog, Input } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';
import { ProductCategory } from '@/modules/shared/types';
import { useSelection } from '@/modules/shared/hooks/use-selection';

const emptyForm = { name: '' };

export default function ProductCategoriesPage() {
  const router = useRouter();
  const [data, setData] = useState<ProductCategory[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const sel = useSelection<ProductCategory>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/product-categories');
      const filtered = Array.isArray(res) ? res.filter(c => c.name.toLowerCase().includes(search.toLowerCase())) : [];
      setData(filtered);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load() }, [load]);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (item: ProductCategory) => { setEditId(item.id); setForm({ name: item.name }); setModalOpen(true); };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try { await api.delete(`/product-categories/${deleteId}`); setConfirmOpen(false); setDeleteId(null); load(); } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) { await api.patch(`/product-categories/${editId}`, form); } else { await api.post('/product-categories', form); }
      setModalOpen(false); load();
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const columns = [
    { key: 'name', label: 'Nombre', render: (c: ProductCategory) => <span className="font-medium">{c.name}</span> },
    { key: 'actions', label: '', render: (c: ProductCategory) => (
      <div className="flex items-center gap-1 justify-end">
        <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)]"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
        <button onClick={() => { setDeleteId(c.id); setConfirmOpen(true); }} className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--danger)] hover:bg-red-50"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
      </div>
    )},
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Categorías" description="Gestionar las categorías de productos" actions={<Button onClick={openCreate}>+ Nueva Categoría</Button>} />
      <Card padding={false}>
        <div className="p-4 border-b border-[var(--border)]">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar categoría..." />
        </div>
        {loading ? <Loading /> : <Table columns={columns} data={data} />}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Categoría' : 'Nueva Categoría'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Nombre de la categoría" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>{editId ? 'Guardar Cambios' : 'Crear Categoría'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} loading={saving} title="Eliminar Categoría" message="¿Estás seguro? Esta acción eliminará la categoría y dejará los productos asociados sin categoría." />
    </div>
  );
}
