'use client';

import { useEffect, useState, useCallback } from 'react';
import { PageHeader, Card, Button, Input, Modal, ConfirmDialog, Loading } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';

interface Modality {
  id: string;
  name: string;
  active: boolean;
}

export default function ModalitiesPage() {
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Modality | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchModalities = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Modality[]>('/modalities');
      setModalities(data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchModalities(); }, [fetchModalities]);

  const handleSave = async (form: Partial<Modality>) => {
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/modalities/${editing.id}`, form);
      } else {
        await api.post('/modalities', form);
      }
      setShowModal(false);
      setEditing(null);
      await fetchModalities();
    } catch {} finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/modalities/${deleteId}`);
      setDeleteId(null);
      await fetchModalities();
    } catch {}
  };

  return (
    <div className="animate-fade-in">
      <PageHeader backHref="/settings" backLabel="Volver a Configuración" title="Modalidades" description="Administra el catálogo de modalidades disponibles" />

      <div className="flex items-center justify-end mb-6">
        <Button onClick={() => { setEditing(null); setShowModal(true); }}>
          + Agregar modalidad
        </Button>
      </div>

      {loading ? <Loading /> : !modalities.length ? (
        <Card><p className="text-sm text-[var(--text-secondary)] text-center py-8">No hay modalidades registradas</p></Card>
      ) : (
        <div className="space-y-3">
          {modalities.map((m) => (
            <Card key={m.id}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-[var(--text)]">{m.name}</h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Estado: {m.active ? 'Activo' : 'Inactivo'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(m); setShowModal(true); }}>Editar</Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteId(m.id)} className="text-red-500">Eliminar</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ModalityModal
        open={showModal}
        modality={editing}
        onClose={() => { setShowModal(false); setEditing(null); }}
        onSave={handleSave}
        saving={saving}
      />

      <ConfirmDialog
        open={!!deleteId}
        title="Eliminar modalidad"
        message="¿Estás seguro de eliminar esta modalidad?"
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}

function ModalityModal({
  open, modality, onClose, onSave, saving,
}: {
  open: boolean;
  modality: Modality | null;
  onClose: () => void;
  onSave: (data: Partial<Modality>) => Promise<void>;
  saving: boolean;
}) {
  const [name, setName] = useState('');
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (modality) {
      setName(modality.name);
      setActive(modality.active !== false);
    } else {
      setName('');
      setActive(true);
    }
  }, [modality, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({ name, active });
  };

  return (
    <Modal open={open} onClose={onClose} title={modality ? 'Editar modalidad' : 'Nueva modalidad'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nombre de la modalidad" value={name} onChange={(e) => setName(e.target.value)} required />
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="rounded border-[var(--border)]" />
          <span className="text-sm text-[var(--text)]">Activo</span>
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
        </div>
      </form>
    </Modal>
  );
}
