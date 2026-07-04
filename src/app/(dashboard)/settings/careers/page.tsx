'use client';

import { useEffect, useState, useCallback } from 'react';
import { PageHeader, Card, Button, Input, Modal, ConfirmDialog, Loading } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';

interface Career {
  id: string;
  name: string;
  active: boolean;
}

export default function CareersPage() {
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Career | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchCareers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Career[]>('/careers');
      setCareers(data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCareers(); }, [fetchCareers]);

  const handleSave = async (form: Partial<Career>) => {
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/careers/${editing.id}`, form);
      } else {
        await api.post('/careers', form);
      }
      setShowModal(false);
      setEditing(null);
      await fetchCareers();
    } catch {} finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/careers/${deleteId}`);
      setDeleteId(null);
      await fetchCareers();
    } catch {}
  };

  return (
    <div className="animate-fade-in">
      <PageHeader backHref="/settings" backLabel="Volver a Configuración" title="Carreras" description="Administra el catálogo de carreras disponibles" />

      <div className="flex items-center justify-end mb-6">
        <Button onClick={() => { setEditing(null); setShowModal(true); }}>
          + Agregar carrera
        </Button>
      </div>

      {loading ? <Loading /> : !careers.length ? (
        <Card><p className="text-sm text-[var(--text-secondary)] text-center py-8">No hay carreras registradas</p></Card>
      ) : (
        <div className="space-y-3">
          {careers.map((c) => (
            <Card key={c.id}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-[var(--text)]">{c.name}</h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Estado: {c.active ? 'Activo' : 'Inactivo'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(c); setShowModal(true); }}>Editar</Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteId(c.id)} className="text-red-500">Eliminar</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CareerModal
        open={showModal}
        career={editing}
        onClose={() => { setShowModal(false); setEditing(null); }}
        onSave={handleSave}
        saving={saving}
      />

      <ConfirmDialog
        open={!!deleteId}
        title="Eliminar carrera"
        message="¿Estás seguro de eliminar esta carrera?"
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}

function CareerModal({
  open, career, onClose, onSave, saving,
}: {
  open: boolean;
  career: Career | null;
  onClose: () => void;
  onSave: (data: Partial<Career>) => Promise<void>;
  saving: boolean;
}) {
  const [name, setName] = useState('');
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (career) {
      setName(career.name);
      setActive(career.active !== false);
    } else {
      setName('');
      setActive(true);
    }
  }, [career, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({ name, active });
  };

  return (
    <Modal open={open} onClose={onClose} title={career ? 'Editar carrera' : 'Nueva carrera'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nombre de la carrera" value={name} onChange={(e) => setName(e.target.value)} required />
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
