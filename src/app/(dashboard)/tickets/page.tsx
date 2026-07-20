'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, Table, Loading, Badge, Button, Modal } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';
import { useAuth } from '@/modules/shared/hooks/useAuth';

interface Ticket {
  id: string;
  number: number;
  subject: string;
  description?: string;
  status: string;
  priority: string;
  createdAt: string;
  lead?: { id: string; name: string };
  assignee?: { id: string; name: string };
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

export default function TicketsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/tickets');
      setData(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load() }, [load]);

  const handleUpdateStatus = async (status: string) => {
    if (!selected) return;
    setSavingStatus(true);
    try {
      await api.patch(`/tickets/${selected.id}`, { status });
      setSelected({ ...selected, status });
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingStatus(false);
    }
  };

  const columns = [
    { key: 'number', label: 'Ticket', render: (t: Ticket) => (
      <button onClick={() => { setSelected(t); setDetailOpen(true); }} className="text-left group">
        <div className="font-mono text-sm text-[var(--primary)] group-hover:underline">#{t.number}</div>
        <div className="font-medium text-[var(--text)] mt-0.5">{t.subject}</div>
      </button>
    )},
    { key: 'lead', label: 'Cliente', render: (t: Ticket) => <span className="text-[var(--text-secondary)]">{t.lead?.name || 'Anónimo'}</span> },
    { key: 'status', label: 'Estado', render: (t: Ticket) => {
        const conf = statusMap[t.status] || { label: t.status, color: 'default' };
        return <Badge variant={conf.color}>{conf.label}</Badge>;
    }},
    { key: 'priority', label: 'Prioridad', render: (t: Ticket) => {
        const conf = priorityMap[t.priority] || { label: t.priority, color: 'default' };
        return <Badge variant={conf.color}>{conf.label}</Badge>;
    }},
    { key: 'assignee', label: 'Asignado a', render: (t: Ticket) => <span className="text-[var(--text-secondary)]">{t.assignee?.name || 'Sin asignar'}</span> },
    { key: 'date', label: 'Fecha', render: (t: Ticket) => <span className="text-[var(--text-secondary)]">{new Date(t.createdAt).toLocaleDateString()}</span> },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader 
        title="Tickets de Soporte" 
        description="Bandeja de entrada de incidentes y consultas de clientes" 
      />

      <Card padding={false}>
        {loading ? <Loading /> : <Table columns={columns} data={data} />}
      </Card>

      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title={`Ticket #${selected?.number}`}>
        {selected && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-[var(--text)]">{selected.subject}</h3>
              <div className="flex gap-2 mt-2">
                <Badge variant={statusMap[selected.status]?.color || 'default'}>{statusMap[selected.status]?.label || selected.status}</Badge>
                <Badge variant={priorityMap[selected.priority]?.color || 'default'}>{priorityMap[selected.priority]?.label || selected.priority}</Badge>
              </div>
            </div>

            <div className="p-4 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
              <p className="text-xs uppercase font-semibold text-[var(--text-muted)] mb-2">Descripción del Cliente</p>
              <p className="text-[var(--text)] whitespace-pre-wrap">{selected.description || 'Sin descripción.'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[var(--text-muted)]">Cliente</p>
                <p className="font-medium">{selected.lead?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)]">Fecha de creación</p>
                <p className="font-medium">{new Date(selected.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="border-t border-[var(--border)] pt-4">
              <p className="text-sm font-medium mb-3">Actualizar Estado</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(statusMap).map(([val, conf]) => (
                  <Button 
                    key={val}
                    variant={selected.status === val ? 'primary' : 'secondary'}
                    size="sm"
                    loading={savingStatus && selected.status !== val}
                    onClick={() => handleUpdateStatus(val)}
                  >
                    {conf.label}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setDetailOpen(false)}>Cerrar</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
