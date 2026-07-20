'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, Table, Loading, Badge, Button, Modal, Input } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';

interface Playbook {
  id: string;
  name: string;
  trigger: string;
  active: boolean;
  createdAt: string;
  _count?: { steps: number; runs: number };
}

const triggers: Record<string, string> = {
  quote_sent: 'Cotización Enviada',
  contract_signed: 'Contrato Firmado',
  lead_created: 'Nuevo Lead',
  ticket_created: 'Nuevo Ticket',
  invoice_overdue: 'Factura Vencida'
};

export default function PlaybooksPage() {
  const [data, setData] = useState<Playbook[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', trigger: 'lead_created' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/playbooks');
      setData(Array.isArray(res) ? res : []);
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
      await api.post('/playbooks', form);
      setModalOpen(false);
      setForm({ name: '', trigger: 'lead_created' });
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await api.patch(`/playbooks/${id}`, { active: !current });
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { key: 'name', label: 'Nombre del Playbook', render: (p: Playbook) => (
      <span className="font-medium text-[var(--text)]">{p.name}</span>
    )},
    { key: 'trigger', label: 'Disparador', render: (p: Playbook) => (
      <Badge variant="default">{triggers[p.trigger] || p.trigger}</Badge>
    )},
    { key: 'stats', label: 'Estadísticas', render: (p: Playbook) => (
      <div className="flex gap-4 text-xs text-[var(--text-secondary)]">
        <div><span className="font-medium text-[var(--text)]">{p._count?.steps || 0}</span> Pasos</div>
        <div><span className="font-medium text-[var(--text)]">{p._count?.runs || 0}</span> Ejecuciones</div>
      </div>
    )},
    { key: 'status', label: 'Estado', render: (p: Playbook) => (
      <button 
        onClick={() => handleToggleActive(p.id, p.active)}
        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
          p.active 
            ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
        }`}
      >
        {p.active ? 'Activo' : 'Inactivo'}
      </button>
    )},
    { key: 'actions', label: '', render: (p: Playbook) => (
      <div className="flex items-center gap-2">
        <Button size="sm" variant="secondary" onClick={() => alert('Próximamente: Editor visual de pasos')}>Editar Pasos</Button>
      </div>
    )}
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader 
        title="Automatizaciones (Playbooks)" 
        description="Configura flujos automáticos para ahorrar tiempo a tu equipo" 
        actions={<Button onClick={() => setModalOpen(true)}>+ Crear Playbook</Button>}
      />

      <Card padding={false}>
        {loading ? <Loading /> : <Table columns={columns} data={data} />}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo Playbook">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Nombre" 
            value={form.name} 
            onChange={e => setForm({...form, name: e.target.value})} 
            required 
            placeholder="Ej. Seguimiento Cotización Sin Firma"
          />
          
          <div>
            <label className="block text-sm font-medium mb-1">Disparador (¿Cuándo inicia?)</label>
            <select 
              className="block w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-[var(--primary)]"
              value={form.trigger} 
              onChange={e => setForm({...form, trigger: e.target.value})}
            >
              {Object.entries(triggers).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Crear Playbook</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
