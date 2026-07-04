'use client';

import { useState, useEffect } from 'react';
import { Button, PageHeader, Card, Modal, Input, Loading } from '@/modules/shared';
import { ConfirmDialog } from '@/modules/shared/components/ui/confirm-dialog';
import { api } from '@/modules/shared/services/api';

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [fullKey, setFullKey] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<any[]>('/api-keys');
      setKeys(Array.isArray(res) ? res : []);
    } catch {}
    finally { setLoading(false) }
  };

  useEffect(() => { load() }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post<any>('/api-keys', { name: newName });
      setFullKey(res.key);
      setModalOpen(false);
      setNewName('');
      load();
    } catch {}
    finally { setSaving(false) }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api-keys/${id}`);
      setDeleteConfirm(null);
      load();
    } catch {}
  };

  const handleToggleActive = async (key: any) => {
    try {
      await api.patch(`/api-keys/${key.id}`, { active: !key.active });
      load();
    } catch {}
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return key;
    return `sk-...${key.slice(-4)}`;
  };

  if (loading) return <Loading />;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader backHref="/settings" backLabel="Volver a Configuración" title="API Keys" description="Gestiona claves de acceso a la API" />
        <Button onClick={() => { setNewName(''); setModalOpen(true) }}>+ Crear API Key</Button>
      </div>

      <Card>
        <p className="text-sm text-[var(--text-secondary)]">
          Usa una API key para integrar sistemas externos con la API pública, enviándola en el header <code className="px-1 py-0.5 rounded bg-[var(--secondary)] text-xs">x-api-key</code>:
        </p>
        <ul className="mt-2 text-xs text-[var(--text-secondary)] space-y-1 font-mono">
          <li>POST /public/v1/leads · GET /public/v1/leads/:id</li>
          <li>POST /public/v1/tickets · GET /public/v1/tickets/:id</li>
        </ul>
      </Card>

      {fullKey && (
        <div className="p-4 rounded-lg border border-amber-200 bg-amber-50">
          <p className="text-sm font-semibold text-amber-800 mb-1">ð Copia esta clave â no se mostrará again</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-[var(--card-bg)] px-3 py-2 rounded border border-amber-200 break-all">{fullKey}</code>
            <Button size="sm" variant="outline" onClick={() => copyToClipboard(fullKey, 'new')}>
              {copiedId === 'new' ? 'Copiado' : 'Copiar'}
            </Button>
          </div>
          <button onClick={() => setFullKey(null)} className="mt-2 text-xs text-amber-600 hover:underline">Descartar</button>
        </div>
      )}

      {keys.length === 0 ? (
        <Card>
          <p className="text-sm text-[var(--text-secondary)] text-center py-12">Sin claves API configuradas</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {keys.map((k) => (
            <Card key={k.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-2 h-2 rounded-full ${k.active ? 'bg-green-500/100' : 'bg-gray-300'}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text)]">{k.name}</p>
                    <code className="text-xs text-[var(--text-secondary)]">{maskKey(k.key)}</code>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">Creada: {new Date(k.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <button
                    onClick={() => copyToClipboard(k.key, k.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)] transition-colors"
                    title="Copiar clave"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                  </button>
                  {copiedId === k.id && <span className="text-xs text-green-600">Copiado</span>}
                  <button
                    onClick={() => handleToggleActive(k)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${k.active ? 'bg-[var(--primary)]' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-[var(--card-bg)] transition-transform ${k.active ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                  </button>
                  <button onClick={() => setDeleteConfirm(k.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Crear API Key">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Nombre de la clave"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ej: Producción, Desarrollo..."
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Crear</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteConfirm}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
        title="Eliminar API Key"
        message="Â¿Estás seguro de eliminar esta clave? Los servicios que la usen dejarán de funcionar."
      />
    </div>
  );
}


