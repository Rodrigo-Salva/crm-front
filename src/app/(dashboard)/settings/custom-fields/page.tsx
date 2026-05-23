'use client';

import { useEffect, useState, useCallback } from 'react';
import { PageHeader, Card, Button, Input, Modal, ConfirmDialog, Loading } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';

interface CustomField {
  id: string;
  name: string;
  label: string;
  type: string;
  entity: string;
  required: boolean;
  options?: string[];
  order: number;
}

const ENTITIES = [
  { value: 'contact', label: 'Contactos' },
  { value: 'deal', label: 'Negocios' },
  { value: 'company', label: 'Empresas' },
  { value: 'ticket', label: 'Tickets' },
  { value: 'product', label: 'Productos' },
  { value: 'quote', label: 'Cotizaciones' },
  { value: 'task', label: 'Tareas' },
  { value: 'campaign', label: 'Campañas' },
];

const FIELD_TYPES = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Fecha' },
  { value: 'select', label: 'Lista desplegable' },
  { value: 'boolean', label: 'Sí/No' },
];

export default function CustomFieldsPage() {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEntity, setFilterEntity] = useState('contact');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CustomField | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchFields = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<CustomField[]>(`/custom-fields?entity=${filterEntity}`);
      setFields(data);
    } catch {} finally { setLoading(false); }
  }, [filterEntity]);

  useEffect(() => { fetchFields(); }, [fetchFields]);

  const handleSave = async (form: Partial<CustomField>) => {
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/custom-fields/${editing.id}`, form);
      } else {
        await api.post('/custom-fields', { ...form, entity: filterEntity });
      }
      setShowModal(false);
      setEditing(null);
      await fetchFields();
    } catch {} finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/custom-fields/${deleteId}`);
      setDeleteId(null);
      await fetchFields();
    } catch {}
  };

  const currentFields = fields.filter((f) => f.entity === filterEntity);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Campos personalizados" description="Agrega campos adicionales a tus módulos" />

      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          {ENTITIES.map((e) => (
            <button
              key={e.value}
              onClick={() => setFilterEntity(e.value)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filterEntity === e.value
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--card)] text-[var(--text-secondary)] hover:bg-[var(--hover)]'
              }`}
            >
              {e.label}
            </button>
          ))}
        </div>
        <Button onClick={() => { setEditing(null); setShowModal(true); }}>
          + Agregar campo
        </Button>
      </div>

      {loading ? <Loading /> : !currentFields.length ? (
        <Card><p className="text-sm text-[var(--text-secondary)] text-center py-8">No hay campos personalizados para esta entidad</p></Card>
      ) : (
        <div className="space-y-3">
          {currentFields.map((f) => (
            <Card key={f.id}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-[var(--text)]">{f.label}</h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {f.name} · {FIELD_TYPES.find((t) => t.value === f.type)?.label || f.type}
                    {f.required && ' · Requerido'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(f); setShowModal(true); }}>Editar</Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteId(f.id)} className="text-red-500">Eliminar</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CustomFieldModal
        open={showModal}
        field={editing}
        onClose={() => { setShowModal(false); setEditing(null); }}
        onSave={handleSave}
        saving={saving}
      />

      <ConfirmDialog
        open={!!deleteId}
        title="Eliminar campo"
        message="¿Estás seguro de eliminar este campo personalizado?"
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}

function CustomFieldModal({
  open, field, onClose, onSave, saving,
}: {
  open: boolean;
  field: CustomField | null;
  onClose: () => void;
  onSave: (data: Partial<CustomField>) => Promise<void>;
  saving: boolean;
}) {
  const [label, setLabel] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('text');
  const [required, setRequired] = useState(false);
  const [options, setOptions] = useState('');

  useEffect(() => {
    if (field) {
      setLabel(field.label);
      setName(field.name);
      setType(field.type);
      setRequired(field.required);
      setOptions(field.options?.join(', ') || '');
    } else {
      setLabel(''); setName(''); setType('text'); setRequired(false); setOptions('');
    }
  }, [field, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      label,
      name: name || label.toLowerCase().replace(/\s+/g, '_'),
      type,
      required,
      ...(type === 'select' ? { options: options.split(',').map((s) => s.trim()).filter(Boolean) } : {}),
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={field ? 'Editar campo' : 'Nuevo campo personalizado'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nombre visible" value={label} onChange={(e) => setLabel(e.target.value)} required />
        <Input label="Identificador (nombre técnico)" value={name} onChange={(e) => setName(e.target.value)} placeholder="se genera automáticamente" />
        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1">Tipo</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--text)]">
            {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        {type === 'select' && (
          <Input label="Opciones (separadas por coma)" value={options} onChange={(e) => setOptions(e.target.value)} placeholder="Opción 1, Opción 2, Opción 3" />
        )}
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} className="rounded border-[var(--border)]" />
          <span className="text-sm text-[var(--text)]">Campo requerido</span>
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
        </div>
      </form>
    </Modal>
  );
}
