'use client';

import { useEffect, useState, useCallback } from 'react';
import { PageHeader, Card, Button, Input, Modal, ConfirmDialog, Loading } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<EmailTemplate[]>('/email/templates');
      setTemplates(data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleSave = async (form: Partial<EmailTemplate>) => {
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/email/templates/${editing.id}`, form);
      } else {
        await api.post('/email/templates', form);
      }
      setShowModal(false);
      setEditing(null);
      await fetchTemplates();
    } catch {} finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/email/templates/${deleteId}`);
      setDeleteId(null);
      await fetchTemplates();
    } catch {}
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Plantillas email" description="Gestiona plantillas de correo electrónico" />

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-[var(--text-secondary)]">{templates.length} plantilla(s)</p>
        <Button onClick={() => { setEditing(null); setShowModal(true); }}>
          + Nueva plantilla
        </Button>
      </div>

      {loading ? <Loading /> : !templates.length ? (
        <Card><p className="text-sm text-[var(--text-secondary)] text-center py-8">No hay plantillas de email</p></Card>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <Card key={t.id}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-[var(--text)]">{t.name}</h3>
                  <p className="text-xs text-[var(--text-secondary)]">{t.subject}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(t); setShowModal(true); }}>Editar</Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteId(t.id)} className="text-red-500">Eliminar</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <TemplateModal
        open={showModal}
        template={editing}
        onClose={() => { setShowModal(false); setEditing(null); }}
        onSave={handleSave}
        saving={saving}
      />

      <ConfirmDialog
        open={!!deleteId}
        title="Eliminar plantilla"
        message="¿Estás seguro de eliminar esta plantilla de email?"
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}

function TemplateModal({
  open, template, onClose, onSave, saving,
}: {
  open: boolean;
  template: EmailTemplate | null;
  onClose: () => void;
  onSave: (data: Partial<EmailTemplate>) => Promise<void>;
  saving: boolean;
}) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (template) {
      setName(template.name);
      setSubject(template.subject);
      setBody(template.body);
    } else {
      setName(''); setSubject(''); setBody('');
    }
  }, [template, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({ name, subject, body });
  };

  return (
    <Modal open={open} onClose={onClose} title={template ? 'Editar plantilla' : 'Nueva plantilla de email'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ej: Bienvenida" />
        <Input label="Asunto" value={subject} onChange={(e) => setSubject(e.target.value)} required placeholder="Ej: ¡Bienvenido a CRM Pro!" />
        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1">Cuerpo</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={8}
            className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--text)] resize-y"
            placeholder="Escribe el contenido del email..."
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
        </div>
      </form>
    </Modal>
  );
}
