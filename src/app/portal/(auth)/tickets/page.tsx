'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Table, Loading, Badge, Button, Modal, Input } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';
import { formatCurrency } from '@/modules/shared/utils/format';

interface Ticket {
  id: string;
  number: number;
  subject: string;
  description?: string;
  status: string;
  priority: string;
  createdAt: string;
}

const statusMap: Record<string, { label: string; color: any }> = {
  open: { label: 'Abierto', color: 'primary' },
  in_progress: { label: 'En Progreso', color: 'warning' },
  resolved: { label: 'Resuelto', color: 'success' },
  closed: { label: 'Cerrado', color: 'default' },
};

const priorityMap: Record<string, { label: string; color: any }> = {
  low: { label: 'Baja', color: 'default' },
  medium: { label: 'Media', color: 'primary' },
  high: { label: 'Alta', color: 'warning' },
  critical: { label: 'Crítica', color: 'danger' },
};

export default function PortalTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({ subject: '', description: '', priority: 'medium' });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Intentamos cargar tickets del backend. Asumiremos que el backend los filtra por leadId si usamos el portal.
      // O quizás hay que pasar un query param, pero api.get('/tickets') de un portal user devolverá sus tickets.
      const res = await api.get<any>('/tickets');
      setTickets(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData() }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const stored = localStorage.getItem('portal_contact');
      const contact = stored ? JSON.parse(stored) : null;
      await api.post('/tickets', { ...form, leadId: contact?.id });
      setModalOpen(false);
      setForm({ subject: '', description: '', priority: 'medium' });
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'number', label: '#', render: (t: Ticket) => <span className="font-mono text-sm text-[var(--text-secondary)]">#{t.number}</span> },
    { key: 'subject', label: 'Asunto', render: (t: Ticket) => <span className="font-medium text-[var(--text)]">{t.subject}</span> },
    { key: 'status', label: 'Estado', render: (t: Ticket) => {
        const conf = statusMap[t.status] || { label: t.status, color: 'default' };
        return <Badge variant={conf.color}>{conf.label}</Badge>;
    }},
    { key: 'priority', label: 'Prioridad', render: (t: Ticket) => {
        const conf = priorityMap[t.priority] || { label: t.priority, color: 'default' };
        return <Badge variant={conf.color}>{conf.label}</Badge>;
    }},
    { key: 'date', label: 'Fecha', render: (t: Ticket) => <span className="text-[var(--text-secondary)]">{new Date(t.createdAt).toLocaleDateString()}</span> },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)] mb-1">Mis Tickets de Soporte</h1>
          <p className="text-[var(--text-secondary)] text-sm">Consulta el estado de tus consultas o reporta un nuevo problema.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>Crear Nuevo Ticket</Button>
      </div>

      <Card padding={false}>
        {loading ? <Loading /> : (
          tickets.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-16 h-16 bg-[var(--sidebar-hover)] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-[var(--text)]">No tienes tickets</h3>
              <p className="text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">Cuando tengas un problema o consulta, abre un ticket y nuestro equipo te responderá pronto.</p>
            </div>
          ) : (
            <Table columns={columns} data={tickets} />
          )
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Abrir Ticket de Soporte">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Asunto" 
            value={form.subject} 
            onChange={e => setForm({...form, subject: e.target.value})} 
            required 
            placeholder="Ej. Problema con mi última factura"
          />
          
          <div>
            <label className="block text-sm font-medium mb-1">Prioridad</label>
            <select 
              className="block w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-[var(--primary)]"
              value={form.priority} 
              onChange={e => setForm({...form, priority: e.target.value})}
            >
              {Object.entries(priorityMap).map(([val, conf]) => (
                <option key={val} value={val}>{conf.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descripción del problema</label>
            <textarea 
              className="block w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-[var(--primary)]"
              rows={4}
              required
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              placeholder="Explícanos a detalle cómo podemos ayudarte..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Enviar Ticket</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
