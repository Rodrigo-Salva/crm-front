'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, Badge, Loading } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';

const statuses = ['open', 'in_progress', 'resolved', 'closed'] as const;

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: 'Abierto', color: '#2196f3' },
  in_progress: { label: 'En Progreso', color: '#ff9800' },
  resolved: { label: 'Resuelto', color: '#4caf50' },
  closed: { label: 'Cerrado', color: '#9e9e9e' },
};

const priorityConfig: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  low: { label: 'Baja', variant: 'default' },
  medium: { label: 'Media', variant: 'primary' },
  high: { label: 'Alta', variant: 'warning' },
  critical: { label: 'CrÃ­tica', variant: 'danger' },
};

interface Ticket {
  id: string;
  number: number;
  subject: string;
  status: string;
  priority: string;
  lead?: { id: string; name: string; email: string };
}

export default function KanbanPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/tickets');
      setTickets(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const grouped = statuses.reduce((acc, s) => {
    acc[s] = tickets.filter(t => t.status === s);
    return acc;
  }, {} as Record<string, Ticket[]>);

  const handleDragStart = (id: string) => setDraggingId(id);

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = async (newStatus: string) => {
    if (!draggingId) return;
    const ticket = tickets.find(t => t.id === draggingId);
    if (!ticket || ticket.status === newStatus) {
      setDraggingId(null);
      return;
    }
    setTickets(prev =>
      prev.map(t => t.id === draggingId ? { ...t, status: newStatus } : t)
    );
    setDraggingId(null);
    try {
      await api.patch(`/tickets/${draggingId}`, { status: newStatus });
    } catch (err) {
      console.error(err);
      load();
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Kanban" description="Tablero visual de tickets" />
      {loading ? (
        <Loading />
      ) : (
        <div className="grid grid-cols-4 gap-4" style={{ minHeight: '70vh' }}>
          {statuses.map(status => {
            const cfg = statusConfig[status];
            const items = grouped[status] || [];
            return (
              <div
                key={status}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(status)}
                className="flex flex-col rounded-xl bg-gray-50 p-3"
                style={{ minHeight: '60vh' }}
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cfg.color }} />
                    <span className="font-semibold text-sm text-gray-700">{cfg.label}</span>
                  </div>
                  <span className="text-xs font-medium text-gray-500 bg-[var(--card-bg)] px-2 py-0.5 rounded-full border">
                    {items.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  {items.map(ticket => {
                    const pcfg = priorityConfig[ticket.priority] || { label: ticket.priority, variant: 'default' as const };
                    return (
                      <div
                        key={ticket.id}
                        draggable
                        onDragStart={() => handleDragStart(ticket.id)}
                        className="bg-[var(--card-bg)] rounded-lg p-3 shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="text-xs font-mono text-gray-400">#{ticket.number}</span>
                          <Badge variant={pcfg.variant}>{pcfg.label}</Badge>
                        </div>
                        <p className="text-sm font-medium text-gray-800 leading-snug">{ticket.subject}</p>
                        {ticket.lead && (
                          <p className="text-xs text-gray-400 mt-1.5 truncate">{ticket.lead.name}</p>
                        )}
                      </div>
                    );
                  })}
                  {items.length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-sm text-gray-400 italic">
                      Sin tickets
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

