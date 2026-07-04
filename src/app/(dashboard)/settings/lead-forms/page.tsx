'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, Button, Input, Modal, Loading, EmptyState, ConfirmDialog } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'textarea';
  required: boolean;
}

interface LeadForm {
  id: string;
  name: string;
  slug: string;
  fields: FormField[];
  active: boolean;
  createdAt: string;
}

const DEFAULT_FIELDS: FormField[] = [
  { name: 'name', label: 'Nombre', type: 'text', required: true },
  { name: 'email', label: 'Correo', type: 'email', required: true },
  { name: 'phone', label: 'Teléfono', type: 'phone', required: false },
];

export default function LeadFormsPage() {
  const [forms, setForms] = useState<LeadForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [fields, setFields] = useState<FormField[]>(DEFAULT_FIELDS);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<LeadForm[]>('/lead-forms');
      setForms(Array.isArray(res) ? res : []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setName('');
    setFields(DEFAULT_FIELDS);
    setModalOpen(true);
  };

  const addField = () => {
    setFields((f) => [...f, { name: '', label: '', type: 'text', required: false }]);
  };

  const updateField = (index: number, patch: Partial<FormField>) => {
    setFields((f) => f.map((field, i) => (i === index ? { ...field, ...patch } : field)));
  };

  const removeField = (index: number) => {
    setFields((f) => f.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/lead-forms', { name, fields });
      setModalOpen(false);
      load();
    } catch {} finally { setSaving(false); }
  };

  const handleToggleActive = async (form: LeadForm) => {
    try {
      await api.patch(`/lead-forms/${form.id}`, { active: !form.active });
      load();
    } catch {}
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/lead-forms/${deleteId}`);
      setDeleteId(null);
      load();
    } catch {}
  };

  const publicUrl = (slug: string) => `${window.location.origin}/forms/${slug}`;

  const copyLink = (form: LeadForm) => {
    navigator.clipboard.writeText(publicUrl(form.slug));
    setCopiedId(form.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) return <Loading />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        backHref="/settings"
        backLabel="Volver a Configuración"
        title="Formularios de captura"
        description="Crea formularios públicos para capturar leads desde tu sitio web"
        actions={<Button onClick={openCreate}>+ Nuevo formulario</Button>}
      />

      {forms.length === 0 ? (
        <EmptyState title="Sin formularios" description="Crea tu primer formulario para empezar a capturar leads desde la web." action={<Button onClick={openCreate}>+ Nuevo formulario</Button>} />
      ) : (
        <div className="space-y-3">
          {forms.map((form) => (
            <Card key={form.id}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--text)]">{form.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${form.active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {form.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 truncate">{form.fields.length} campo(s) · /forms/{form.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => copyLink(form)}>
                    {copiedId === form.id ? 'Copiado!' : 'Copiar link'}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleToggleActive(form)}>
                    {form.active ? 'Desactivar' : 'Activar'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleteId(form.id)} className="text-red-500!">Eliminar</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo formulario">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre del formulario" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ej. Contacto sitio web" />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Campos</label>
              <Button type="button" size="sm" variant="secondary" onClick={addField}>+ Agregar campo</Button>
            </div>
            <div className="space-y-2">
              {fields.map((field, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end p-2 rounded-lg bg-[var(--bg)]">
                  <div className="col-span-4">
                    <Input placeholder="nombre_interno" value={field.name} onChange={(e) => updateField(i, { name: e.target.value })} />
                  </div>
                  <div className="col-span-4">
                    <Input placeholder="Etiqueta visible" value={field.label} onChange={(e) => updateField(i, { label: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <select value={field.type} onChange={(e) => updateField(i, { type: e.target.value as FormField['type'] })} className="block w-full rounded-lg border border-[var(--border)] px-2 py-2 text-sm">
                      <option value="text">Texto</option>
                      <option value="email">Email</option>
                      <option value="phone">Teléfono</option>
                      <option value="textarea">Área de texto</option>
                    </select>
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <input type="checkbox" checked={field.required} onChange={(e) => updateField(i, { required: e.target.checked })} title="Requerido" />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button type="button" onClick={() => removeField(i)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Crear formulario</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Eliminar formulario"
        message="¿Estás seguro de eliminar este formulario? Dejará de recibir leads."
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
