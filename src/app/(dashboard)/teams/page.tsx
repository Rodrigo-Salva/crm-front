'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, Table, Loading, Button, Modal, Input } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';

interface Team {
  id: string;
  name: string;
  description?: string;
  leadId?: string;
  lead?: { id: string; name: string };
  _count?: { members: number };
}

export default function TeamsPage() {
  const [data, setData] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', leadId: '' });
  
  const [users, setUsers] = useState<{id: string, name: string}[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [teamsRes, usersRes] = await Promise.all([
        api.get<any>('/teams'),
        api.get<any>('/users').catch(() => [])
      ]);
      setData(Array.isArray(teamsRes) ? teamsRes : []);
      setUsers(Array.isArray(usersRes) ? usersRes : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load() }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/teams', form);
      setModalOpen(false);
      setForm({ name: '', description: '', leadId: '' });
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Equipo', render: (t: Team) => (
      <div>
        <div className="font-medium text-[var(--text)]">{t.name}</div>
        {t.description && <div className="text-xs text-[var(--text-secondary)]">{t.description}</div>}
      </div>
    )},
    { key: 'lead', label: 'Líder / Gerente', render: (t: Team) => (
      <span className="text-[var(--text)]">{t.lead?.name || <span className="text-[var(--text-muted)] italic">Sin asignar</span>}</span>
    )},
    { key: 'members', label: 'Miembros', render: (t: Team) => (
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
           {/* Simulamos avatares apilados */}
           {Array.from({ length: Math.min(t._count?.members || 0, 3) }).map((_, i) => (
             <div key={i} className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-[var(--bg)]" />
           ))}
        </div>
        <span className="text-sm text-[var(--text-secondary)] font-medium">
          {t._count?.members || 0}
        </span>
      </div>
    )},
    { key: 'actions', label: '', render: (t: Team) => (
      <div className="flex items-center gap-2">
        <Button size="sm" variant="secondary" onClick={() => alert('Próximamente: Administrar Miembros')}>Gestionar Miembros</Button>
      </div>
    )}
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader 
        title="Gestión de Equipos" 
        description="Agrupa a tus vendedores o agentes de soporte y asigna líderes" 
        actions={<Button onClick={() => setModalOpen(true)}>+ Crear Equipo</Button>}
      />

      <Card padding={false}>
        {loading ? <Loading /> : <Table columns={columns} data={data} />}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Crear Equipo">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Nombre del Equipo" 
            value={form.name} 
            onChange={e => setForm({...form, name: e.target.value})} 
            required 
            placeholder="Ej. Ventas Norte"
          />
          <Input 
            label="Descripción (Opcional)" 
            value={form.description} 
            onChange={e => setForm({...form, description: e.target.value})} 
          />
          
          <div>
            <label className="block text-sm font-medium mb-1">Líder del Equipo</label>
            <select 
              className="block w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-[var(--primary)]"
              value={form.leadId} 
              onChange={e => setForm({...form, leadId: e.target.value})}
            >
              <option value="">Seleccionar un líder...</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Crear Equipo</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
